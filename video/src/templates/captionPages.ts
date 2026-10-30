import type { Caption } from "@remotion/captions";

// Phrase-aware caption paging. Pages break at sentence ends, section ends and pauses,
// long sentences split into balanced chunks (preferring commas), and each page is split
// into at most two balanced lines. Breaks after weak words ("make me a" / "habit tracker"),
// inside quotes and one-word pages are penalised, so every line reads as a phrase.

export type CaptionToken = { text: string; fromMs: number; toMs: number };
export type CaptionPage = { startMs: number; endMs: number; lines: CaptionToken[][] };

// Widths are in "average characters" (0.57 em of Inter SemiBold), so narrow letters and
// spaces count less than "m" or capitals. One line fits ~740 px of the 780 px column
// at 64 px (typeScale.caption): 740 / (64 * 0.57) = 20. Calibrated against a render.
export const LINE_CHARS = 20;
// A page holds up to two lines.
export const PAGE_CHARS = 34;
// A gap this long between words always starts a new page.
const PAUSE_MS = 600;

// Cost weights for the break search. Higher = avoided more.
const PAGE_COST = 800;
// A bad line wrap inside a page hurts less than the same break between pages.
const WRAP_WEIGHT = 0.5;
// Breaking between two content words ("timing / signals") vs just before a link word
// ("timing signals / and their positions").
const MID_CLAUSE_COST = 300;
const BEFORE_LINK_COST = 50;
const WEAK_END_COST = 400;
// A quote split across pages is much worse than a quote wrapping inside one page.
const QUOTE_PAGE_COST = 1200;
const QUOTE_LINE_COST = 150;
const ONE_WORD_COST = 600;
// A page that needs three lines.
const OVERFULL_COST = 2000;

const WEAK_WORDS = new Set(
  (
    "a an the to of in on at for from by with as into onto about " +
    "and or but nor so if then than when while that which who what how why " +
    "it its it's is are was be i you we they he she my your our their this these those " +
    "not no don't doesn't can't won't can will just very one"
  ).split(" "),
);

