import { staticFile } from "remotion";
import { estimateCaptions, estimateDurationMs } from "./timing";
import type { PostScript, SectionId, VoManifest } from "./types";

export const voManifestPath = (postId: string) => `posts/${postId}/vo.json`;

export const buildEstimatedManifest = (script: PostScript, wordsPerSecond: number): VoManifest => ({
  postId: script.id,
  estimated: true,
  sections: script.sections.map((s) => {
    const durationMs = estimateDurationMs(s.voiceover, wordsPerSecond);
    return {
      id: s.id,
      text: s.voiceover,
      file: null,
      durationMs,
      captions: estimateCaptions(s.voiceover, durationMs),
    };
  }),
});

export const staleSections = (script: PostScript, vo: VoManifest): SectionId[] =>
  script.sections
    .filter((s) => vo.sections.find((v) => v.id === s.id)?.text !== s.voiceover)
    .map((s) => s.id);

// Real VO if `npm run tts` has been run for this post, otherwise estimated timing.
export const loadVo = async (script: PostScript, wordsPerSecond: number): Promise<VoManifest> => {
  let vo: VoManifest | null = null;
  try {
    const res = await fetch(staticFile(voManifestPath(script.id)));
    if (res.ok) {
      vo = (await res.json()) as VoManifest;
    }
  } catch {
    vo = null;
  }
  if (!vo) {
    return buildEstimatedManifest(script, wordsPerSecond);
  }
  const stale = staleSections(script, vo);
  if (stale.length > 0) {
    throw new Error(
      `VO for ${script.id} is out of date (${stale.join(", ")}). Run: npm run tts -- ${script.id}`,
    );
  }
  return vo;
};
