import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POSTS = join(process.cwd(), "src", "posts");

// Reels with a Blender plan must show the rendered mechanism clip.
const blenderPosts = readdirSync(POSTS).filter((name) => {
  const script = join(POSTS, name, "script.ts");
  return existsSync(script) && /blender:\s*\{\s*(\/\/[^\n]*\n\s*)*model:/.test(readFileSync(script, "utf8"));
});

describe("Blender mechanism guard", () => {
  it("finds the Blender posts", () => {
    expect(blenderPosts.length).toBeGreaterThan(0);
  });

  it("draws the mechanism of every Blender post from the rendered clip", () => {
    const missing = blenderPosts.filter((name) => {
      const scene = join(POSTS, name, "scenes", "MechanismScene.tsx");
      return !existsSync(scene) || !/<BlenderClip[^>]*clip="mechanism"/.test(readFileSync(scene, "utf8"));
    });
    expect(missing).toEqual([]);
  });
});
