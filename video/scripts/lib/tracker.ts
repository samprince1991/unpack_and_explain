import yaml from "js-yaml";
import { brand } from "../../src/brand/tokens";
import { countWords } from "../../src/templates/timing";
import { SECTION_ORDER, type SectionId } from "../../src/templates/types";
import { WORD_RANGE } from "../../src/templates/validate";

// The content tracker: one ideas/idea-NN-slug/idea.md per idea (YAML front matter +
// script). `npm run tracker` validates them and writes ideas/README.md. Once an idea is
// built it becomes a post: its code, VO and renders use post-NN-slug (see postFolder).

export const STATUSES = ["idea", "scripted", "built", "rendered", "posted"] as const;
export const FORMATS = ["E", "F", "Q", "Carousel"] as const;
export const METRIC_KEYS = ["reach", "watch_pct", "likes", "comments", "shares", "saves", "follows"] as const;

export type Status = (typeof STATUSES)[number];
export type IdeaFormat = (typeof FORMATS)[number];
export type Metrics = Record<(typeof METRIC_KEYS)[number], number | null>;

export type IdeaMeta = {
  id: number | string;
  slug: string;
  title: string;
  format: IdeaFormat;
  area: string;
  week: number;
  date: string;
  status: Status;
  link?: string; // the live post URL, once posted
  hook: string;
  source: string;
  verify: string[];
  notes?: string;
  metrics: Metrics;
};

export type TrackerSection = { id: SectionId; voiceover: string; visual: string };

export type Idea = {
  folder: string;
  meta: IdeaMeta;
  sections: TrackerSection[];
  caption: string;
};

export type Problems = { errors: string[]; warnings: string[] };

export const folderName = (id: number | string, slug: string) =>
  `idea-${typeof id === "number" ? String(id).padStart(2, "0") : id.toLowerCase()}-${slug}`;

// Where a built idea's code, VO and renders live: video/src/posts/<postFolder>/ etc.
export const postFolder = (idea: Idea) => idea.folder.replace(/^idea-/, "post-");

// Splits a markdown table row on unescaped pipes.
const cells = (row: string) =>
  row
    .trim()
    .replace(/^\||\|$/g, "")
    .split(/(?<!\\)\|/)
    .map((c) => c.trim().replace(/\\\|/g, "|"));

