import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const POSTS = join(process.cwd(), "src", "posts");

// Live before SFX existed. Posts 10, 12 and 26 leave this list once their sounds are made.
const MAY_OPT_OUT = [
  "post-01-card-payment",
  "post-02-gps",
  "post-03-jet-engine",
  "post-10-undersea-cables",
  "post-12-cloud-myth",
  "post-20-vibe-coding",
  "post-26-bulbous-bow",
];

describe("SFX guard", () => {
  it("every new reel has a sound plan", () => {
    const optedOut = readdirSync(POSTS).filter((name) => {
      const script = join(POSTS, name, "script.ts");
      return existsSync(script) && /sfx:\s*\{\s*optOut/.test(readFileSync(script, "utf8"));
    });
    expect(optedOut.filter((name) => !MAY_OPT_OUT.includes(name))).toEqual([]);
  });
});
