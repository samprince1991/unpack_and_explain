import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { colors } from "../brand/tokens";
import type { Format } from "../templates/types";
import { AmbientWaves } from "./AmbientWaves";

const GRID = 90;
const DOT_GAP = 60;
// Frames for the Q pulse band to sweep the frame once.
const PULSE_FRAMES = 150;

// F (failure): faint blueprint grid drifting diagonally, an incident-report feel.
const BlueprintGrid: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const shift = (frame * 0.3) % GRID;
  return (
    <AbsoluteFill style={{ opacity: 0.3 }}>
      <svg width={width} height={height}>
        <defs>
          <pattern
            id="motif-grid"
            width={GRID}
            height={GRID}
            patternUnits="userSpaceOnUse"
            x={shift}
            y={shift}
          >
            <path
              d={`M ${GRID} 0 L 0 0 0 ${GRID}`}
              fill="none"
              stroke={colors.diagram.faint}
              strokeWidth={2}
            />
          </pattern>
        </defs>
        <rect width={width} height={height} fill="url(#motif-grid)" />
      </svg>
    </AbsoluteFill>
  );
};

const Dots: React.FC<{ id: string }> = ({ id }) => {
  const { width, height } = useVideoConfig();
  return (
    <svg width={width} height={height}>
      <defs>
        <pattern id={id} width={DOT_GAP} height={DOT_GAP} patternUnits="userSpaceOnUse">
          <circle cx={DOT_GAP / 2} cy={DOT_GAP / 2} r={3} fill={colors.diagram.faint} />
        </pattern>
      </defs>
      <rect width={width} height={height} fill={`url(#${id})`} />
    </svg>
  );
};

// Q (myth / fact): dot grid with a brighter band sweeping down through it.
const PulseDots: React.FC = () => {
  const frame = useCurrentFrame();
  const band = ((frame % PULSE_FRAMES) / PULSE_FRAMES) * 140 - 20;
  const mask = `linear-gradient(to bottom, transparent ${band - 20}%, black ${band}%, transparent ${band + 20}%)`;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.22 }}>
        <Dots id="motif-dots" />
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: 0.5, maskImage: mask, WebkitMaskImage: mask }}>
        <Dots id="motif-dots-pulse" />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Format signature: the background texture tells the viewer what kind of reel this is
// before the voice-over does. Always barely visible.
export const AmbientMotif: React.FC<{ format: Format }> = ({ format }) =>
  format === "F" ? <BlueprintGrid /> : format === "Q" ? <PulseDots /> : <AmbientWaves />;
