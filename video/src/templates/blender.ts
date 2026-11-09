import { createContext, useContext } from "react";
import { staticFile } from "remotion";
import { blenderManifestPath, hashBytes, type BlenderAreas, type BlenderJob } from "./blenderJob";
import type { BlenderClipId, BlenderManifest } from "./types";

export type ClipStatus = "ok" | "missing" | "stale" | "preview";

// Compares what Blender rendered with what the current script + VO need.
export const clipStatuses = (
  job: BlenderJob,
  manifest: BlenderManifest | null,
  modelHash: string | null = null,
): Partial<Record<BlenderClipId, ClipStatus>> =>
  Object.fromEntries(
    job.clips.map((clip) => {
      const rendered = manifest?.clips[clip.id];
      const modelChanged = Boolean(modelHash && rendered?.modelHash && rendered.modelHash !== modelHash);
      const status: ClipStatus = !rendered
        ? "missing"
        : rendered.hash !== clip.hash || modelChanged
          ? "stale"
          : rendered.preview
            ? "preview"
            : "ok";
      return [clip.id, status];
    }),
  );

// Problems that block a final render (anything goes in Studio). QA renders may accept
// preview clips with the allowBlenderPreview prop; missing or stale clips always block.
export const blenderProblems = (
  postId: string,
  statuses: Partial<Record<BlenderClipId, ClipStatus>>,
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

// Null when the file can't be read: the job's own check reports a truly missing model.
export const loadModelHash = async (file: string): Promise<string | null> => {
  try {
    const res = await fetch(staticFile(file));
    return res.ok ? hashBytes(new Uint8Array(await res.arrayBuffer())) : null;
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
