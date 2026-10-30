import { Banknote, Store, User } from "lucide-react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../../brand/motion";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { Float } from "../../../components/motion/Float";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { Bank } from "./parts";

const Y = 620;
const YOUR_BANK = { x: 290, y: Y };
const SHOP_BANK = { x: 790, y: Y };
const LINE = `M ${YOUR_BANK.x + 110} ${Y} L ${SHOP_BANK.x - 110} ${Y}`;
const CAL = { x: 540, y: 1000, w: 300, h: 260 };
const DAYS = 4;
const CELL = 60;

// Calendar whose highlighted day steps forward: today, +1, +2.
const Calendar: React.FC<{ day: number; highlight: string }> = ({
  day,
  highlight,
}) => {
  const left = CAL.x - CAL.w / 2;
  const top = CAL.y - CAL.h / 2;
  const firstX = CAL.x - ((DAYS - 1) * CELL) / 2;
  return (
    <g>
      <rect
        x={left}
        y={top}
        width={CAL.w}
        height={CAL.h}
        rx={22}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4}
      />
      <line
        x1={left}
        y1={top + 70}
        x2={left + CAL.w}
        y2={top + 70}
        stroke={colors.diagram.soft}
        strokeWidth={3}
      />
      {[-60, 60].map((dx) => (
        <line
          key={dx}
          x1={CAL.x + dx}
          y1={top - 18}
          x2={CAL.x + dx}
          y2={top + 18}
          stroke={colors.diagram.stroke}
          strokeWidth={8}
          strokeLinecap="round"
        />
      ))}
      {Array.from({ length: DAYS }, (_, i) => (
        <circle
          key={i}
          cx={firstX + i * CELL}
          cy={CAL.y + 50}
          r={12}
          fill={colors.diagram.faint}
        />
      ))}
      {/* Highlight ring slides from day to day. */}
      <circle
        cx={firstX + day * CELL}
        cy={CAL.y + 50}
        r={24}
        fill="none"
        stroke={highlight}
        strokeWidth={5}
      />
    </g>
  );
};

export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const promise = useCue("promise", 0.22);
  const later = useCue("later", 0.5);
  const settlement = useCue("settlement", 0.6);
  const two = useCue("two", 0.8);

  const step = (at: number) =>
    interpolate(frame, [at, at + 12], [0, 1], {
      ...clamp,
      easing: ease.smooth,
    });
  const calendarDay = step(settlement) + step(two);
  // Money moves once the days have passed; then it is the one amber thing.
  const moveAt = two + 10;
  const move = interpolate(frame, [moveAt, moveAt + 30], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  // Banknote travels between the banks without touching either icon.
  const moneyX = YOUR_BANK.x + 150 + (SHOP_BANK.x - YOUR_BANK.x - 300) * move;

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          {/* The yes travels as a promise (dashed); the money follows later (solid). */}
          <DrawPath
            d={LINE}
            at={4}
            dashed
            width={4}
            // Amber only while "promise" is the point of the beat.
            color={
              frame >= promise && frame < later
                ? colors.amber[500]
                : colors.diagram.soft
            }
          />
          <DrawPath
            d={LINE}
            at={moveAt}
            frames={30}
            width={5}
            color={colors.diagram.stroke}
          />
          <Reveal at={0}>
            <Float seed="pay-your-bank">
              <Bank x={YOUR_BANK.x} y={YOUR_BANK.y} size={170} badge={User} />
            </Float>
          </Reveal>
          <Reveal at={4}>
            <Float seed="pay-shop-bank">
              <Bank x={SHOP_BANK.x} y={SHOP_BANK.y} size={170} badge={Store} />
            </Float>
          </Reveal>
          <Reveal at={later}>
            <Calendar
              day={calendarDay}
              highlight={
                frame >= moveAt ? colors.diagram.soft : colors.amber[500]
              }
            />
          </Reveal>
          <Reveal at={moveAt} dy={0} fromScale={0.6}>
            <LineIcon icon={Banknote} x={moneyX} y={Y - 70} size={90} accent />
          </Reveal>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
