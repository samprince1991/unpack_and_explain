# Faster, safer `npm run blender` Implementation Plan

> Execute inline in the main session with superpowers:executing-plans. CLAUDE.md rules out subagents. Commit only if the user asks. Steps use checkboxes for tracking.

**Goal:** Add parallel rendering, skipping of up-to-date clips, `--frames` test stills and model-based stale checks to `npm run blender`, with failed runs leaving finished clips intact.

**Architecture:** `video/scripts/blender.ts` owns all decisions and is the only manifest writer. Pure logic lives in `scripts/lib/blenderPlan.ts`, process handling in `scripts/lib/blenderPool.ts`. `blender/render.py` becomes a worker that renders a given frame list of one clip. The browser check fetches the GLB from `public/` and compares its hash with the manifest.

**Tech stack:** TypeScript (tsx, Vitest), Node `child_process`, Blender 4.5 Python, Remotion `calculateMetadata`.

**Spec:** `docs/specs/2026-11-09-blender-render-pipeline-design.md`

All commands run from `video/`.

---

## File map

| File | Change | Responsibility |
|---|---|---|
| `video/src/templates/blenderJob.ts` | Modify | Add `hashBytes` next to `hashString` (runs in Node and the browser) |
| `video/src/templates/types.ts` | Modify | `modelHash?`, `codeHash?` on `BlenderManifestClip` |
| `video/src/templates/blender.ts` | Modify | `clipStatuses` takes a model hash; add `loadModelHash` |
| `video/src/templates/metadata.ts`, `Cover.tsx` | Modify | Pass the model hash into the status check |
| `video/scripts/lib/blenderPlan.ts` | Create | Pure: arg parsing, chunking, test frames, skip decision, code hash, frame verification |
| `video/scripts/lib/blenderPool.ts` | Create | Worker pool: concurrency limit, stop on first failure, spawn Blender |
| `video/scripts/blender.ts` | Rewrite | Orchestration |
| `blender/render.py` | Modify | Worker mode; manifest and job loop removed |
| `CLAUDE.md` | Modify | Commands, stale rules, render times |

---

### Task 1: Byte hash and clip status

**Files:** Modify `video/src/templates/blenderJob.ts`, `types.ts`, `blender.ts`; test `blenderJob.test.ts`, `blender.test.ts`.

- [ ] **Step 1: Write failing tests.** Add to `blenderJob.test.ts` (import `hashBytes`, `hashString`):

```ts
describe("hashBytes", () => {
  it("matches hashString on ASCII and the FNV-1a test vector", () => {
    const bytes = new TextEncoder().encode("a");
    expect(hashBytes(bytes)).toBe("e40c292c");
    expect(hashBytes(bytes)).toBe(hashString("a"));
  });
  it("changes when one byte changes", () => {
    expect(hashBytes(new Uint8Array([1, 2, 3]))).not.toBe(hashBytes(new Uint8Array([1, 2, 4])));
  });
});
```

Add to `blender.test.ts`, inside `describe("clipStatuses")`:

```ts
it("marks a clip stale when its model file changed", () => {
  const manifest: BlenderManifest = {
    postId: "p",
    clips: { cover: { ...rendered("a"), modelHash: "m1" } },
  };
  expect(clipStatuses(job, manifest, "m2").cover).toBe("stale");
  expect(clipStatuses(job, manifest, "m1").cover).toBe("ok");
});

it("accepts old renders with no model hash, and an unreadable model file", () => {
  const manifest: BlenderManifest = { postId: "p", clips: { cover: rendered("a") } };
  expect(clipStatuses(job, manifest, "m2").cover).toBe("ok");
  const tracked: BlenderManifest = { postId: "p", clips: { cover: { ...rendered("a"), modelHash: "m1" } } };
  expect(clipStatuses(job, tracked, null).cover).toBe("ok");
});
```

- [ ] **Step 2: Run and confirm failure.** `npx vitest run src/templates/blender.test.ts src/templates/blenderJob.test.ts`. Expected: FAIL (`hashBytes` is not a function; `stale` not returned).

- [ ] **Step 3: Implement.** In `blenderJob.ts`, after `hashString`:

