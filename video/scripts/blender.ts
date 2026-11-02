// Renders a post's Blender 3D clips (docs/specs/2026-11-02-blender-3d-design.md).
//
//   npm run blender -- post-NN-slug [--preview] [--only=cover,opener,hook,mechanism]
//   npm run blender -- kit-blender [--preview]     (the Kit-Blender sample)
//   npm run blender -- --selftest                  (cube in look A; checks alpha + amber)
//
// Exports blender/tokens.json from the brand tokens, builds the job from script.ts +
// vo.json (same cue maths as useCue), runs headless Blender, then checks the manifest.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { colors, video } from "../src/brand/tokens";
import { voice } from "../src/brand/voice";
import { LINE } from "../src/components/three/materials";
import { blenderDir, buildBlenderJob } from "../src/templates/blenderJob";
import type { BlenderManifest, PostScript, VoManifest } from "../src/templates/types";
import { buildEstimatedManifest, staleSections, voManifestPath } from "../src/templates/vo";
import { findBlender } from "./lib/blender";

const VIDEO = resolve(__dirname, "..");
const REPO = resolve(VIDEO, "..");
const BLENDER_DIR = join(REPO, "blender");
const PUBLIC = join(VIDEO, "public");

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
    },
    lines: LINE,
  };
  writeFileSync(join(BLENDER_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));
};

const runBlender = (exe: string, args: string[]) => {
  const result = spawnSync(
    exe,
    ["-b", "--factory-startup", "--python", join(BLENDER_DIR, "render.py"), "--", ...args],
    { stdio: "inherit" },
  );
  if (result.status !== 0) {
    throw new Error(`Blender exited with ${result.status}`);
  }
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

const main = async () => {
  const args = process.argv.slice(2);
  const exe = findBlender();
  if (!exe) {
    throw new Error(
      `Blender not found. Install ${requiredVersion()}: winget install BlenderFoundation.Blender (or set BLENDER_PATH)`,
    );
  }
  exportTokens();

  if (args.includes("--selftest")) {
    const out = join(VIDEO, "out", "blender-selftest");
    mkdirSync(out, { recursive: true });
    runBlender(exe, ["--selftest", out]);
    return;
  }

  const postId = args.find((a) => !a.startsWith("--"));
  if (!postId) {
    throw new Error("Usage: npm run blender -- post-NN-slug [--preview] [--only=cover,hook]");
  }
  const script = await loadScript(postId);
  const vo = loadVoFile(script);
  const job = buildBlenderJob(script, vo, video.fps);
  const outDir = join(PUBLIC, blenderDir(script.id));
  mkdirSync(outDir, { recursive: true });
  const jobPath = join(outDir, "job.json");
  writeFileSync(jobPath, JSON.stringify(job, null, 2));

  const flags = args.filter((a) => a.startsWith("--"));
  const started = Date.now();
  runBlender(exe, [jobPath, outDir, ...flags]);

  const manifest = JSON.parse(readFileSync(join(outDir, "manifest.json"), "utf8")) as BlenderManifest;
  const only = flags.find((f) => f.startsWith("--only="))?.slice(7).split(",");
  const missing = job.clips
    .filter((c) => !only || only.includes(c.id))
    .filter((c) => manifest.clips[c.id]?.hash !== c.hash)
    .map((c) => c.id);
  if (missing.length > 0) {
    throw new Error(`Blender finished but these clips are missing or stale: ${missing.join(", ")}`);
  }
  console.log(`[blender] done in ${Math.round((Date.now() - started) / 1000)} s -> ${outDir}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
