import { Bot, Code, FolderOpen, ListChecks, Play } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { CycleDiagram, cycleLoop, cyclePoint } from "../../../components/styles/CycleDiagram";
import { useCue } from "../../../templates/SectionContext";

const C = { x: 540, y: 800 };
const R = 280;
const N = 4;
// Node order clockwise from the top: read project, plan, write code, run.
const RUN = 3;

// The agent loop: four steps on a ring around the agent. A crash shows up as an amber dot
// at "run", goes round the loop once more (read error, fix, run again) and turns into a
// check.
export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const once = useCue("once", 0.15);
  const reads = useCue("reads", 0.22);
  const plans = useCue("plans", 0.31);
  const writes = useCue("writes", 0.4);
  const runs = useCue("runs", 0.5);
  const crashes = useCue("crashes", 0.58);
  const error = useCue("error", 0.67);
  const fixes = useCue("fixes", 0.72);
  const again = useCue("again", 0.81);
  const loops = useCue("loops", 0.89);

  const steps = [
    { at: reads, node: 0 },
    { at: plans, node: 1 },
    { at: writes, node: 2 },
    { at: runs, node: 3 },
    { at: fixes, node: 2 },
    { at: again, node: 3 },
  ];
  const active = steps.filter((s) => frame >= s.at).at(-1)?.node;
  const run = cyclePoint(C.x, C.y, R, RUN, N);
  const loop = cycleLoop(C.x, C.y, R, RUN, N);
  // Error mark sits inside the ring, between "run" and the agent.
  const mark = { x: run.x + 120, y: run.y };
  // The error dot leaves "run" on "error" and is back there on "again".
  const errorTrip = Math.max(20, again - error);
  const fixed = interpolate(frame, [again, again + 12], [0, 1], { ...clamp, easing: ease.pop });

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Interactive.G name="Agent">
          <Reveal at={0}>
            <Float seed="mech-agent">
              <LineIcon icon={Bot} x={C.x} y={C.y} size={140} />
            </Float>
          </Reveal>
          <Ping x={C.x} y={C.y} at={once} from={90} to={150} color={colors.diagram.soft} until={reads} />
        </Interactive.G>
        {/* Dots ride the ring under the nodes, so they pass behind each step cleanly. */}
        <Interactive.G name="Dots">
          {/* First run: a neutral pulse leaves "run" and comes back round. */}
          <Travel d={loop} at={runs + 4} frames={crashes - runs} until={crashes} />
          <g opacity={1 - fixed}>
            <Travel d={loop} at={error} frames={errorTrip} r={18} color={colors.amber[500]} />
          </g>
          {/* Then it just keeps looping. */}
          <Travel d={loop} at={loops} frames={36} repeat={Infinity} />
        </Interactive.G>
        <Interactive.G name="Loop">
          <CycleDiagram
            cx={C.x}
            cy={C.y}
            r={R}
            active={active}
            nodes={[
              { icon: FolderOpen, at: reads },
              { icon: ListChecks, at: plans },
              { icon: Code, at: writes },
              { icon: Play, at: runs },
            ]}
          />
        </Interactive.G>
        <Interactive.G name="Error">
          <g opacity={1 - fixed}>
            <Reveal at={crashes} pop exitAt={error}>
              <circle cx={mark.x} cy={mark.y} r={20} fill={colors.amber[500]} />
            </Reveal>
            <Ping x={run.x} y={run.y} at={crashes} from={80} to={130} until={error} />
          </g>
          {/* Fixed: a check where the error was. Teal = "correct" mark. */}
          <path
            d={`M ${mark.x - 34} ${mark.y} l 22 22 l 44 -46`}
            fill="none"
            stroke={colors.teal[400]}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={fixed}
            style={{ transformBox: "fill-box", transformOrigin: "center", scale: String(0.6 + 0.4 * fixed) }}
          />
        </Interactive.G>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
