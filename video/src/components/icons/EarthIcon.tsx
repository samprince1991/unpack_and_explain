import { colors } from "../../brand/tokens";

export const EarthIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <circle r={48} fill={colors.diagram.fill} stroke={colors.diagram.stroke} strokeWidth={2} />
      <ellipse rx={20} ry={48} fill="none" stroke={colors.diagram.faint} strokeWidth={1.5} />
      <line x1={-48} y1={0} x2={48} y2={0} stroke={colors.diagram.faint} strokeWidth={1.5} />
      <path d="M-30 -22 C-18 -30 -6 -26 -4 -14 C-2 -4 -16 0 -24 -6 C-32 -10 -36 -16 -30 -22 Z" fill={colors.diagram.faint} />
      <path d="M8 6 C20 2 32 8 30 20 C28 32 14 34 8 24 C4 18 2 10 8 6 Z" fill={colors.diagram.faint} />
    </g>
  );
};
