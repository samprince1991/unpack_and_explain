import { colors } from "../../brand/tokens";

// Side view of the maglev car (nose to the right), sitting on a guideway top at `y`: its
// underside is a straight line `lift` px above it. Shared by the setup and payoff drawings.
export const TRAIN = { left: 170, right: 930, height: 210 };

export const trainPath = (y: number, lift: number): string => {
  const { left, right, height } = TRAIN;
  const bottom = y - lift;
  const top = bottom - height;
  const noseStart = right - 330;
  return [
    `M ${left + 30} ${bottom}`,
    `L ${right - 20} ${bottom}`,
    `Q ${right + 10} ${bottom} ${right} ${bottom - 30}`,
    `C ${right - 80} ${top + 70} ${noseStart + 90} ${top} ${noseStart} ${top}`,
    `L ${left + 30} ${top}`,
    `Q ${left} ${top} ${left} ${top + 30}`,
    `L ${left} ${bottom - 30}`,
    `Q ${left} ${bottom} ${left + 30} ${bottom}`,
    "Z",
  ].join(" ");
};

export const Train: React.FC<{ y: number; lift: number; opacity?: number }> = ({ y, lift, opacity = 1 }) => {
  const bottom = y - lift;
  const winY = bottom - TRAIN.height + 62;
  return (
    <g opacity={opacity}>
      <path
        d={trainPath(y, lift)}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={5}
        strokeLinejoin="round"
      />
      <rect
        x={TRAIN.left + 50}
        y={winY}
        width={420}
        height={34}
        rx={10}
        fill="none"
        stroke={colors.diagram.soft}
        strokeWidth={4}
      />
    </g>
  );
};
