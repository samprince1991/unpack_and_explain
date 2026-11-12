import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { BarChart } from "../../../components/charts/bar/BarChart";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { TRAIN, Train } from "../train";

const RAIL_Y = 900;
const GAP = 46; // same exaggerated gap as the setup
const RULER_X = TRAIN.right - 60;

// "Floats 10 centimeters up": the same maglev car, lifted, with a ruler across the gap and
// "10 cm (4 in)" (amber: the one number). "In 2015 ... 603": the car fades and a two-bar
// chart grows, the fastest wheeled train (TGV, 2007) against the SCMaglev (2015, amber).
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const floats = useCue("floats", 0.15);
  const year = useCue("2015", 0.5);
  const record = useCue("603", 0.62);
  const out = interpolate(frame, [year - 8, year + 4], [1, 0], { ...clamp, easing: ease.smooth });
  const bob = 4 * Math.sin(frame / 14);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-31-far">
        <DustField seed="payoff-31" count={22} />
      </Parallax>
      <Parallax depth={1} seed="payoff-31-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Floating car" style={{ opacity: out }}>
              <line x1={120} y1={RAIL_Y} x2={960} y2={RAIL_Y} stroke={colors.diagram.stroke} strokeWidth={6} strokeLinecap="round" />
              <Train y={RAIL_Y} lift={GAP + bob} />
              <Reveal at={floats}>
                <g>
                  <line x1={RULER_X} y1={RAIL_Y} x2={RULER_X} y2={RAIL_Y - GAP - bob} stroke={colors.amber[500]} strokeWidth={6} />
                  {[RAIL_Y, RAIL_Y - GAP - bob].map((y) => (
                    <line key={y} x1={RULER_X - 22} y1={y} x2={RULER_X + 22} y2={y} stroke={colors.amber[500]} strokeWidth={6} strokeLinecap="round" />
                  ))}
                  <text
                    x={540}
                    y={RAIL_Y + 110}
                    textAnchor="middle"
                    fontFamily={fonts.body}
                    fontWeight={weights.bodySemibold}
                    fontSize={typeScale.label}
                    fill={colors.amber[500]}
                  >
                    10 cm (4 in)
                  </text>
                </g>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Speed records">
              <BarChart
                box={{ x: 200, y: 520, width: 680, height: 560 }}
                data={[
                  { id: "tgv", name: "TGV 2007", value: 574.8 },
                  { id: "maglev", name: "Maglev 2015", value: 603 },
                ]}
                keyId="maglev"
                values="all"
                unit=" km/h"
                // Whole numbers as whole numbers (603), the rest to one decimal (574.8), while counting up too.
                format={(v) => (Math.abs(v - Math.round(v)) < 0.05 ? String(Math.round(v)) : v.toFixed(1))}
                at={year}
                keyAt={record}
              />
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
