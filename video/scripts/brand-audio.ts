import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  audioLibraryPath,
  audioPath,
  music,
  sfx,
  type AudioLibrary,
  type SfxName,
} from "../src/brand/audio";

const API = "https://api.elevenlabs.io";
const MUSIC_NAME = "music-bed";

const generate = async (apiKey: string, path: string, body: object): Promise<Buffer> => {
  const res = await fetch(`${API}${path}?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs ${path} ${res.status}: ${await res.text()}`);
  }
  return Buffer.from(await res.arrayBuffer());
};

const main = async () => {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  // Existing files are kept so the brand sounds stay identical; --force regenerates.
  const force = process.argv.includes("--force");
  const publicDir = join(process.cwd(), "public");
  mkdirSync(join(publicDir, "brand", "audio"), { recursive: true });

  const library: AudioLibrary = { sfx: {}, music: null };

  for (const [name, spec] of Object.entries(sfx) as [SfxName, (typeof sfx)[SfxName]][]) {
    const file = audioPath(name);
    if (force || !existsSync(join(publicDir, file))) {
      console.log(`Generating sfx: ${name}...`);
      const audio = await generate(apiKey, "/v1/sound-generation", {
        text: spec.prompt,
        duration_seconds: spec.seconds,
        prompt_influence: 0.6,
      });
      writeFileSync(join(publicDir, file), audio);
    }
    library.sfx[name] = file;
  }

  const musicFile = audioPath(MUSIC_NAME);
  try {
    if (force || !existsSync(join(publicDir, musicFile))) {
      console.log("Generating music bed...");
      const audio = await generate(apiKey, "/v1/music", {
        prompt: music.prompt,
        music_length_ms: music.lengthMs,
        force_instrumental: true,
      });
      writeFileSync(join(publicDir, musicFile), audio);
    }
    library.music = musicFile;
  } catch (err) {
    // Music needs a paid ElevenLabs plan; SFX still work without it.
    console.warn(`Music skipped: ${err instanceof Error ? err.message : String(err)}`);
  }

  writeFileSync(join(publicDir, audioLibraryPath), `${JSON.stringify(library, null, 2)}\n`);
  console.log(`Wrote ${audioLibraryPath}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
