import { describe, expect, it } from "vitest";
import {
  ChartLimitError,
  checkCount,
  checkFits,
  checkValues,
  formatValue,
  textWidth,
  uniqueIds,
} from "./geometry";

describe("chart geometry", () => {
  it("checkCount throws on empty and over the limit", () => {
    expect(() => checkCount("X", "bars", 0, 6)).toThrow(ChartLimitError);
    expect(() => checkCount("X", "bars", 7, 6)).toThrow(/7 bars, max 6/);
    expect(() => checkCount("X", "bars", 6, 6)).not.toThrow();
  });

  it("checkValues rejects negatives unless allowed, and non-finite always", () => {
    expect(() => checkValues("X", [1, -1])).toThrow(ChartLimitError);
    expect(() => checkValues("X", [1, -1], true)).not.toThrow();
    expect(() => checkValues("X", [Number.NaN], true)).toThrow(ChartLimitError);
  });

  it("uniqueIds rejects duplicates", () => {
    expect(() => uniqueIds("X", ["a", "b", "a"])).toThrow(/duplicate id "a"/);
  });

  it("textWidth scales with length and checkFits uses it", () => {
    expect(textWidth("abcd")).toBeCloseTo(2 * textWidth("ab"));
    expect(() => checkFits("X", "Mon", 200)).not.toThrow();
    expect(() => checkFits("X", "A very long category name", 200)).toThrow(
      /Shorten/,
    );
  });

  it("formatValue rounds, groups and adds the unit", () => {
    expect(formatValue(1234.6)).toBe("1,235");
    expect(formatValue(40, undefined, "%")).toBe("40%");
    expect(formatValue(12, undefined, "km")).toBe("12 km");
    expect(formatValue(0.5, (v) => `${v * 100}%`)).toBe("50%");
  });
});
