import { existsSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { models, type ModelEntry } from "./models";

const entries = Object.entries(models) as [string, ModelEntry][];

describe("model catalog", () => {
  it.each(entries)("%s has no TODO fields", (_id, entry) => {
    expect(JSON.stringify(entry)).not.toMatch(/TODO/);
  });

  it.each(entries)("%s has a credit line when CC-BY", (_id, entry) => {
    if (entry.license === "CC-BY") {
      expect(entry.credit?.trim()).toBeTruthy();
    }
  });

  it.each(entries)("%s file exists under public/", (_id, entry) => {
    expect(existsSync(join(process.cwd(), "public", entry.file))).toBe(true);
  });

  it.each(entries)("%s keyPart and explode order use known parts", (_id, entry) => {
    const parts = Object.keys(entry.parts);
    expect(parts).toContain(entry.keyPart);
    entry.explode.order.forEach((p) => expect(parts).toContain(p));
  });
});
