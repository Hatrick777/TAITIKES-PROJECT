import fs from "fs";
import path from "path";
import { getUserBySession, saveMessage, upsertThread } from "@/lib/db";
import { cookies } from "next/headers";

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const API_KEY =
  process.env.NVIDIA_API_KEY ??
  "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";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, model, threadId } = await req.json();

  // Get user from session
  const cookieStore = await cookies();
  const token = cookieStore.get("ashura_session")?.value;
  const user = token ? await getUserBySession(token) : null;

  // Load model-specific system prompt
  const V1_MODEL = "mistralai/mistral-nemotron";
  const V2_MODEL = "meta/llama-4-maverick-17b-128e-instruct";

  const promptFile =
    model === V1_MODEL ? "custom instruction-v1.md" :
    model === V2_MODEL ? "custom instruction-v2.md" :
    "custom instruction.md";

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), promptFile),
    "utf-8"
  );


  // assistant-ui sends content as string OR array of content parts
  // NVIDIA NIM only accepts plain strings — extract text from either format
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

  // Sanitize messages for NVIDIA NIM:
  // - Only keep user/assistant/system roles
  // - assistant messages: content only (no tool_calls) or tool_calls only (no content)
  // - Skip empty assistant messages
  type RawMsg = { role: string; content: unknown; tool_calls?: unknown };
  const sanitized = messages
    .filter((m: RawMsg) => ["user", "assistant", "system"].includes(m.role))
    .map((m: RawMsg) => {
      const text = extractContent(m.content);
      if (m.role === "assistant") {
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

  const allMessages = [
    { role: "system", content: systemPrompt },
    ...sanitized,
  ];



  // Save user message + upsert thread before streaming
  if (user && threadId && messages.length > 0) {
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      const userText = extractContent(lastUserMsg.content);

      // Generate title from first user message (first 60 chars)
      const isFirstMessage = messages.filter((m: { role: string }) => m.role === "user").length === 1;
      const title = isFirstMessage
        ? userText.slice(0, 60).trim() + (userText.length > 60 ? "..." : "")
        : undefined;

      // Upsert thread (only updates title on first message)
      await upsertThread({
        thread_id: threadId,
        user_id: user.user_id,
        title: title ?? "New Chat",
        updated_at: new Date().toISOString(),
      });

      // Save user message
      await saveMessage({
        thread_id: threadId,
        user_id: user.user_id,
        role: "user",
        content: userText,
      });
    }
  }

  const nvidiaRes = await fetch(`${NVIDIA_BASE}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model || "mistralai/mistral-nemotron",
      messages: allMessages,
      temperature: 0.9,
      top_p: 0.95,
      max_tokens: 4096,
      stream: true,
    }),
  });

  if (!nvidiaRes.ok) {
    const err = await nvidiaRes.text();
    return new Response(JSON.stringify({ error: err }), {
      status: nvidiaRes.status,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Accumulate full assistant response to save after stream
  let fullAssistantResponse = "";

  const stream = new ReadableStream({
    async start(controller) {
      const reader = nvidiaRes.body!.getReader();
      let buffer = "";

      const send = (text: string) => {
        fullAssistantResponse += text;
        const escaped = JSON.stringify(text);
        controller.enqueue(encoder.encode(`0:${escaped}\n`));
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
            if (!trimmed || trimmed === "data: [DONE]") continue;
            if (!trimmed.startsWith("data: ")) continue;

            try {
              const json = JSON.parse(trimmed.slice(6));
              const delta = json.choices?.[0]?.delta;
              if (!delta) continue;

              const reasoning = delta.reasoning ?? delta.reasoning_content ?? null;
              if (reasoning) send(reasoning);

              if (delta.content != null && delta.content !== "") {
                send(delta.content);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        // Save assistant response to Supabase after stream completes
        if (user && threadId && fullAssistantResponse.trim()) {
          await saveMessage({
            thread_id: threadId,
            user_id: user.user_id,
            role: "assistant",
            content: fullAssistantResponse.trim(),
          });
          // Update thread's updated_at
          await upsertThread({
            thread_id: threadId,
            user_id: user.user_id,
            title: "New Chat", // won't overwrite existing — handled by upsert logic
            updated_at: new Date().toISOString(),
          });
        }

        controller.enqueue(
          encoder.encode(
            `d:${JSON.stringify({
              finishReason: "stop",
              usage: { promptTokens: 0, completionTokens: 0 },
            })}\n`
          )
        );
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Vercel-AI-Data-Stream": "v1",
      "Cache-Control": "no-cache",
    },
  });
}