```ts
// Same FNV-1a over raw bytes: hashes a model file identically in Node and the browser.
export const hashBytes = (bytes: Uint8Array): string => {
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) {
    h ^= bytes[i];
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, "0");
};
```

In `types.ts`, on `BlenderManifestClip`, and correct the comment above `BlenderManifest` to say `scripts/blender.ts` writes it:

```ts
  // Hash of the model's GLB. A mismatch makes the clip stale. Older renders have none.
  modelHash?: string;
  // Hash of the shared Blender code. Only `npm run blender` compares it (re-renders, never blocks).
  codeHash?: string;
```

In `blender.ts`, replace `clipStatuses` and add `loadModelHash`:

```ts
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

// Null when the file can't be read: the job's own check reports a truly missing model.
export const loadModelHash = async (file: string): Promise<string | null> => {
  try {
    const res = await fetch(staticFile(file));
    return res.ok ? hashBytes(new Uint8Array(await res.arrayBuffer())) : null;
  } catch {
    return null;
  }
};
```

Update the import: `import { blenderManifestPath, hashBytes, type BlenderAreas, type BlenderJob } from "./blenderJob";`

- [ ] **Step 4: Run and confirm pass.** Same command. Expected: PASS.

### Task 2: Wire the model check into metadata

**Files:** Modify `video/src/templates/metadata.ts:31-37`, `video/src/templates/Cover.tsx:127-137`.

- [ ] **Step 1: Reels.** In `metadata.ts`, import `loadModelHash` and change the block to:

```ts
    blender3d = await loadBlenderManifest(props.script.id);
    const job = buildBlenderJob(props.script, vo, video.fps);
    const modelHash = await loadModelHash(job.model.file);
    const problem = blenderProblems(
      props.script.id,
      clipStatuses(job, blender3d, modelHash),
      props.allowBlenderPreview,
    );
```

- [ ] **Step 2: Covers.** In `Cover.tsx`, import `loadModelHash` and change the block to:

```ts
    const job = buildBlenderJob(props.script, vo, video.fps);
    const statuses = clipStatuses(job, blender3d, await loadModelHash(job.model.file));
    if (statuses.cover !== "ok" && getRemotionEnvironment().isRendering) {
      throw new Error(blenderProblems(props.script.id, statuses) ?? "");
    }
```

- [ ] **Step 3: Check.** `npm run lint` and `npx vitest run src/templates`. Expected: both pass.

### Task 3: Pure planning logic

**Files:** Create `video/scripts/lib/blenderPlan.ts`, `video/scripts/lib/blenderPlan.test.ts`.

- [ ] **Step 1: Write failing tests.**

