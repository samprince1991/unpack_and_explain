import { AbsoluteFill, Interactive } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { colors, typeScale } from "../../../brand/tokens";
import { PieChart } from "../../../components/charts/pie/PieChart";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { phoneScreen, PhoneFrame } from "../../../components/styles/PhoneFrame";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;
const PHONE = { x: CX, y: 790, width: 430, height: 780 };
const SCREEN = phoneScreen(PHONE.x, PHONE.y, PHONE.width, PHONE.height);
const ROW = { height: 72, gap: 34 };
// FICO's five categories. Names read from the VO; the hole shows only the key one.
const PARTS = [
  { id: "payment", name: "Paying on time", value: 35 },
  { id: "owed", value: 30 },
  { id: "history", value: 15 },
  { id: "new", value: 10 },
  { id: "mix", value: 10 },
];

const Field: React.FC<{ index: number; active?: boolean }> = ({ index, active = false }) => (
  <rect
    x={SCREEN.left}
    y={SCREEN.top + 90 + index * (ROW.height + ROW.gap)}
    width={SCREEN.width}
    height={ROW.height}
    rx={14}
    fill="none"
    stroke={active ? colors.amber[500] : colors.diagram.faint}
    strokeWidth={active ? 6 : 4}
  />
);

// A loan form on a phone, its income field amber on "salary". Then the score's five parts as
// a donut on "score", paying on time amber on "only", and salary's share shown as 0%.
export const PayoffScene: React.FC = () => {
  const { durationInFrames } = useSection();
  const salary = useCue("salary", 0.25);
  const but = useCue("But", 0.38);
  const score = useCue("score", 0.44);
  const never = useCue("never", 0.56);
  const only = useCue("only", 0.76);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-07-far">
        <DustField seed="payoff-07" count={22} />
      </Parallax>
      <Parallax depth={1} seed="payoff-07-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Loan form">
              <Reveal at={0} exitAt={but}>
                <PhoneFrame {...PHONE}>
                  <rect x={SCREEN.left} y={SCREEN.top + 20} width={190} height={22} rx={11} fill={colors.diagram.soft} />
                  <Field index={0} />
                  <Field index={1} />
                  <Field index={2} />
                  <Field index={3} />
                </PhoneFrame>
              </Reveal>
              <Reveal at={salary - 2} exitAt={but}>
                <Field index={2} active />
                <text
                  x={SCREEN.left + 22}
                  y={SCREEN.top + 90 + 2 * (ROW.height + ROW.gap) + 52}
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.primary}
                >
                  Income
                </text>
              </Reveal>
            </Interactive.G>
            <PieChart
              data={PARTS}
              box={{ x: 190, y: 400, width: 700, height: 680 }}
              donut
              keyId="payment"
              unit="%"
              at={score}
              keyAt={only}
            />
            <Interactive.G name="Salary share">
              <Reveal at={never}>
                <text
                  x={CX}
                  y={1170}
                  textAnchor="middle"
                  fontFamily={fonts.heading}
                  fontWeight={weights.heading}
                  fontSize={typeScale.title}
                  fill={colors.text.primary}
                >
                  Salary: 0%
                </text>
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
