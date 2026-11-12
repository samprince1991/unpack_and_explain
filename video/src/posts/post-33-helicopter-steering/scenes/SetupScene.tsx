import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;
const CABIN = { cy: 900, rx: 120, ry: 132 };
const ROTOR = { y: 694, half: 380 };
const SKID_Y = 1080;

// One wing (right side), mirrored for the left: a thin tapered plank from the cabin side, its
// flap the outer back strip. Front view, so the wing reads as a plank sticking out sideways.
const wing = (s: 1 | -1) => {
  const x0 = CX + s * (CABIN.rx - 6);
  const x1 = CX + s * 370;
  return `M ${x0} 884 L ${x1} 896 L ${x1} 912 L ${x0} 922 Z`;
};
const flap = (s: 1 | -1) => `M ${CX + s * 250} 914 L ${CX + s * 362} 916`;

// One subject, the helicopter, nose on. "No wing flaps": dashed wings with flaps where a plane
// would have them, which fade away. "One main rotor": the rotor across the top turns amber,
// its blades turning (their length foreshortens as they swing round).
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const flaps = useCue("flaps", 0.25);
  const rotor = useCue("rotor", 0.7);
  const wingsOut = interpolate(frame, [flaps + 20, flaps + 36], [1, 0], { ...clamp, easing: ease.smooth });
  const amber = interpolate(frame, [rotor, rotor + 8], [0, 1], { ...clamp, easing: ease.smooth });
  const swing = Math.cos(frame * 0.22);
  const blade = ROTOR.half * Math.max(Math.abs(swing), 0.08);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-33-far">
        <DustField seed="setup-33" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-33-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Missing wings" style={{ opacity: wingsOut }}>
              {([-1, 1] as const).map((s) => (
                <g key={s}>
                  <DrawPath d={wing(s)} at={flaps - 4} frames={14} color={colors.diagram.faint} width={4} dashed />
                  <DrawPath d={flap(s)} at={flaps + 4} frames={10} color={colors.diagram.faint} width={4} dashed />
                </g>
              ))}
            </Interactive.G>
            <Interactive.G name="Skids">
              {([-1, 1] as const).map((s) => (
                <g key={s}>
                  <path
                    d={`M ${CX + s * 62} ${CABIN.cy + CABIN.ry - 18} L ${CX + s * 118} ${SKID_Y - 14}`}
                    stroke={colors.diagram.stroke}
                    strokeWidth={6}
                    strokeLinecap="round"
                    fill="none"
                  />
                  <circle cx={CX + s * 122} cy={SKID_Y} r={14} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
                </g>
              ))}
            </Interactive.G>
            <Interactive.G name="Cabin">
              <ellipse cx={CX} cy={CABIN.cy} rx={CABIN.rx} ry={CABIN.ry} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={6} />
              <path
                d={`M ${CX - 92} ${CABIN.cy - 10} Q ${CX} ${CABIN.cy - 150} ${CX + 92} ${CABIN.cy - 10} Q ${CX} ${CABIN.cy + 22} ${CX - 92} ${CABIN.cy - 10} Z`}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={4}
              />
            </Interactive.G>
            <Interactive.G name="Mast">
              <line x1={CX} y1={CABIN.cy - CABIN.ry} x2={CX} y2={ROTOR.y + 10} stroke={colors.diagram.stroke} strokeWidth={8} strokeLinecap="round" />
              <rect x={CX - 22} y={ROTOR.y - 12} width={44} height={24} rx={6} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
            </Interactive.G>
            <Interactive.G name="Rotor">
              <ellipse cx={CX} cy={ROTOR.y} rx={ROTOR.half} ry={26} fill="none" stroke={colors.diagram.faint} strokeWidth={3} strokeDasharray="10 12" />
              <line x1={CX - blade} y1={ROTOR.y} x2={CX + blade} y2={ROTOR.y} stroke={colors.diagram.stroke} strokeWidth={10} strokeLinecap="round" />
              <line x1={CX - blade} y1={ROTOR.y} x2={CX + blade} y2={ROTOR.y} stroke={colors.amber[500]} strokeWidth={10} strokeLinecap="round" opacity={amber} />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
