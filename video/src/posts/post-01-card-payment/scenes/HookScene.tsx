import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { Camera } from "../../../components/motion/Camera";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { Card, Terminal } from "./parts";

const TERMINAL = { x: 540, y: 1000 };
// Where the card hovers over the terminal screen.
const TAP = { x: 560, y: 900 };
const START = { x: 760, y: 700 };

// Hook title is added by the Reel template above this scene (it covers y 360-600).
export const HookScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const tap = useCue("tap", 0.4);

  // Card glides in, touches the terminal on "tap", then lifts slightly.
  const approach = interpolate(frame, [0, tap], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  const lift = interpolate(frame, [tap, tap + 12], [0, 1], {
    ...clamp,
    easing: ease.out,
  });
  const x = START.x + (TAP.x - START.x) * approach;
  const y = START.y + (TAP.y - START.y) * approach - 24 * lift;

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Reveal at={0} dy={0}>
            <Float seed="terminal">
              <Terminal x={TERMINAL.x} y={TERMINAL.y} size={300} />
            </Float>
          </Reveal>
          <Ping x={TAP.x - 20} y={TAP.y} at={tap} period={36} to={120} />
          <g
            style={{
              transformBox: "fill-box",
              transformOrigin: "center",
              rotate: `${interpolate(approach, [0, 1], [-16, -6])}deg`,
            }}
          >
            <Card x={x} y={y} width={280} />
          </g>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
