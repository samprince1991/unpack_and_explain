import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { BlenderClip } from "../../../components/BlenderClip";
import { BlenderLabels } from "../../../components/BlenderLabels";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const SHIP = { x: 300, y: 430 };

// A small spacecraft in side view (capsule + service module) with a puff out of one side:
// the same push, where there's nothing to push on.
const Spacecraft: React.FC<{ puff: number }> = ({ puff }) => {
  const { x, y } = SHIP;
  return (
    <g style={{ scale: "1.6", transformOrigin: `${x}px ${y}px` }}>
      <path
        d={`M ${x - 70} ${y - 26} L ${x - 10} ${y - 26} L ${x + 40} ${y - 12} Q ${x + 52} ${y} ${x + 40} ${y + 12} L ${x - 10} ${y + 26} L ${x - 70} ${y + 26} Z`}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <line x1={x - 10} y1={y - 26} x2={x - 10} y2={y + 26} stroke={colors.diagram.soft} strokeWidth={3} />
      <path
        d={`M ${x - 40} ${y + 30} L ${x - 52 - 26 * puff} ${y + 40 + 60 * puff} L ${x - 28 + 26 * puff} ${y + 40 + 60 * puff} Z`}
        fill="none"
        stroke={colors.diagram.soft}
        strokeWidth={4}
        strokeLinejoin="round"
        opacity={1 - 0.6 * puff}
      />
    </g>
  );
};

// Blender 3D hero on the test track (beats in script.ts `blender.mechanism`): the shell drops
// away so the tanks show, back on for a close-up of one nozzle, its jet fires, every jet fires
// and the car lifts, then the jets cut and it drops back down. The 2D layer adds only what the
// VO doesn't say: the tank volume in US gallons, and a small spacecraft on "rockets".
export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const liters = useCue("liters", 0.22);
  const ten = useCue("ten", 0.32);
  const rockets = useCue("rockets", 0.66);
  const when = useCue("when", 0.82);
  const puff = interpolate((frame - rockets) % 30, [0, 24], [0, 1], clamp);
  return (
    <AbsoluteFill>
      <BlenderClip clip="mechanism" />
      <BlenderLabels clip="mechanism" />
      <SceneCanvas>
        <Interactive.G name="Tank volume">
          <Reveal at={liters} exitAt={ten}>
            <text
              x={540}
              y={480}
              textAnchor="middle"
              fontFamily={fonts.body}
              fontWeight={weights.bodySemibold}
              fontSize={typeScale.label}
              fill={colors.text.primary}
            >
              600 L (159 US gal)
            </text>
          </Reveal>
        </Interactive.G>
        <Interactive.G name="Spacecraft">
          <Reveal at={rockets} exitAt={when}>
            <Spacecraft puff={frame >= rockets ? puff : 0} />
          </Reveal>
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
