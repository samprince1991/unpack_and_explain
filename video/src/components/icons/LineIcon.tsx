import type { LucideIcon } from "lucide-react";
import { colors } from "../../brand/tokens";

type LineIconProps = {
  // Any icon from lucide-react, e.g. `import { Router } from "lucide-react"`.
  icon: LucideIcon;
  // Center and size in frame coordinates (same convention as our drawn icons).
  x: number;
  y: number;
  size: number;
  // Amber: only when this icon IS the key element of the beat.
  accent?: boolean;
  // Stroke in px at the drawn size (Lucide draws on a 24-unit grid).
  stroke?: number;
};

// Lucide line icons in diagram style, for use inside SceneCanvas. Saves drawing every
// object by hand; draw a bespoke icon only when no Lucide one fits.
export const LineIcon: React.FC<LineIconProps> = ({
  icon: Icon,
  x,
  y,
  size,
  accent = false,
  stroke = 4,
}) => {
  return (
    <Icon
      x={x - size / 2}
      y={y - size / 2}
      width={size}
      height={size}
      color={accent ? colors.amber[500] : colors.diagram.stroke}
      strokeWidth={(stroke * 24) / size}
    />
  );
};
