import { getUserBySession, saveMessage, upsertThread } from "@/lib/db";
import { getPromptForVariant } from "@/lib/load-instructions";
import { CHAT_MAX_HISTORY_MESSAGES } from "@/lib/model-config";
import { cookies } from "next/headers";

export const maxDuration = 60;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { messages, threadId, variant } = await req.json();

  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;

  const systemPrompt = getPromptForVariant(variant);

  // Extract plain text from assistant-ui content format
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

  type RawMsg = { role: string; content: unknown; tool_calls?: unknown };
  const sanitized = messages
    .filter((m: RawMsg) => ["user", "assistant", "system"].includes(m.role))
    .map((m: RawMsg) => {
      const text = extractContent(m.content);
      if (m.role === "assistant") {
        if (text.trim()) return { role: "assistant", content: text };
        if (m.tool_calls) return { role: "assistant", tool_calls: m.tool_calls };
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

  const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;
  if (!NVIDIA_API_KEY) {
    return new Response(JSON.stringify({ error: "NVIDIA_API_KEY not set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const nvidiaRes = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model: "meta/llama-3.3-70b-instruct",
      messages: allMessages,
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!nvidiaRes.ok) {
    const err = await nvidiaRes.text();
    return new Response(JSON.stringify({ error: `NVIDIA API Error: ${err.slice(0, 500)}` }), {
      status: nvidiaRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();
  let fullAssistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = nvidiaRes.body!.getReader();
      let buffer = "";

      const send = (text: string) => {
        fullAssistantResponse += text;
        controller.enqueue(encoder.encode(`0:${JSON.stringify(text)}\n`));
      };

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() ?? "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            // OpenAI SSE format: "data: {...}" or "data: [DONE]"
            if (!trimmedLine.startsWith("data:")) continue;
            const raw = trimmedLine.slice(5).trim();
            if (raw === "[DONE]") break;

            try {
              const json = JSON.parse(raw);
              const delta = json.choices?.[0]?.delta;
              if (!delta) continue;

              // Reasoning tokens — prefix with ⟨thinking⟩ tag for UI
              const reasoning: string = delta.reasoning_content ?? "";
              if (reasoning) send(reasoning);

              // Regular content tokens
              const content: string = delta.content ?? "";
              if (content) send(content);
            } catch {
              // skip malformed chunks
            }
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
        if (token && threadId && text) {
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