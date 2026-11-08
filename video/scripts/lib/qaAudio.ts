import type { ResolvedSfxCue } from "../../src/templates/sfxCues";

// "post-26-bulbous-bow" -> the "Post26-..." composition registered in Root.tsx.
export const compositionForPost = (rootSource: string, postId: string): string => {
  const number = postId.match(/^post-(\d+)-/)?.[1];
  const match = number ? rootSource.match(new RegExp(`id="(Post${number}-[^"]+)"`)) : null;
  if (!match) {
    throw new Error(`No reel composition for ${postId} in Root.tsx`);
  }
  return match[1];
};

export const cueWindows = (cues: ResolvedSfxCue[], fps: number) =>
  cues.map((c) => ({ sound: c.sound, start: c.from / fps, end: (c.from + c.durationInFrames) / fps }));
