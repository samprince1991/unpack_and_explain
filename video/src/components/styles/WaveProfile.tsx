import { useCurrentFrame } from "remotion";
import { colors } from "../../brand/tokens";
import { enterProgress } from "../motion/progress";

// Where the hull sits (frame coordinates). `stem` = x where the bow meets the water,
// `surface` = still water line, `deck` = deck height at the stern end (it rises toward
// the bow), `keel` = bottom of the hull. The hull runs off the left edge of the box.
export type WaveBox = {
  left: number;
  right: number;
  stem: number;
  surface: number;
  deck: number;
  keel: number;
};

// A bulb under the bow: `length` and `radius` in px, `dx` / `dy` offset it (slide it
// away), `opacity` fades it, `accent` makes it the amber key.
export type WaveBulb = {
  length: number;
  radius: number;
  dx?: number;
  dy?: number;
  opacity?: number;
  accent?: boolean;
};

const SHEER = 46; // deck rises this much toward the bow
const RAKE = 0.32; // stem leans forward this much per px of height
const STEP = 10;
const RIPPLE = 5;
const CREST = 70; // full bow-wave height (px)

// Stem x at height y (it rakes forward with height).
const stemAt = (b: WaveBox, y: number) => b.stem + (b.surface - y) * RAKE;

// Points to place things: bow top, forefoot, and the bulb's anchor below the water.
export const waveProfilePoints = (b: WaveBox) => {
  const bulbY = b.surface + (b.keel - b.surface) * 0.55;
  return {
    bowTop: { x: stemAt(b, b.deck - SHEER), y: b.deck - SHEER },
    forefoot: { x: stemAt(b, b.keel), y: b.keel },
    bulb: { x: stemAt(b, bulbY), y: bulbY },
    crest: { x: b.stem, y: b.surface - CREST },
  };
};

const hullPath = (b: WaveBox) => {
  const top = b.deck - SHEER;
  const left = b.left - 60;
  const bottomEnd = stemAt(b, b.keel);
  return [
    `M ${left} ${b.deck}`,
    // sheer: the deck sweeps up toward the bow
    `C ${left + (b.stem - left) * 0.55} ${b.deck} ${b.stem - 80} ${top + 8} ${stemAt(b, top)} ${top}`,
    `L ${bottomEnd} ${b.keel - 30}`,
    `Q ${bottomEnd - 4} ${b.keel} ${bottomEnd - 40} ${b.keel}`,
    `L ${left} ${b.keel}`,
    "Z",
  ].join(" ");
};

// Water height offset at x: the bow wave (crest at the stem, trough behind it).
const bowWave = (b: WaveBox, x: number, crest: number) => {
  const d = (x - b.stem) / 90;
  const t = (x - (b.stem - 210)) / 110;
  return -crest * CREST * (Math.exp(-d * d) - 0.5 * Math.exp(-t * t));
};

const waterPath = (b: WaveBox, crest: number, phase: number, from: number, to: number) => {
  const pts: string[] = [];
  for (let x = from; x <= to; x += STEP) {
    const y = b.surface + Math.sin(x / 40 + phase) * RIPPLE + bowWave(b, x, crest);
    pts.push(`${pts.length ? "L" : "M"} ${x} ${y.toFixed(1)}`);
  }
  return pts.join(" ");
};

const bulbPath = (b: WaveBox, bulb: WaveBulb) => {
  const { bulb: anchor } = waveProfilePoints(b);
  const x0 = anchor.x - 6 + (bulb.dx ?? 0);
  const y = anchor.y + (bulb.dy ?? 0);
  const r = bulb.radius;
  const neck = r * 0.45;
  const swell = x0 + bulb.length * 0.35;
  const tip = x0 + bulb.length;
  return [
    `M ${x0} ${y - neck}`,
    `C ${x0 + 20} ${y - neck} ${swell - 30} ${y - r} ${swell} ${y - r}`,
    `C ${tip - r * 0.4} ${y - r} ${tip} ${y - r * 0.55} ${tip} ${y}`,
    `C ${tip} ${y + r * 0.55} ${tip - r * 0.4} ${y + r} ${swell} ${y + r}`,
    `C ${swell - 30} ${y + r} ${x0 + 20} ${y + neck} ${x0} ${y + neck}`,
    "Z",
  ].join(" ");
};

type WaveProfileProps = {
  box: WaveBox;
  // Bow-wave height, 0 (calm) to 1 (full crest). Animate it from the scene.
  crest?: number;
  // Draws the crest in amber: the key element of the beat.
  crestAccent?: boolean;
  bulbs?: WaveBulb[];
  // Frame the drawing enters.
  at?: number;
};

// Side view of a ship's bow at the waterline: the hull (running off the left edge) with a
// raked stem, a moving water line that can pile up into a bow wave, the water body in
// front, and optional bulbs under the bow. Neutral line art; the amber key is the crest
// (`crestAccent`), a bulb (`accent`) or something the scene adds on top. SVG, for use
// inside SceneCanvas.
export const WaveProfile: React.FC<WaveProfileProps> = ({
  box,
  crest = 0,
  crestAccent = false,
  bulbs = [],
  at = 0,
}) => {
  const frame = useCurrentFrame();
  const shown = enterProgress(frame, at);
  // The water runs past the hull (the ship is moving forward).
  const phase = frame * 0.12;
  const water = waterPath(box, crest, phase, box.left - 20, box.right + 20);
  const crestLine = waterPath(box, crest, phase, box.stem - 130, box.stem + 80);
  const bob = Math.sin(frame / 14) * 3;

  return (
    <g opacity={shown} style={{ translate: `0 ${(1 - shown) * 16}px` }}>
      <g style={{ translate: `0 ${bob}px` }}>
        <path d={hullPath(box)} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} strokeLinejoin="round" />
      </g>
      {/* water in front of the hull below the line, so the underwater part reads submerged */}
      <path
        d={`${water} L ${box.right + 20} ${box.keel + 120} L ${box.left - 20} ${box.keel + 120} Z`}
        fill={colors.bg.base}
        opacity={0.45}
      />
      {/* bulbs over the tint: the bow's own part, and often the amber key */}
      <g style={{ translate: `0 ${bob}px` }}>
          {bulbs.map((bulb, i) => (
            <path
              key={i}
              d={bulbPath(box, bulb)}
              opacity={bulb.opacity ?? 1}
              fill={colors.diagram.fill}
              stroke={bulb.accent ? colors.amber[500] : colors.diagram.stroke}
              strokeWidth={5}
              strokeLinejoin="round"
            />
          ))}
      </g>
      <path d={water} fill="none" stroke={colors.diagram.soft} strokeWidth={5} strokeLinecap="round" />
      {crestAccent && crest > 0.05 ? (
        <path d={crestLine} fill="none" stroke={colors.amber[500]} strokeWidth={7} strokeLinecap="round" />
      ) : null}
    </g>
  );
};
