import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { voice } from "../src/brand/voice";
import { alignmentToCaptions, type Alignment } from "../src/templates/alignment";
import type { PostScript, VoManifest, VoSection } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";
import { cleanVoSection } from "./lib/voClean";

type TtsResponse = { audio_base64: string; alignment: Alignment };

const synthesize = async (
  apiKey: string,
  text: string,
  previousText: string | undefined,
  nextText: string | undefined,
): Promise<TtsResponse> => {
  const res = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voice.voiceId}/with-timestamps?output_format=mp3_44100_128`,
    {
      method: "POST",
      headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        text,
        model_id: voice.modelId,
        voice_settings: voice.settings,
        // Keeps intonation natural across separately generated sections.
        previous_text: previousText,
        next_text: nextText,
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`ElevenLabs ${res.status}: ${await res.text()}`);
  }
  return (await res.json()) as TtsResponse;
};

const main = async () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run tts -- <post-id>   e.g. npm run tts -- post-02-gps");
  }
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("ELEVENLABS_API_KEY is missing. Add it to video/.env");
  }
  if (voice.voiceId.startsWith("REPLACE")) {
    throw new Error("Set voice.voiceId in src/brand/voice.ts first");
  }

  const { script } = (await import(`../src/posts/${postId}/script`)) as { script: PostScript };
  const voDir = join(process.cwd(), "public", "posts", postId, "vo");
  mkdirSync(voDir, { recursive: true });

  // --only=congrats,cta regenerates just those sections and keeps the rest of the
  // existing VO untouched (each generation sounds slightly different).
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice("--only=".length).split(",") : null;
  const manifestFile = join(process.cwd(), "public", voManifestPath(postId));
  const existing: VoManifest | null =
    only && existsSync(manifestFile)
      ? (JSON.parse(readFileSync(manifestFile, "utf8")) as VoManifest)
      : null;
  if (only && !existing) {
    throw new Error(`--only needs an existing ${voManifestPath(postId)}; run without --only first`);
  }

  const sections: VoSection[] = [];
  for (const [i, section] of script.sections.entries()) {
    const kept = existing?.sections.find((s) => s.id === section.id);
    if (only && !only.includes(section.id) && kept) {
      sections.push(kept);
      continue;
    }
    console.log(`Synthesizing ${section.id}...`);
    const data = await synthesize(
      apiKey,
      section.voiceover,
      script.sections[i - 1]?.voiceover,
      script.sections[i + 1]?.voiceover,
    );
    const file = `posts/${postId}/vo/${section.id}.mp3`;
    writeFileSync(join(process.cwd(), "public", file), Buffer.from(data.audio_base64, "base64"));
    const ends = data.alignment.character_end_times_seconds;
    // previous_text / next_text can leave the next section's first sound at the end of
    // the file (a stutter before the next section), so trim it off every new take.
    sections.push(
      cleanVoSection(join(process.cwd(), "public"), {
        id: section.id,
        text: section.voiceover,
        file,
        durationMs: Math.round((ends[ends.length - 1] ?? 0) * 1000),
        captions: alignmentToCaptions(data.alignment),
      }),
    );
  }

  const manifest: VoManifest = { postId, estimated: false, sections };
  writeFileSync(
    join(process.cwd(), "public", voManifestPath(postId)),
    `${JSON.stringify(manifest, null, 2)}\n`,
  );
  console.log(`Wrote ${voManifestPath(postId)}`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