```ts
import { describe, expect, it } from "vitest";
import type { BlenderManifestClip } from "../../src/templates/types";
import {
  chunkFrames,
  clipDecision,
  framesComplete,
  hashSources,
  parseBlenderArgs,
  testFrames,
} from "./blenderPlan";

describe("parseBlenderArgs", () => {
  it("has the documented defaults", () => {
    expect(parseBlenderArgs(["post-21"])).toEqual({
      postId: "post-21", preview: false, force: false, selftest: false, workers: 3, only: null, frames: null,
    });
  });
  it("reads every flag", () => {
    const a = parseBlenderArgs(["post-21", "--preview", "--force", "--workers=1", "--only=hook,cover", "--frames=120,240"]);
    expect(a).toMatchObject({ preview: true, force: true, workers: 1, only: ["hook", "cover"], frames: [120, 240] });
    expect(parseBlenderArgs(["post-21", "--frames"]).frames).toBe("beats");
  });
  it("rejects bad input instead of ignoring it", () => {
    expect(() => parseBlenderArgs(["p", "--workers=0"])).toThrow(/workers/);
    expect(() => parseBlenderArgs(["p", "--frames=a"])).toThrow(/frames/);
    expect(() => parseBlenderArgs(["p", "--nope"])).toThrow(/nope/);
    expect(() => parseBlenderArgs([])).toThrow(/Usage/);
  });
});

describe("chunkFrames", () => {
  it("splits frames in order and keeps every one", () => {
    const frames = Array.from({ length: 95 }, (_, i) => i);
    const chunks = chunkFrames(frames, 40);
    expect(chunks.map((c) => c.length)).toEqual([40, 40, 15]);
    expect(chunks.flat()).toEqual(frames);
  });
  it("keeps short clips in one chunk", () => {
    expect(chunkFrames([0], 40)).toEqual([[0]]);
  });
});

describe("testFrames", () => {
  const clip = { frames: 100, beats: [{ frame: 50 }, { frame: 0 }, { frame: 50 }] };
  it("uses first, last and beat frames without repeats", () => {
    expect(testFrames(clip, "beats")).toEqual({ frames: [0, 50, 99], dropped: [] });
  });
  it("drops exact frames past the end", () => {
    expect(testFrames(clip, [240, 10])).toEqual({ frames: [10], dropped: [240] });
  });
});

describe("clipDecision", () => {
  const clip = { hash: "h", frames: 2 };
  const want = { modelHash: "m", codeHash: "c", preview: false, force: false, framesOnDisk: true };
  const full: BlenderManifestClip = {
    hash: "h", modelHash: "m", codeHash: "c", frames: 2, width: 1, height: 1, preview: false, blenderVersion: "4.5", labels: [],
  };
  it("skips only when everything matches", () => {
    expect(clipDecision(clip, full, want).render).toBe(false);
  });
  it.each([
    ["no render", undefined, want],
    ["plan change", { ...full, hash: "x" }, want],
    ["model change", { ...full, modelHash: "x" }, want],
    ["code change", { ...full, codeHash: "x" }, want],
    ["old render with no model hash", { ...full, modelHash: undefined }, want],
    ["old render with no code hash", { ...full, codeHash: undefined }, want],
    ["preview when full is wanted", { ...full, preview: true }, want],
    ["frames gone from disk", full, { ...want, framesOnDisk: false }],
    ["--force", full, { ...want, force: true }],
  ])("renders on %s", (_name, rendered, w) => {
    expect(clipDecision(clip, rendered, w).render).toBe(true);
  });
  it("keeps a full render when only a preview is asked for", () => {
    expect(clipDecision(clip, full, { ...want, preview: true }).render).toBe(false);
  });
});

describe("hashSources", () => {
  it("ignores line endings and file order, and sees real changes", () => {
    const a = hashSources([{ path: "a.py", text: "x\r\ny" }, { path: "b.py", text: "z" }]);
    expect(hashSources([{ path: "b.py", text: "z" }, { path: "a.py", text: "x\ny" }])).toBe(a);
    expect(hashSources([{ path: "a.py", text: "x\ny!" }, { path: "b.py", text: "z" }])).not.toBe(a);
  });
});

describe("framesComplete", () => {
  it("needs exactly 0000..n-1", () => {
    expect(framesComplete(["0000.png", "0001.png"], 2)).toBe(true);
    expect(framesComplete(["0000.png"], 2)).toBe(false);
    expect(framesComplete(["0000.png", "0002.png"], 2)).toBe(false);
    expect(framesComplete(["0000.png", "0001.png", "0002.png"], 2)).toBe(false);
  });
});
```

- [ ] **Step 2: Run and confirm failure.** `npx vitest run scripts/lib/blenderPlan.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `blenderPlan.ts`.**

```ts
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
    postId: null, preview: false, force: false, selftest: false, workers: DEFAULT_WORKERS, only: null, frames: null,
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
  if (want.force) return render("--force");
  if (!rendered) return render("no render yet");
  if (rendered.hash !== clip.hash) return render("plan or VO timing changed");
  if (rendered.modelHash !== want.modelHash) {
    return render(rendered.modelHash ? "model file changed" : "rendered before model tracking");
  }
  if (rendered.codeHash !== want.codeHash) {
    return render(rendered.codeHash ? "shared Blender code changed" : "rendered before code tracking");
  }
  if (rendered.preview && !want.preview) return render("only a preview exists");
  if (!want.framesOnDisk) return render("frames missing on disk");
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
```

- [ ] **Step 4: Run and confirm pass.** Same command. Expected: PASS.

### Task 4: Worker pool

**Files:** Create `video/scripts/lib/blenderPool.ts`, `video/scripts/lib/blenderPool.test.ts`.

- [ ] **Step 1: Write failing tests.**

```ts
import { describe, expect, it } from "vitest";
import { runPool, type PoolJob } from "./blenderPool";

