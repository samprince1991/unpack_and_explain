import { colors } from "../../brand/tokens";

export const SatelliteIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <rect x={-48} y={-8} width={30} height={16} fill={colors.diagram.faint} stroke={colors.diagram.soft} strokeWidth={2} />
      <rect x={18} y={-8} width={30} height={16} fill={colors.diagram.faint} stroke={colors.diagram.soft} strokeWidth={2} />
      <rect x={-12} y={-12} width={24} height={24} rx={3} fill={colors.diagram.stroke} />
      <line x1={0} y1={12} x2={0} y2={24} stroke={colors.diagram.soft} strokeWidth={3} />
      <circle cx={0} cy={27} r={4} fill={colors.diagram.soft} />
    </g>
  );
};
