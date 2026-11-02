import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POSTS = join(process.cwd(), "src", "posts");

// Reels (folders with a script.ts) that declare a 3D mechanism.
const heroPosts = readdirSync(POSTS).filter((name) => {
  const script = join(POSTS, name, "script.ts");
  return existsSync(script) && /hero3d:\s*"mechanism"/.test(readFileSync(script, "utf8"));
});

// Posts with a Blender plan draw the mechanism from the Blender render.
const blenderPosts = readdirSync(POSTS).filter((name) => {
  const script = join(POSTS, name, "script.ts");
  return existsSync(script) && /blender:\s*\{\s*model:/.test(readFileSync(script, "utf8"));
});

describe("3D hero guard", () => {
  it("draws the mechanism of every hero3d post with src/components/three", () => {
    const missing = heroPosts.filter((name) => {
      const scene = join(POSTS, name, "scenes", "MechanismScene.tsx");
      if (!existsSync(scene)) {
        return true;
      }
      const code = readFileSync(scene, "utf8");
      return blenderPosts.includes(name)
        ? !/<BlenderClip[^>]*clip="mechanism"/.test(code)
        : !/components\/three\//.test(code);
    });
    expect(missing).toEqual([]);
  });
});
