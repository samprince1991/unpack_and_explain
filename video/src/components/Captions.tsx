import type { Caption } from "@remotion/captions";
import { useMemo } from "react";
import { AbsoluteFill, Sequence, interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout } from "../brand/layout";
import { clamp } from "../brand/motion";
import { colors, typeScale, withAlpha } from "../brand/tokens";
import { toCaptionPages, type CaptionPage as Page } from "../templates/captionPages";

// How long a page may linger after its last word before a pause clears it.
const LINGER_MS = 500;

const CaptionPage: React.FC<{ page: Page }> = ({ page }) => {
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
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        whiteSpace: "pre-wrap",
        fontFamily: fonts.body,
        fontWeight: weights.bodySemibold,
        fontSize: typeScale.caption,
        lineHeight: 1.2,
        textShadow: `0 4px 24px ${withAlpha(colors.bg.base, 0.9)}`,
        translate: interpolate(frame, [0, 4], ["0px 12px", "0px 0px"], clamp),
      }}
    >
      {/* Line breaks come from toCaptionPages (balanced, phrase-aware), not the browser. */}
      {page.lines.map((line, l) => (
        <div key={l}>
          {line.map((token, i) => {
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
        </div>
      ))}
    </div>
  );
};

export const Captions: React.FC<{ captions: Caption[] }> = ({ captions }) => {
  const { fps } = useVideoConfig();
  const pages = useMemo(() => toCaptionPages(captions), [captions]);

  return (
    <AbsoluteFill>
      {pages.map((page, i) => {
        const next = pages[i + 1] ?? null;
        const from = Math.round((page.startMs / 1000) * fps);
        const endMs = Math.min(
          next ? next.startMs : Infinity,
          page.endMs + LINGER_MS,
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
