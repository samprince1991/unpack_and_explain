// Renders a post's Blender 3D clips (docs/blender.md).
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
import { coverCrop } from "../src/brand/layout";
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
import { ensureTextures, httpIo, lockText, readLock, texturesForWorld } from "./lib/textures";
import { textures } from "../src/brand/textures";

const VIDEO = resolve(__dirname, "..");
const REPO = resolve(VIDEO, "..");
const BLENDER_DIR = join(REPO, "blender");
const PUBLIC = join(VIDEO, "public");
const RENDER_SCRIPT = join(BLENDER_DIR, "render.py");
const WORLD_DIR = join(BLENDER_DIR, "world");
const CODE_FILES = ["build.py", "look.py", "common.py", "qc.py", "render.py", "tokens.json"];
const TEXTURE_DIR = join(BLENDER_DIR, "textures");
const TEXTURE_LOCK = join(TEXTURE_DIR, "textures.lock.json");

const requiredVersion = () => readFileSync(join(BLENDER_DIR, "VERSION"), "utf8").trim();

const exportTokens = () => {
  const tokens = {
    colors: {
      fill: colors.diagram.fill,
      stroke: colors.diagram.stroke,
      soft: colors.diagram.soft,
      faint: colors.diagram.faint,
      amber: colors.amber[500],
      bgBase: colors.bg.base,
      bgRaised: colors.bg.raised,
      env: colors.env,
    },
    lines: LINE,
  };
  writeFileSync(join(BLENDER_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));
};

const loadScript = async (postId: string): Promise<PostScript> => {
  if (postId === "kit-blender") {
    return (await import("../src/kit/blenderSample")).blenderSample;
  }
  return ((await import(`../src/posts/${postId}/script`)) as { script: PostScript }).script;
};

const loadVoFile = (script: PostScript): VoManifest => {
  const path = join(PUBLIC, voManifestPath(script.id));
  if (!existsSync(path)) {
    console.warn(`[blender] no vo.json: using estimated timing (re-run after npm run tts)`);
    return buildEstimatedManifest(script, voice.wordsPerSecond);
  }
  const vo = JSON.parse(readFileSync(path, "utf8")) as VoManifest;
  const stale = staleSections(script, vo);
  if (stale.length > 0) {
    throw new Error(`VO out of date (${stale.join(", ")}). Run: npm run tts -- ${script.id}`);
  }
  return vo;
};

// The world's photo textures (src/brand/textures.ts): downloaded if missing, checked against
// the lock, and their paths handed to Blender in blender/textures.json.
const prepareTextures = async (world: string | undefined) => {
  const ids = texturesForWorld(textures, world);
  const { paths } = await ensureTextures({ catalog: textures, ids, dir: TEXTURE_DIR, lockPath: TEXTURE_LOCK, io: httpIo });
  const forward = Object.fromEntries(
    Object.entries(paths).map(([id, maps]) => [
      id,
      Object.fromEntries(Object.entries(maps).map(([m, p]) => [m, p.split("\\").join("/")])),
    ]),
  );
  writeFileSync(join(BLENDER_DIR, "textures.json"), JSON.stringify(forward, null, 2));
  return ids;
};

const computeCodeHash = (modelId: string, textureIds: string[]) => {
  const read = (path: string) => ({ path, text: readFileSync(join(BLENDER_DIR, path), "latin1") });
  const world = readdirSync(WORLD_DIR)
    .filter((f) => f.endsWith(".py"))
    .map((f) => `world/${f}`);
  const blend = `models/${modelId}.blend`;
  const hasBlend = existsSync(join(BLENDER_DIR, blend));
  if (hasBlend) {
    console.warn(`[blender] ${blend} is tracked here, but final renders can't verify it`);
  }
  const sources = [...CODE_FILES, ...world, ...(hasBlend ? [blend] : [])].map(read);
  // Only worlds that load textures hash the lock, so other posts' renders stay current.
  if (textureIds.length > 0) {
    sources.push({ path: "textures.lock", text: lockText(readLock(TEXTURE_LOCK), textureIds) });
  }
  return hashSources(sources);
};

