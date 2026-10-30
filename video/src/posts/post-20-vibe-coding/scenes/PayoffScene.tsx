import { Search } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { enterProgress, stagger } from "../../../components/motion/progress";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { PhoneFrame, phoneScreen } from "../../../components/styles/PhoneFrame";
import { useCue, useSection } from "../../../templates/SectionContext";

const PHONE = { x: 540, y: 800, width: 460, height: 760 };
const SCREEN = phoneScreen(PHONE.x, PHONE.y, PHONE.width, PHONE.height);
// The built app's week row has one day too many: it runs, but it isn't right.
const DAYS = ["M", "T", "W", "T", "F", "S", "S", "S"];
const DAY_GAP = 46;
const WEEK_Y = SCREEN.top + 470;
const dayX = (i: number) => PHONE.x + (i - (DAYS.length - 1) / 2) * DAY_GAP;
const WRONG = DAYS.length - 1;
// "It runs" check, inside the phone's top-right corner.
const BADGE = { x: PHONE.x + PHONE.width / 2 - 80, y: SCREEN.top + 30 };
const ROWS = [0, 1, 2].map((i) => SCREEN.top + 110 + i * 100);

const ellipse = (x: number, y: number, rx: number, ry: number) =>
  `M ${x} ${y - ry} A ${rx} ${ry} 0 1 1 ${x - 0.1} ${y - ry}`;

// The finished habit tracker. It runs (teal check), but a closer look finds an eighth day.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const predicting = useCue("predicting", 0.08);
  const meant = useCue("meant", 0.35);
  const runs = useCue("runs", 0.55);
  const right = useCue("right", 0.69);
  const test = useCue("test", 0.84);
  const scan = interpolate(frame, [test, test + 24], [dayX(0), dayX(WRONG)], {
    ...clamp,
    easing: ease.smooth,
  });

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <Camera
          duration={durationInFrames}
          // Gentle zoom on the phone itself: it stays centered and whole inside the region.
          pushIn={1}
          shots={[{ at: right, x: PHONE.x, y: PHONE.y, zoom: 1.12 }]}
        >
          <Interactive.G name="App">
            <Reveal at={0}>
              <PhoneFrame {...PHONE}>
                <rect
                  x={SCREEN.left + 20}
                  y={SCREEN.top + 20}
                  width={200}
                  height={20}
                  rx={10}
                  fill={colors.diagram.soft}
                />
                {ROWS.map((y, i) => {
                  const t = enterProgress(frame, stagger(predicting, i, 8));
                  return (
                    <g key={y} opacity={0.3 + 0.7 * t}>
                      <circle
                        cx={SCREEN.left + 44}
                        cy={y}
                        r={22}
                        fill="none"
                        stroke={colors.diagram.soft}
                        strokeWidth={4}
                      />
                      <path
                        d={`M ${SCREEN.left + 33} ${y} l 8 8 l 15 -16`}
                        fill="none"
                        stroke={colors.diagram.stroke}
                        strokeWidth={5}
                        strokeLinecap="round"
                        opacity={t}
                      />
                      <rect
                        x={SCREEN.left + 90}
                        y={y - 9}
                        width={160 + ((i * 70) % 110)}
                        height={18}
                        rx={9}
                        fill={colors.diagram.faint}
                      />
                    </g>
                  );
                })}
                {DAYS.map((d, i) => (
                  <text
                    key={`${d}-${i}`}
                    x={dayX(i)}
                    y={WEEK_Y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontFamily={fonts.body}
                    fontWeight={weights.bodySemibold}
                    fontSize={typeScale.label}
                    fill={colors.text.secondary}
                    opacity={enterProgress(frame, stagger(meant - 20, i, 2))}
                  >
                    {d}
                  </text>
                ))}
              </PhoneFrame>
            </Reveal>
          </Interactive.G>
          <Interactive.G name="Runs">
            <Reveal at={runs} pop>
              <circle
                cx={BADGE.x}
                cy={BADGE.y}
                r={44}
                fill={colors.bg.raised}
                stroke={colors.teal[400]}
                strokeWidth={5}
              />
              <path
                d={`M ${BADGE.x - 20} ${BADGE.y} l 14 14 l 28 -30`}
                fill="none"
                stroke={colors.teal[400]}
                strokeWidth={7}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Reveal>
          </Interactive.G>
          <Interactive.G name="Wrong day">
            <DrawPath d={ellipse(dayX(WRONG), WEEK_Y, 30, 40)} at={right} color={colors.amber[500]} width={6} />
          </Interactive.G>
          <Interactive.G name="Test">
            <Reveal at={test}>
              <g style={{ translate: `${scan - dayX(0)}px 0px` }}>
                <LineIcon icon={Search} x={dayX(0) + 20} y={WEEK_Y + 90} size={90} />
              </g>
            </Reveal>
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
