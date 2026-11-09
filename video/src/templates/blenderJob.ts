import { layout } from "../brand/layout";
import { models, type ModelEntry, type ModelId } from "../brand/models";
import { durations } from "../brand/motion";
import { findCueMs } from "./cues";
import { computeTimeline } from "./timing";
import type {
  Beat,
  BlenderClipId,
  BlenderPlan,
  PostScript,
  SectionId,
  Shot,
  VoManifest,
  WorldId,
} from "./types";

// Bump when blender/*.py changes the look, so every render is marked stale.
export const BLENDER_LOOK_VERSION = 2;
// Bump when blender/world/*.py changes, so renders using a world are marked stale.
export const BLENDER_WORLD_VERSION = 1;

export type JobBeat = Omit<Beat, "cue" | "fallback"> & { frame: number };

export type JobClip = {
  id: BlenderClipId;
  frames: number;
  width: number;
  height: number;
  start: Shot;
  beats: JobBeat[];
  // Hash of this clip + model + look + fps: re-render one clip without staling the rest.
  hash: string;
};

export type BlenderJob = {
  postId: string;
  fps: number;
  lookVersion: number;
  world?: WorldId;
  model: { id: ModelId } & ModelEntry;
  clips: JobClip[];
  hash: string;
};

export const isBlenderPlan = (b: PostScript["blender"]): b is BlenderPlan =>
  typeof b === "object" && !("optOut" in b);

// Screen area of each clip. Without a hook title the hook gets the whole visual region.
export const blenderAreas = (script: Pick<PostScript, "hookTitle" | "blender">) => {
  const full = layout.blender.world;
  if (isBlenderPlan(script.blender) && script.blender.world) {
    return { opener: full, hook: full, mechanism: full, cover: full, backdrop: full };
  }
  return {
    opener: layout.blender.opener,
    hook: script.hookTitle === false ? layout.blender.mechanism : layout.blender.hook,
    mechanism: layout.blender.mechanism,
    cover: layout.blender.cover,
    backdrop: full,
  };
};

export type BlenderAreas = ReturnType<typeof blenderAreas>;

// Deterministic JSON (sorted keys) so the hash doesn't depend on key order.
const stable = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stable).join(",")}]`;
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    return `{${Object.keys(obj)
      .sort()
      .filter((k) => obj[k] !== undefined)
      .map((k) => `${JSON.stringify(k)}:${stable(obj[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(value);
};

// FNV-1a 32-bit, hex. Runs in Node and the browser (no crypto import).
export const hashString = (text: string): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

// Same FNV-1a over raw bytes: hashes a model file identically in Node and the browser.
export const hashBytes = (bytes: Uint8Array): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};

const resolveBeats = (
  beats: Beat[] | undefined,
  section: SectionId,
  vo: VoManifest,
  frames: number,
  fps: number,
): JobBeat[] => {
  const captions = vo.sections.find((s) => s.id === section)?.captions ?? [];
  return (beats ?? [])
    .map(({ cue, fallback, ...rest }) => {
      const ms = findCueMs(captions, cue);
      const frame = ms === null ? Math.round(frames * fallback) : Math.round((ms / 1000) * fps);
      return { ...rest, frame: Math.min(Math.max(frame, 0), frames - 1) };
    })
    .sort((a, b) => a.frame - b.frame);
};

const shotOf = ({ yaw, pitch, zoom, keyPart, exploded, roll, drift, aim, frameY, sea }: Shot): Shot => ({
  yaw,
  pitch,
  zoom,
  keyPart,
  exploded,
  roll,
  drift,
  aim,
  frameY,
  sea,
});

// The job Blender renders: one clip per 3D moment, frame-exact against the VO.
export const buildBlenderJob = (script: PostScript, vo: VoManifest, fps: number): BlenderJob => {
  if (!isBlenderPlan(script.blender)) {
    throw new Error(`${script.id} has no blender plan`);
  }
  const plan = script.blender;
  const { sections } = computeTimeline(vo.sections, fps, durations.crossfade);
  const length = (id: SectionId) => {
    const t = sections.find((s) => s.id === id);
    if (!t) {
      throw new Error(`Missing section ${id}`);
    }
    return t.durationInFrames;
  };
  const areas = blenderAreas(script);
  const { cover } = areas;
  const model = { id: plan.model, ...models[plan.model] };
  const withHash = (c: Omit<JobClip, "hash">): JobClip => ({
    ...c,
    hash: hashString(
      stable({
        c,
        model,
        fps,
        lookVersion: BLENDER_LOOK_VERSION,
        world: plan.world ? `${plan.world}-${BLENDER_WORLD_VERSION}` : undefined,
      }),
    ),
  });
  const reelClip = (
    id: Exclude<BlenderClipId, "cover">,
    section: SectionId,
    shot: Shot,
    beats?: Beat[],
  ) => {
    const frames = length(section);
    const area = areas[id];
    return withHash({
      id,
      frames,
      width: area.width,
      height: area.height,
      start: shotOf(shot),
      beats: resolveBeats(beats, section, vo, frames, fps),
    });
  };

  const clips: JobClip[] = [
    withHash({
      id: "cover",
      frames: 1,
      width: cover.width,
      height: cover.height,
      start: shotOf(plan.cover),
      beats: [],
    }),
    reelClip("opener", "question", plan.opener),
    reelClip("hook", "hook", plan.hook, plan.hook.beats),
    reelClip("mechanism", "mechanism", plan.mechanism, plan.mechanism.beats),
  ];
  if (plan.world) {
    // The world without the ship, shared by the 2D sections (each plays it from its own start).
    clips.push(
      withHash({
        id: "backdrop",
        frames: Math.max(length("setup"), length("payoff")),
        width: areas.backdrop.width,
        height: areas.backdrop.height,
        start: { yaw: 0, pitch: 7, zoom: 3, drift: 0, frameY: 0.5, exploded: true },
        beats: [],
      }),
    );
  }
  const body = {
    postId: script.id,
    fps,
    lookVersion: BLENDER_LOOK_VERSION,
    ...(plan.world ? { world: plan.world } : {}),
    model,
    clips,
  };
  return { ...body, hash: hashString(stable(body)) };
};

export const blenderDir = (postId: string) => `posts/${postId}/3d`;
export const blenderManifestPath = (postId: string) => `${blenderDir(postId)}/manifest.json`;
export const blenderFramePath = (postId: string, clip: BlenderClipId, frame: number) =>
  `${blenderDir(postId)}/${clip}/${String(frame).padStart(4, "0")}.png`;
