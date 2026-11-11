import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, durations, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { QrGrid } from "../../../components/styles/QrGrid";
import { useCue, useSection } from "../../../templates/SectionContext";
import { QR_MATRIX } from "../qrMatrix";

const CX = 540;
const CY = 730;
const CELL = 25;
const N = QR_MATRIX.length;
const HALF = (N * CELL) / 2;
const PAD = 2 * CELL;
const BAR_W = 560;
const BAR_Y = CY + HALF + PAD + 90;
const LOGO = 5; // logo size in modules, centered

// The torn corner: everything past a diagonal at the bottom right.
const torn = (r: number, c: number) => r + c >= 29;

const BRACKETS = [
  [-1, -1],
  [1, -1],
  [-1, 1],
  [1, 1],
] as const;

// The same QR code with a logo over its middle. On "30" a bar fills to 30% (amber); on
// "missing" the bottom-right corner tears away; on "still" scan brackets lock onto the
// code (amber moves to them) and it still reads.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const thirty = useCue("30", 0.3);
  const missing = useCue("missing", 0.55);
  const still = useCue("still", 0.85);
  const fill = interpolate(frame, [thirty, thirty + durations.draw], [0, 0.3], { ...clamp, easing: ease.out });
  const barAmber = interpolate(frame, [still, still + durations.enter], [1, 0], clamp);
  const x0 = CX - HALF;
  const y0 = CY - HALF;
  const edge = [
    `M ${x0 + 8 * CELL} ${y0 + N * CELL + PAD * 0.6}`,
    `L ${x0 + 12 * CELL} ${y0 + 17 * CELL}`,
    `L ${x0 + 13.5 * CELL} ${y0 + 16.5 * CELL}`,
    `L ${x0 + 16.5 * CELL} ${y0 + 13 * CELL}`,
    `L ${x0 + 17 * CELL} ${y0 + 11 * CELL}`,
    `L ${x0 + N * CELL + PAD * 0.6} ${y0 + 8 * CELL}`,
  ].join(" ");
  const bracket = (sx: number, sy: number) => {
    const x = CX + sx * (HALF + PAD + 26);
    const y = CY + sy * (HALF + PAD + 26);
    return `M ${x} ${y - sy * 90} L ${x} ${y} L ${x - sx * 90} ${y}`;
  };
  return (
    <AbsoluteFill>
      <DustField seed="payoff-14" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <QrGrid matrix={QR_MATRIX} cx={CX} cy={CY} cell={CELL} missing={torn} missingAt={missing} />
          <Interactive.G name="Logo over the middle">
            <rect
              x={CX - (LOGO * CELL) / 2 - 6}
              y={CY - (LOGO * CELL) / 2 - 6}
              width={LOGO * CELL + 12}
              height={LOGO * CELL + 12}
              rx={18}
              fill={colors.diagram.fill}
              stroke={colors.diagram.stroke}
              strokeWidth={4}
            />
            <circle cx={CX} cy={CY} r={(LOGO * CELL) / 2 - 18} fill="none" stroke={colors.diagram.soft} strokeWidth={6} />
          </Interactive.G>
          <Interactive.G name="Torn edge">
            <DrawPath d={edge} at={missing} color={colors.diagram.soft} width={4} dashed />
          </Interactive.G>
          <Interactive.G name="Up to 30% bar">
            <rect
              x={CX - BAR_W / 2}
              y={BAR_Y - 14}
              width={BAR_W}
              height={28}
              rx={14}
              fill={colors.diagram.fill}
              stroke={colors.diagram.faint}
              strokeWidth={3}
            />
            <rect x={CX - BAR_W / 2} y={BAR_Y - 14} width={BAR_W * fill} height={28} rx={14} fill={colors.diagram.soft} />
            <rect
              x={CX - BAR_W / 2}
              y={BAR_Y - 14}
              width={BAR_W * fill}
              height={28}
              rx={14}
              fill={colors.amber[500]}
              opacity={barAmber}
            />
            <Reveal at={thirty + 6}>
              <text
                x={CX - BAR_W / 2 + BAR_W * 0.3 + 24}
                y={BAR_Y + 16}
                fontFamily={fonts.body}
                fontWeight={weights.bodySemibold}
                fontSize={typeScale.label}
                fill={colors.text.primary}
              >
                30%
              </text>
            </Reveal>
          </Interactive.G>
          <Interactive.G name="Scan brackets">
            {BRACKETS.map(([sx, sy]) => (
              <DrawPath key={`${sx}${sy}`} d={bracket(sx, sy)} at={still} color={colors.amber[500]} width={8} />
            ))}
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
