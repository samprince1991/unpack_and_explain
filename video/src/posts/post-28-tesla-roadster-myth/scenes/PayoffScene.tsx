import { AbsoluteFill, Interactive, Sequence, interpolate, useCurrentFrame } from "remotion";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { Stamp } from "../../../components/Stamp";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CoupeSide, coupeUnderside } from "./coupe";

const GROUND = 1080;
const SCALE = 1.3;
const ARROWS = [-1.5, -0.75, 0, 0.75, 1.5]; // along the car, metres

const FAN_W = 150;
const FAN_H = 34;
const BLADES = 6;

// The fan seen side-on, as it sits flat under the floor: a duct straddling the underside,
// its blades sweeping past (the spin reads as blades sliding across and back).
const Fan: React.FC<{ x: number; y: number; angle: number }> = ({ x, y, angle }) => (
  <g>
    <rect
      x={x - FAN_W / 2}
      y={y - FAN_H / 2}
      width={FAN_W}
      height={FAN_H}
      rx={FAN_H / 2}
      fill={colors.diagram.fill}
      stroke={colors.amber[500]}
      strokeWidth={5}
    />
    {Array.from({ length: BLADES }, (_, i) => {
      const phase = ((angle / 360 + i / BLADES) % 1) * 2 * Math.PI;
      const bx = x + Math.cos(phase) * (FAN_W / 2 - FAN_H / 2);
      return (
        <line
          key={i}
          x1={bx}
          y1={y - FAN_H / 2 + 8}
          x2={bx}
          y2={y + FAN_H / 2 - 8}
          stroke={colors.amber[500]}
          strokeWidth={4}
          strokeLinecap="round"
          opacity={0.4 + 0.6 * Math.abs(Math.sin(phase))}
        />
      );
    })}
  </g>
);

// FACT (teal) on "jumps", over the same coupe, now on the road. On "fan" a fan (amber) shows
// under the floor and spins; on "sucking" arrows press down along the car into the road.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const jumps = useCue("jumps", 0.2);
  const fan = useCue("fan", 0.45);
  const sucking = useCue("sucking", 0.7);
  const spin = interpolate(frame, [fan, durationInFrames], [0, 1500], clamp);
  const under = coupeUnderside(540, GROUND, SCALE);
  const press = interpolate(frame, [sucking, sucking + 20], [0, 1], { ...clamp, easing: ease.out });
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-28-far">
        <DustField seed="payoff-28" count={18} />
      </Parallax>
      <Parallax depth={1} seed="payoff-28-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Road">
              <line x1={150} y1={GROUND} x2={930} y2={GROUND} stroke={colors.diagram.soft} strokeWidth={5} strokeLinecap="round" />
            </Interactive.G>
            <Interactive.G name="Roadster on the road">
              <Reveal at={0}>
                <CoupeSide cx={540} ground={GROUND} scale={SCALE} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Fan under the floor">
              <Reveal at={fan} pop>
                <Fan x={under.x} y={under.y - 4} angle={spin} />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Pressed down onto the road">
              {ARROWS.map((u, i) => {
                const p = coupeUnderside(540, GROUND, SCALE, u);
                const top = 790;
                return (
                  <Reveal key={u} at={sucking + i * 2} dy={-10}>
                    <g opacity={0.5 + 0.5 * press} style={{ translate: `0px ${press * 14}px` }}>
                      <line x1={p.x} y1={top} x2={p.x} y2={top + 70} stroke={colors.diagram.stroke} strokeWidth={5} strokeLinecap="round" />
                      <path
                        d={`M ${p.x - 16} ${top + 58} L ${p.x} ${top + 84} L ${p.x + 16} ${top + 58}`}
                        fill="none"
                        stroke={colors.diagram.stroke}
                        strokeWidth={5}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </Reveal>
                );
              })}
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
      {/* The Stamp animates from its own frame 0, so it mounts on the cue. */}
      <Sequence from={jumps} layout="none">
        <Interactive.Div
          name="FACT stamp"
          style={{ position: "absolute", left: layout.column.x, width: layout.column.width, top: 560, textAlign: "center" }}
        >
          <Stamp kind="fact" />
        </Interactive.Div>
      </Sequence>
    </AbsoluteFill>
  );
};
