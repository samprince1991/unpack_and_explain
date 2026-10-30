import { describe, expect, it } from "vitest";
import { validateCarousel } from "../../templates/validate";
import { script } from "./slides";

describe("post 18 slides", () => {
  it("passes validation with no warnings", () => {
    expect(validateCarousel(script)).toEqual({ errors: [], warnings: [] });
  });
});