const word = (t: CaptionToken) => t.text.trim();
const bare = (t: CaptionToken) =>
  word(t)
    .toLowerCase()
    .replace(/^['"‘“]+|['"’”.,?!;:]+$/g, "")
    .replace(/’/g, "'");
const endsSentence = (t: CaptionToken) => /[.?!;:]['"’”]*$/.test(word(t));
const endsClause = (t: CaptionToken) => /[,.?!;:]['"’”]*$/.test(word(t));
const opensQuote = (t: CaptionToken) => /^['"‘“]/.test(word(t));
const closesQuote = (t: CaptionToken) => /['"’”][.,?!;:]*$/.test(word(t));

// Approximate Inter SemiBold advance widths in em.
const glyphEm = (ch: string): number => {
  if (/[ .,:;'’!|ijl]/.test(ch)) return 0.27;
  if (/[frt"“”()-]/.test(ch)) return 0.38;
  if (/[mw]/.test(ch)) return 0.86;
  if (/[MW]/.test(ch)) return 0.92;
  if (/[A-Z]/.test(ch)) return 0.68;
  if (/[0-9]/.test(ch)) return 0.62;
  return 0.56;
};

export const textWidth = (text: string): number =>
  [...text].reduce((sum, ch) => sum + glyphEm(ch), 0) / 0.57;

const chars = (tokens: CaptionToken[]) => textWidth(tokens.map(word).join(" "));

// insideQuote[i]: a quote is still open after token i.
const quoteState = (tokens: CaptionToken[]): boolean[] => {
  let open = false;
  return tokens.map((t) => {
    // "'make" opens, "app'," closes, "'hi'" opens and closes.
    if (!open && opensQuote(t)) {
      open = !(word(t).length > 1 && closesQuote(t));
    } else if (open && closesQuote(t)) {
      open = false;
    }
    return open;
  });
};

// Cost of breaking after token i (not at the end of the run).
const breakCost = (
  tokens: CaptionToken[],
  i: number,
  inQuote: boolean[],
  quoteCost: number,
): number => {
  const t = tokens[i];
  let cost = 0;
  if (!endsClause(t)) {
    const weak = WEAK_WORDS.has(bare(t));
    const beforeLink = !weak && i + 1 < tokens.length && WEAK_WORDS.has(bare(tokens[i + 1]));
    cost += beforeLink ? BEFORE_LINK_COST : MID_CLAUSE_COST;
    if (weak) {
      cost += WEAK_END_COST;
    }
  }
  if (inQuote[i]) {
    cost += quoteCost;
  }
  return cost;
};

// Split tokens into chunks of at most maxChars, minimising: chunk count (chunkCost each),
// imbalance (sum of squared lengths), bad break points and one-word chunks (fine when
// a leading word ends a clause: "Congrats," / "you just learned").
// A single word longer than maxChars gets its own chunk. extraCost adds a per-chunk cost
// (pages add how badly they wrap into lines).
export const splitBalanced = (
  tokens: CaptionToken[],
  maxChars: number,
  chunkCost: number,
  quoteCost: number,
  extraCost: (chunk: CaptionToken[]) => number = () => 0,
): CaptionToken[][] => {
  const n = tokens.length;
  if (n === 0) {
    return [];
  }
  const inQuote = quoteState(tokens);
  const oneWordCost = (start: number, end: number) =>
    end - start === 1 && n > 1 && !(end < n && endsClause(tokens[start])) ? ONE_WORD_COST : 0;
  const best: number[] = [0, ...Array<number>(n).fill(Infinity)];
  const from: number[] = Array<number>(n + 1).fill(0);
  for (let end = 1; end <= n; end++) {
    for (let start = end - 1; start >= 0; start--) {
      const len = chars(tokens.slice(start, end));
      if (len > maxChars && end - start > 1) {
        break;
      }
      const cost =
        best[start] +
        chunkCost +
        len * len +
        oneWordCost(start, end) +
        (end < n ? breakCost(tokens, end - 1, inQuote, quoteCost) : 0) +
        extraCost(tokens.slice(start, end));
      if (cost < best[end]) {
        best[end] = cost;
        from[end] = start;
      }
    }
  }
  const chunks: CaptionToken[][] = [];
  for (let end = n; end > 0; end = from[end]) {
    chunks.unshift(tokens.slice(from[end], end));
  }
  return chunks;
};

// Runs of words that must never share a page: sentences, sections, pauses.
const hardRuns = (captions: Caption[]): CaptionToken[][] => {
  const runs: CaptionToken[][] = [];
  let run: CaptionToken[] = [];
  captions.forEach((c, i) => {
    const token = { text: c.text, fromMs: c.startMs, toMs: c.endMs };
    run.push(token);
    const next = captions[i + 1];
    const pause = next ? next.startMs - c.endMs >= PAUSE_MS : true;
    if (!next || c.pageBreakAfter || endsSentence(token) || pause) {
      runs.push(run);
      run = [];
    }
  });
  return runs;
};

// Lines keep their leading-space tokens; the first token of each line is trimmed.
const asLine = (tokens: CaptionToken[]): CaptionToken[] =>
  tokens.map((t, i) => (i === 0 ? { ...t, text: t.text.trimStart() } : t));

// One line when it fits, else the balanced split. The huge chunk cost means it never
// makes more lines than the width needs.
const splitLines = (page: CaptionToken[]): CaptionToken[][] =>
  chars(page) <= LINE_CHARS ? [page] : splitBalanced(page, LINE_CHARS, 10_000, QUOTE_LINE_COST);

// How badly a page wraps: the break penalties of its line split.
const wrapCost = (page: CaptionToken[]): number => {
  const lines = splitLines(page);
  if (lines.length > 2) {
    return OVERFULL_COST;
  }
  if (lines.length === 1) {
    return 0;
  }
  const i = lines[0].length - 1;
  const oneWord = lines.some((l, n) => l.length === 1 && !(n === 0 && endsClause(l[0])));
  return (
    WRAP_WEIGHT *
    (breakCost(page, i, quoteState(page), QUOTE_LINE_COST) + (oneWord ? ONE_WORD_COST : 0))
  );
};

export const toCaptionPages = (captions: Caption[]): CaptionPage[] =>
  hardRuns(captions)
    .flatMap((run) => splitBalanced(run, PAGE_CHARS, PAGE_COST, QUOTE_PAGE_COST, wrapCost))
    .map((page) => {
      const lines = splitLines(page);
      return {
        startMs: page[0].fromMs,
        endMs: page[page.length - 1].toMs,
        lines: lines.map(asLine),
      };
    });
