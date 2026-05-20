import fs from "fs";
import path from "path";
import {
  PROMPT_DEFAULT as FALLBACK_DEFAULT,
  PROMPT_V1 as FALLBACK_V1,
  PROMPT_V2 as FALLBACK_V2,
} from "@/lib/ashura-prompts";

const INSTRUCTIONS_PATH = path.join(process.cwd(), "custom instruction.md");



type AshuraPrompts = {
  v1: string;
  v2: string;
  default: string;
};

let cache: { mtimeMs: number; prompts: AshuraPrompts } | null = null;


function extractSection(content: string, heading: string): string {
  const re = new RegExp(
    `##\\s*${heading.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\n([\\s\\S]*?)(?=\\n---\\s*\\n|\\n##\\s|$)`,
    "i"
  );
  const match = content.match(re);
  return match?.[1]?.trim() ?? "";
}

function parseInstructionsFile(raw: string): AshuraPrompts {
  const v1Raw = extractSection(raw, "ASHURA Evil V1");
  const v2Raw = extractSection(raw, "ASHURA V2");

  const v1 = v1Raw || FALLBACK_V1;
  const v2 = v2Raw || FALLBACK_V2;

  return {
    v1,
    v2,
    default: v1,
  };
}

export function getAshuraPrompts(): AshuraPrompts {
  try {
    if (!fs.existsSync(INSTRUCTIONS_PATH)) {
      return { v1: FALLBACK_V1, v2: FALLBACK_V2, default: FALLBACK_DEFAULT };
    }

    const stat = fs.statSync(INSTRUCTIONS_PATH);
    if (cache && cache.mtimeMs === stat.mtimeMs) {
      return cache.prompts;
    }

    const raw = fs.readFileSync(INSTRUCTIONS_PATH, "utf8");
    const prompts = parseInstructionsFile(raw);
    cache = { mtimeMs: stat.mtimeMs, prompts };
    return prompts;
  } catch (err) {
    console.error("[ashura] failed to read custom instruction.md:", err);
    return { v1: FALLBACK_V1, v2: FALLBACK_V2, default: FALLBACK_DEFAULT };
  }
}

export function getPromptForVariant(
  variant: string | undefined
): string {
  const p = getAshuraPrompts();
  if (variant === "v2") return p.v2;
  if (variant === "v1") return p.v1;
  return p.default;
}
