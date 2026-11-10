import { afterEach, describe, expect, it, vi } from "vitest";
import { parseOnly, postOutPath, requireApiKey } from "./cli";

describe("parseOnly", () => {
  const valid = ["hook", "setup", "cta"];

  it("is null without the flag", () => {
    expect(parseOnly(["post-01"], valid)).toBeNull();
  });

  it("returns the listed names", () => {
    expect(parseOnly(["post-01", "--only=hook,cta"], valid)).toEqual(["hook", "cta"]);
  });

  it("throws on a name that doesn't exist, listing the valid ones", () => {
    expect(() => parseOnly(["--only=hok"], valid)).toThrow(/"hok".*hook, setup, cta/);
  });
});

describe("postOutPath", () => {
  it("puts a post's outputs in its own folder", () => {
    expect(postOutPath("post-07-credit-score", "cover.png")).toBe(
      "out/post-07-credit-score/post-07-credit-score-cover.png",
    );
  });
});

describe("requireApiKey", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns the key", () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "abc");
    expect(requireApiKey()).toBe("abc");
  });

  it("explains where the key goes", () => {
    vi.stubEnv("ELEVENLABS_API_KEY", "");
    expect(() => requireApiKey()).toThrow(/video\/\.env/);
  });
});
