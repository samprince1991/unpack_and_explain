import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import type { Beat, PostScript } from "./types";
import { validateScript } from "./validate";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");
const shot = { yaw: 0, pitch: 0, zoom: 1 };

const withBeats = (extra: Beat[], aim?: string): PostScript => ({
  id: "post-99-test",
  postNumber: 99,
  format: "E",
  title: "Test",
  hookText: "Short hook",
  topic: "Thing",
  source: "Somewhere.gov",
  verify: [],
  sfx: { optOut: "unit test base" },
  blender: {
    model: "mems-accelerometer",
    cover: shot,
    opener: shot,
    hook: shot,
    mechanism: {
      ...shot,
      aim,
      beats: [
        { cue: "word", fallback: 0.1, do: "focus", part: "weight" },
        { cue: "word", fallback: 0.9, do: "wide" },
        ...extra,
      ],
    },
  },
  sections: [
    { id: "question", voiceover: "Do you know how this works?", visual: "" },
    { id: "hook", voiceover: words(10), visual: "" },
    { id: "setup", voiceover: words(15), visual: "" },
    { id: "mechanism", voiceover: words(40), visual: "" },
    { id: "payoff", voiceover: words(26), visual: "" },
    { id: "congrats", voiceover: "Congrats, you just learned how this works.", visual: "" },
    { id: "cta", voiceover: brand.ctaLine, visual: "" },
  ],
});

const errorsOf = (extra: Beat[], aim?: string) => validateScript(withBeats(extra, aim)).errors;
const beat = { cue: "word", fallback: 0.5 };

describe("shift and appear beats", () => {
  it("accepts a shift with an offset and an appear on an appearOnly part", () => {
    expect(
      errorsOf([
        { ...beat, do: "shift", part: "weight", by: [0.01, 0, 0] },
        { ...beat, do: "appear", part: "ground" },
      ]),
    ).toEqual([]);
  });

  it("needs a part and an offset for shift", () => {
    expect(errorsOf([{ ...beat, do: "shift", by: [0.01, 0, 0] }])[0]).toMatch(/"shift" needs a part/);
    expect(errorsOf([{ ...beat, do: "shift", part: "weight" }])[0]).toMatch(/"shift" needs an offset/);
  });

  it("rejects an offset on any other action", () => {
    expect(errorsOf([{ ...beat, do: "focus", part: "weight", by: [0.01, 0, 0] }])[0]).toMatch(/only applies to shift/);
  });

  it("only lets appearOnly parts appear", () => {
    expect(errorsOf([{ ...beat, do: "appear", part: "weight" }])[0]).toMatch(/not in the model's appearOnly list/);
  });

  it("checks the part a shot aims at", () => {
    expect(errorsOf([], "nonsense")[0]).toMatch(/part "nonsense" is not in model/);
    expect(errorsOf([], "weight")).toEqual([]);
  });
});
