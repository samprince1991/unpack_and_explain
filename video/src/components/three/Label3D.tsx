import { Interactive } from "remotion";
import { fonts, weights } from "../../brand/fonts";
import { colors, typeScale } from "../../brand/tokens";
import { projectToScreen, type StageView, type Vec3 } from "./stage";

type Label3DProps = {
  view: StageView;
  // Scene point the label is centered on, and a pixel nudge (e.g. above a bar).
  at: Vec3;
  offsetY?: number;
  opacity?: number;
  accent?: boolean;
  // Shrink with distance like the 3D around it (icons on a ring), times `scale`.
  depthScale?: boolean;
  scale?: number;
  children: React.ReactNode;
};

// 2D text pinned to a 3D point. Text never renders in WebGL, so brand fonts apply.
export const Label3D: React.FC<Label3DProps> = ({
  view,
  at,
  offsetY = 0,
  opacity = 1,
  accent = false,
  depthScale = false,
  scale = 1,
  children,
}) => {
  const projected = projectToScreen(at, view);
  const { x, y } = projected;
  return (
    <Interactive.Div
      name="3D label"
      style={{
        position: "absolute",
        left: x,
        top: y + offsetY,
        translate: "-50% -50%",
        scale: String((depthScale ? projected.scale : 1) * scale),
        whiteSpace: "nowrap",
        fontFamily: fonts.body,
        fontWeight: weights.bodyMedium,
        fontSize: typeScale.label,
        color: accent ? colors.amber[500] : colors.text.primary,
        opacity,
      }}
    >
      {children}
    </Interactive.Div>
  );
};
