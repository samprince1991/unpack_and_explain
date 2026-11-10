import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { clamp, ease } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { Camera } from "../../../components/motion/Camera";
import { DrawPath } from "../../../components/motion/DrawPath";
import { DustField } from "../../../components/motion/DustField";
import { Parallax } from "../../../components/motion/Parallax";
import { Reveal } from "../../../components/motion/Reveal";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue, useSection } from "../../../templates/SectionContext";

const CX = 540;
const CY = 800;
const R_OUT = 230;
const R_IN = 182;
const DENT_AT = -Math.PI / 2; // top of the band
const DENT_W = 0.35; // radians
const DENT_DEPTH = 34;

// A closed ring outline at radius r, pushed in by `dent` px around the top.
const ringPath = (r: number, dent: number) => {
  const steps = 120;
  const pts = Array.from({ length: steps }, (_, i) => {
    const a = (2 * Math.PI * i) / steps;
    const d = a - DENT_AT - 2 * Math.PI * Math.round((a - DENT_AT) / (2 * Math.PI));
    const rr = r - dent * Math.exp(-((d / DENT_W) ** 2));
    return `${(CX + rr * Math.cos(a)).toFixed(1)} ${(CY + rr * Math.sin(a)).toFixed(1)}`;
  });
  return `M ${pts.join(" L ")} Z`;
};

const polar = (r: number, a: number) => `${(CX + r * Math.cos(a)).toFixed(1)} ${(CY + r * Math.sin(a)).toFixed(1)}`;

// One subject: the same gold ring band, front on. "24k = 99.9% gold" names pure gold; on
// "scratches" a scratch drags across the band (amber); on "bends" the top of the band dents
// in and the amber moves to the dent.
export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useSection();
  const karat = useCue("karat", 0.25);
  const scratches = useCue("scratches", 0.7);
  const bends = useCue("bends", 0.88);
  const dent = interpolate(frame, [bends - 4, bends + 14], [0, DENT_DEPTH], { ...clamp, easing: ease.out });
  const band = `${ringPath(R_OUT, dent)} ${ringPath(R_IN, dent)}`;
  // The dented stretch of the outer edge, traced in amber once the dent has formed.
  const mid = (R_OUT + R_IN) / 2 - DENT_DEPTH;
  const dentArc = `M ${polar(mid, DENT_AT - DENT_W)} A ${mid} ${mid} 0 0 1 ${polar(mid, DENT_AT + DENT_W)}`;
  return (
    <AbsoluteFill>
      <Parallax depth={0.25} seed="setup-38-far">
        <DustField seed="setup-38" count={22} />
      </Parallax>
      <Parallax depth={1} seed="setup-38-near">
        <SceneCanvas>
          <Camera duration={durationInFrames}>
            <Interactive.G name="Gold ring band">
              <Reveal at={0}>
                <path
                  d={band}
                  fillRule="evenodd"
                  fill={colors.diagram.fill}
                  stroke={colors.diagram.stroke}
                  strokeWidth={5}
                  strokeLinejoin="round"
                />
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Pure gold label">
              <Reveal at={karat}>
                <text
                  x={CX}
                  y={CY + R_OUT + 110}
                  textAnchor="middle"
                  fontFamily={fonts.body}
                  fontWeight={weights.bodySemibold}
                  fontSize={typeScale.label}
                  fill={colors.text.secondary}
                >
                  24k = 99.9% gold
                </text>
              </Reveal>
            </Interactive.G>
            <Interactive.G name="Scratch">
              <DrawPath
                d={`M ${polar(R_IN + 8, 0.55)} Q ${polar(R_OUT + 6, 0.8)} ${polar(R_OUT - 10, 1.15)}`}
                at={scratches}
                eraseAt={bends}
                color={colors.amber[500]}
                width={6}
              />
            </Interactive.G>
            <Interactive.G name="Dent">
              <Reveal at={bends + 8}>
                <path d={dentArc} fill="none" stroke={colors.amber[500]} strokeWidth={10} strokeLinecap="round" />
              </Reveal>
            </Interactive.G>
          </Camera>
        </SceneCanvas>
      </Parallax>
    </AbsoluteFill>
  );
};
