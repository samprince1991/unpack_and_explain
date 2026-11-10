import { Car } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";
import { CraftSide } from "./craft";

const COLS = 10;
const ROWS = 6;
const CAR = { x0: 225, dx: 70, y0: 860, dy: 50, size: 46 };
const ROUTE_Y = 1196;

// The small craft grows into the SR.N4; its weight in both units appears on "320"; 60 car
// icons count in on "cars" (the last one amber); on "across" a dashed route draws Dover to
// Calais and takes the amber.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const scales = useCue("scales", 0.06);
  const weight = useCue("320", 0.38);
  const cars = useCue("cars", 0.6);
  const across = useCue("across", 0.72);
  const grow = interpolate(frame, [scales, scales + 30], [0.5, 1.3], { ...clamp, easing: ease.smooth });
  // All 60 land before "across" (at most a frame apart).
  const each = Math.min(1, Math.max(0.3, (across - cars - 6) / (COLS * ROWS)));
  return (
    <AbsoluteFill>
      <DustField seed="payoff-27" count={18} />
      <SceneCanvas>
        <Camera duration={durationInFrames}>
          <Interactive.G name="Small craft grows into the SR.N4">
            <CraftSide cx={540} ground={720} scale={grow} lift={10} />
          </Interactive.G>
          <Interactive.G name="SR.N4 weight">
            <Reveal at={weight - 4}>
              <text
                x={540}
                y={800}
                textAnchor="middle"
                fontFamily={fonts.body}
                fontWeight={weights.bodySemibold}
                fontSize={typeScale.label}
                fill={colors.text.primary}
              >
                SR.N4 · 320 t (353 US tons)
              </text>
            </Reveal>
          </Interactive.G>
          <Interactive.G name="60 cars">
            {Array.from({ length: COLS * ROWS }, (_, i) => {
              const col = i % COLS;
              const row = Math.floor(i / COLS);
              const last = i === COLS * ROWS - 1;
              return (
                <Reveal key={i} at={cars + i * each} dy={8} frames={8}>
                  <LineIcon
                    icon={Car}
                    x={CAR.x0 + col * CAR.dx}
                    y={CAR.y0 + row * CAR.dy}
                    size={CAR.size}
                    accent={last && frame < across + 4}
                    stroke={3}
                  />
                </Reveal>
              );
            })}
          </Interactive.G>
          <Interactive.G name="Dover to Calais">
            <Reveal at={across - 6}>
              <text x={170} y={ROUTE_Y + 14} fontFamily={fonts.body} fontWeight={weights.bodyMedium} fontSize={typeScale.label} fill={colors.text.secondary}>
                Dover
              </text>
              <text x={910} y={ROUTE_Y + 14} textAnchor="end" fontFamily={fonts.body} fontWeight={weights.bodyMedium} fontSize={typeScale.label} fill={colors.text.secondary}>
                Calais
              </text>
            </Reveal>
            <DrawPath d={`M 330 ${ROUTE_Y} L 750 ${ROUTE_Y}`} at={across} color={colors.amber[500]} width={6} dashed />
          </Interactive.G>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
