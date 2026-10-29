import { describe, expect, it } from "vitest";
import { validateScript } from "../../templates/validate";
import { script } from "./script";

describe("post 02 script", () => {
  it("passes validation with no warnings", () => {
    expect(validateScript(script)).toEqual({ errors: [], warnings: [] });
  });
});
