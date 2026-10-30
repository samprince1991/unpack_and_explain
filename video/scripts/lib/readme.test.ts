import { describe, expect, it } from "vitest";
import { renderIndex, renderTopics } from "./readme";
import { CAROUSEL, FRONT, SLIDES, TAXONOMY, idea, posted } from "./tracker.fixtures";

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
    const carousel = idea(CAROUSEL.replace("2026-11-03", "2026-11-04"), SLIDES, "idea-18-gps-steps");
    const out = renderIndex([money, idea(), live, carousel], TAXONOMY, 2.5);
    expect(out).toContain(
      "**4 ideas** (by status: 1 idea, 2 scripted, 1 posted) · next up: #1 [How GPS finds you](idea-01-card/idea.md) (Mon 2 Nov)",
    );
    expect(out).toContain(
      "| 2026-11-03 | 1 | 2 | [How GPS finds you](idea-02-gps/idea.md) | Everyday tech › Location & GPS | E | scripted | 81 | 124 | 50 |",
    );
    expect(out).toContain(
      "| 2026-11-04 | 1 | 18 | [How GPS finds you](idea-18-gps-steps/idea.md) | Everyday tech › Location & GPS | C | scripted | - | 6 slides | - |",
    );
    expect(out).toContain("| [posted](https://www.instagram.com/reel/x) |");
    expect(out).toContain("| [watch](https://www.instagram.com/reel/x) | 2,000 | 1.0x | 1,000 | 60% | 70% | 40% | 2.0% | 4.0% | 5 |");
    expect(out).toContain("Posted 1 of 4 ideas (25%).");
    expect(out).not.toContain("Carousel");
  });
});
