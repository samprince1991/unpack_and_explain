// Pure decisions for `npm run blender`: no files, no processes.
import { hashString } from "../../src/templates/blenderJob";
import type { BlenderManifestClip } from "../../src/templates/types";

export const DEFAULT_WORKERS = 3;
export const CHUNK_FRAMES = 40;

export type BlenderArgs = {
  postId: string | null;
  preview: boolean;
  force: boolean;
  selftest: boolean;
  workers: number;
  only: string[] | null;
  frames: "beats" | number[] | null;
};

const USAGE =
  "Usage: npm run blender -- post-NN-slug [--preview] [--force] [--workers=N] [--only=cover,hook] [--frames[=120,240]]";

export const parseBlenderArgs = (args: string[]): BlenderArgs => {
  const out: BlenderArgs = {
    postId: null,
    preview: false,
    force: false,
    selftest: false,
    workers: DEFAULT_WORKERS,
    only: null,
    frames: null,
  };
  for (const arg of args) {
    if (!arg.startsWith("--")) {
      out.postId = arg;
    } else if (arg === "--preview") {
      out.preview = true;
    } else if (arg === "--force") {
      out.force = true;
    } else if (arg === "--selftest") {
      out.selftest = true;
    } else if (arg === "--frames") {
      out.frames = "beats";
    } else if (arg.startsWith("--frames=")) {
      const list = arg.slice(9).split(",").map(Number);
      if (list.some((n) => !Number.isInteger(n) || n < 0)) {
        throw new Error(`Bad --frames value: ${arg}`);
      }
      out.frames = list;
    } else if (arg.startsWith("--workers=")) {
      const n = Number(arg.slice(10));
      if (!Number.isInteger(n) || n < 1) {
        throw new Error(`Bad --workers value: ${arg}`);
      }
      out.workers = n;
    } else if (arg.startsWith("--only=")) {
      out.only = arg.slice(7).split(",");
    } else {
      throw new Error(`Unknown flag ${arg}. ${USAGE}`);
    }
  }
  if (!out.postId && !out.selftest) {
    throw new Error(USAGE);
  }
  return out;
};

export const chunkFrames = (frames: number[], size: number): number[][] => {
  const chunks: number[][] = [];
  for (let i = 0; i < frames.length; i += size) {
    chunks.push(frames.slice(i, i + size));
  }
  return chunks;
};

export const allFrames = (count: number) => Array.from({ length: count }, (_, i) => i);

export const testFrames = (
  clip: { frames: number; beats: { frame: number }[] },
  wanted: "beats" | number[],
) => {
  const list = wanted === "beats" ? [0, clip.frames - 1, ...clip.beats.map((b) => b.frame)] : wanted;
  const unique = [...new Set(list)].sort((a, b) => a - b);
  return {
    frames: unique.filter((f) => f < clip.frames),
    dropped: unique.filter((f) => f >= clip.frames),
  };
};

export type ClipWant = {
  modelHash: string;
  codeHash: string;
  preview: boolean;
  force: boolean;
  framesOnDisk: boolean;
};

export const clipDecision = (
  clip: { hash: string },
  rendered: BlenderManifestClip | undefined,
  want: ClipWant,
): { render: boolean; reason: string } => {
  const render = (reason: string) => ({ render: true, reason });
  if (want.force) {
    return render("--force");
  }
  if (!rendered) {
    return render("no render yet");
  }
  if (rendered.hash !== clip.hash) {
    return render("plan or VO timing changed");
  }
  if (rendered.modelHash !== want.modelHash) {
    return render(rendered.modelHash ? "model file changed" : "rendered before model tracking");
  }
  if (rendered.codeHash !== want.codeHash) {
    return render(rendered.codeHash ? "shared Blender code changed" : "rendered before code tracking");
  }
  if (rendered.preview && !want.preview) {
    return render("only a preview exists");
  }
  if (!want.framesOnDisk) {
    return render("frames missing on disk");
  }
  return { render: false, reason: "up to date" };
};

export const hashSources = (files: { path: string; text: string }[]) =>
  hashString(
    [...files]
      .sort((a, b) => a.path.localeCompare(b.path))
      .map((f) => `${f.path}\n${f.text.replace(/\r\n/g, "\n")}`)
      .join("\n"),
  );

export const frameName = (frame: number) => `${String(frame).padStart(4, "0")}.png`;

export const framesComplete = (files: string[], count: number) => {
  const pngs = new Set(files.filter((f) => f.endsWith(".png")));
  return pngs.size === count && allFrames(count).every((f) => pngs.has(frameName(f)));
};
