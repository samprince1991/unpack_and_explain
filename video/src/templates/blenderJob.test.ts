import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import { durations } from "../brand/motion";
import { blenderFramePath, buildBlenderJob, hashBytes, hashString } from "./blenderJob";
import { computeTimeline } from "./timing";
import type { BlenderPlan, PostScript } from "./types";
import { buildEstimatedManifest } from "./vo";

describe("hashBytes", () => {
  it("matches hashString on ASCII and the FNV-1a test vector", () => {
    const bytes = new TextEncoder().encode("a");
    expect(hashBytes(bytes)).toBe("e40c292c");
    expect(hashBytes(bytes)).toBe(hashString("a"));
  });
  it("changes when one byte changes", () => {
    expect(hashBytes(new Uint8Array([1, 2, 3]))).not.toBe(hashBytes(new Uint8Array([1, 2, 4])));
  });
});

const plan: BlenderPlan = {
  model: "jet-engine",
  cover: { yaw: 30, pitch: 15, zoom: 1, keyPart: "combustor" },
  opener: { yaw: 20, pitch: 10, zoom: 0.9 },
  hook: { yaw: 40, pitch: 10, zoom: 1, beats: [{ cue: "fuel", fallback: 0.5, do: "reveal" }] },
  mechanism: {
    yaw: 60,
    pitch: 20,
    zoom: 1,
    beats: [
      { cue: "squeezes", fallback: 0.4, do: "focus", part: "compressor" },
      { cue: "air", fallback: 0.1, do: "explode" },
      { cue: "missing", fallback: 0.9, do: "focus", part: "turbine" },
    ],
  },
};

const script: PostScript = {
  id: "post-99-test",
  postNumber: 99,
  format: "E",
  title: "Test",
  hookText: "Hook",
  topic: "Jet engine",
  source: "Somewhere",
  verify: [],
  sfx: { optOut: "unit test base" },
  hero3d: "mechanism",
  blender: plan,
  sections: [
    { id: "question", voiceover: "Do you know how a jet engine works?", visual: "" },
    { id: "hook", voiceover: "It ran out of fuel at altitude.", visual: "" },
    { id: "setup", voiceover: "Setup words here.", visual: "" },
    { id: "mechanism", voiceover: "Air comes in and the compressor squeezes it hard.", visual: "" },
    { id: "payoff", voiceover: "Payoff words.", visual: "" },
    { id: "congrats", voiceover: "Congrats, you learned it.", visual: "" },
    { id: "cta", voiceover: brand.ctaLine, visual: "" },
  ],
};

const vo = buildEstimatedManifest(script, 2.5);

describe("buildBlenderJob", () => {
  const job = buildBlenderJob(script, vo, 30);
  const clip = (id: string) => job.clips.find((c) => c.id === id)!;

  it("makes a one-frame cover and reel clips as long as their sections", () => {
    expect(clip("cover").frames).toBe(1);
    expect(clip("opener").frames).toBeGreaterThan(30);
    expect(clip("mechanism").frames).toBeGreaterThan(clip("hook").frames);
  });

  it("resolves cues to the spoken frame, sorted, with fallbacks for missing words", () => {
    const beats = clip("mechanism").beats;
    const mech = vo.sections.find((s) => s.id === "mechanism")!;
    const squeezeMs = mech.captions.find((c) => c.text.trim() === "squeezes")!.startMs;
    expect(beats.map((b) => b.do)).toEqual(["explode", "focus", "focus"]);
    expect(beats[1].frame).toBe(Math.round((squeezeMs / 1000) * 30));
    expect(beats[2].frame).toBe(Math.round(clip("mechanism").frames * 0.9));
    expect(beats[0]).not.toHaveProperty("cue");
  });

  it("hash is stable and changes with the VO or the plan", () => {
    expect(buildBlenderJob(script, vo, 30).hash).toBe(job.hash);
    const slower = buildEstimatedManifest(script, 2);
    expect(buildBlenderJob(script, slower, 30).hash).not.toBe(job.hash);
    const moved = { ...script, blender: { ...plan, cover: { ...plan.cover, yaw: 31 } } };
    expect(buildBlenderJob(moved, vo, 30).hash).not.toBe(job.hash);
  });

  it("hash ignores the sfx plan, so sound changes never need a Blender re-render", () => {
    const withSound = {
      ...script,
      sfx: { cues: [{ sound: "tick", section: "mechanism" as const, cue: "compressor" }] },
    };
    expect(buildBlenderJob(withSound, vo, 30).hash).toBe(job.hash);
  });

  it("throws for opted-out posts", () => {
    expect(() => buildBlenderJob({ ...script, blender: { optOut: "old" } }, vo, 30)).toThrow();
  });

  it("pads frame file names to 4 digits", () => {
    expect(blenderFramePath("post-99-test", "hook", 7)).toBe("posts/post-99-test/3d/hook/0007.png");
  });
});

