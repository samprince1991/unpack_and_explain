import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { CircleMark } from "../../../components/elements/CircleMark";
import { ClockIcon } from "../../../components/icons/ClockIcon";
import { PhoneIcon } from "../../../components/icons/PhoneIcon";
import { PinIcon } from "../../../components/icons/PinIcon";
import { PlaneIcon } from "../../../components/icons/PlaneIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const CENTER = { x: 540, y: 800 };
const SWAP_FRAMES = 8;

export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const beat2 = useCue("relativity", 0.5);
  const drift = useCue("kilometers", 0.85);
  const beat1Opacity = interpolate(frame, [beat2 - SWAP_FRAMES, beat2], [1, 0], clamp);
  const beat2Opacity = interpolate(frame, [beat2, beat2 + SWAP_FRAMES], [0, 1], clamp);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <g opacity={beat1Opacity}>
          <PhoneIcon x={CENTER.x} y={CENTER.y} size={320} />
          <PlaneIcon x={CENTER.x} y={CENTER.y - 90} size={60} />
          <g
            style={{
              scale: interpolate(frame, [10, 22], [0, 1], { ...clamp, easing: ease.pop }),
              transformOrigin: `${CENTER.x}px ${CENTER.y + 50}px`,
            }}
          >
            <PinIcon x={CENTER.x} y={CENTER.y + 50} size={90} />
          </g>
        </g>
        <g opacity={beat2Opacity}>
          <ClockIcon
            x={CENTER.x}
            y={CENTER.y - 40}
            size={260}
            minuteAngle={interpolate(frame, [beat2 + 10, beat2 + 30], [35, 0], {
              ...clamp,
              easing: ease.pop,
            })}
          />
        </g>
      </SceneCanvas>
      <Interactive.Div
        name="No internet label"
        style={{
          position: "absolute",
          left: layout.column.x,
          top: 1110,
          width: layout.column.width,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          color: colors.text.primary,
          opacity: beat1Opacity,
        }}
      >
        Works with no internet
      </Interactive.Div>
      <Interactive.Div
        name="Relativity label"
        style={{
          position: "absolute",
          left: layout.column.x,
          top: 930,
          width: layout.column.width,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          textAlign: "center",
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: typeScale.label,
          lineHeight: 1.3,
          color: colors.text.primary,
          opacity: beat2Opacity,
        }}
      >
        <div>Without the relativity fix:</div>
        <div
          style={{
            margin: "34px 0 22px",
            fontFamily: fonts.heading,
            fontWeight: weights.heading,
            fontSize: typeScale.title,
            color: colors.amber[500],
          }}
        >
          <CircleMark start={drift}>~10 km (6 mi)</CircleMark>
        </div>
        <div>off, every day</div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
