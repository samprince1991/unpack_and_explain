import { colors } from "../brand/tokens";

const bare = (word: string) => word.toLowerCase().replace(/[^a-z0-9']/g, "");

// Renders text with every occurrence of `highlight` (a single word) in amber.
export const HighlightedText: React.FC<{ text: string; highlight: string }> = ({
  text,
  highlight,
}) => {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          style={{
            color: bare(word) === bare(highlight) ? colors.amber[500] : colors.text.primary,
          }}
        >
          {i < words.length - 1 ? `${word} ` : word}
        </span>
      ))}
    </>
  );
};
