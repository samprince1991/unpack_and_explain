import { Landmark, type LucideIcon } from "lucide-react";
import { fonts, weights } from "../../../brand/fonts";
import { colors } from "../../../brand/tokens";
import { LineIcon } from "../../../components/icons/LineIcon";

// Bank card, drawn around its center. `number` (0..1) fades the chip and contactless
// mark out and the card number in: the card is "just a number".
export const Card: React.FC<{
  x: number;
  y: number;
  width: number;
  number?: number;
  numberColor?: string;
}> = ({ x, y, width, number = 0, numberColor = colors.amber[500] }) => {
  const s = width / 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect
        x={-150}
        y={-95}
        width={300}
        height={190}
        rx={18}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4 / s}
      />
      <g opacity={1 - number}>
        <rect
          x={-115}
          y={-40}
          width={52}
          height={40}
          rx={6}
          fill="none"
          stroke={colors.diagram.soft}
          strokeWidth={3 / s}
        />
        {[14, 26, 38].map((r) => (
          <path
            key={r}
            d={`M ${95 + r * Math.cos(-0.7)} ${-40 + r * Math.sin(-0.7)} A ${r} ${r} 0 0 1 ${95 + r * Math.cos(0.7)} ${-40 + r * Math.sin(0.7)}`}
            fill="none"
            stroke={colors.diagram.soft}
            strokeWidth={3 / s}
            strokeLinecap="round"
          />
        ))}
        <rect
          x={-115}
          y={40}
          width={150}
          height={10}
          rx={5}
          fill={colors.diagram.faint}
        />
      </g>
      <text
        x={0}
        y={14}
        textAnchor="middle"
        opacity={number}
        fill={numberColor}
        style={{
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: 40,
          letterSpacing: 2,
        }}
      >
        •••• 4821
      </text>
    </g>
  );
};

// Card terminal, drawn around its center (size = body height).
export const Terminal: React.FC<{ x: number; y: number; size: number }> = ({
  x,
  y,
  size,
}) => {
  const s = size / 300;
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`}>
      <rect
        x={-100}
        y={-150}
        width={200}
        height={300}
        rx={26}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4 / s}
      />
      <rect
        x={-72}
        y={-122}
        width={144}
        height={86}
        rx={10}
        fill="none"
        stroke={colors.diagram.soft}
        strokeWidth={3 / s}
      />
      {[0, 1, 2].flatMap((row) =>
        [0, 1, 2].map((col) => (
          <circle
            key={`${row}-${col}`}
            cx={-48 + col * 48}
            cy={10 + row * 40}
            r={10}
            fill={colors.diagram.faint}
          />
        )),
      )}
    </g>
  );
};

// A bank, with a small badge icon saying whose bank it is (shop's or yours).
export const Bank: React.FC<{
  x: number;
  y: number;
  size: number;
  badge: LucideIcon;
}> = ({ x, y, size, badge }) => {
  const b = { x: x + size * 0.38, y: y + size * 0.36, r: size * 0.22 };
  return (
    <g>
      <LineIcon icon={Landmark} x={x} y={y} size={size} />
      <circle
        cx={b.x}
        cy={b.y}
        r={b.r}
        fill={colors.bg.raised}
        stroke={colors.diagram.soft}
        strokeWidth={3}
      />
      <LineIcon icon={badge} x={b.x} y={b.y} size={b.r * 1.15} stroke={3} />
    </g>
  );
};
