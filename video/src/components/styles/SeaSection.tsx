import { useCurrentFrame } from "remotion";
import { colors } from "../../brand/tokens";
import { enterProgress } from "../motion/progress";

// Box the section is drawn in (frame coordinates). `land` = top of the two coasts,
// `surface` = water line, `seabed` = ocean floor, `bottom` = where the ground ends.
export type SeaBox = {
  left: number;
  right: number;
  land: number;
  surface: number;
  seabed: number;
  bottom: number;
};

const WAVE_STEP = 20;
const WAVE_AMP = 6;

// Coast x positions: where each coast starts falling (shelf) and reaches the seabed (foot).
export const seaCoasts = (b: SeaBox) => {
  const w = b.right - b.left;
  return {
    leftShelf: b.left + w * 0.18,
    leftFoot: b.left + w * 0.36,
    rightFoot: b.right - w * 0.36,
    rightShelf: b.right - w * 0.18,
  };
};

const slope = (x0: number, y0: number, x1: number, y1: number) => {
  const dx = x1 - x0;
  return `C ${x0 + dx * 0.45} ${y0} ${x1 - dx * 0.45} ${y1} ${x1} ${y1}`;
};

// A cable laid from one coast, down the slope, along the seabed and up the other coast.
// `lift` raises it off the seabed (px) and `landLift` off the coasts, so a second cable
// can run above the first in the deep water and still land on the same shore.
export const seaCable = (b: SeaBox, lift = 8, landLift = Math.min(lift, 12)): string => {
  const c = seaCoasts(b);
  const w = b.right - b.left;
  const top = b.land - landLift;
  const deep = b.seabed - lift;
  return [
    `M ${b.left + w * 0.08} ${top}`,
    `L ${c.leftShelf} ${top}`,
    slope(c.leftShelf, top, c.leftFoot, deep),
    `L ${c.rightFoot} ${deep}`,
    slope(c.rightFoot, deep, c.rightShelf, top),
    `L ${b.right - w * 0.08} ${top}`,
  ].join(" ");
};

// The same cable cut at `atX` (on the flat seabed) with a `gap` (px) between the two
// ends: [left half, right half]. Use for a break; gap 0 reads as one whole cable.
export const seaCableSplit = (b: SeaBox, atX: number, gap: number, lift = 8): [string, string] => {
  const c = seaCoasts(b);
  const w = b.right - b.left;
  const y = b.seabed - lift;
  const left = [
    `M ${b.left + w * 0.08} ${b.land - lift}`,
    `L ${c.leftShelf} ${b.land - lift}`,
    slope(c.leftShelf, b.land - lift, c.leftFoot, y),
    `L ${atX - gap / 2} ${y}`,
  ].join(" ");
  const right = [
    `M ${atX + gap / 2} ${y}`,
    `L ${c.rightFoot} ${y}`,
    slope(c.rightFoot, y, c.rightShelf, b.land - lift),
    `L ${b.right - w * 0.08} ${b.land - lift}`,
  ].join(" ");
  return [left, right];
};

const groundPath = (b: SeaBox): string => {
  const c = seaCoasts(b);
  return [
    `M ${b.left} ${b.land}`,
    `L ${c.leftShelf} ${b.land}`,
    slope(c.leftShelf, b.land, c.leftFoot, b.seabed),
    `L ${c.rightFoot} ${b.seabed}`,
    slope(c.rightFoot, b.seabed, c.rightShelf, b.land),
    `L ${b.right} ${b.land}`,
    `L ${b.right} ${b.bottom}`,
    `L ${b.left} ${b.bottom}`,
    "Z",
  ].join(" ");
};

type SeaSectionProps = {
  box: SeaBox;
  // Frame the coasts and the water draw in.
  at: number;
};

// Side view of an ocean between two coasts: the ground (both coasts and the seabed)
// as one shaded shape, and a slowly moving water line. Neutral line art: put the key
// element (a cable, a signal, a ship) on top. Use `seaCable()` for a cable route and
// `seaCoasts()` to place things on the coasts. SVG, for use inside SceneCanvas.
export const SeaSection: React.FC<SeaSectionProps> = ({ box, at }) => {
  const frame = useCurrentFrame();
  const shown = enterProgress(frame, at);
  const phase = frame * 0.08;
  const points: string[] = [];
  for (let x = box.left; x <= box.right; x += WAVE_STEP) {
    const y = box.surface + Math.sin(x / 45 + phase) * WAVE_AMP;
    points.push(`${points.length ? "L" : "M"} ${x} ${y.toFixed(1)}`);
  }

  return (
    <g opacity={shown} style={{ translate: `0 ${(1 - shown) * 16}px` }}>
      <path d={points.join(" ")} fill="none" stroke={colors.diagram.soft} strokeWidth={4} strokeLinecap="round" />
      {/* drawn after the water so the coasts hide the water line over land */}
      <path d={groundPath(box)} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={4} strokeLinejoin="round" />
    </g>
  );
};
