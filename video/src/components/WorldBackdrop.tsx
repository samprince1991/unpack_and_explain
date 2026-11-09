import { AbsoluteFill } from "remotion";
import { layout } from "../brand/layout";
import { colors, video, withAlpha } from "../brand/tokens";
import { BlenderClip } from "./BlenderClip";
import { DustField } from "./motion/DustField";

const DIM = 0.6;
// Below the waterline in the world's usual framing, above the Instagram UI zone.
const UNDERWATER = { x: 0, y: 1000, width: video.width, height: layout.regions.source.bottom - 1000 };

// The world behind a 2D scene (setup, payoff): the ship-free clip, dimmed so diagrams read.
export const WorldBackdrop: React.FC = () => (
  <AbsoluteFill>
    <BlenderClip clip="backdrop" />
    <AbsoluteFill style={{ backgroundColor: withAlpha(colors.bg.base, DIM) }} />
  </AbsoluteFill>
);

// Specks drifting in the water, over the world's 3D clips.
export const WorldDust: React.FC = () => <DustField count={22} seed="world" area={UNDERWATER} />;

// Soft dark band so captions stay readable over a busy picture.
export const CaptionScrim: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: layout.regions.captions.top - 90,
      height: layout.regions.captions.bottom - layout.regions.captions.top + 180,
      background: `linear-gradient(${withAlpha(colors.bg.base, 0)}, ${withAlpha(colors.bg.base, 0.55)} 30%, ${withAlpha(colors.bg.base, 0.55)} 70%, ${withAlpha(colors.bg.base, 0)})`,
    }}
  />
);
