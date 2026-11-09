import { staticFile } from "remotion";
import { sfxManifestPath } from "./sfxCues";
import type { SfxManifest } from "./types";

// Null until `npm run sfx` has been run for this post.
export const loadSfxManifest = async (postId: string): Promise<SfxManifest | null> => {
  try {
    const res = await fetch(staticFile(sfxManifestPath(postId)));
    return res.ok ? ((await res.json()) as SfxManifest) : null;
  } catch {
    return null;
  }
};
