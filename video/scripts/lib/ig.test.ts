import { describe, expect, it } from "vitest";
import { igInputs } from "./ig";
import { CAROUSEL, SLIDES, idea } from "./tracker.fixtures";

describe("igInputs", () => {
  it("scores the question and hook of a reel and splits beats at sentence ends", () => {
    const input = igInputs(idea());
    expect(input.hooks).toEqual(["Do you know how GPS finds you?", expect.stringMatching(/^word/)]);
    expect(input.spoken[0]).toBe("Do you know how GPS finds you?");
    expect(input.spoken).toContain("Congrats, you just learned how GPS finds you.");
    expect(input.caption).toBe("Save this.\n\n#GPS");
  });

  it("scores a carousel's cover and checks its slide copy", () => {
    const input = igInputs(idea(CAROUSEL, SLIDES, "idea-18-gps-steps"));
    expect(input.hooks).toEqual(["GPS in 4 steps"]);
    expect(input.spoken).toEqual([]);
    expect(input.text.split("\n")[0]).toBe("GPS in 4 steps. Your phone only listens.");
  });
});
