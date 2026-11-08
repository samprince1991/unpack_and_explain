import { describe, expect, it } from "vitest";
import { compositionForPost, cueWindows } from "./qaAudio";

describe("compositionForPost", () => {
  const root = `<Composition id="Post03-JetEngine" /><Composition id="Cover26-BulbousBow" /><Composition id="Post26-BulbousBow" />`;

  it("finds the reel, not the cover", () => {
    expect(compositionForPost(root, "post-26-bulbous-bow")).toBe("Post26-BulbousBow");
    expect(compositionForPost(root, "post-03-jet-engine")).toBe("Post03-JetEngine");
  });

  it("throws when the post isn't registered", () => {
    expect(() => compositionForPost(root, "post-99-nope")).toThrow(/post-99-nope/);
  });
});

describe("cueWindows", () => {
  it("converts frames to seconds", () => {
    const cue = { sound: "tick", from: 30, durationInFrames: 15, volume: 0.25 };
    expect(cueWindows([cue], 30)).toEqual([{ sound: "tick", start: 1, end: 1.5 }]);
  });
});
