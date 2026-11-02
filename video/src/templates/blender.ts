import { createContext, useContext } from "react";
import { staticFile } from "remotion";
import { blenderManifestPath, type BlenderAreas, type BlenderJob } from "./blenderJob";
import type { BlenderClipId, BlenderManifest } from "./types";

export type ClipStatus = "ok" | "missing" | "stale" | "preview";

// Compares what Blender rendered with what the current script + VO need.
export const clipStatuses = (
  job: BlenderJob,
  manifest: BlenderManifest | null,
): Record<BlenderClipId, ClipStatus> =>
  Object.fromEntries(
    job.clips.map((clip) => {
      const rendered = manifest?.clips[clip.id];
      const status: ClipStatus = !rendered
        ? "missing"
        : rendered.hash !== clip.hash
          ? "stale"
          : rendered.preview
            ? "preview"
            : "ok";
      return [clip.id, status];
    }),
  ) as Record<BlenderClipId, ClipStatus>;

// Problems that block a final render (anything goes in Studio). QA renders may accept
// preview clips with the allowBlenderPreview prop; missing or stale clips always block.
export const blenderProblems = (
  postId: string,
  statuses: Record<BlenderClipId, ClipStatus>,
  allowPreview = false,
) => {
  const bad = Object.entries(statuses).filter(
    ([, s]) => s !== "ok" && !(allowPreview && s === "preview"),
  );
  return bad.length === 0
    ? null
    : `Blender clips not ready for ${postId} (${bad.map(([id, s]) => `${id}: ${s}`).join(", ")}). Run: npm run blender -- ${postId}`;
};

export const loadBlenderManifest = async (postId: string): Promise<BlenderManifest | null> => {
  try {
    const res = await fetch(staticFile(blenderManifestPath(postId)));
    return res.ok ? ((await res.json()) as BlenderManifest) : null;
  } catch {
    return null;
  }
};

export type BlenderContextValue = {
  postId: string;
  manifest: BlenderManifest | null;
  areas: BlenderAreas;
};

export const BlenderContext = createContext<BlenderContextValue | null>(null);

export const useBlender = (): BlenderContextValue => {
  const value = useContext(BlenderContext);
  if (!value) {
    throw new Error("BlenderClip must be inside a Reel or Cover with a blender plan");
  }
  return value;
};