describe("worlds", () => {
  const sea = { ...script, blender: { ...plan, model: "bulbous-bow" as const, world: "sea" as const } };
  const plain = { ...script, blender: { ...plan, model: "bulbous-bow" as const } };
  const worldJob = buildBlenderJob(sea, vo, 30);
  const plainJob = buildBlenderJob(plain, vo, 30);
  const length = (id: string) => worldJob.clips.find((c) => c.id === id)!.frames;

  it("leaves a post without a world alone: same clips and no world in the job", () => {
    expect(plainJob.clips.map((c) => c.id)).toEqual(["cover", "opener", "hook", "mechanism"]);
    expect(plainJob).not.toHaveProperty("world");
    expect(plainJob.clips.find((c) => c.id === "mechanism")!.height).toBe(870);
  });

  it("an explicitly undefined world keeps every hash", () => {
    const same = { ...plain, blender: { ...plain.blender, world: undefined } };
    const again = buildBlenderJob(same, vo, 30);
    expect(again.hash).toBe(plainJob.hash);
    expect(again.clips.map((c) => c.hash)).toEqual(plainJob.clips.map((c) => c.hash));
  });

  it("renders every clip full-frame and adds a backdrop as long as the longer 2D section", () => {
    expect(worldJob.world).toBe("sea");
    expect(worldJob.clips.map((c) => c.id)).toEqual(["cover", "opener", "hook", "mechanism", "backdrop"]);
    for (const clip of worldJob.clips) {
      expect([clip.width, clip.height]).toEqual([1080, 1920]);
    }
    const timeline = computeTimeline(vo.sections, 30, durations.crossfade).sections;
    const frames = (id: string) => timeline.find((s) => s.id === id)!.durationInFrames;
    expect(length("backdrop")).toBe(Math.max(frames("setup"), frames("payoff")));
  });

  it("a world changes the clip hashes, so old renders go stale", () => {
    const hook = (j: typeof worldJob) => j.clips.find((c) => c.id === "hook")!;
    expect(hook(worldJob).hash).not.toBe(hook(plainJob).hash);
  });

  it("keeps world framing and sea state in the clip start", () => {
    const framed = {
      ...sea,
      blender: { ...sea.blender, opener: { ...sea.blender.opener, frameY: 0.7, sea: "bowWave" as const } },
    };
    const opener = buildBlenderJob(framed, vo, 30).clips.find((c) => c.id === "opener")!;
    expect(opener.start.frameY).toBe(0.7);
    expect(opener.start.sea).toBe("bowWave");
  });
});

describe("clip hashes", () => {
  it("only change for the clip whose plan changed", () => {
    const a = buildBlenderJob(script, vo, 30);
    const moved = { ...script, blender: { ...plan, cover: { ...plan.cover, yaw: 99 } } };
    const b = buildBlenderJob(moved, vo, 30);
    const h = (j: typeof a, id: string) => j.clips.find((c) => c.id === id)!.hash;
    expect(h(b, "cover")).not.toBe(h(a, "cover"));
    expect(h(b, "mechanism")).toBe(h(a, "mechanism"));
  });
});
