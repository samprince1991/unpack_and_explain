import { colors } from "../../brand/tokens";

type PhoneFrameProps = {
  // Center of the phone, frame coordinates.
  x: number;
  y: number;
  width: number;
  height: number;
  // Screen content, drawn in frame coordinates inside phoneScreen().
  children?: React.ReactNode;
};

// Inner screen area for laying out content.
export const phoneScreen = (x: number, y: number, width: number, height: number) => ({
  left: x - width / 2 + 36,
  top: y - height / 2 + 70,
  width: width - 72,
  height: height - 110,
});

// UI mock style: a phone outline for showing an app screen. Neutral line art.
export const PhoneFrame: React.FC<PhoneFrameProps> = ({ x, y, width, height, children }) => {
  const left = x - width / 2;
  const top = y - height / 2;
  return (
    <g>
      <rect
        x={left}
        y={top}
        width={width}
        height={height}
        rx={48}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={5}
      />
      <rect x={x - 50} y={top + 22} width={100} height={14} rx={7} fill={colors.diagram.faint} />
      {children}
    </g>
  );
};