// docs/blender.md "Cover": the subject should fill most of the 4:5 feed crop.
const COVER_MIN_FILL = 0.5;
const warnCoverFraming = (box: [number, number, number, number] | null) => {
  if (!box) {
    console.warn("[blender] cover: model not in frame");
    return;
  }
  const crop = coverCrop(video.width, video.height);
  const height = ((box[3] - box[1]) * video.height) / crop.height;
  const width = box[2] - box[0]; // the 4:5 crop is full width
  const fill = Math.max(height, width);
  console.log(`[blender] cover: model fills ${Math.round(fill * 100)}% of the 4:5 crop`);
  if (fill < COVER_MIN_FILL) {
    console.warn(
      `[blender] cover: model fills under ${COVER_MIN_FILL * 100}% of the 4:5 crop: raise cover.zoom (docs/blender.md "Cover")`,
    );
  }
};

const readManifest = (path: string, postId: string): BlenderManifest =>
  existsSync(path)
    ? { postId, clips: (JSON.parse(readFileSync(path, "utf8")) as BlenderManifest).clips }
    : { postId, clips: {} };

type FrameRun = {
  exe: string;
  jobPath: string;
  clipId: string;
  outDir: string;
  chunks: number[][];
  args: BlenderArgs;
  metaPath: string | null;
  onFinished?: (finished: number) => void;
};

const renderFrames = ({ exe, jobPath, clipId, outDir, chunks, args, metaPath, onFinished }: FrameRun) =>
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
    await renderFrames({
      exe,
      jobPath,
      clipId: clip.id,
      outDir: tmp,
      chunks,
      args,
      metaPath,
      onFinished: (finished) => console.log(`[blender] ${clip.id}: ${finished}/${chunks.length} chunks`),
    });
    if (!framesComplete(readdirSync(tmp), clip.frames)) {
      throw new Error(`${clip.id}: Blender finished but frames are missing`);
    }
    const meta = JSON.parse(readFileSync(metaPath, "utf8")) as {
      labels: BlenderLabelTrack[];
      blenderVersion: string;
      subjectBox?: [number, number, number, number] | null;
      subject?: boolean;
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

const renderTestStills = async (
  exe: string,
  jobPath: string,
  job: BlenderJob,
  clips: JobClip[],
  args: BlenderArgs,
) => {
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
    await renderFrames({
      exe,
      jobPath,
      clipId: clip.id,
      outDir: dir,
      chunks: chunkFrames(frames, size),
      args,
      metaPath: null,
    });
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

  const textureIds = await prepareTextures(job.world);
  const clips = job.clips.filter((c) => !args.only || args.only.includes(c.id));
  const started = Date.now();
  if (args.frames) {
    await renderTestStills(exe, jobPath, job, clips, args);
    console.log(`[blender] stills done in ${Math.round((Date.now() - started) / 1000)} s`);
    return;
  }

  const modelHash = hashBytes(readFileSync(join(PUBLIC, job.model.file)));
  const codeHash = computeCodeHash(job.model.id, textureIds);
  const manifestPath = join(outDir, "manifest.json");
  const manifest = readManifest(manifestPath, job.postId);
  let rendered = 0;
  for (const clip of clips) {
    const clipDir = join(outDir, clip.id);
    const framesOnDisk = existsSync(clipDir) && framesComplete(readdirSync(clipDir), clip.frames);
    const decision = clipDecision(clip, manifest.clips[clip.id], {
      modelHash,
      codeHash,
      preview: args.preview,
      force: args.force,
      framesOnDisk,
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
      ...(clip.id === "cover" ? { subjectBox: meta.subjectBox ?? null, subject: meta.subject ?? false } : {}),
    };
    if (clip.id === "cover") {
      warnCoverFraming(meta.subjectBox ?? null);
    }
    writeFileSync(manifestPath, JSON.stringify(manifest, null, 2)); // keep progress if a later clip fails
    rendered++;
  }
  console.log(
    `[blender] rendered ${rendered}/${clips.length} clips in ${Math.round((Date.now() - started) / 1000)} s -> ${outDir}`,
  );
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
