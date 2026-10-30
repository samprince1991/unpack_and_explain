// "1 First step. 2 Second step." -> ["First step.", "Second step."]. A step number only
// counts at the start or right after a sentence ends, so "about 30 satellites" stays
// whole. A trailing "Source: ..." is dropped: the template prints the script's source.
export const recapSteps = (body: string): string[] =>
  body
    .replace(/\s*Source:.*$/, "")
    .split(/(?:^|(?<=[.?])\s+)\d+\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
