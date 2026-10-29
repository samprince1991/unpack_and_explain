import { createTikTokStyleCaptions, type Caption, type TikTokPage } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp } from "../brand/motion";
import { colors, typeScale, withAlpha } from "../brand/tokens";

// Higher = more words per page. ~1 s keeps pages to ~3 words, mostly one line.
const SWITCH_CAPTIONS_EVERY_MS = 1000;
// How long a page may linger after its last word before a pause clears it.
const LINGER_MS = 500;

const CaptionPage: React.FC<{ page: TikTokPage }> = ({ page }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const absoluteTimeMs = page.startMs + (frame / fps) * 1000;
  const { captions } = layout.regions;

  return (
    <div
      style={{
        position: "absolute",
        left: layout.column.x,
        top: captions.top,
        width: layout.column.width,
        height: captions.bottom - captions.top,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "pre-wrap",
        // Even line lengths when a page wraps (no single orphan word on line 2).
        textWrap: "balance",
        fontFamily: fonts.body,
        fontWeight: weights.bodySemibold,
        fontSize: typeScale.caption,
        lineHeight: 1.2,
        textShadow: `0 4px 24px ${withAlpha(colors.bg.base, 0.9)}`,
        translate: interpolate(frame, [0, 4], ["0px 12px", "0px 0px"], clamp),
      }}
    >
      <span>
        {page.tokens.map((token, i) => {
          const active = token.fromMs <= absoluteTimeMs && token.toMs > absoluteTimeMs;
          return (
            <span
              key={`${token.fromMs}-${i}`}
              style={{ color: active ? colors.amber[500] : colors.text.primary }}
            >
              {token.text}
            </span>
          );
        })}
      </span>
    </div>
  );
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const { pages } = useMemo(
    () =>
      createTikTokStyleCaptions({
        captions,
        combineTokensWithinMilliseconds: SWITCH_CAPTIONS_EVERY_MS,
      }),
    [captions],
  );

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = Math.min(
          next ? next.startMs : Infinity,
          page.startMs + page.durationMs + LINGER_MS,
        );
        const durationInFrames = Math.round((endMs / 1000) * fps) - from;
        if (durationInFrames <= 0) {
          return null;
        }
        return (
          <Sequence key={`${page.startMs}-${i}`} from={from} durationInFrames={durationInFrames}>
            <CaptionPage page={page} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};
