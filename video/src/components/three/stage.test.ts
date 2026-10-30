import { describe, expect, it } from "vitest";
import { STAGE, cameraAt, projectToScreen, type StageView } from "./stage";

const still: StageView = { rotation: [0, 0, 0], pan: [0, 0], zoom: 1 };
const center = { x: STAGE.left + STAGE.width / 2, y: STAGE.top + STAGE.height / 2 };

describe("projectToScreen", () => {
  it("puts the origin at the visual region center (x 540)", () => {
    const p = projectToScreen([0, 0, 0], still);
    expect(p.x).toBeCloseTo(540);
    expect(p.y).toBeCloseTo(center.y);
  });

  it("puts +x right and +y up", () => {
    const p = projectToScreen([1, 1, 0], still);
    expect(p.x).toBeGreaterThan(center.x);
    expect(p.y).toBeLessThan(center.y);
  });

  it("scales 1 at the origin and larger toward the camera", () => {
    expect(projectToScreen([0, 0, 0], still).scale).toBeCloseTo(1);
    expect(projectToScreen([0, 0, 1], still).scale).toBeGreaterThan(1);
    expect(projectToScreen([0, 0, 0], { ...still, zoom: 2 }).scale).toBeCloseTo(2);
  });

  it("centers the pan point", () => {
    const p = projectToScreen([1, 0.5, 0], { ...still, pan: [1, 0.5], zoom: 2 });
    expect(p.x).toBeCloseTo(center.x);
    expect(p.y).toBeCloseTo(center.y);
  });
});

describe("cameraAt", () => {
  const base = { duration: 300, fps: 30, pushIn: 1 };

  it("orbits by degrees per second", () => {
    expect(cameraAt(30, { ...base, orbit: 30, tilt: 0 }).rotation[1]).toBeCloseTo(Math.PI / 6);
  });

  it("arrives at a shot on its frame", () => {
    const v = cameraAt(60, { ...base, shots: [{ at: 60, pan: [1, 2], zoom: 1.5 }] });
    // Spring easing may land a hair off 1.0, so compare loosely.
    expect(v.pan[0]).toBeCloseTo(1);
    expect(v.pan[1]).toBeCloseTo(2);
    expect(v.zoom).toBeCloseTo(1.5);
  });

  it("stays put before the shot's move starts", () => {
    const v = cameraAt(10, { ...base, shots: [{ at: 60, pan: [1, 2], zoom: 1.5 }] });
    expect(v.pan).toEqual([0, 0]);
    expect(v.zoom).toBe(1);
  });
});