const controlled = () => {
  const started: number[] = [];
  const killed: number[] = [];
  const finish = new Map<number, (err?: Error) => void>();
  const start = (task: number): PoolJob => {
    started.push(task);
    return {
      done: new Promise<void>((resolve, reject) => {
        finish.set(task, (err) => (err ? reject(err) : resolve()));
      }),
      kill: () => {
        killed.push(task);
        finish.get(task)?.(new Error("killed"));
      },
    };
  };
  return { started, killed, finish, start };
};

const tick = () => new Promise((r) => setTimeout(r, 0));

describe("runPool", () => {
  it("never exceeds the worker limit and runs everything", async () => {
    const c = controlled();
    const run = runPool([1, 2, 3], 2, c.start);
    await tick();
    expect(c.started).toEqual([1, 2]);
    c.finish.get(1)?.();
    await tick();
    expect(c.started).toEqual([1, 2, 3]);
    c.finish.get(2)?.();
    c.finish.get(3)?.();
    await expect(run).resolves.toBeUndefined();
  });

  it("on failure kills the others, starts nothing new, reports the first error", async () => {
    const c = controlled();
    const run = runPool([1, 2, 3], 2, c.start);
    await tick();
    c.finish.get(1)?.(new Error("boom"));
    await expect(run).rejects.toThrow("boom");
    expect(c.killed).toEqual([2]);
    expect(c.started).toEqual([1, 2]);
  });

  it("reports progress per finished task", async () => {
    const seen: number[] = [];
    const start = (): PoolJob => ({ done: Promise.resolve(), kill: () => undefined });
    await runPool([1, 2], 1, start, (n) => seen.push(n));
    expect(seen).toEqual([1, 2]);
  });
});
```

- [ ] **Step 2: Run and confirm failure.** `npx vitest run scripts/lib/blenderPool.test.ts`. Expected: FAIL (module not found).

- [ ] **Step 3: Implement `blenderPool.ts`.**

```ts
// Runs Blender workers with a concurrency limit. The first failure stops everything.
import { spawn } from "node:child_process";

export type PoolJob = { done: Promise<void>; kill: () => void };

export const runPool = async <T>(
  tasks: T[],
  workers: number,
  start: (task: T) => PoolJob,
  onFinished?: (finished: number) => void,
): Promise<void> => {
  let next = 0;
  let finished = 0;
  let failure: { error: unknown } | null = null;
  const running = new Set<PoolJob>();

  const lane = async () => {
    while (!failure && next < tasks.length) {
      const job = start(tasks[next++]);
      running.add(job);
      try {
        await job.done;
        finished++;
        onFinished?.(finished);
      } catch (error) {
        if (!failure) {
          failure = { error };
          [...running].filter((j) => j !== job).forEach((j) => j.kill());
        }
      } finally {
        running.delete(job);
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(workers, tasks.length) }, lane));
  if (failure) {
    throw (failure as { error: unknown }).error;
  }
};

const TAIL_LINES = 40;

