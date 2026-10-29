import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";
import { describe, expect, it } from "vitest";

const SRC = join(process.cwd(), "src");

const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const full = join(dir, name);
    return statSync(full).isDirectory() ? walk(full) : [full];
  });

const sourceFiles = walk(SRC)
  .filter((f) => /\.(ts|tsx)$/.test(f))
  .filter((f) => !f.endsWith(".test.ts"))
  .filter((f) => !relative(SRC, f).startsWith(`brand${sep}`))
  // Original Remotion Elements kept as an unbranded reference library.
  .filter((f) => !relative(SRC, f).startsWith(`elements${sep}`));

const offenders = (pattern: RegExp) =>
  sourceFiles.filter((f) => pattern.test(readFileSync(f, "utf8"))).map((f) => relative(SRC, f));

describe("brand guard", () => {
  it("has no color literals outside src/brand", () => {
    expect(offenders(/#[0-9a-fA-F]{3,8}\b|rgba?\(|hsla?\(/)).toEqual([]);
  });

  it("has no font-family strings outside src/brand", () => {
    expect(offenders(/fontFamily:\s*["'`]/)).toEqual([]);
  });
});
