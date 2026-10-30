import { Network, Store, User } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors, withAlpha } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { Bank, Terminal } from "./parts";

// The chain is wider than the frame: the camera follows the request along it, then
// pulls back to show the whole trip when the answer races back.
const Y = 800;
const NODES = [300, 700, 1100, 1500];
const GAP = 100;
const HOP = 18;
const TAIL = 6;

const link = (i: number) =>
  `M ${NODES[i] + GAP} ${Y} L ${NODES[i + 1] - GAP} ${Y}`;

export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const sends = useCue("sends", 0.05);
  const hands = useCue("hands", 0.2);
  const visa = useCue("visa", 0.33);
  const finds = useCue("finds", 0.5);
  const checks = useCue("checks", 0.62);
  const yes = useCue("yes", 0.83);
  const races = useCue("races", 0.92);

  // Position of the request along the chain, in nodes (0 = terminal, 3 = your bank).
  const along = (f: number) =>
    interpolate(
      f,
      [
        sends,
        sends + HOP,
        hands,
        hands + HOP,
        finds,
        finds + HOP,
        races,
        races + 24,
      ],
      [0, 1, 1, 2, 2, 3, 3, 0],
      { ...clamp, easing: ease.smooth },
    );
  const packetX = (f: number) => {
    const s = along(f);
    const i = Math.min(Math.floor(s), NODES.length - 2);
    return NODES[i] + (NODES[i + 1] - NODES[i]) * (s - i);
  };
  const packetIn = interpolate(frame, [sends - 6, sends], [0, 1], clamp);
  // 1 between nodes, 0 at a node.
  const inTransit = (f: number) => {
    const s = along(f);
    return interpolate(Math.abs(s - Math.round(s)), [0, 0.12], [0, 1], clamp);
  };

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera
          duration={durationInFrames}
          shots={[
            { at: hands, x: 900, y: Y, zoom: 1 },
            { at: finds, x: 1300, y: Y, zoom: 1 },
            { at: races, x: 900, y: Y, zoom: 0.48 },
          ]}
        >
          {[0, 1, 2].map((i) => (
            <DrawPath
              key={i}
              d={link(i)}
              at={[sends, hands, finds][i] - 6}
              width={4}
              color={colors.diagram.soft}
            />
          ))}

          <Reveal at={0}>
            <Terminal x={NODES[0]} y={Y} size={190} />
          </Reveal>
          <Reveal at={sends + 6}>
            <Float seed="shop-bank">
              <Bank x={NODES[1]} y={Y} size={170} badge={Store} />
            </Float>
          </Reveal>
          <Reveal at={hands + 6}>
            <Float seed="network">
              <LineIcon icon={Network} x={NODES[2]} y={Y} size={170} />
            </Float>
          </Reveal>
          <Ping
            x={NODES[2]}
            y={Y}
            at={visa}
            until={finds}
            color={colors.diagram.soft}
            from={90}
            to={150}
          />
          <Reveal at={finds + 6}>
            <Float seed="your-bank">
              <Bank x={NODES[3]} y={Y} size={170} badge={User} />
            </Float>
          </Reveal>
          {/* Balance and fraud check: the bank "thinks" until it answers. */}
          <Ping
            x={NODES[3]}
            y={Y}
            at={checks}
            until={yes}
            color={colors.diagram.soft}
            from={90}
            to={150}
          />
          <DrawPath
            d={`M ${NODES[3] - 34} ${Y - 150} l 24 24 l 48 -52`}
            at={yes}
            frames={10}
            width={10}
            color={colors.teal[400]}
          />

          {/* The request (amber), with a short tail while it moves. */}
          <g opacity={packetIn}>
            {Array.from({ length: TAIL }, (_, k) => (
              <circle
                key={k}
                cx={packetX(frame - (k + 1) * 1.5)}
                cy={Y}
                r={
                  14 *
                  (1 - (k + 1) / (TAIL + 2)) *
                  inTransit(frame - (k + 1) * 1.5)
                }
                fill={withAlpha(
                  colors.amber[500],
                  0.45 * (1 - (k + 1) / (TAIL + 1)),
                )}
              />
            ))}
            {/* Shrinks into each node while it is being handled there, instead of sitting on the icon. */}
            <circle
              cx={packetX(frame)}
              cy={Y}
              r={16 * inTransit(frame)}
              fill={colors.amber[500]}
            />
          </g>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
