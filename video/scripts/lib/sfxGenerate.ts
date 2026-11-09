import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { SFX_MODEL, SFX_PROMPT_INFLUENCE } from "../../src/brand/audio";
import { cleanSfxSamples, pcmToWav, wavToPcm } from "./sfxEdges";
import { ffmpeg } from "./voClean";

const CHANNELS = 2;
const SAMPLE_RATE = 44100;

// Decode, clean and re-encode a raw mp3. No API call, so it can be tested on existing files.
export const cleanSfxFile = (raw: string, file: string, dir: string) => {
  const decoded = join(dir, "decoded.wav");
  const cleaned = join(dir, "cleaned.wav");
  ffmpeg(["-v", "error", "-y", "-i", raw, "-ac", `${CHANNELS}`, "-ar", `${SAMPLE_RATE}`, "-c:a", "pcm_s16le", decoded]);
  const samples = cleanSfxSamples(wavToPcm(readFileSync(decoded)), CHANNELS, SAMPLE_RATE);
  writeFileSync(cleaned, pcmToWav(samples, CHANNELS, SAMPLE_RATE));
  ffmpeg(["-v", "error", "-y", "-i", cleaned, "-c:a", "libmp3lame", "-b:a", "128k", file]);
};

// Generates one sound with ElevenLabs, cleans it and writes it as an mp3.
export const generateSfx = async (apiKey: string, file: string, text: string, seconds: number) => {
  const res = await fetch("https://api.elevenlabs.io/v1/sound-generation?output_format=mp3_44100_128", {
    method: "POST",
    headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      duration_seconds: seconds,
      prompt_influence: SFX_PROMPT_INFLUENCE,
      model_id: SFX_MODEL,
    }),
  });
  if (!res.ok) {
    throw new Error(`ElevenLabs sound generation ${res.status}: ${await res.text()}`);
  }
  const dir = mkdtempSync(join(tmpdir(), "sfx-"));
  try {
    const raw = join(dir, "raw.mp3");
    writeFileSync(raw, Buffer.from(await res.arrayBuffer()));
    cleanSfxFile(raw, file, dir);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
