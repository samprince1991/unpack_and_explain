import { copyFileSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { VoSection } from "../../src/templates/types";
import { ffmpeg } from "./remotion";
import { FRAME_MS, rmsEnvelope } from "./voEdges";

const RATE = 44100;
// A pause between words longer than this gets shortened to KEEP_MS of silence.
export const MAX_PAUSE_MS = 450;
export const KEEP_MS = 400;

type Cut = { fromMs: number; toMs: number };

const decode = (file: string, dir: string): Int16Array => {
  const wav = join(dir, "in.wav");
  ffmpeg(["-v", "error", "-y", "-i", file, "-ac", "1", "-ar", `${RATE}`, "-c:a", "pcm_s16le", wav]);
  const buf = readFileSync(wav);
  const data = buf.indexOf("data");
  const start = data + 8;
  const bytes = buf.subarray(start, start + buf.readUInt32LE(data + 4));
  return new Int16Array(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.length));
};

const writeWav = (file: string, samples: Int16Array) => {
  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + samples.length * 2, 4);
  header.write("WAVEfmt ", 8);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(1, 22);
  header.writeUInt32LE(RATE, 24);
  header.writeUInt32LE(RATE * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(samples.length * 2, 40);
  writeFileSync(file, Buffer.concat([header, Buffer.from(samples.buffer, samples.byteOffset, samples.length * 2)]));
};

// The silent stretch inside each long caption gap, minus KEEP_MS, as cuts (middle of the
// silence, so both words keep their natural decay). Only ever cuts frames below the
// silence threshold.
export const findPauseCuts = (env: number[], section: VoSection): Cut[] => {
  const peak = Math.max(...env);
  const threshold = Math.max(30, peak * 0.005);
  const cuts: Cut[] = [];
  const caps = section.captions;
  for (let i = 0; i < caps.length - 1; i++) {
    if (caps[i + 1].startMs - caps[i].endMs <= MAX_PAUSE_MS) {
      continue;
    }
    // Longest run of quiet frames between the two words.
    const a = Math.floor(caps[i].endMs / FRAME_MS);
    const b = Math.min(Math.ceil(caps[i + 1].startMs / FRAME_MS), env.length);
    let best = { start: 0, len: 0 };
    let run = { start: a, len: 0 };
    for (let f = a; f < b; f++) {
      if (env[f] < threshold) {
        run = run.len ? { start: run.start, len: run.len + 1 } : { start: f, len: 1 };
        if (run.len > best.len) {
          best = run;
        }
      } else {
        run = { start: f + 1, len: 0 };
      }
    }
    const silentMs = best.len * FRAME_MS;
    const removeMs = silentMs - KEEP_MS;
    if (removeMs <= 0) {
      continue;
    }
    const mid = (best.start + best.len / 2) * FRAME_MS;
    cuts.push({ fromMs: Math.round(mid - removeMs / 2), toMs: Math.round(mid + removeMs / 2) });
  }
  return cuts;
};

const shift = (ms: number, cuts: Cut[]): number =>
  ms - cuts.reduce((sum, c) => sum + (ms >= c.toMs ? c.toMs - c.fromMs : ms > c.fromMs ? ms - c.fromMs : 0), 0);

// Shortens long silent pauses between words in a section's mp3 (in place) and shifts the
// captions to match. Returns the section unchanged when there is nothing to cut.
export const tightenVoSection = (publicDir: string, section: VoSection): VoSection => {
  if (!section.file || section.captions.length < 2) {
    return section;
  }
  const file = join(publicDir, section.file);
  const dir = mkdtempSync(join(tmpdir(), "vo-tighten-"));
  try {
    const samples = decode(file, dir);
    const cuts = findPauseCuts(rmsEnvelope(samples, RATE), section);
    if (cuts.length === 0) {
      return section;
    }
    const keep: Int16Array[] = [];
    let from = 0;
    for (const c of cuts) {
      keep.push(samples.subarray(from, Math.round((c.fromMs / 1000) * RATE)));
      from = Math.round((c.toMs / 1000) * RATE);
    }
    keep.push(samples.subarray(from));
    const out = new Int16Array(keep.reduce((n, k) => n + k.length, 0));
    let at = 0;
    for (const k of keep) {
      out.set(k, at);
      at += k.length;
    }
    const wav = join(dir, "out.wav");
    const mp3 = join(dir, "out.mp3");
    writeWav(wav, out);
    ffmpeg(["-v", "error", "-y", "-i", wav, "-c:a", "libmp3lame", "-b:a", "128k", mp3]);
    copyFileSync(mp3, file);
    const removed = cuts.reduce((n, c) => n + c.toMs - c.fromMs, 0);
    console.log(`  ${section.id}: shortened ${cuts.length} pause(s), ${removed} ms`);
    return {
      ...section,
      durationMs: Math.round((out.length / RATE) * 1000),
      captions: section.captions.map((c) => ({ ...c, startMs: shift(c.startMs, cuts), endMs: shift(c.endMs, cuts) })),
    };
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
};