// One Blender process. Output is held back (three at once is unreadable) and shown on failure.
export const startBlender = (exe: string, scriptPath: string, args: string[]): PoolJob => {
  const child = spawn(
    exe,
    ["-b", "--factory-startup", "--python-exit-code", "1", "--python", scriptPath, "--", ...args],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let tail: string[] = [];
  const keep = (data: Buffer) => {
    tail = [...tail, ...data.toString().split(/\r?\n/)].slice(-TAIL_LINES);
  };
  child.stdout.on("data", keep);
  child.stderr.on("data", keep);
  return {
    done: new Promise<void>((resolve, reject) => {
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Blender exited with ${code}:\n${tail.join("\n")}`));
        }
      });
    }),
    kill: () => {
      child.kill();
    },
  };
};
```

- [ ] **Step 4: Run and confirm pass.** Same command. Expected: PASS.

### Task 5: `render.py` worker mode

**Files:** Modify `blender/render.py`.

- [ ] **Step 1: Rewrite the file's top section and `main`.** Replace the docstring, drop `write_manifest` and `run_job`, keep `render_clip` and `selftest`, add `run_worker`, and keep the `try: main()` block at the bottom unchanged:

```python
"""Run by `npm run blender` (video/scripts/blender.ts), which decides what to render:

  blender -b --factory-startup --python-exit-code 1 --python blender/render.py -- \
    --worker <job.json> <clip_id> <out_dir> <frame,frame,...> <meta.json or -> [--preview]
  blender -b --factory-startup --python blender/render.py -- --selftest <out_dir>

A worker renders the given frames of one clip as RGBA PNGs named NNNN.png into <out_dir>.
With a meta path it also writes that clip's label tracks and the Blender version."""
```

```python
def run_worker(job_path, clip_id, out_dir, frames, meta_path, preview):
    tokens = load_tokens()
    job = load_json(job_path)
    clip = next(c for c in job["clips"] if c["id"] == clip_id)
    scene = reset_scene()
    labels = build.build_clip(scene, job, clip, tokens, preview, REPO_ROOT)
    os.makedirs(out_dir, exist_ok=True)
    if meta_path != "-":
        with open(meta_path, "w", encoding="utf-8") as f:
            json.dump({"labels": labels, "blenderVersion": bpy.app.version_string}, f)
    for frame in frames:
        scene.frame_set(frame)
        scene.render.filepath = os.path.join(out_dir, f"{frame:04d}.png")
        bpy.ops.render.render(write_still=True)


def main():
    args = script_args()
    flags = [a for a in args if a.startswith("--")]
    rest = [a for a in args if not a.startswith("--")]
    if "--selftest" in flags:
        selftest(rest[0])
        return
    if "--worker" not in flags:
        raise SystemExit("render.py is run by `npm run blender`")
    job_path, clip_id, out_dir, frames, meta_path = rest
    run_worker(job_path, clip_id, out_dir, [int(f) for f in frames.split(",")], meta_path, "--preview" in flags)
```

- [ ] **Step 2: Confirm selftest still works** after Task 6: `npm run blender -- --selftest`. Expected: `[selftest] OK`.

### Task 6: Orchestrator

**Files:** Rewrite the `main` part of `video/scripts/blender.ts`. Keep the header helpers `exportTokens`, `loadScript`, `loadVoFile`, `requiredVersion`.

- [ ] **Step 1: Update the header comment and imports.**

```ts
// Renders a post's Blender 3D clips (docs/specs/2026-11-09-blender-render-pipeline-design.md).
//
//   npm run blender -- post-NN-slug [--preview] [--force] [--workers=N] [--only=cover,hook]
//   npm run blender -- post-NN-slug --frames[=120,240]   (test stills in out/blender-frames/)
//   npm run blender -- kit-blender [--preview]           (the Kit-Blender sample)
//   npm run blender -- --selftest                        (cube in look A; checks alpha + amber)
//
// Exports blender/tokens.json, builds the job from script.ts + vo.json (same cue maths as
// useCue), then renders each clip that isn't up to date. This file is the manifest's only
// writer. A clip reaches its folder only once every frame has rendered.
import { existsSync, mkdirSync, readdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { colors, video } from "../src/brand/tokens";
import { voice } from "../src/brand/voice";
import { LINE } from "../src/components/three/materials";
import { blenderDir, buildBlenderJob, hashBytes, type BlenderJob, type JobClip } from "../src/templates/blenderJob";
import type { BlenderLabelTrack, BlenderManifest, PostScript, VoManifest } from "../src/templates/types";
import { buildEstimatedManifest, staleSections, voManifestPath } from "../src/templates/vo";
import { findBlender } from "./lib/blender";
import {
  allFrames,
  CHUNK_FRAMES,
  chunkFrames,
  clipDecision,
  framesComplete,
  hashSources,
  parseBlenderArgs,
  testFrames,
  type BlenderArgs,
} from "./lib/blenderPlan";
import { runPool, startBlender } from "./lib/blenderPool";
```

- [ ] **Step 2: Replace `runBlender` and `main`.**

```ts
const RENDER_SCRIPT = join(BLENDER_DIR, "render.py");
const WORLD_DIR = join(BLENDER_DIR, "world");
const CODE_FILES = ["build.py", "look.py", "common.py", "qc.py", "render.py", "tokens.json"];

const computeCodeHash = (modelId: string) => {
  const read = (path: string) => ({ path, text: readFileSync(join(BLENDER_DIR, path), "latin1") });
  const world = readdirSync(WORLD_DIR).filter((f) => f.endsWith(".py")).map((f) => `world/${f}`);
  const blend = `models/${modelId}.blend`;
  const hasBlend = existsSync(join(BLENDER_DIR, blend));
  if (hasBlend) {
    console.warn(`[blender] ${blend} is tracked here, but final renders can't verify it`);
  }
  return hashSources([...CODE_FILES, ...world, ...(hasBlend ? [blend] : [])].map(read));
};

const readManifest = (path: string, postId: string): BlenderManifest =>
  existsSync(path)
    ? { postId, clips: (JSON.parse(readFileSync(path, "utf8")) as BlenderManifest).clips }
    : { postId, clips: {} };

const renderFrames = (
  exe: string,
  jobPath: string,
  clipId: string,
  outDir: string,
  chunks: number[][],
  args: BlenderArgs,
  metaPath: string | null,
  onFinished: (finished: number) => void,
) =>
  runPool(
    chunks.map((frames, index) => ({ frames, index })),
    args.workers,
    ({ frames, index }) =>
      startBlender(exe, RENDER_SCRIPT, [
        "--worker",
        jobPath,
        clipId,
        outDir,
        frames.join(","),
        // Label tracks cover the whole clip, so the first chunk's are enough.
        index === 0 && metaPath ? metaPath : "-",
        ...(args.preview ? ["--preview"] : []),
      ]),
    onFinished,
  );

const renderClip = async (exe: string, jobPath: string, clip: JobClip, outDir: string, args: BlenderArgs) => {
  const tmp = join(outDir, `${clip.id}.tmp`);
  const metaPath = `${tmp}.meta.json`;
  rmSync(tmp, { recursive: true, force: true });
  rmSync(metaPath, { force: true });
  mkdirSync(tmp, { recursive: true });
  try {
    const chunks = chunkFrames(allFrames(clip.frames), CHUNK_FRAMES);
    await renderFrames(exe, jobPath, clip.id, tmp, chunks, args, metaPath, (finished) => {
      console.log(`[blender] ${clip.id}: ${finished}/${chunks.length} chunks`);
    });
    if (!framesComplete(readdirSync(tmp), clip.frames)) {
      throw new Error(`${clip.id}: Blender finished but frames are missing`);
    }
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
      labels: BlenderLabelTrack[];
      blenderVersion: string;
    };
    const clipDir = join(outDir, clip.id);
    rmSync(clipDir, { recursive: true, force: true, maxRetries: 5 });
    renameSync(tmp, clipDir);
    return meta;
  } catch (err) {
    rmSync(tmp, { recursive: true, force: true, maxRetries: 5 });
    throw err;
  } finally {
    rmSync(metaPath, { force: true });
  }
};

const renderTestStills = async (exe: string, jobPath: string, job: BlenderJob, clips: JobClip[], args: BlenderArgs) => {
  const wanted = args.frames as "beats" | number[];
  for (const clip of clips) {
    const { frames, dropped } = testFrames(clip, wanted);
    if (dropped.length > 0) {
      console.warn(`[blender] ${clip.id}: only has ${clip.frames} frames, dropped ${dropped.join(", ")}`);
    }
    if (frames.length === 0) {
      continue;
    }
    const dir = join(VIDEO, "out", "blender-frames", job.postId, clip.id);
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    const size = Math.min(CHUNK_FRAMES, Math.ceil(frames.length / args.workers));
    await renderFrames(exe, jobPath, clip.id, dir, chunkFrames(frames, size), args, null, () => undefined);
    console.log(`[blender] ${clip.id}: frames ${frames.join(", ")} -> ${dir}`);
  }
};

const main = async () => {
  const args = parseBlenderArgs(process.argv.slice(2));
  const exe = findBlender();
  if (!exe) {
    throw new Error(
      `Blender not found. Install ${requiredVersion()}: winget install BlenderFoundation.Blender (or set BLENDER_PATH)`,
    );
  }
  exportTokens();

  if (args.selftest) {
    const out = join(VIDEO, "out", "blender-selftest");
    mkdirSync(out, { recursive: true });
    await startBlender(exe, RENDER_SCRIPT, ["--selftest", out]).done;
    console.log("[selftest] OK");
    return;
  }

  const script = await loadScript(args.postId as string);
  const vo = loadVoFile(script);
  const job = buildBlenderJob(script, vo, video.fps);
  const outDir = join(PUBLIC, blenderDir(script.id));
  mkdirSync(outDir, { recursive: true });
  const jobPath = join(outDir, "job.json");
  writeFileSync(jobPath, JSON.stringify(job, null, 2));

  const clips = job.clips.filter((c) => !args.only || args.only.includes(c.id));
  const started = Date.now();
  if (args.frames) {
    await renderTestStills(exe, jobPath, job, clips, args);
    console.log(`[blender] stills done in ${Math.round((Date.now() - started) / 1000)} s`);
    return;
  }

  const modelHash = hashBytes(readFileSync(join(PUBLIC, job.model.file)));
  const codeHash = computeCodeHash(job.model.id);
  const manifestPath = join(outDir, "manifest.json");
  const manifest = readManifest(manifestPath, job.postId);
  let rendered = 0;
  for (const clip of clips) {
    const clipDir = join(outDir, clip.id);
    const framesOnDisk = existsSync(clipDir) && framesComplete(readdirSync(clipDir), clip.frames);
    const decision = clipDecision(clip, manifest.clips[clip.id], {
      modelHash, codeHash, preview: args.preview, force: args.force, framesOnDisk,
    });
    if (!decision.render) {
      console.log(`[blender] ${clip.id}: skipped (${decision.reason}; --force re-renders)`);
      continue;
    }
    console.log(`[blender] ${clip.id}: rendering ${clip.frames} frames (${decision.reason})`);
    const meta = await renderClip(exe, jobPath, clip, outDir, args);
    manifest.clips[clip.id] = {
      hash: clip.hash,
      modelHash,
      codeHash,
      frames: clip.frames,
      width: clip.width,
      height: clip.height,
      preview: args.preview,
      blenderVersion: meta.blenderVersion,
      labels: meta.labels,
    };
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)); // keep progress if a later clip fails
    rendered++;
  }
  console.log(`[blender] rendered ${rendered}/${clips.length} clips in ${Math.round((Date.now() - started) / 1000)} s -> ${outDir}`);
};
```

Keep the `main().catch(...)` block.

- [ ] **Step 3: Check.** `npm run lint` and `npm test`. Expected: both pass.

- [ ] **Step 4: Selftest.** `npm run blender -- --selftest`. Expected: `[selftest] OK`.

### Task 7: Real runs (spec Testing section)

The first run on any post re-renders it, because existing entries have no `codeHash`.

- [ ] **Step 1: Parallel matches sequential.** Run `npm run blender -- kit-blender --force --workers=1`, copy `public/posts/kit-blender/3d` to the scratchpad, run `npm run blender -- kit-blender --force --workers=3`, then compare every PNG pixel by pixel with PIL (`ImageChops.difference(...).getbbox() is None`) and the `labels` arrays in both manifests. Expected: no differences. Also compare one frame against the pre-change render method, since `write_still` replaced `animation=True`: the frame in the benchmark folder `out-1-1/0111.png` in the scratchpad against a `--frames=111 --only=mechanism` still of post 21. Expected: identical.

- [ ] **Step 2: Skip.** Run `npm run blender -- kit-blender` again. Expected: every clip prints `skipped (up to date...)`.

- [ ] **Step 3: Preview keeps a full render.** `npm run blender -- kit-blender --preview`. Expected: all skipped, and the manifest shows `preview: false`.

- [ ] **Step 4: Failure leaves the old clip.** Hash the kit `mechanism` folder and its manifest entry. Start `npm run blender -- kit-blender --force --only=mechanism` in the background, and once frames appear in `mechanism.tmp` kill one worker **by command line only, so an open Blender window isn't touched**:

```powershell
Get-CimInstance Win32_Process -Filter "Name='blender.exe'" | Where-Object { $_.CommandLine -like '*render.py*' } | Select-Object -First 1 | ForEach-Object { Stop-Process -Id $_.ProcessId -Force }
```

Expected: non-zero exit, no `render.py` Blender processes left, `mechanism.tmp` gone, folder and manifest entry unchanged.

- [ ] **Step 5: Model change blocks a final render.** Old renders have no `modelHash` and are always accepted, so first run `npm run blender -- post-21-phone-accelerometer --only=cover` to record one, and confirm `npm run cover -- post-21-phone-accelerometer` works. Back up `public/models/mems-accelerometer.glb`, append one byte, and run the cover command again. Expected: refuses with `cover: stale`. **Restore the GLB** and confirm `git status` shows it unchanged.

- [ ] **Step 6: `--frames`.** Record hashes of post 21's `3d/manifest.json`, then run `npm run blender -- post-21-phone-accelerometer --frames --only=mechanism`. Expected: stills in `out/blender-frames/post-21-phone-accelerometer/mechanism/` for first, last and beat frames; manifest and clip folders unchanged. Inspect one still at full size.

- [ ] **Step 7: Post 26 memory.** Log `nvidia-smi --query-gpu=utilization.gpu,memory.used --format=csv,noheader,nounits -l 2` during `npm run blender -- post-26-bulbous-bow --force --only=mechanism`, and record frames per second. Compare with `--workers=2` on a `--frames=` sample of about 24 frames. If memory runs out or 3 workers is slower than 2 on the sea world, lower `DEFAULT_WORKERS` in `blenderPlan.ts` or add a per-world limit, and tell the user.

- [ ] **Step 8: A final render still works.** With the GLB restored, run `npm run cover -- post-21-phone-accelerometer`. Expected: renders with no stale error. Inspect the PNG.

### Task 8: Docs

**Files:** Modify `CLAUDE.md`.

- [ ] **Step 1: Commands section.** Replace the `Blender 3D:` line:

```markdown
- Blender 3D: `npm run blender -- post-NN-slug [--preview] [--only=cover,opener,hook,mechanism] [--force] [--workers=N]` renders the post's 3D clips (needs Blender 4.5: `BLENDER_PATH` in `video/.env`; Blender does not need to be open). Up-to-date clips are skipped; `--force` re-renders, and `--only` alone no longer does. Three workers by default, `--workers=1` for one. A failed run leaves finished clips intact. `--preview` = 25% size for fast checks, and it never replaces a matching full render. `npm run blender -- --selftest` checks the install; `npm run blender -- kit-blender` renders the Kit sample.
- Blender test stills: `npm run blender -- post-NN-slug --frames [--only=mechanism]` renders each clip's first, last and beat frames at full size to `out/blender-frames/`; `--frames=120,240` for exact frames. Never touches the clips or manifest. Use this for the full-size junction crops in QA instead of a whole clip render.
```

- [ ] **Step 2: Blender 3D section.** Replace the "Stale renders" bullet:

```markdown
- **Stale renders:** each clip has a hash of its plan + VO timing, plus `modelHash` (the GLB). Studio shows a placeholder for missing clips; a final render throws if any clip is missing, stale or a preview. Shared Blender code has a `codeHash` that makes `npm run blender` re-render but never blocks a final render, so a real look change still needs a `BLENDER_LOOK_VERSION` bump. After any TTS re-take of the question, hook or mechanism, re-run `npm run blender`.
```

In the "Geometry QC" bullet, replace the last sentence ("The clip hash covers the catalog entry, not the GLB: ...") with: `After changing a model's geometry, rebuild its GLB; every post using it then goes stale until re-rendered.`

Replace the "Render time" bullet using the numbers measured in Task 7, with the benchmark's post 21 result (about 1 frame per second with one worker, about 2 with three) as the baseline.

- [ ] **Step 3: Final checks.** `npm run lint`, `npm test`. Expected: both pass. Run `git status` and report what changed. Do not commit unless asked.
