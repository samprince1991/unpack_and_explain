import { describe, expect, it } from "vitest";
import { renderIndex, renderTopics } from "./readme";
import { FRONT, TAXONOMY, idea, posted } from "./tracker.fixtures";

const money = idea(
  FRONT.replace("id: 2", "id: 1")
    .replace("slug: gps", "slug: card")
    .replace('"Everyday tech"', '"Money & payments"')
    .replace('"Location & GPS"', '"Payments"')
    .replace("2026-11-03", "2026-11-02")
    .replace("status: scripted", "status: idea")
    .replace("verify: []", 'verify:\n  - "Fee figure"\n  - "Timing"'),
  "",
  "idea-01-card",
);

describe("renderTopics", () => {
  it("groups by category in taxonomy order and lists empty sub-categories", () => {
    const out = renderTopics([money, idea()], TAXONOMY);
    expect(out.indexOf("### Everyday tech (1)")).toBeLessThan(out.indexOf("### Money & payments (1)"));
    expect(out).toContain(
      "| Location & GPS | 2 | [How GPS finds you](idea-02-gps/idea.md) | GPS doesn't track you. | E | scripted | GPS.gov | - |",
    );
    expect(out).toContain("| Payments | 1 | [How GPS finds you](idea-01-card/idea.md) | GPS doesn't track you. | E | idea | GPS.gov | 2 |");
    expect(out).toContain("No ideas yet: Wireless.");
  });

  it("shows a placeholder for a category with no ideas", () => {
    expect(renderTopics([idea()], TAXONOMY)).toContain("### Money & payments (0)\n\n_No ideas yet._");
  });
});

describe("renderIndex", () => {
  it("renders header, schedule, performance and formats", () => {
    const live = posted("E", 1000, 20);
    live.meta.link = "https://www.instagram.com/reel/x";
    const out = renderIndex([money, idea(), live], TAXONOMY, 2.5);
    expect(out).toContain(
      "**3 ideas** (by status: 1 idea, 1 scripted, 1 posted) · next up: #1 [How GPS finds you](idea-01-card/idea.md) (Mon 2 Nov)",
    );
    expect(out).toContain(
      "| 2026-11-03 | 1 | 2 | [How GPS finds you](idea-02-gps/idea.md) | Everyday tech › Location & GPS | E | scripted | 124 | 50 |",
    );
    expect(out).toContain("| [posted](https://www.instagram.com/reel/x) |");
    expect(out).toContain("| [watch](https://www.instagram.com/reel/x) | 1,000 | 40% | 10.0% | 4.0% | 5 |");
    expect(out).toContain("Posted 1 of 3 ideas (33%).");
    expect(out).not.toContain("Carousel");
  });
});
