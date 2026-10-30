import { Fragment } from "react";
import { colors } from "../brand/tokens";

const bare = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

// Splits `text` into plain runs and highlight matches. `highlight` may be a phrase
// ("vibe coding"); it matches whole words, ignoring case and punctuation.
export const splitHighlight = (text: string, highlight: string) => {
  if (!highlight.trim()) {
    return [{ text, hit: false }];
  }
  const words = text.split(" ");
  const target = highlight.split(" ").map(bare);
  const parts: { text: string; hit: boolean }[] = [];
  let plain: string[] = [];
  let i = 0;
  while (i < words.length) {
    const hit = target.every((t, k) => bare(words[i + k] ?? "") === t);
    if (hit) {
      if (plain.length) {
        parts.push({ text: plain.join(" "), hit: false });
      }
      parts.push({ text: words.slice(i, i + target.length).join(" "), hit: true });
      plain = [];
      i += target.length;
    } else {
      plain.push(words[i]);
      i++;
    }
  }
  if (plain.length) {
    parts.push({ text: plain.join(" "), hit: false });
  }
  return parts;
};

// Renders text with every occurrence of `highlight` in amber. `mark` optionally wraps
// each match (underline, spotlight...).
export const HighlightedText: React.FC<{
  text: string;
  highlight: string;
  mark?: (match: React.ReactNode) => React.ReactNode;
}> = ({ text, highlight, mark = (m) => m }) => {
  const parts = splitHighlight(text, highlight);
  return (
    <>
      {parts.map((part, i) => {
        const space = i < parts.length - 1 ? " " : "";
        return part.hit ? (
          <Fragment key={i}>
            {mark(<span style={{ color: colors.amber[500] }}>{part.text}</span>)}
            {space}
          </Fragment>
        ) : (
          <span key={i} style={{ color: colors.text.primary }}>
            {part.text}
            {space}
          </span>
        );
      })}
    </>
  );
};
