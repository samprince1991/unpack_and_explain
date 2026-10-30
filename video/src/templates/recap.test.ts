import { describe, expect, it } from "vitest";
import { recapSteps } from "./recap";

describe("recapSteps", () => {
  it("splits numbered steps and drops the source", () => {
    expect(
      recapSteps("1 Satellites broadcast. 2 Phone times the delay. 3 Delay x c = distance. Source: GPS.gov"),
    ).toEqual(["Satellites broadcast.", "Phone times the delay.", "Delay x c = distance."]);
  });

  it("keeps numbers inside a step", () => {
    expect(recapSteps("1 About 30 satellites orbit. 2 Four distances = you.")).toEqual([
      "About 30 satellites orbit.",
      "Four distances = you.",
    ]);
  });
});
