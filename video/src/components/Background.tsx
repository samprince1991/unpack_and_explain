import { AbsoluteFill } from "remotion";
import { colors } from "../brand/tokens";

export const Background: React.FC = () => {
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(circle at 50% 45%, ${colors.bg.raised} 0%, ${colors.bg.base} 70%)`,
      }}
    />
  );
};
