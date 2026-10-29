import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { VoSection } from "../../src/templates/types";
import { findTailBleed, rmsEnvelope } from "./voEdges";

const ANALYSIS_RATE = 16000;

// Remotion's bundled ffmpeg (no afade there, so we only ever cut inside silence).
const ffmpeg = (args: string[]) => {
  const res = spawnSync("npx", ["remotion", "ffmpeg", ...args.map((a) => `"${a}"`)], {
    encoding: "utf8",
    shell: true,
  });
  if (res.status !== 0) {
    throw new Error(`ffmpeg failed:\n${res.stderr.slice(-2000)}`);
  }
};

const decodeMono = (file: string, dir: string): Int16Array => {
  const wav = join(dir, "analysis.wav");
  ffmpeg(["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", `${ANALYSIS_RATE}`, "-c:a", "pcm_s16le", wav]);
  const buf = readFileSync(wav);
  const data = buf.indexOf("data");
  const start = data + 8;
  const bytes = buf.subarray(start, start + buf.readUInt32LE(data + 4));
  return new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
};

// Trims a stitching bleed off the end of a section's mp3 (in place) and fits the
// captions to the new length. Returns the section unchanged if the file is clean.
export const cleanVoSection = (publicDir: string, section: VoSection): VoSection => {
  if (!section.file || section.captions.length === 0) {
    return section;
  }
  const file = join(publicDir, section.file);
  const dir = mkdtempSync(join(tmpdir(), "vo-clean-"));
  try {
    const env = rmsEnvelope(decodeMono(file, dir), ANALYSIS_RATE);
    const lastWordStartMs = section.captions[section.captions.length - 1].startMs;
    const cutMs = findTailBleed(env, lastWordStartMs);
    if (cutMs === null) {
      return section;
    }
    const trimmed = join(dir, "trimmed.mp3");
    ffmpeg(["-v", "error", "-y", "-i", file, "-t", `${cutMs / 1000}`, "-c:a", "libmp3lame", "-b:a", "128k", trimmed]);
    copyFileSync(trimmed, file);
    console.log(`  ${section.id}: trimmed ${section.durationMs - cutMs} ms of bleed from the end`);
    return {
      ...section,
      durationMs: cutMs,
      captions: section.captions.map((c) => ({
        ...c,
        endMs: Math.min(c.endMs, cutMs),
      })),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
