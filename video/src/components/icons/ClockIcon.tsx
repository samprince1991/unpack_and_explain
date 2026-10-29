import { colors } from "../../brand/tokens";

// minuteAngle in degrees, 0 = 12 o'clock. The minute hand is the key (amber) element.
export const ClockIcon: React.FC<{ x: number; y: number; size: number; minuteAngle: number }> = ({
  x,
  y,
  size,
  minuteAngle,
}) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <circle r={44} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={5} />
      {[0, 90, 180, 270].map((a) => (
        <line key={a} x1={0} y1={-36} x2={0} y2={-30} stroke={colors.diagram.soft} strokeWidth={3} transform={`rotate(${a})`} />
      ))}
      <line x1={0} y1={0} x2={0} y2={-18} stroke={colors.diagram.stroke} strokeWidth={5} strokeLinecap="round" transform="rotate(120)" />
      <line x1={0} y1={0} x2={0} y2={-30} stroke={colors.amber[500]} strokeWidth={4} strokeLinecap="round" transform={`rotate(${minuteAngle})`} />
      <circle r={4} fill={colors.diagram.stroke} />
    </g>
  );
};
