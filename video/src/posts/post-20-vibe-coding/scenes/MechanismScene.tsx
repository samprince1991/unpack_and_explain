import { Billboard, Line } from "@react-three/drei";
import { Bot, Code, FolderOpen, ListChecks, Play } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { CycleRing3D, RingTravel, ringNode } from "../../../components/three/CycleRing3D";
import { ringPoint } from "../../../components/three/ring";
import { Label3D } from "../../../components/three/Label3D";
import { line } from "../../../components/three/materials";
import { Stage3D, useStageView } from "../../../components/three/Stage3D";
import type { Vec3 } from "../../../components/three/stage";
import { useCue, useSection } from "../../../templates/SectionContext";

const N = 4;
const R = 1.25;
// Node order clockwise seen from above: read project, plan, write code, run.
const STEPS = [FolderOpen, ListChecks, Code, Play];
const RUN = 3;
const ICON = 64;

const ring = (r: number, n = 48): Vec3[] =>
  Array.from({ length: n + 1 }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    return [Math.cos(a) * r, Math.sin(a) * r, 0];
  });

// The agent loop as a 3D hero: four steps on a tilted ring around the agent, slowly
// orbiting. A crash shows up as an amber dot above "run", rides the ring once more
// (read error, fix, run again) and turns into a check. Then it keeps looping.
export const MechanismScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
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

  const view = useStageView({
    orbit: 3,
    angle: -20,
    tilt: 38,
    duration: durationInFrames,
    // Lean in on the crash, ease back out once it loops.
    shots: [
      { at: crashes, pan: [0, 0], zoom: 1.1 },
      { at: loops, pan: [0, 0], zoom: 1 },
    ],
  });

  const steps = [
    { at: reads, node: 0 },
    { at: plans, node: 1 },
    { at: writes, node: 2 },
    { at: runs, node: 3 },
    { at: fixes, node: 2 },
    { at: again, node: 3 },
  ];
  const active = steps.filter((s) => frame >= s.at).at(-1)?.node;
  const nodeAts = [reads, plans, writes, runs];
  const run = ringNode(RUN, N, R);
  // The error dot hovers above "run" until "error", then rides the ring back to it.
  const above: Vec3 = [run[0], 0.55, run[2]];
  const errorTrip = Math.max(20, again - error);
  const hover = interpolate(frame, [crashes, crashes + 12], [0, 1], { ...clamp, easing: ease.pop });
  const ping = interpolate(frame, [crashes, crashes + 20], [0, 1], { ...clamp, easing: ease.out });
  const fixed = interpolate(frame, [again, again + 12], [0, 1], { ...clamp, easing: ease.pop });
  const agentIn = interpolate(frame, [0, 12], [0, 1], { ...clamp, easing: ease.out });
  // Faint guide ring draws in while the agent is introduced, then gives way to the arcs.
  const guide = interpolate(frame, [4, Math.max(16, once)], [0, 1], { ...clamp, easing: ease.out });
  const guideFade = interpolate(frame, [runs + 6, runs + 30], [1, 0], clamp);
  const guidePts = Array.from({ length: 97 }, (_, k) => ringPoint(-0.25 + (k / 96) * guide, R));
  const agentPulse = interpolate(frame, [once, once + 8, once + 20], [1, 1.12, 1], clamp);

  return (
    <AbsoluteFill>
      <Stage3D view={view}>
        {guide > 0 && guideFade > 0 ? (
          <Line points={guidePts} {...line("faint")} transparent opacity={guideFade} />
        ) : null}
        <CycleRing3D nodes={nodeAts.map((at) => ({ at }))} radius={R} active={active} />
        {/* First run: a neutral pulse leaves "run" and comes back round. */}
        <RingTravel from={RUN / N} at={runs + 4} frames={crashes - runs} until={crashes} radius={R} />
        {frame >= crashes && frame < error ? (
          <>
            <mesh position={above} scale={hover}>
              <sphereGeometry args={[0.11, 24, 24]} />
              <meshBasicMaterial color={colors.amber[500]} />
            </mesh>
            {ping < 1 ? (
              <Billboard position={above}>
                <Line
                  points={ring(0.12 + 0.35 * ping)}
                  {...line("amber")}
                  transparent
                  opacity={1 - ping}
                />
              </Billboard>
            ) : null}
          </>
        ) : null}
        <RingTravel
          from={RUN / N}
          at={error}
          frames={errorTrip}
          radius={R}
          size={0.11}
          role="amber"
          opacity={1 - fixed}
        />
        {/* Then it just keeps looping. */}
        <RingTravel from={RUN / N} at={loops} frames={36} repeat radius={R} />
      </Stage3D>
      <Label3D view={view} at={[0, 0.15, 0]} opacity={agentIn} scale={agentPulse} depthScale>
        <Bot size={120} color={colors.diagram.stroke} strokeWidth={4 * (24 / 120)} />
      </Label3D>
      {STEPS.map((Icon, i) => {
        const t = interpolate(frame, [nodeAts[i], nodeAts[i] + 12], [0, 1], clamp);
        return (
          <Label3D key={nodeAts[i]} view={view} at={ringNode(i, N, R)} opacity={t} depthScale>
            <Icon size={ICON} color={colors.diagram.stroke} strokeWidth={4 * (24 / ICON)} />
          </Label3D>
        );
      })}
      {/* Fixed: a check above "run". Teal = "correct" mark. */}
      <Label3D view={view} at={above} opacity={fixed} scale={0.6 + 0.4 * fixed} depthScale>
        <svg width={96} height={96} viewBox="0 0 96 96">
          <path
            d="M 18 50 l 20 20 l 40 -42"
            fill="none"
            stroke={colors.teal[400]}
            strokeWidth={10}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Label3D>
    </AbsoluteFill>
  );
};
