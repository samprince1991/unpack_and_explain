import { colors } from "../../brand/tokens";

export const PlaneIcon: React.FC<{ x: number; y: number; size: number }> = ({ x, y, size }) => {
  return (
    <g transform={`translate(${x} ${y}) scale(${size / 100})`}>
      <path
        d="M-6 -46 L6 -46 L8 -10 L46 12 L46 22 L8 10 L6 34 L18 42 L18 48 L0 44 L-18 48 L-18 42 L-6 34 L-8 10 L-46 22 L-46 12 L-8 -10 Z"
        fill={colors.diagram.stroke}
      />
    </g>
  );
};
