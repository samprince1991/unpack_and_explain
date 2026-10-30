import { AbsoluteFill, Series } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { colors, typeScale } from "../brand/tokens";
import { AmbientMotif } from "../components/AmbientMotif";
import { Background } from "../components/Background";
import { HookTitle } from "../components/HookTitle";
import { QuestionCard } from "../components/QuestionCard";
import { HOOK_STYLES, QUESTION_STYLES } from "../templates/look";
import type { Format } from "../templates/types";

const FRAMES = 60;
const FORMATS: Format[] = ["E", "F", "Q"];

const Label: React.FC<{ text: string }> = ({ text }) => (
  <div
    style={{
      position: "absolute",
      left: layout.column.x,
      width: layout.column.width,
      top: layout.regions.captions.top,
      textAlign: "center",
      fontFamily: fonts.body,
      fontWeight: weights.bodySemibold,
      fontSize: typeScale.label,
      color: colors.text.muted,
    }}
  >
    {text}
  </div>
);

// Every per-post look slot (question card, hook title) and every format's background motif.
export const KitLooks: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      {QUESTION_STYLES.map((s) => (
        <Series.Sequence key={`q-${s}`} durationInFrames={FRAMES}>
          <QuestionCard
            question="Do you know how vibe coding actually works?"
            topic="vibe coding"
            variant={s}
          />
          <Label text={`question: ${s}`} />
        </Series.Sequence>
      ))}
      {HOOK_STYLES.map((s) => (
        <Series.Sequence key={`h-${s}`} durationInFrames={FRAMES}>
          <HookTitle text="No code needed in 2026" highlight="code" variant={s} />
          <Label text={`hook: ${s}`} />
        </Series.Sequence>
      ))}
      {FORMATS.map((f) => (
        <Series.Sequence key={`m-${f}`} durationInFrames={FRAMES * 2}>
          <AmbientMotif format={f} />
          <Label text={`motif: ${f}`} />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const kitLooksFrames =
  (QUESTION_STYLES.length + HOOK_STYLES.length) * FRAMES + FORMATS.length * FRAMES * 2;
