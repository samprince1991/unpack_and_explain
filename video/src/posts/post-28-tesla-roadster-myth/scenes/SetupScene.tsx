import { AbsoluteFill, Interactive, interpolate, Sequence, useCurrentFrame } from "remotion";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Stamp } from "../../../components/Stamp";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CoupeSide } from "./coupe";

const GROUND = 1060;
const PARKED = { x0: 330, dx: 100, scale: 0.24 };
const START_X = 190;
const END_X = 850;
const PEAK = 330; // arc height above the ground, px
const JUMP = 40; // frames in the air

// The jump arc: a parabola from the take-off to the landing over the five parked cars.
const arcAt = (t: number) => ({ x: START_X + (END_X - START_X) * t, lift: 4 * PEAK * t * (1 - t) });
const ARC = Array.from({ length: 41 }, (_, i) => {
  const { x, lift } = arcAt(i / 40);
  return `${i === 0 ? "M" : "L"} ${x.toFixed(1)} ${(GROUND - 40 - lift).toFixed(1)}`;
}).join(" ");

// The Roadster (our coupe, small) sits at the left; on "jumped" it flies the dashed arc
// (amber) over five parked cars drawn soft, which line up on "five". MYTH (coral) on "flying".
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const jumped = useCue("jumped", 0.35);
  const five = useCue("five", 0.45);
  const flying = useCue("flying", 0.8);
  const t = interpolate(frame, [jumped, jumped + JUMP], [0, 1], { ...clamp, easing: ease.smooth });
  const { x, lift } = arcAt(t);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-28-far">
        <DustField seed="setup-28" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-28-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Ground">
              <Reveal at={0}>
                <line x1={150} y1={GROUND} x2={930} y2={GROUND} stroke={colors.diagram.faint} strokeWidth={4} strokeLinecap="round" />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Five parked cars">
              {Array.from({ length: 5 }, (_, i) => (
                <Reveal key={i} at={five - 10 + i * 3} dy={10}>
                  <CoupeSide cx={PARKED.x0 + i * PARKED.dx} ground={GROUND} scale={PARKED.scale} tone="faint" />
                </Reveal>
              ))}
            </Interactive.G>
            <Interactive.G name="Jump arc">
              <DrawPath d={ARC} at={jumped} frames={JUMP} color={colors.amber[500]} width={6} dashed />
            </Interactive.G>
            <Interactive.G name="Roadster">
              <Reveal at={0}>
                <CoupeSide cx={x} ground={GROUND} scale={0.3} lift={lift} />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
      {/* The Stamp animates from its own frame 0, so it mounts on the cue. */}
      <Sequence from={flying} layout="none">
        <Interactive.Div
          name="MYTH stamp"
          style={{ position: "absolute", left: layout.column.x, width: layout.column.width, top: 420, textAlign: "center" }}
        >
          <Stamp kind="myth" />
        </Interactive.Div>
      </Sequence>
    </AbsoluteFill>
  );
};
