import { describe, expect, it } from "vitest";
import type { BlenderManifestClip } from "../../src/templates/types";
import {
  chunkFrames,
  clipDecision,
  framesComplete,
  hashSources,
  parseBlenderArgs,
  testFrames,
} from "./blenderPlan";

describe("parseBlenderArgs", () => {
  it("has the documented defaults", () => {
    expect(parseBlenderArgs(["post-21"])).toEqual({
      postId: "post-21",
      preview: false,
      force: false,
      selftest: false,
      workers: 3,
      only: null,
      frames: null,
    });
  });
  it("reads every flag", () => {
    const a = parseBlenderArgs([
      "post-21",
      "--preview",
      "--force",
      "--workers=1",
      "--only=hook,cover",
      "--frames=120,240",
    ]);
    expect(a).toMatchObject({
      preview: true,
      force: true,
      workers: 1,
      only: ["hook", "cover"],
      frames: [120, 240],
    });
    expect(parseBlenderArgs(["post-21", "--frames"]).frames).toBe("beats");
  });
  it("rejects bad input instead of ignoring it", () => {
    expect(() => parseBlenderArgs(["p", "--workers=0"])).toThrow(/workers/);
    expect(() => parseBlenderArgs(["p", "--frames=a"])).toThrow(/frames/);
    expect(() => parseBlenderArgs(["p", "--nope"])).toThrow(/nope/);
    expect(() => parseBlenderArgs([])).toThrow(/Usage/);
  });
});

describe("chunkFrames", () => {
  it("splits frames in order and keeps every one", () => {
    const frames = Array.from({ length: 95 }, (_, i) => i);
    const chunks = chunkFrames(frames, 40);
    expect(chunks.map((c) => c.length)).toEqual([40, 40, 15]);
    expect(chunks.flat()).toEqual(frames);
  });
  it("keeps short clips in one chunk", () => {
    expect(chunkFrames([0], 40)).toEqual([[0]]);
  });
});

describe("testFrames", () => {
  const clip = { frames: 100, beats: [{ frame: 50 }, { frame: 0 }, { frame: 50 }] };
  it("uses first, last and beat frames without repeats", () => {
    expect(testFrames(clip, "beats")).toEqual({ frames: [0, 50, 99], dropped: [] });
  });
  it("drops exact frames past the end", () => {
    expect(testFrames(clip, [240, 10])).toEqual({ frames: [10], dropped: [240] });
  });
});

describe("clipDecision", () => {
  const clip = { hash: "h", frames: 2 };
  const want = { modelHash: "m", codeHash: "c", preview: false, force: false, framesOnDisk: true };
  const full: BlenderManifestClip = {
    hash: "h",
    modelHash: "m",
    codeHash: "c",
    frames: 2,
    width: 1,
    height: 1,
    preview: false,
    blenderVersion: "4.5",
    labels: [],
  };
  it("skips only when everything matches", () => {
    expect(clipDecision(clip, full, want).render).toBe(false);
  });
  it.each([
    ["no render", undefined, want],
    ["plan change", { ...full, hash: "x" }, want],
    ["model change", { ...full, modelHash: "x" }, want],
    ["code change", { ...full, codeHash: "x" }, want],
    ["old render with no model hash", { ...full, modelHash: undefined }, want],
    ["old render with no code hash", { ...full, codeHash: undefined }, want],
    ["preview when full is wanted", { ...full, preview: true }, want],
    ["frames gone from disk", full, { ...want, framesOnDisk: false }],
    ["--force", full, { ...want, force: true }],
  ])("renders on %s", (_name, rendered, w) => {
    expect(clipDecision(clip, rendered, w).render).toBe(true);
  });
  it("keeps a full render when only a preview is asked for", () => {
    expect(clipDecision(clip, full, { ...want, preview: true }).render).toBe(false);
  });
});

describe("hashSources", () => {
  it("ignores line endings and file order, and sees real changes", () => {
    const a = hashSources([
      { path: "a.py", text: "x\r\ny" },
      { path: "b.py", text: "z" },
    ]);
    expect(
      hashSources([
        { path: "b.py", text: "z" },
        { path: "a.py", text: "x\ny" },
      ]),
    ).toBe(a);
    expect(
      hashSources([
        { path: "a.py", text: "x\ny!" },
        { path: "b.py", text: "z" },
      ]),
    ).not.toBe(a);
  });
});

describe("framesComplete", () => {
  it("needs exactly 0000..n-1", () => {
    expect(framesComplete(["0000.png", "0001.png"], 2)).toBe(true);
    expect(framesComplete(["0000.png"], 2)).toBe(false);
    expect(framesComplete(["0000.png", "0002.png"], 2)).toBe(false);
    expect(framesComplete(["0000.png", "0001.png", "0002.png"], 2)).toBe(false);
  });
});
