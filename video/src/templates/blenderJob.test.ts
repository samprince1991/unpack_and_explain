import { describe, expect, it } from "vitest";
import { brand } from "../brand/tokens";
import { blenderFramePath, buildBlenderJob } from "./blenderJob";
import type { BlenderPlan, PostScript } from "./types";
import { buildEstimatedManifest } from "./vo";

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

  it("throws for opted-out posts", () => {
    expect(() => buildBlenderJob({ ...script, blender: { optOut: "old" } }, vo, 30)).toThrow();
  });

  it("pads frame file names to 4 digits", () => {
    expect(blenderFramePath("post-99-test", "hook", 7)).toBe("posts/post-99-test/3d/hook/0007.png");
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
