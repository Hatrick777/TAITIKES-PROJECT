import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import fs from "fs";
import path from "path";

const clod = createOpenAI({
  baseURL: "https://api.clod.io/v1",
  apiKey: process.env.CLOD_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();
  const systemPrompt = fs.readFileSync(
    path.join(process.cwd(), "custom instruction.md"),
    "utf-8"
  );
  const result = streamText({
    model: clod(model || "DeepSeek R1"),
    system: systemPrompt,
    messages,
  });
  return result.toDataStreamResponse();
}