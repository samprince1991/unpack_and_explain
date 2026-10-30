import { Radio, Smartphone } from "lucide-react";
import { AbsoluteFill } from "remotion";
import { colors } from "../brand/tokens";
import { Background } from "../components/Background";
import { LineIcon } from "../components/icons/LineIcon";
import { Camera } from "../components/motion/Camera";
import { DrawPath } from "../components/motion/DrawPath";
import { Float } from "../components/motion/Float";
import { Ping } from "../components/motion/Ping";
import { stagger } from "../components/motion/progress";
import { Reveal } from "../components/motion/Reveal";
import { Travel } from "../components/motion/Travel";
import { SceneCanvas } from "../components/SceneCanvas";

// Demo of the motion kit: three towers send signals that converge on a phone.
// Beats (frames): towers in 0, links draw 30, signals 55, links erase 115, ping 120, camera 130.
const PHONE = { x: 540, y: 1020 };
const TOWERS = [
  { x: 260, y: 560 },
  { x: 540, y: 500 },
  { x: 820, y: 560 },
];
const link = (t: { x: number; y: number }) =>
  `M ${t.x} ${t.y + 70} Q ${(t.x + PHONE.x) / 2 + (t.x < PHONE.x ? -60 : 60)} ${(t.y + PHONE.y) / 2} ${PHONE.x} ${PHONE.y - 80}`;

export const KitMotion: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <SceneCanvas>
        <Camera
          shots={[{ at: 140, x: PHONE.x, y: PHONE.y, zoom: 1.5 }]}
          duration={180}
        >
          {TOWERS.map((t, i) => (
            <DrawPath
              key={`l${t.x}`}
              d={link(t)}
              at={stagger(30, i)}
              eraseAt={115}
              dashed
              width={3}
            />
          ))}
          {TOWERS.map((t, i) => (
            <Travel
              key={`s${t.x}`}
              d={link(t)}
              at={stagger(55, i, 4)}
              frames={24}
              repeat={Infinity}
              until={110}
            />
          ))}
          {TOWERS.map((t, i) => (
            <Reveal key={`t${t.x}`} at={stagger(0, i)}>
              <Float seed={`tower-${i}`}>
                <LineIcon icon={Radio} x={t.x} y={t.y} size={120} />
              </Float>
            </Reveal>
          ))}
          <Reveal at={10}>
            <LineIcon icon={Smartphone} x={PHONE.x} y={PHONE.y} size={150} />
          </Reveal>
          <Ping x={PHONE.x} y={PHONE.y} at={120} />
          <Reveal at={120} pop>
            <circle cx={PHONE.x} cy={PHONE.y} r={14} fill={colors.amber[500]} />
          </Reveal>
        </Camera>
      </SceneCanvas>
    </AbsoluteFill>
  );
};
