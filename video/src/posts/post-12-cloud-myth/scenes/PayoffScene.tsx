import { Cloud, Plug } from "lucide-react";
import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Float } from "../../../components/motion/Float";
import { Parallax } from "../../../components/motion/Parallax";
import { enterProgress, exitProgress } from "../../../components/motion/progress";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { ShareGrid } from "../../../components/styles/ShareGrid";
import { useCue } from "../../../templates/SectionContext";

const CLOUD = { x: 540, y: 560 };
const PLUG = { x: 540, y: 1080 };
// The power cord hangs from the cloud down to a plug on the ground.
const CORD = `M ${CLOUD.x} ${CLOUD.y + 110} C ${CLOUD.x + 120} ${CLOUD.y + 300}, ${CLOUD.x - 120} ${PLUG.y - 260}, ${PLUG.x} ${PLUG.y - 60}`;

// 1.5 of 100 squares turn amber (data centers' share of world electricity), with the TWh
// the VO doesn't say; then the cloud from the setup comes back on a plug: it needs power.
export const PayoffScene: React.FC = () => {
  const frame = useCurrentFrame();
  const electricity = useCue("electricity", 0.45);
  const sky = useCue("sky", 0.88);
  const value = interpolate(frame, [electricity, electricity + 24], [0, 1.5], {
    ...clamp,
    easing: ease.out,
  });
  const labelIn = enterProgress(frame, electricity) * exitProgress(frame, sky);
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="payoff-12-far">
        <DustField seed="payoff-12" count={22} />
      </Parallax>
      <Parallax depth={1} seed="payoff-12-near">
        <SceneCanvas>
          <ShareGrid
            cx={540}
            cy={910}
            cell={46}
            share={1.5}
            at={4}
            highlightAt={electricity}
            exitAt={sky}
          />
          <Interactive.G name="Cloud with plug">
            <Reveal at={sky}>
              <Float seed="cloud-12-payoff" amplitude={8}>
                <LineIcon icon={Cloud} x={CLOUD.x} y={CLOUD.y} size={300} stroke={6} />
              </Float>
            </Reveal>
            <DrawPath d={CORD} at={sky + 6} frames={20} color={colors.diagram.soft} width={5} />
            <Reveal at={sky + 20} pop>
              <LineIcon icon={Plug} x={PLUG.x} y={PLUG.y} size={130} stroke={6} accent />
            </Reveal>
          </Interactive.G>
        </SceneCanvas>
      </Parallax>
      <Interactive.Div
        name="Share label"
        style={{
          position: "absolute",
          left: layout.column.x,
          width: layout.column.width,
          top: layout.regions.visual.top + 10,
          textAlign: "center",
          opacity: labelIn,
          translate: `0 ${(1 - labelIn) * 12}px`,
        }}
      >
        <div
          style={{
            fontFamily: fonts.heading,
            fontWeight: weights.heading,
            fontSize: typeScale.display,
            lineHeight: 1,
            color: colors.text.primary,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {value.toFixed(1)}%
        </div>
        <div
          style={{
            marginTop: 12,
            fontFamily: fonts.body,
            fontWeight: weights.bodyMedium,
            fontSize: typeScale.label,
            color: colors.text.secondary,
          }}
        >
          415 TWh
        </div>
      </Interactive.Div>
    </AbsoluteFill>
  );
};
