import fs from "fs";
import path from "path";

const NVIDIA_BASE = "https://integrate.api.nvidia.com/v1";
const API_KEY =
  process.env.NVIDIA_API_KEY ??
  "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";

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "custom instruction.md"),
    "utf-8"
  );

  // Build messages with system prompt prepended
  const allMessages = [
    { role: "system", content: systemPrompt },
    ...messages.map((m: { role: string; content: string }) => ({
      role: m.role,
      content: m.content,
    })),
  ];

  // Raw fetch to NVIDIA — exactly like the Python code
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

  // Convert NVIDIA SSE stream → Vercel AI SDK data stream format
  // Format: 0:"text"\n  (text chunks)   d:{...}\n (finish)
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream({
    async start(controller) {
      const reader = nvidiaRes.body!.getReader();
      let buffer = "";

      const send = (text: string) => {
        // Escape for AI SDK data stream protocol
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

              // reasoning / thinking content
              const reasoning =
                delta.reasoning ?? delta.reasoning_content ?? null;
              if (reasoning) send(reasoning);

              // actual response content
              if (delta.content != null && delta.content !== "") {
                send(delta.content);
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      } finally {
        // Finish signal for AI SDK
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