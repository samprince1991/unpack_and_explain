import { describe, expect, it } from "vitest";
import { brand } from "../../src/brand/tokens";
import { folderName, parseIdea, postFolder, rates, renderIndex, summarize, validateIdea, type Idea } from "./tracker";

const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

const md = (front: string, body = "") => `---\n${front}\n---\n\n# Title\n${body}`;

const FRONT = `id: 2
slug: gps
title: "How GPS finds you"
format: E
area: "Everyday tech"
week: 1
date: 2026-11-03
status: scripted
hook: "GPS doesn't track you."
source: "GPS.gov"
verify: []
metrics:
  reach: null
  watch_pct: null
  likes: null
  comments: null
  shares: null
  saves: null
  follows: null`;

const SCRIPT = `
## Script

| Section | Voice-over | Visual |
|---|---|---|
| Question | Do you know how GPS finds you? | Card |
| Hook | ${words(10)} | a \\| b |
| Setup | ${words(15)} | x |
| Mechanism | ${words(50)} | x |
| Payoff | ${words(25)} | x |
| Congrats | Congrats, you just learned how GPS finds you. | Card |
| CTA | ${brand.ctaLine} | Logo |

## Caption

Save this.

#GPS
`;

const idea = (front = FRONT, body = SCRIPT) => parseIdea("idea-02-gps", md(front, body));

describe("parseIdea", () => {
  it("reads front matter, script table and caption", () => {
    const p = idea();
    expect(p.meta.date).toBe("2026-11-03");
    expect(p.meta.id).toBe(2);
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

describe("validateIdea", () => {
  it("accepts a valid scripted idea", () => {
    expect(validateIdea(idea())).toEqual({ errors: [], warnings: [] });
  });

  it("checks the folder name, status and date", () => {
    const p = idea(FRONT.replace("status: scripted", "status: done").replace("2026-11-03", "3 Nov"));
    const { errors } = validateIdea({ ...p, folder: "post_2" });
    expect(errors).toContain("folder should be idea-02-gps");
    expect(errors.some((e) => e.startsWith("status must be"))).toBe(true);
    expect(errors.some((e) => e.startsWith("date must be"))).toBe(true);
  });

  it("applies the reel script rules", () => {
    const body = SCRIPT.replace("Congrats, you", "Congrats! You").replace("finds you? |", "finds you. |");
    const { errors } = validateIdea(idea(FRONT, body));
    expect(errors).toContain('Question must end with "?"');
    expect(errors.some((e) => e.startsWith("Congrats must start"))).toBe(true);
    expect(errors.some((e) => e.includes('"!"'))).toBe(true);
  });

  it("does not need a script for ideas", () => {
    expect(validateIdea(idea(FRONT.replace("scripted", "idea"), ""))).toEqual({ errors: [], warnings: [] });
  });

  it("warns about word count, missing link and missing reach", () => {
    const p = idea(FRONT.replace("scripted", "posted"), SCRIPT.replace(words(50), words(5)));
    expect(validateIdea(p).warnings).toEqual([
      "79 spoken words, outside the 100-130 target",
      "posted but link is empty",
      "posted but metrics.reach is empty",
    ]);
  });

  it("checks the link is an https URL", () => {
    const p = idea(FRONT.replace("status: scripted", 'status: scripted\nlink: "instagram.com/reel/x"'));
    expect(validateIdea(p).errors).toEqual(["link must be an https:// URL, got instagram.com/reel/x"]);
  });
});

describe("folderName", () => {
  it("pads reel ids and lowercases carousel ids", () => {
    expect(folderName(2, "gps")).toBe("idea-02-gps");
    expect(folderName("C1", "steps")).toBe("idea-c1-steps");
  });

  it("maps an idea to its post folder", () => {
    expect(postFolder(idea())).toBe("post-02-gps");
  });
});

const posted = (format: "E" | "F", reach: number, shares: number): Idea => {
  const p = idea(FRONT.replace("status: scripted", "status: posted").replace("format: E", `format: ${format}`));
  return {
    ...p,
    meta: {
      ...p.meta,
      metrics: { reach, watch_pct: 40, likes: 50, comments: 10, shares, saves: 20, follows: 5 },
    },
  };
};

describe("metrics", () => {
  it("computes the spreadsheet rates", () => {
    expect(rates(posted("E", 1000, 20).meta.metrics)).toEqual({
      engagement: 0.1,
      shareSave: 0.04,
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

  it("renders the area groups and performance tables", () => {
    const live = posted("E", 1000, 20);
    live.meta.link = "https://www.instagram.com/reel/x";
    const other = idea(FRONT.replace("Everyday tech", "Money & payments"));
    const out = renderIndex([idea(), live, other], 2.5);
    expect(out).toContain("| 2 | 2026-11-03 | 1 | E | [How GPS finds you](idea-02-gps/idea.md) | scripted | 124 | 50 |");
    expect(out).toContain("| [posted](https://www.instagram.com/reel/x) |");
    expect(out.indexOf("### Everyday tech (2)")).toBeLessThan(out.indexOf("### Money & payments (1)"));
    expect(out).toContain("| [watch](https://www.instagram.com/reel/x) | 1,000 | 40% | 10.0% | 4.0% | 5 |");
    expect(out).toContain("Posted 1 of 3 ideas (33%).");
  });
});
