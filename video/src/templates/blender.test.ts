import { describe, expect, it } from "vitest";
import { blenderProblems, clipStatuses } from "./blender";
import type { BlenderJob } from "./blenderJob";
import type { BlenderManifest } from "./types";

const job = {
  clips: [
    { id: "cover", hash: "a" },
    { id: "opener", hash: "b" },
    { id: "hook", hash: "c" },
    { id: "mechanism", hash: "d" },
  ],
} as unknown as BlenderJob;

const rendered = (hash: string, preview = false) => ({
  hash,
  frames: 1,
  width: 1,
  height: 1,
  preview,
  blenderVersion: "4.5",
  labels: [],
});

describe("clipStatuses", () => {
  it("marks missing, stale, preview and ok clips", () => {
    const manifest: BlenderManifest = {
      postId: "p",
      clips: { cover: rendered("a"), opener: rendered("old"), hook: rendered("c", true) },
    };
    expect(clipStatuses(job, manifest)).toEqual({
      cover: "ok",
      opener: "stale",
      hook: "preview",
      mechanism: "missing",
    });
  });

  it("marks a clip stale when its model file changed", () => {
    const manifest: BlenderManifest = {
      postId: "p",
      clips: { cover: { ...rendered("a"), modelHash: "m1" } },
    };
    expect(clipStatuses(job, manifest, "m2").cover).toBe("stale");
    expect(clipStatuses(job, manifest, "m1").cover).toBe("ok");
  });

  it("accepts old renders with no model hash, and an unreadable model file", () => {
    const manifest: BlenderManifest = { postId: "p", clips: { cover: rendered("a") } };
    expect(clipStatuses(job, manifest, "m2").cover).toBe("ok");
    const tracked: BlenderManifest = {
      postId: "p",
      clips: { cover: { ...rendered("a"), modelHash: "m1" } },
    };
    expect(clipStatuses(job, tracked, null).cover).toBe("ok");
  });

  it("reports nothing when every clip is ok", () => {
    const manifest: BlenderManifest = {
      postId: "p",
      clips: { cover: rendered("a"), opener: rendered("b"), hook: rendered("c"), mechanism: rendered("d") },
    };
    expect(blenderProblems("p", clipStatuses(job, manifest))).toBeNull();
    expect(blenderProblems("p", clipStatuses(job, null))).toMatch(/npm run blender -- p/);
  });
});

describe("allowPreview", () => {
  it("accepts preview clips but still blocks stale ones", () => {
    const statuses = { cover: "ok", opener: "preview", hook: "preview", mechanism: "ok" } as const;
    expect(blenderProblems("p", statuses, true)).toBeNull();
    expect(blenderProblems("p", { ...statuses, cover: "stale" }, true)).toMatch(/cover: stale/);
  });
});
