import { colors } from "../../brand/tokens";

// The pin's tip sits at (x, y).
export const PinIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100}) translate(0 -48)`}>
      <path d="M0 48 C-4 30 -32 10 -32 -14 A32 32 0 1 1 32 -14 C32 10 4 30 0 48 Z" fill={colors.amber[500]} />
      <circle cx={0} cy={-14} r={12} fill={colors.bg.base} />
    </g>
  );
};
