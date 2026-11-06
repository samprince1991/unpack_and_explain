import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

// D3 is for maths only. These modules mutate the DOM or run on the wall clock,
// which flickers in Remotion renders (see docs/specs/2026-11-06-d3-charts-design.md).
const BANNED =
  /from\s+["'](d3|d3-selection|d3-transition|d3-timer|d3-ease)["']/;

const SRC = join(process.cwd(), "src");
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

describe("d3 import guard", () => {
  it("only imports frame-safe d3 modules", () => {
    const bad = walk(SRC)
      .filter((f) => /\.(ts|tsx)$/.test(f))
      .filter((f) => BANNED.test(readFileSync(f, "utf8")))
      .map((f) => relative(SRC, f));
    expect(bad).toEqual([]);
  });
});
