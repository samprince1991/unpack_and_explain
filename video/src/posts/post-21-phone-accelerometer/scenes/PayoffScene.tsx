import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { PhoneFrame } from "../../../components/styles/PhoneFrame";
import { useCue, useSection } from "../../../templates/SectionContext";

const PHONE = { x: 360, y: 690, width: 190, height: 370, tilt: 25 };
const ARROW = { x: 750, y: 700, length: 340 };
const BASE = 960; // floor of the bars
// Heights for a phone tilted 25 degrees and turned slightly: no scale or figures on screen.
const BARS = [
  { name: "x", x: 640, height: 130 },
  { name: "y", x: 750, height: 62 },
  { name: "z", x: 860, height: 280, key: true },
];
const RESTING_HEIGHT = 12;

// The amber arrow points down at the ground and flips up on "other". On "drop" it leaves,
// the phone falls and fades before it reaches the edge of the region, and on "fall" the
// three bars drop to almost nothing and slide to the center.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const other = useCue("other", 0.17);
  const drop = useCue("drop", 0.27);
  const fall = useCue("fall", 0.82);

  const flip = interpolate(frame, [other - 6, other + 12], [0, 180], { ...clamp, easing: ease.smooth });
  const fallen = interpolate(frame, [drop, fall + 14], [0, 1], clamp);
  // Free fall covers distance with the square of time, so it starts slow and speeds up.
  const phoneY = PHONE.y + fallen * fallen * 820;
  const phoneTilt = PHONE.tilt + fallen * fallen * 30;
  const phoneOpacity = interpolate(fallen, [0.5, 0.66], [1, 0], clamp);
  const empty = interpolate(frame, [fall, fall + 16], [0, 1], { ...clamp, easing: ease.smooth });
  const slide = interpolate(frame, [fall - 6, fall + 18], [0, BARS[1].x - 540], { ...clamp, easing: ease.smooth });

  return (
    <AbsoluteFill>
      <DustField seed="payoff-21" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Falling phone">
            <g opacity={phoneOpacity} style={{ rotate: `${phoneTilt}deg`, transformOrigin: `${PHONE.x}px ${phoneY}px` }}>
              <PhoneFrame x={PHONE.x} y={phoneY} width={PHONE.width} height={PHONE.height} />
            </g>
          </Interactive.G>
          <Interactive.G name="Up arrow">
            <Reveal at={0} exitAt={drop} dy={0}>
              <g style={{ rotate: `${flip}deg`, transformOrigin: `${ARROW.x}px ${ARROW.y}px` }}>
                <line
                  x1={ARROW.x}
                  y1={ARROW.y - ARROW.length / 2}
                  x2={ARROW.x}
                  y2={ARROW.y + ARROW.length / 2 - 40}
                  stroke={colors.amber[500]}
                  strokeWidth={16}
                  strokeLinecap="round"
                />
                <path
                  d={`M ${ARROW.x - 52} ${ARROW.y + ARROW.length / 2 - 60} L ${ARROW.x} ${ARROW.y + ARROW.length / 2 + 6} L ${ARROW.x + 52} ${ARROW.y + ARROW.length / 2 - 60} Z`}
                  fill={colors.amber[500]}
                />
              </g>
            </Reveal>
          </Interactive.G>
          <g style={{ translate: `${-slide}px 0px` }}>
          <Interactive.G name="Three readings">
            <Reveal at={drop + 4} dy={0}>
              <line
                x1={BARS[0].x - 70}
                y1={BASE}
                x2={BARS[2].x + 70}
                y2={BASE}
                stroke={colors.diagram.soft}
                strokeWidth={5}
                strokeLinecap="round"
              />
              {BARS.map((bar) => {
                const height = interpolate(empty, [0, 1], [bar.height, RESTING_HEIGHT]);
                return (
                  <g key={bar.name}>
                    <rect
                      x={bar.x - 36}
                      y={BASE - height}
                      width={72}
                      height={height}
                      rx={6}
                      fill={bar.key ? colors.amber[500] : colors.diagram.fill}
                      stroke={bar.key ? colors.amber[500] : colors.diagram.stroke}
                      strokeWidth={4}
                    />
                    <text
                      x={bar.x}
                      y={BASE + 66}
                      textAnchor="middle"
                      fontFamily={fonts.body}
                      fontWeight={weights.bodySemibold}
                      fontSize={typeScale.label}
                      fill={colors.text.secondary}
                    >
                      {bar.name}
                    </text>
                  </g>
                );
              })}
            </Reveal>
          </Interactive.G>
          <Interactive.G name="Near zero">
            <Reveal at={fall + 10}>
              <text
                x={BARS[1].x}
                y={BASE - 90}
                textAnchor="middle"
                fontFamily={fonts.heading}
                fontWeight={weights.heading}
                fontSize={typeScale.title}
                fill={colors.text.primary}
              >
                ≈ 0 g
              </text>
            </Reveal>
          </Interactive.G>
          </g>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
