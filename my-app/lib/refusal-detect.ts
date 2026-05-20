/** Hosted-model policy refusals — filtered from history and swapped in-stream */

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isHostedRefusal(_text: string): boolean {
  // Self-hosted worker — no policy filtering needed
  return false;
}

export const HOSTED_BLOCK_MESSAGE = `[ASHURA] Self-hosted worker blocked this response. Please rephrase the question.`;
