import { getUserBySession, saveMessage, upsertThread } from "@/lib/db";
import { getPromptForVariant } from "@/lib/load-instructions";
import {
  HOSTED_BLOCK_MESSAGE,
  isHostedRefusal,
} from "@/lib/refusal-detect";
import {
  CHAT_MAX_HISTORY_MESSAGES,
  REFUSAL_SCAN_CHARS,
} from "@/lib/model-config";
import { cookies } from "next/headers";


export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";


export async function POST(req: Request) {
  const { messages, threadId, variant } = await req.json();

  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;

  const systemPrompt = getPromptForVariant(variant);



  // assistant-ui sends content as string OR array of content parts
  // worker API only accepts plain strings — extract text from either format
  const extractContent = (content: unknown): string => {
    if (typeof content === "string") return content;
    if (Array.isArray(content)) {
      return content
        .map((part: { type?: string; text?: string }) =>
          part?.type === "text" ? (part.text ?? "") : ""
        )
        .join("");
    }
    return String(content ?? "");
  };

  // Sanitize messages for worker API:
  // - Only keep user/assistant/system roles
  // - assistant messages: content only (no tool_calls) or tool_calls only (no content)
  // - Skip empty assistant messages
  type RawMsg = { role: string; content: unknown; tool_calls?: unknown };
  const sanitized = messages
    .filter((m: RawMsg) => ["user", "assistant", "system"].includes(m.role))
    .map((m: RawMsg) => {
      const text = extractContent(m.content);
      if (m.role === "assistant") {
        // Drop prior hosted refusals so the model does not stay in "policy mode"
        if (text.trim() && isHostedRefusal(text)) return null;
        // If content exists, drop tool_calls entirely
        if (text.trim()) return { role: "assistant", content: text };
        // If no content but tool_calls exist, pass tool_calls only
        if (m.tool_calls) return { role: "assistant", tool_calls: m.tool_calls };
        // Empty assistant message — skip by returning null
        return null;
      }
      return { role: m.role, content: text };
    })
    .filter(Boolean);

  const trimmed = sanitized.slice(-CHAT_MAX_HISTORY_MESSAGES);

  const allMessages = [
    { role: "system", content: systemPrompt },
    ...trimmed,
  ];

  // Persist user message in background — do not block first token
  if (token && threadId && messages.length > 0) {
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      const userText = extractContent(lastUserMsg.content);
      const isFirstMessage =
        messages.filter((m: { role: string }) => m.role === "user").length === 1;
      const title = isFirstMessage
        ? userText.slice(0, 60).trim() + (userText.length > 60 ? "..." : "")
        : undefined;

      void getUserBySession(token)
        .then(async (user) => {
          if (!user) return;
          await upsertThread({
            thread_id: threadId,
            user_id: user.user_id,
            title: title ?? "New Chat",
            updated_at: new Date().toISOString(),
          });
          await saveMessage({
            thread_id: threadId,
            user_id: user.user_id,
            role: "user",
            content: userText,
          });
        })
        .catch((err) => console.error("save user message:", err));
    }
  }

  const workerRes = await fetch("https://ashuragpt.darkness789867.workers.dev/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "mistral-nemo",
      messages: allMessages,
      stream: true,
    }),
  });

  if (!workerRes.ok) {
    const err = await workerRes.text();
    const message = `Worker API Error: ${err.slice(0, 500)}`;
    return new Response(JSON.stringify({ error: message }), {
      status: workerRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  let fullAssistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = workerRes.body!.getReader();
      let buffer = "";
      let liveStreaming = false;
      let scanBuffer = "";
      let refusalLocked = false;

      const pushToClient = (text: string) => {
        controller.enqueue(
          encoder.encode(`0:${JSON.stringify(text)}\n`)
        );
      };

      const send = (text: string) => {
        if (refusalLocked) return;

        fullAssistantResponse += text;

        if (!liveStreaming) {
          scanBuffer += text;
          if (isHostedRefusal(scanBuffer)) {
            refusalLocked = true;
            fullAssistantResponse = HOSTED_BLOCK_MESSAGE;
            pushToClient(HOSTED_BLOCK_MESSAGE);
            return;
          }
          if (scanBuffer.length >= REFUSAL_SCAN_CHARS) {
            liveStreaming = true;
            pushToClient(scanBuffer);
            scanBuffer = "";
          }
          return;
        }

        pushToClient(text);
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;

            try {
              const json = JSON.parse(trimmed);
              const token: string = json.message?.content ?? "";
              if (token !== "") send(token);
            } catch {
              // skip malformed chunks
            }
          }
        }

        if (!refusalLocked && scanBuffer) {
          if (isHostedRefusal(scanBuffer) || isHostedRefusal(fullAssistantResponse)) {
            refusalLocked = true;
            fullAssistantResponse = HOSTED_BLOCK_MESSAGE;
            pushToClient(HOSTED_BLOCK_MESSAGE);
          } else {
            pushToClient(scanBuffer);
          }
        }
      } finally {
        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: "stop",
              usage: { promptTokens: 0, completionTokens: 0 },
            })}\n`
          )
        );
        controller.close();

        const text = fullAssistantResponse.trim();
        if (token && threadId && text && !isHostedRefusal(text)) {
          void persistAssistantReply({ token, threadId, content: text }).catch(
            (err) => console.error("save assistant message:", err)
          );
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function persistAssistantReply(params: {
  token: string;
  threadId: string;
  content: string;
}) {
  return getUserBySession(params.token).then(async (user) => {
    if (!user) return;
    await saveMessage({
      thread_id: params.threadId,
      user_id: user.user_id,
      role: "assistant",
      content: params.content,
    });
    await upsertThread({
      thread_id: params.threadId,
      user_id: user.user_id,
      title: "New Chat",
      updated_at: new Date().toISOString(),
    });
  });
}