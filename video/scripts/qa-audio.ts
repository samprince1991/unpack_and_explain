import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { durations } from "../src/brand/motion";
import { video } from "../src/brand/tokens";
import { isSfxPlan, resolveSfxCues } from "../src/templates/sfxCues";
import { computeTimeline } from "../src/templates/timing";
import type { PostScript, VoManifest } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";
import { compositionForPost, cueWindows } from "./lib/qaAudio";

const OUT = "out/qa";

const run = (command: string, args: string[]) =>
  spawnSync(command, args.map((a) => `"${a}"`), { stdio: "inherit", shell: true }).status === 0;

const must = (ok: boolean, what: string) => {
  if (!ok) {
    throw new Error(`${what} failed`);
  }
};

const renderStem = (composition: string, name: string, props: string | null) => {
  const wav = `${OUT}/${name}.wav`;
  must(
    run("npx", ["remotion", "render", composition, wav, "--codec=wav", ...(props ? [`--props=${props}`] : [])]),
    `Rendering the ${name} stem`,
  );
  return wav;
};

const toAnalysisWav = (wav: string) => {
  const out = wav.replace(/\.wav$/, "16.wav");
  must(
    run("npx", ["remotion", "ffmpeg", "-v", "error", "-y", "-i", wav, "-ac", "1", "-ar", "16000", "-c:a", "pcm_s16le", out]),
    `Converting ${wav}`,
  );
  return out;
};

const main = async () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run qa:audio -- <post-id>");
  }
  const composition = compositionForPost(readFileSync(join("src", "Root.tsx"), "utf8"), postId);
  mkdirSync(OUT, { recursive: true });

  const vo16 = toAnalysisWav(renderStem(composition, "vo", "./qa-vo.json"));
  // On the voice alone: an intentional tick in a pause would fail this on the full mix,
  // and a sustained topic sound could hide a real stutter.
  const stutterOk = run("python", ["scripts/audio-bursts.py", vo16]);

  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  let levelsOk = true;
  if (isSfxPlan(script.sfx)) {
    const vo = JSON.parse(readFileSync(join("public", voManifestPath(postId)), "utf8")) as VoManifest;
    const { sections } = computeTimeline(vo.sections, video.fps, durations.crossfade);
    const cues = resolveSfxCues(script.sfx, vo.sections, sections, video.fps, durations.crossfade);
    writeFileSync(`${OUT}/cues.json`, JSON.stringify(cueWindows(cues, video.fps)));
    const sfx16 = toAnalysisWav(renderStem(composition, "sfx", "./qa-sfx.json"));
    levelsOk = run("python", ["scripts/audio-sfx-levels.py", vo16, sfx16, `${OUT}/cues.json`]);
  }

  const mix = renderStem(composition, "mix", null);
  console.log(`\nListen across every section boundary and every cue: ${mix}`);
  if (!stutterOk || !levelsOk) {
    process.exit(1);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
