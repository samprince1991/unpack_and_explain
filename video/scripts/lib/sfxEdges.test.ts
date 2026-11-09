import { describe, expect, it } from "vitest";
import { cleanSfxSamples, pcmToWav, wavToPcm } from "./sfxEdges";

const RATE = 1000; // 1 frame = 1 ms, so fades are easy to read.

const peak = (s: Int16Array) => s.reduce((m, v) => Math.max(m, Math.abs(v)), 0);

describe("cleanSfxSamples", () => {
  const body = new Int16Array(200).fill(10000);

  it("trims silence off both ends", () => {
    const input = new Int16Array(300);
    input.set(body, 50);
    expect(cleanSfxSamples(input, 1, RATE).length).toBe(200);
  });

  it("level-matches quiet and loud takes to the same peak", () => {
    const quiet = cleanSfxSamples(new Int16Array(200).fill(1000), 1, RATE);
    const loud = cleanSfxSamples(new Int16Array(200).fill(30000), 1, RATE);
    expect(peak(quiet)).toBe(peak(loud));
    expect(peak(loud)).toBe(Math.round(32767 * 10 ** (-3 / 20)));
  });

  it("fades both ends so nothing clicks", () => {
    const out = cleanSfxSamples(body, 1, RATE);
    expect(out[0]).toBe(0);
    expect(out[out.length - 1]).toBe(0);
    expect(out[100]).toBe(peak(out));
  });

  it("keeps stereo frames together", () => {
    const input = new Int16Array(600);
    // 100 silent stereo frames, then 200 frames, the left channel only.
    for (let i = 100; i < 300; i++) {
      input[i * 2] = 10000;
    }
    const out = cleanSfxSamples(input, 2, RATE);
    expect(out.length).toBe(400);
    expect(out[201]).toBe(0);
    expect(out[200]).toBeGreaterThan(0);
  });

  it("throws on a silent take rather than writing nothing", () => {
    expect(() => cleanSfxSamples(new Int16Array(100), 1, RATE)).toThrow(/silent/);
  });
});

describe("WAV", () => {
  it("round-trips samples", () => {
    const samples = Int16Array.from([1, -2, 300, -400]);
    expect(Array.from(wavToPcm(pcmToWav(samples, 2, 44100)))).toEqual([1, -2, 300, -400]);
  });
});
