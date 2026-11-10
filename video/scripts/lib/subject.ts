// Plain-text "one subject" checks on idea.md scripts: the question card names the topic, the
// setup opens on it (docs/superpowers/specs/2026-11-10-one-subject-reels-design.md).

const ARTICLES = new Set(["a", "an", "the"]);
// A setup may open by pointing back at the subject the hook just named.
const BACK_REFERENCES = new Set(["it", "its", "it's", "this", "that", "that's", "they", "these", "those"]);

// Lower-case words; dots stay inside names (SR.N4) but not at the end of a word.
const tokens = (text: string) =>
  (text.toLowerCase().match(/[a-z0-9.']+/g) ?? []).map((w) => w.replace(/^'+|'+$/g, "").replace(/\.+$/, "")).filter(Boolean);

// Singular/plural tolerance: "ships"/"ship", "planes"/"plane", "taxis"/"taxi",
// "batteries"/"battery", "boxes"/"box" compare equal.
const stem = (w: string) => {
  if (w.endsWith("ies") && w.length > 4) return `${w.slice(0, -3)}y`;
  if (/(ss|x|z|ch|sh)es$/.test(w)) return w.slice(0, -2);
  if (w.endsWith("s") && !w.endsWith("ss") && w.length > 3) return w.slice(0, -1);
  return w;
};

export const topicWords = (topic: string) => tokens(topic).filter((w) => !ARTICLES.has(w));

// True when every topic word (articles aside) appears in the text as a whole word.
export const mentionsTopic = (text: string, topic: string): boolean => {
  const have = new Set(tokens(text).map(stem));
  const need = topicWords(topic).map(stem);
  return need.length > 0 && need.every((w) => have.has(w));
};

// Up to the first ".", "?" or ":" that ends a word (so "SR.N4" doesn't end a sentence), after
// any MYTH: / FACT: stamp label that opens a Q post's line.
export const firstSentence = (text: string) => {
  const line = text.trim().replace(/^(myth|fact):\s*/i, "");
  return line.match(/^[\s\S]*?[.?:](?=\s|$)/)?.[0] ?? line;
};

export const opensOnTopic = (text: string, topic: string): boolean => {
  const first = firstSentence(text);
  return mentionsTopic(first, topic) || BACK_REFERENCES.has(tokens(first)[0] ?? "");
};
