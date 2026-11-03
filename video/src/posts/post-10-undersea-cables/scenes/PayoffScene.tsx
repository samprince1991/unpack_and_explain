import { Anchor, Ship } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Float } from "../../../components/motion/Float";
import { Ping } from "../../../components/motion/Ping";
import { exitProgress } from "../../../components/motion/progress";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { SeaSection, seaCable, seaCableSplit } from "../../../components/styles/SeaSection";
import { useCue, useSection } from "../../../templates/SectionContext";
import { SEA } from "./sea";

const BREAK_X = 540;
const CABLE_LIFT = 8;
const BACKUP_LIFT = 46;
const ANCHOR_TRAIL = 80; // the anchor drags this far behind the ship
const SHIP_Y = SEA.surface - 48;
const ANCHOR_Y = SEA.seabed - 34;
const BACKUP = seaCable(SEA, BACKUP_LIFT, 22);

// A ship drags its anchor (amber, the key) along the seabed until it snaps the cable.
// Then the data takes the second cable (amber pulse) and a repair ship parks over the break.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const brk = useCue("break", 0.25);
  const another = useCue("another", 0.62);
  const repair = useCue("ship", 0.85);

  const shipX = interpolate(frame, [0, brk], [250, BREAK_X + ANCHOR_TRAIL], { ...clamp, easing: ease.smooth });
  const anchorX = shipX - ANCHOR_TRAIL;
  const gap = interpolate(frame, [brk, brk + 10], [0, 44], { ...clamp, easing: ease.out });
  const [left, right] = seaCableSplit(SEA, BREAK_X, gap, CABLE_LIFT);
  const dragging = exitProgress(frame, another);
  const backupLit = interpolate(frame, [another, another + 12], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <DustField seed="payoff-10" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <SeaSection box={SEA} at={0} />
          <Interactive.G name="Backup cable">
            <path
              d={BACKUP}
              fill="none"
              stroke={backupLit > 0.5 ? colors.diagram.stroke : colors.diagram.faint}
              strokeWidth={5}
              strokeDasharray={backupLit > 0.5 ? undefined : "14 12"}
              strokeLinecap="round"
            />
            <Travel d={BACKUP} at={another + 4} frames={34} repeat={Infinity} r={13} color={colors.amber[500]} />
          </Interactive.G>
          <Interactive.G name="Main cable">
            <path d={left} fill="none" stroke={colors.diagram.stroke} strokeWidth={6} strokeLinecap="round" />
            <path d={right} fill="none" stroke={colors.diagram.stroke} strokeWidth={6} strokeLinecap="round" />
          </Interactive.G>
          <Interactive.G name="Ship and anchor" opacity={dragging}>
            <line
              x1={shipX - 20}
              y1={SEA.surface}
              x2={anchorX + 10}
              y2={ANCHOR_Y - 34}
              stroke={colors.diagram.soft}
              strokeWidth={3}
              strokeDasharray="6 8"
            />
            <LineIcon icon={Ship} x={shipX} y={SHIP_Y + Math.sin(frame / 9) * 4} size={110} />
            <LineIcon icon={Anchor} x={anchorX} y={ANCHOR_Y} size={76} accent />
          </Interactive.G>
          <Ping x={BREAK_X} y={SEA.seabed - CABLE_LIFT} at={brk} until={another} from={20} to={90} />
          <Interactive.G name="Repair ship">
            <Reveal at={repair}>
              <Float seed="repair" amplitude={5}>
                <LineIcon icon={Ship} x={BREAK_X} y={SHIP_Y} size={110} />
              </Float>
            </Reveal>
            <DrawPath
              d={`M ${BREAK_X} ${SEA.surface + 6} L ${BREAK_X} ${SEA.seabed - 40}`}
              at={repair + 8}
              frames={16}
              dashed
              color={colors.diagram.soft}
            />
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
