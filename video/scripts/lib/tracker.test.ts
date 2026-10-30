import { describe, expect, it } from "vitest";
import { CAROUSEL, FRONT, SCRIPT, SLIDES, TAXONOMY, idea, posted, words } from "./tracker.fixtures";
import { folderName, medianViews, parseIdea, parseTaxonomy, postFolder, rates, summarize, validateIdea } from "./tracker";

describe("parseIdea", () => {
  it("reads front matter, script table and caption", () => {
    const p = idea();
    expect(p.meta.date).toBe("2026-11-03");
    expect(p.meta.id).toBe(2);
    expect(p.meta.subcategory).toBe("Location & GPS");
    expect(p.sections.map((s) => s.id)).toEqual([
      "question", "hook", "setup", "mechanism", "payoff", "congrats", "cta",
    ]);
    expect(p.sections[1].visual).toBe("a | b");
    expect(p.caption).toBe("Save this.\n\n#GPS");
  });

  it("throws without front matter", () => {
    expect(() => parseIdea("x", "# no front matter")).toThrow(/front matter/);
  });
});

describe("parseTaxonomy", () => {
  it("keeps categories and sub-categories in file order", () => {
    expect(TAXONOMY).toEqual([
      { category: "Everyday tech", subcategories: ["Location & GPS", "Wireless"] },
      { category: "Money & payments", subcategories: ["Payments"] },
    ]);
  });

  it("rejects a category without sub-categories", () => {
    expect(() => parseTaxonomy("Everyday tech:\n")).toThrow(/needs a list/);
  });
});

describe("validateIdea", () => {
  it("accepts a valid scripted idea", () => {
    expect(validateIdea(idea(), TAXONOMY)).toEqual({ errors: [], warnings: [] });
  });

  it("checks the folder name, id, status and date", () => {
    const p = idea(FRONT.replace("status: scripted", "status: done").replace("2026-11-03", "3 Nov"));
    const { errors } = validateIdea({ ...p, folder: "post_2" }, TAXONOMY);
    expect(errors).toContain("folder should be idea-02-gps");
    expect(errors.some((e) => e.startsWith("status must be"))).toBe(true);
    expect(errors.some((e) => e.startsWith("date must be"))).toBe(true);
    const carousel = idea(FRONT.replace("id: 2", "id: C1"), SCRIPT);
    expect(validateIdea(carousel, TAXONOMY).errors).toContain("id must be a whole number, got C1");
  });

  it("checks category and sub-category against the taxonomy", () => {
    const unknown = idea(FRONT.replace('"Everyday tech"', '"Everyday Tech"'));
    expect(validateIdea(unknown, TAXONOMY).errors).toEqual([
      'category "Everyday Tech" is not in ideas/categories.yml',
    ]);
    const wrongSub = idea(FRONT.replace('"Location & GPS"', '"Payments"'));
    expect(validateIdea(wrongSub, TAXONOMY).errors).toEqual([
      'subcategory "Payments" is not listed under Everyday tech in ideas/categories.yml',
    ]);
    const missing = idea(FRONT.replace('subcategory: "Location & GPS"\n', ""));
    expect(validateIdea(missing, TAXONOMY).errors).toEqual(["subcategory is required"]);
  });

  it("applies the reel script rules", () => {
    const body = SCRIPT.replace("Congrats, you", "Congrats! You").replace("finds you? |", "finds you. |");
    const { errors } = validateIdea(idea(FRONT, body), TAXONOMY);
    expect(errors).toContain('Question must end with "?"');
    expect(errors.some((e) => e.startsWith("Congrats must start"))).toBe(true);
    expect(errors.some((e) => e.includes('"!"'))).toBe(true);
  });

  it("does not need a script for ideas", () => {
    expect(validateIdea(idea(FRONT.replace("scripted", "idea"), ""), TAXONOMY)).toEqual({
      errors: [],
      warnings: [],
    });
  });

  it("warns about word count, missing link and missing reach", () => {
    const p = idea(FRONT.replace("scripted", "posted"), SCRIPT.replace(words(50), words(5)));
    expect(validateIdea(p, TAXONOMY).warnings).toEqual([
      "79 spoken words, outside the 100-130 target",
      "posted but link is empty",
      "posted but metrics.reach is empty",
    ]);
  });

  it("checks the link is an https URL", () => {
    const p = idea(FRONT.replace("status: scripted", 'status: scripted\nlink: "instagram.com/reel/x"'));
    expect(validateIdea(p, TAXONOMY).errors).toEqual(["link must be an https:// URL, got instagram.com/reel/x"]);
  });
});

describe("hook scores", () => {
  it("rejects a hook or question card under 50", () => {
    const weak = idea(FRONT.replace("question_score: 60", "question_score: 45"));
    expect(validateIdea(weak, TAXONOMY).errors).toEqual([
      "question_score is 45, under 50: write a stronger line (npm run ig)",
    ]);
  });

  it("warns when a scripted reel has no scores yet", () => {
    const unscored = idea(FRONT.replace(/hook_formula: 3\nhook_score: 81\nquestion_score: 60\n/, ""));
    expect(validateIdea(unscored, TAXONOMY).warnings).toEqual([
      "no hook_formula, hook_score, question_score yet (run npm run ig, then record them)",
    ]);
  });
});

describe("carousels", () => {
  const carousel = (front = CAROUSEL, body = SLIDES) => idea(front, body, "idea-18-gps-steps");

  it("parses slides and accepts a valid carousel without a reel script", () => {
    const c = carousel();
    expect(c.slides).toHaveLength(6);
    expect(c.slides[0]).toEqual({ headline: "GPS in 4 steps", body: "Your phone only listens." });
    expect(c.meta.companion_of).toBe(2);
    expect(validateIdea(c, TAXONOMY)).toEqual({ errors: [], warnings: [] });
  });

  it("checks slide count and word limits", () => {
    const body = SLIDES.replace("GPS in 4 steps", "How GPS works in four easy steps").replace(/\| 6 \|.*\n/, "");
    expect(validateIdea(carousel(CAROUSEL, body), TAXONOMY).errors).toEqual([
      "## Slides needs 6-10 slides, got 5",
      "slide 1 headline needs 1-6 words, got 7",
    ]);
  });
});

describe("medianViews", () => {
  it("takes the middle of the posted views", () => {
    expect(medianViews([posted("E", 100, 1), posted("E", 300, 1), posted("E", 1000, 1)])).toBe(600);
    expect(medianViews([idea()])).toBeNull();
  });
});

describe("folderName", () => {
  it("pads the id", () => {
    expect(folderName(2, "gps")).toBe("idea-02-gps");
  });

  it("maps an idea to its post folder", () => {
    expect(postFolder(idea())).toBe("post-02-gps");
  });
});

describe("metrics", () => {
  it("computes the spreadsheet rates", () => {
    expect(rates(posted("E", 1000, 20).meta.metrics)).toEqual({
      engagement: 0.1,
      shareSave: 0.04,
      sendsPerReach: 0.02,
      followsPer1k: 5,
    });
    expect(rates(idea().meta.metrics)).toBeNull();
  });

  it("only names a best format once it has 3 posted", () => {
    const two = summarize([posted("E", 1000, 20), posted("E", 1000, 20), posted("F", 1000, 90)]);
    expect(two.best.shareSave).toBeNull();
    const three = summarize([1, 2, 3].map(() => posted("E", 1000, 20)));
    expect(three.best.shareSave).toBe("E");
    expect(three.byFormat.find((f) => f.format === "E")).toMatchObject({ planned: 3, posted: 3, avgReach: 1000 });
  });
});
