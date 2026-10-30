import yaml from "js-yaml";
import { brand } from "../../src/brand/tokens";
import { countWords } from "../../src/templates/timing";
import { SECTION_ORDER, type SectionId } from "../../src/templates/types";
import { WORD_RANGE } from "../../src/templates/validate";

// The content tracker: one ideas/idea-NN-slug/idea.md per idea (YAML front matter +
// script). `npm run tracker` validates them and writes ideas/README.md. Once an idea is
// built it becomes a post: its code, VO and renders use post-NN-slug (see postFolder).

export const STATUSES = ["idea", "scripted", "built", "rendered", "posted"] as const;
export const FORMATS = ["E", "F", "Q"] as const;
export const METRIC_KEYS = ["reach", "watch_pct", "likes", "comments", "shares", "saves", "follows"] as const;

export type Status = (typeof STATUSES)[number];
export type IdeaFormat = (typeof FORMATS)[number];
export type Metrics = Record<(typeof METRIC_KEYS)[number], number | null>;

export type IdeaMeta = {
  id: number;
  slug: string;
  title: string;
  format: IdeaFormat;
  category: string;
  subcategory: string;
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

// ideas/categories.yml: category -> sub-categories, in README order.
export type Taxonomy = { category: string; subcategories: string[] }[];

export const parseTaxonomy = (text: string): Taxonomy => {
  const raw = yaml.load(text, { schema: yaml.JSON_SCHEMA });
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    throw new Error("categories.yml must map each category to a list of sub-categories");
  }
  return Object.entries(raw as Record<string, unknown>).map(([category, subs]) => {
    if (!Array.isArray(subs) || !subs.length || subs.some((x) => typeof x !== "string")) {
      throw new Error(`categories.yml: ${category} needs a list of sub-category names`);
    }
    return { category, subcategories: subs as string[] };
  });
};

export const folderName = (id: number, slug: string) => `idea-${String(id).padStart(2, "0")}-${slug}`;

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

export const validateIdea = (idea: Idea, taxonomy: Taxonomy): Problems => {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { meta } = idea;

  for (const key of ["slug", "title", "category", "subcategory", "hook", "source"] as const) {
    if (typeof meta[key] !== "string" || !meta[key].trim()) {
      errors.push(`${key} is required`);
    }
  }
  if (!Number.isInteger(meta.id) || meta.id < 1) {
    errors.push(`id must be a whole number, got ${meta.id}`);
  }
  const cat = taxonomy.find((c) => c.category === meta.category);
  if (meta.category && !cat) {
    errors.push(`category "${meta.category}" is not in ideas/categories.yml`);
  } else if (cat && meta.subcategory && !cat.subcategories.includes(meta.subcategory)) {
    errors.push(`subcategory "${meta.subcategory}" is not listed under ${meta.category} in ideas/categories.yml`);
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

  if (meta.status !== "idea") {
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
