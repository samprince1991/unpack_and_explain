import { describe, expect, it } from "vitest";
import { brand, withAlpha } from "./tokens";

describe("withAlpha", () => {
  it("appends a two-digit alpha channel", () => {
    expect(withAlpha("#ffffff", 0.5)).toBe("#ffffff80");
    expect(withAlpha("#0f172a", 0)).toBe("#0f172a00");
    expect(withAlpha("#0f172a", 1)).toBe("#0f172aff");
  });

  it("rejects non 6-digit hex", () => {
    expect(() => withAlpha("#fff", 0.5)).toThrow();
  });
});

describe("brand", () => {
  it("uses the canonical tagline and CTA line", () => {
    expect(brand.tagline).toBe("How things actually work");
    expect(brand.ctaLine).toBe("Follow Unpack and Explain for how things actually work.");
  });
});
