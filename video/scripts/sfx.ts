import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SFX_MODEL } from "../src/brand/audio";
import { isSfxPlan, sfxManifestPath, sfxSoundIsCurrent } from "../src/templates/sfxCues";
import type { PostScript, SfxManifest } from "../src/templates/types";
import { parseOnly, requireApiKey } from "./lib/cli";
import { generateSfx } from "./lib/sfxGenerate";

// Generates a post's topic sounds. Keeps every sound whose prompt, seconds and model still
// match, because each generation sounds different. --only=name --force redoes one sound.
const main = async () => {
  const postId = process.argv[2];
  if (!postId || postId.startsWith("--")) {
    throw new Error("Usage: npm run sfx -- <post-id> [--only=name,name] [--force]");
  }
  const apiKey = requireApiKey();
  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  if (!isSfxPlan(script.sfx)) {
    throw new Error(`${postId} opts out of SFX: ${script.sfx.optOut}`);
  }

  const force = process.argv.includes("--force");
  const custom = Object.entries(script.sfx.custom ?? {});
  const only = parseOnly(
    process.argv,
    custom.map(([name]) => name),
  );

  const publicDir = join(process.cwd(), "public");
  const manifestFile = join(publicDir, sfxManifestPath(postId));
  mkdirSync(join(publicDir, "posts", postId, "sfx"), { recursive: true });
  const existing: SfxManifest | null = existsSync(manifestFile)
    ? (JSON.parse(readFileSync(manifestFile, "utf8")) as SfxManifest)
    : null;

  // Starts from the sounds already made and saves after each new one, so a failure partway
  // doesn't lose sounds that were already paid for.
  const manifest: SfxManifest = {
    postId,
    sounds: Object.fromEntries(
      custom.flatMap(([name]) => {
        const previous = existing?.sounds[name];
        return previous ? [[name, previous]] : [];
      }),
    ),
  };
  const save = () => writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`);
  save();
  for (const [name, sound] of custom) {
    const file = `posts/${postId}/sfx/${name}.mp3`;
    const current = sfxSoundIsCurrent(existing?.sounds[name], sound) && existsSync(join(publicDir, file));
    const selected = !only || only.includes(name);
    if (selected && (force || !current)) {
      console.log(`Generating ${name}...`);
      await generateSfx(apiKey, join(publicDir, file), sound.prompt, sound.seconds);
      manifest.sounds[name] = { prompt: sound.prompt, seconds: sound.seconds, model: SFX_MODEL, file };
      save();
    }
  }
  console.log(`Wrote ${sfxManifestPath(postId)}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
