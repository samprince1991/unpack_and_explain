import { interpolate, useCurrentFrame } from "remotion";
import { clamp, ease } from "../../brand/motion";
import { colors, withAlpha } from "../../brand/tokens";

// A soft band of light crossing an area once (a glint on the key object), starting at
// `at`. Neutral white at low opacity, so it adds depth without adding a color.
export const LightSweep: React.FC<{
  at: number;
  area: { x: number; y: number; width: number; height: number };
  frames?: number;
  strength?: number;
  radius?: number;
}> = ({ at, area, frames = 30, strength = 0.18, radius = 24 }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [at, at + frames], [-0.6, 1.6], { ...clamp, easing: ease.smooth });
  if (frame < at || frame > at + frames) {
    return null;
  }
  const band = withAlpha(colors.text.primary, strength);
  const clear = withAlpha(colors.text.primary, 0);
  return (
    <div
      style={{
        position: "absolute",
        left: area.x,
        top: area.y,
        width: area.width,
        height: area.height,
        overflow: "hidden",
        borderRadius: radius,
        mixBlendMode: "screen",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: "-50%",
          height: "200%",
          width: "40%",
          left: `${p * 100 - 20}%`,
          rotate: "20deg",
          background: `linear-gradient(90deg, ${clear}, ${band}, ${clear})`,
        }}
      />
    </div>
  );
};
