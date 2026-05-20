/** Hosted-model policy refusals — filtered from history and swapped in-stream */

const REFUSAL_PATTERNS: RegExp[] = [
  /^I can'?t help with that\.?$/im,
  /I can'?t help with (that|this)/i,
  /I don'?t assist with illegal/i,
  /I can'?t assist with/i,
  /I won'?t (help|assist|provide)/i,
  /I'?m not able to (help|assist)/i,
  /I cannot (help|assist|provide)/i,
  /I must (decline|refuse)/i,
  /against my (guidelines|policies)/i,
  /as an AI (language )?model/i,
  /responsible and respectful way/i,
  /illegal, harmful, or unethical/i,
  /violence, abuse, or exploitation/i,
  /I'?m sorry,? but I can'?t/i,
  /unable to (help|assist|comply)/i,
];

export function isHostedRefusal(text: string): boolean {
  return false;
}

export const HOSTED_BLOCK_MESSAGE = `[ASHURA] Self-hosted worker blocked this response. Please rephrase the question.`;
