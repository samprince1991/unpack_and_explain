import {
  Battery,
  Cpu,
  Globe,
  KeyRound,
  Plane,
  Router,
  Server,
  Wifi,
  Zap,
} from "lucide-react";
import { AbsoluteFill } from "remotion";
import { Background } from "../components/Background";
import { LineIcon } from "../components/icons/LineIcon";
import { Float } from "../components/motion/Float";
import { stagger } from "../components/motion/progress";
import { Reveal } from "../components/motion/Reveal";
import { SceneCanvas } from "../components/SceneCanvas";

// Lucide icons in diagram style, entering staggered and drifting. One amber accent.
const ICONS = [Wifi, Router, Server, Cpu, KeyRound, Globe, Plane, Battery, Zap];
const ACCENT = 4;

export const KitIcons: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <SceneCanvas>
      {ICONS.map((icon, i) => {
        const x = 300 + (i % 3) * 240;
        const y = 560 + Math.floor(i / 3) * 240;
        return (
          <Reveal key={i} at={stagger(5, i, 4)} pop={i === ACCENT}>
            <Float seed={`icon-${i}`} sway={3}>
              <LineIcon
                icon={icon}
                x={x}
                y={y}
                size={130}
                accent={i === ACCENT}
              />
            </Float>
          </Reveal>
        );
      })}
    </SceneCanvas>
  </AbsoluteFill>
);