const sectionBody = (body: string, heading: string): string => {
  const m = body.match(new RegExp(`^## ${heading}\\s*$([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, "m"));
  return m ? m[1].trim() : "";
};

export const parseIdea = (folder: string, md: string): Idea => {
  const m = md.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) {
    throw new Error(`${folder}/idea.md: missing --- front matter ---`);
  }
  // JSON schema keeps dates as plain strings.
  const meta = yaml.load(m[1], { schema: yaml.JSON_SCHEMA }) as IdeaMeta;
  const body = m[2];
  const sections = sectionBody(body, "Script")
    .split(/\r?\n/)
    .filter((l) => l.trim().startsWith("|"))
    .slice(2) // header + separator
    .map((l) => {
      const [name, voiceover, visual] = cells(l);
      return { id: name.toLowerCase() as SectionId, voiceover, visual: visual ?? "" };
    });
  return { folder, meta, sections, caption: sectionBody(body, "Caption") };
};

export const spokenWords = (idea: Idea) =>
  idea.sections.reduce((n, s) => n + countWords(s.voiceover), 0);

const isReel = (idea: Idea) => idea.meta.format !== "Carousel";

export const validateIdea = (idea: Idea): Problems => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { meta } = idea;

  for (const key of ["slug", "title", "area", "hook", "source"] as const) {
    if (typeof meta[key] !== "string" || !meta[key].trim()) {
      errors.push(`${key} is required`);
    }
  }
  if (typeof meta.id !== "number" && !/^C\d+$/.test(String(meta.id))) {
    errors.push(`id must be a number (reel) or C<n> (carousel), got ${meta.id}`);
  }
  if (!FORMATS.includes(meta.format)) {
    errors.push(`format must be one of ${FORMATS.join(", ")}`);
  }
  if (!STATUSES.includes(meta.status)) {
    errors.push(`status must be one of ${STATUSES.join(", ")}`);
  }
  if (!Number.isInteger(meta.week)) {
    errors.push("week must be a whole number");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(meta.date)) || Number.isNaN(Date.parse(meta.date))) {
    errors.push(`date must be YYYY-MM-DD, got ${meta.date}`);
  }
  if (!Array.isArray(meta.verify)) {
    errors.push("verify must be a list (use [] when there is nothing to check)");
  }
  if (idea.folder !== folderName(meta.id, meta.slug)) {
    errors.push(`folder should be ${folderName(meta.id, meta.slug)}`);
  }
  if (meta.link !== undefined && !/^https:\/\/\S+$/.test(String(meta.link))) {
    errors.push(`link must be an https:// URL, got ${meta.link}`);
  }
  for (const key of METRIC_KEYS) {
    const v = meta.metrics?.[key];
    if (v !== null && v !== undefined && (typeof v !== "number" || v < 0)) {
      errors.push(`metrics.${key} must be a number >= 0 or null`);
    }
  }

  if (isReel(idea) && meta.status !== "idea") {
    const ids = idea.sections.map((s) => s.id);
    if (ids.join(",") !== SECTION_ORDER.join(",")) {
      errors.push(`Script sections must be ${SECTION_ORDER.join(" > ")}, got ${ids.join(" > ") || "none"}`);
    }
    const vo = (id: SectionId) => idea.sections.find((s) => s.id === id)?.voiceover.trim() ?? "";
    if (!vo("question").endsWith("?")) {
      errors.push('Question must end with "?"');
    }
    if (!vo("congrats").startsWith("Congrats,")) {
      errors.push('Congrats must start with "Congrats," (comma, not "!")');
    }
    if (vo("cta") !== brand.ctaLine) {
      errors.push(`CTA must be exactly "${brand.ctaLine}"`);
    }
    if (idea.sections.some((s) => s.voiceover.includes("!"))) {
      errors.push('Voice-over must not use "!" (the voice over-stresses the word before it)');
    }
    const words = spokenWords(idea);
    if (words < WORD_RANGE.min || words > WORD_RANGE.max) {
      warnings.push(`${words} spoken words, outside the ${WORD_RANGE.min}-${WORD_RANGE.max} target`);
    }
    if (!idea.caption) {
      warnings.push("no ## Caption section");
    }
  }
  if (meta.status === "posted" && !meta.link) {
    warnings.push("posted but link is empty");
  }
  if (meta.status === "posted" && meta.metrics?.reach == null) {
    warnings.push("posted but metrics.reach is empty");
  }
  return { errors, warnings };
};

export type Rates = { engagement: number; shareSave: number; followsPer1k: number };

// Same formulas as the old spreadsheet; empty counts are treated as 0.
export const rates = (m: Metrics): Rates | null => {
  if (!m.reach) {
    return null;
  }
  const n = (v: number | null) => v ?? 0;
  return {
    engagement: (n(m.likes) + n(m.comments) + n(m.shares) + n(m.saves)) / m.reach,
    shareSave: (n(m.shares) + n(m.saves)) / m.reach,
    followsPer1k: (n(m.follows) / m.reach) * 1000,
  };
};

// Formats need this many posted ideas before they are compared (small samples mislead).
export const MIN_POSTED_TO_COMPARE = 3;

export type FormatSummary = {
  format: IdeaFormat;
  planned: number;
  posted: number;
  avgReach: number | null;
  avgWatchPct: number | null;
  avgShareSave: number | null;
  avgFollowsPer1k: number | null;
};

const avg = (xs: (number | null | undefined)[]) => {
  const v = xs.filter((x): x is number => typeof x === "number");
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
};

export const summarize = (ideas: Idea[]) => {
  const byFormat: FormatSummary[] = FORMATS.map((format) => {
    const all = ideas.filter((p) => p.meta.format === format);
    const live = all.filter((p) => p.meta.status === "posted");
    return {
      format,
      planned: all.length,
      posted: live.length,
      avgReach: avg(live.map((p) => p.meta.metrics.reach)),
      avgWatchPct: avg(live.map((p) => p.meta.metrics.watch_pct)),
      avgShareSave: avg(live.map((p) => rates(p.meta.metrics)?.shareSave)),
      avgFollowsPer1k: avg(live.map((p) => rates(p.meta.metrics)?.followsPer1k)),
    };
  });
  const eligible = byFormat.filter((f) => f.posted >= MIN_POSTED_TO_COMPARE);
  const best = (key: "avgWatchPct" | "avgShareSave" | "avgFollowsPer1k") =>
    eligible
      .filter((f) => f[key] !== null)
      .sort((a, b) => (b[key] as number) - (a[key] as number))[0]?.format ?? null;
  const posted = ideas.filter((p) => p.meta.status === "posted").length;
  return {
    planned: ideas.length,
    posted,
    byFormat,
    best: {
      watch: best("avgWatchPct"),
      shareSave: best("avgShareSave"),
      follows: best("avgFollowsPer1k"),
    },
  };
};

const pct = (x: number | null | undefined) => (x == null ? "-" : `${(x * 100).toFixed(1)}%`);
const num = (x: number | null | undefined, digits = 0) =>
  x == null ? "-" : x.toLocaleString("en-US", { maximumFractionDigits: digits });


// Areas group related ideas so new ones go under an existing theme instead of repeating
// a topic. Alphabetical, with the catch-all "Mixed" last.
export const groupByArea = (ideas: Idea[]) => {
  const areas = [...new Set(ideas.map((i) => i.meta.area))].sort((a, b) =>
    a === "Mixed" ? 1 : b === "Mixed" ? -1 : a.localeCompare(b),
  );
  return areas.map((area) => ({
    area,
    ideas: ideas.filter((i) => i.meta.area === area).sort((a, b) => a.meta.date.localeCompare(b.meta.date)),
  }));
};

export const renderIndex = (ideas: Idea[], wordsPerSecond: number): string => {
  const s = summarize(ideas);
  const live = [...ideas]
    .filter((i) => i.meta.status === "posted")
    .sort((a, b) => a.meta.date.localeCompare(b.meta.date));
  const link = (i: Idea) => `[${i.meta.title}](${i.folder}/idea.md)`;
  const status = (i: Idea) => (i.meta.link ? `[${i.meta.status}](${i.meta.link})` : i.meta.status);

  const groups = groupByArea(ideas).map(({ area, ideas: list }) => {
    const rows = list.map((i) => {
      const scripted = isReel(i) && i.sections.length > 0;
      const words = scripted ? spokenWords(i) : null;
      return `| ${i.meta.id} | ${i.meta.date} | ${i.meta.week} | ${i.meta.format} | ${link(i)} | ${status(i)} | ${num(words)} | ${words == null ? "-" : Math.round(words / wordsPerSecond)} |`;
    });
    return `### ${area} (${list.length})

| ID | Date | Wk | Format | Idea | Status | Words | Est. s |
|---|---|---|---|---|---|---|---|
${rows.join("\n")}`;
  });
  const perf = live.map((i) => {
    const m = i.meta.metrics;
    const r = rates(m);
    return `| ${i.meta.id} | ${link(i)} | ${i.meta.link ? `[watch](${i.meta.link})` : "-"} | ${num(m.reach)} | ${m.watch_pct == null ? "-" : `${m.watch_pct}%`} | ${pct(r?.engagement)} | ${pct(r?.shareSave)} | ${num(r?.followsPer1k, 1)} |`;
  });
  const formats = s.byFormat.map(
    (f) =>
      `| ${f.format} | ${f.planned} | ${f.posted} | ${num(f.avgReach)} | ${f.avgWatchPct == null ? "-" : `${f.avgWatchPct.toFixed(1)}%`} | ${pct(f.avgShareSave)} | ${num(f.avgFollowsPer1k, 1)} |`,
  );
  const best = (f: IdeaFormat | null) => f ?? `- (needs ${MIN_POSTED_TO_COMPARE} posted per format)`;

  return `# Ideas

<!-- Generated by \`npm run tracker\` (from video/) out of ideas/*/idea.md. Edit the idea files, not this file. -->

This folder is the content tracker. Each idea has a folder \`idea-NN-slug\`, where \`NN\` is its ID (zero-padded; carousels use \`c1\`, \`c2\`...). Once an idea is built it becomes a post, and its code, voice-over and renders use the matching \`post-NN-slug\` name:

| Where | Example |
|---|---|
| Plan, script, caption, link, metrics | \`ideas/idea-02-gps/idea.md\` |
| Video code | \`video/src/posts/post-02-gps/\` |
| Voice-over + captions | \`video/public/posts/post-02-gps/\` |
| Studio composition | \`Post02-Gps\` |
| Renders | \`video/out/post-02-gps.master.mp4\` |

**To update:** edit the front matter in an \`idea.md\` (status, date, \`link\` and metrics after posting), then run \`npm run tracker\` from \`video/\`. It checks every idea and rewrites this page.

**To add an idea:** check its area below first so you don't repeat a topic, then create \`idea-NN-slug/idea.md\` (copy an \`idea\`-status one) and set \`area\` to an existing area name. Only start a new area when nothing fits.

## Ideas by area

${groups.join("\n\n")}

Est. s assumes ${wordsPerSecond} words/s; the real length comes from the voice-over.

## Performance

${
  perf.length
    ? `| ID | Idea | Post | Reach | Watch % | Engagement | Share + save | Follows / 1k |
|---|---|---|---|---|---|---|---|
${perf.join("\n")}`
    : "Nothing posted yet."
}

## Summary

Posted ${s.posted} of ${s.planned} ideas (${s.planned ? Math.round((s.posted / s.planned) * 100) : 0}%).

| Format | Ideas | Posted | Avg reach | Avg watch % | Avg share + save | Avg follows / 1k |
|---|---|---|---|---|---|---|
${formats.join("\n")}

**Best format so far:** by watch time ${best(s.best.watch)}; by share + save rate ${best(s.best.shareSave)}; by follows per 1k reach ${best(s.best.follows)}.

Decision checkpoint: once about 12-15 ideas are posted, shift the mix toward the format that wins on watch time, shares/saves and follows. Small samples mislead, so formats are only compared once each has at least ${MIN_POSTED_TO_COMPARE} posted.

## Legend

- **Formats:** E = pure explainer (saves, shares, authority). F = explainer + failure story (reach, watch time). Q = quick myth / fact (fast to make on busy days). Carousel = saveable cheat sheet (saves, shares; not built in this repo yet).
- **Status:** idea → scripted (script approved) → built (Remotion reel + VO done, now a post) → rendered (master MP4 exported) → posted (add \`link\`, fill in metrics). A posted idea's status links to the live post.
- **Metrics:** \`watch_pct\` is average watch time as % of video length. Engagement = (likes + comments + shares + saves) / reach. Share + save = (shares + saves) / reach. Follows / 1k = follows / reach × 1000.
- **Schedule:** dates assume a Monday 2 Nov 2026 start (reels Mon/Tue/Thu/Fri, carousel Wed). Change \`date\` in an idea to move it.
`;
};
