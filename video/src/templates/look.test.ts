import { describe, expect, it } from "vitest";
import { classicLook, pickLook } from "./look";

describe("pickLook", () => {
  it("is deterministic", () => {
    expect(pickLook(20)).toEqual(pickLook(20));
  });

  it("never repeats a question style, hook style or transition mix on consecutive posts", () => {
    for (let n = 1; n < 200; n++) {
      const a = pickLook(n);
      const b = pickLook(n + 1);
      expect(b.question).not.toBe(a.question);
      expect(b.hook).not.toBe(a.hook);
      expect(b.transitions).not.toBe(a.transitions);
    }
  });

  it("drifts: question and transition styles don't stay paired", () => {
    const pairs = new Set(
      Array.from({ length: 32 }, (_, n) => `${pickLook(n).question}/${pickLook(n).transitions}`),
    );
    expect(pairs.size).toBeGreaterThan(4);
  });

  it("never picks the classic mix by rotation", () => {
    for (let n = 0; n < 200; n++) {
      expect(pickLook(n).transitions).not.toBe("classic");
    }
  });

  it("lets a script pin any slot", () => {
    expect(pickLook(20, { hook: "rise" }).hook).toBe("rise");
    expect(pickLook(2, classicLook)).toEqual(classicLook);
  });
});
