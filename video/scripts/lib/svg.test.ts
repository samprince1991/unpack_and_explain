import { describe, expect, it } from "vitest";
import { cropViewBox, stripBackground } from "./svg";

const SAMPLE = `<svg width="1080" height="1080" viewBox="0 0 1080 1080">
  <g id="Background">
    <path id="bg" d="M0 0 Z" fill="url(#g)"/>
  </g>
  <g id="Avatar-Dark"><path d="M1 1"/></g>
</svg>`;

describe("stripBackground", () => {
  it("removes the Background group only", () => {
    const out = stripBackground(SAMPLE);
    expect(out).not.toContain('id="Background"');
    expect(out).toContain('id="Avatar-Dark"');
  });

  it("throws when there is no Background group", () => {
    expect(() => stripBackground("<svg></svg>")).toThrow();
  });
});

describe("cropViewBox", () => {
  it("replaces viewBox, width and height", () => {
    const out = cropViewBox(SAMPLE, { x: 190, y: 300, width: 700, height: 470 });
    expect(out).toContain('viewBox="190 300 700 470"');
    expect(out).toContain('width="700"');
    expect(out).toContain('height="470"');
  });
});
