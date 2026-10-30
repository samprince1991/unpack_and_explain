import { User } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { Float } from "../../../components/motion/Float";
import { stagger } from "../../../components/motion/progress";
import { Reveal } from "../../../components/motion/Reveal";
import { Travel } from "../../../components/motion/Travel";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { Bank, Card } from "./parts";

const CARD = { x: 540, y: 530 };
const BANK = { x: 540, y: 1100 };
// The number's route from the card to your bank; the five companies sit on it.
const ROUTE = `M ${CARD.x} ${CARD.y + 115} L ${BANK.x} ${BANK.y - 110}`;
const COMPANIES = [0, 1, 2, 3, 4].map((i) => ({
  x: CARD.x,
  y: CARD.y + 175 + i * 75,
}));

export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const number = useCue("number", 0.3);
  const points = useCue("points", 0.4);
  const five = useCue("five", 0.65);
  const pass = useCue("pass", 0.78);

  const numberIn = interpolate(frame, [number, number + 14], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  // Once the number leaves the card, the travelling dot is the one amber thing.
  const numberColor = frame >= pass ? colors.diagram.soft : colors.amber[500];

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <DrawPath
            d={ROUTE}
            at={points}
            dashed
            width={3}
            color={colors.diagram.soft}
          />
          {COMPANIES.map((c, i) => (
            <Reveal
              key={c.y}
              at={stagger(five, i, 4)}
              pop
              dy={0}
              fromScale={0.4}
            >
              <circle
                cx={c.x}
                cy={c.y}
                r={14}
                fill={colors.bg.raised}
                stroke={colors.diagram.stroke}
                strokeWidth={4}
              />
            </Reveal>
          ))}
          <Travel
            d={ROUTE}
            at={pass}
            frames={44}
            r={12}
            color={colors.amber[500]}
          />
          <Reveal at={0}>
            <Float seed="card">
              <Card
                x={CARD.x}
                y={CARD.y}
                width={340}
                number={numberIn}
                numberColor={numberColor}
              />
            </Float>
          </Reveal>
          <Reveal at={points + 8}>
            <Bank x={BANK.x} y={BANK.y} size={170} badge={User} />
          </Reveal>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
