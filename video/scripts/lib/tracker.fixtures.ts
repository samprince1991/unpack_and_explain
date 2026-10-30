import { brand } from "../../src/brand/tokens";
import { parseIdea, parseTaxonomy, type Idea } from "./tracker";

// Shared test data for tracker.test.ts and readme.test.ts.

export const words = (n: number) => Array.from({ length: n }, () => "word").join(" ");

const md = (front: string, body = "") => `---\n${front}\n---\n\n# Title\n${body}`;

export const TAXONOMY = parseTaxonomy(`Everyday tech:
  - Location & GPS
  - Wireless
Money & payments:
  - Payments
`);

export const FRONT = `id: 2
slug: gps
title: "How GPS finds you"
format: E
category: "Everyday tech"
subcategory: "Location & GPS"
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

export const SCRIPT = `
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

export const idea = (front = FRONT, body = SCRIPT, folder = "idea-02-gps") => parseIdea(folder, md(front, body));

export const posted = (format: "E" | "F", reach: number, shares: number): Idea => {
  const p = idea(FRONT.replace("status: scripted", "status: posted").replace("format: E", `format: ${format}`));
  return {
    ...p,
    meta: {
      ...p.meta,
      metrics: { reach, watch_pct: 40, likes: 50, comments: 10, shares, saves: 20, follows: 5 },
    },
  };
};
