import { colors } from "../../brand/tokens";

export const PhoneIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <rect x={-28} y={-50} width={56} height={100} rx={10} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={4} />
      <rect x={-22} y={-40} width={44} height={76} rx={4} fill={colors.bg.base} />
      <line x1={-8} y1={43} x2={8} y2={43} stroke={colors.diagram.soft} strokeWidth={3} strokeLinecap="round" />
    </g>
  );
};
