import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SFX_MODEL } from "../src/brand/audio";
import { isSfxPlan, sfxManifestPath, sfxSoundIsCurrent } from "../src/templates/sfxCues";
import type { PostScript, SfxManifest } from "../src/templates/types";
import { generateSfx } from "./lib/sfxGenerate";

// Generates a post's topic sounds. Keeps every sound whose prompt, seconds and model still
// match, because each generation sounds different. --only=name --force redoes one sound.
const main = async () => {
  const postId = process.argv[2];
  if (!postId || postId.startsWith("--")) {
    throw new Error("Usage: npm run sfx -- <post-id> [--only=name,name] [--force]");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  if (!isSfxPlan(script.sfx)) {
    throw new Error(`${postId} opts out of SFX: ${script.sfx.optOut}`);
  }

  const force = process.argv.includes("--force");
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;

  const publicDir = join(process.cwd(), "public");
  const manifestFile = join(publicDir, sfxManifestPath(postId));
  mkdirSync(join(publicDir, "posts", postId, "sfx"), { recursive: true });
  const existing: SfxManifest | null = existsSync(manifestFile)
    ? (JSON.parse(readFileSync(manifestFile, "utf8")) as SfxManifest)
    : null;

  const manifest: SfxManifest = { postId, sounds: {} };
  for (const [name, sound] of Object.entries(script.sfx.custom ?? {})) {
    const file = `posts/${postId}/sfx/${name}.mp3`;
    const previous = existing?.sounds[name];
    const current = sfxSoundIsCurrent(previous, sound) && existsSync(join(publicDir, file));
    const selected = !only || only.includes(name);
    if (selected && (force || !current)) {
      console.log(`Generating ${name}...`);
      await generateSfx(apiKey, join(publicDir, file), sound.prompt, sound.seconds);
      manifest.sounds[name] = { prompt: sound.prompt, seconds: sound.seconds, model: SFX_MODEL, file };
    } else if (previous) {
      manifest.sounds[name] = previous;
    }
  }
  writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`Wrote ${sfxManifestPath(postId)}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
