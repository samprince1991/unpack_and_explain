import { colors } from "../../../brand/tokens";

export type EnginePart =
  | "fan"
  | "compressor"
  | "combustor"
  | "turbine"
  | "shaft";

type EngineSideProps = {
  // Center of the engine and its size (1 = 720 px long).
  cx: number;
  cy: number;
  scale?: number;
  // The one amber part on this slide.
  keyPart?: EnginePart;
  // Air arrows going in at the front / gas arrows leaving the back.
  intake?: boolean;
  exhaust?: boolean;
};

// Side cutaway of a turbofan in neutral line art: nacelle, fan, compressor stages,
// combustor (flame), turbine stages and the shaft that links them. Static SVG for
// carousel slides (inside SlideCanvas); one part is drawn amber.
export const EngineSide: React.FC<EngineSideProps> = ({
  cx,
  cy,
  scale = 1,
  keyPart,
  intake = false,
  exhaust = false,
}) => {
  const x = (v: number) => cx + v * scale;
  const y = (v: number) => cy + v * scale;
  const p = (vx: number, vy: number) => `${x(vx)} ${y(vy)}`;
  const tone = (part: EnginePart, base: string = colors.diagram.soft) =>
    part === keyPart ? colors.amber[500] : base;
  const width = (part: EnginePart, base: number) =>
    part === keyPart ? base + 2 : base;

  // Blades as two strokes (above and below the shaft), so the shaft reads through them.
  const blades = (
    part: EnginePart,
    xs: number[],
    half: (i: number) => number,
  ) =>
    xs.map((bx, i) => (
      <g key={`${part}-${bx}`}>
        <line x1={x(bx)} y1={y(-half(i))} x2={x(bx)} y2={y(-10)} />
        <line x1={x(bx)} y1={y(10)} x2={x(bx)} y2={y(half(i))} />
      </g>
    ));

  const arrow = (x1: number, x2: number, ay: number) => (
    <g key={`${x1}-${ay}`}>
      <line x1={x(x1)} y1={y(ay)} x2={x(x2)} y2={y(ay)} />
      <path
        d={`M ${p(x2 - 14, ay - 10)} L ${p(x2, ay)} L ${p(x2 - 14, ay + 10)}`}
      />
    </g>
  );

  return (
    <g strokeLinecap="round" strokeLinejoin="round" fill="none">
      {/* Shaft first, so the combustor's fill sits over its middle. */}
      <line
        x1={x(-315)}
        y1={y(0)}
        x2={x(205)}
        y2={y(0)}
        stroke={tone("shaft", colors.diagram.faint)}
        strokeWidth={width("shaft", 6)}
      />

      {/* Nacelle (outer casing). */}
      <g stroke={colors.diagram.stroke} strokeWidth={5}>
        <path
          d={`M ${p(-335, -120)} L ${p(170, -120)} Q ${p(280, -118)} ${p(340, -70)}`}
        />
        <path
          d={`M ${p(-335, 120)} L ${p(170, 120)} Q ${p(280, 118)} ${p(340, 70)}`}
        />
      </g>
      {/* Core casing. */}
      <g stroke={colors.diagram.faint} strokeWidth={4}>
        <path
          d={`M ${p(-265, -62)} L ${p(225, -62)} Q ${p(295, -60)} ${p(340, -34)}`}
        />
        <path
          d={`M ${p(-265, 62)} L ${p(225, 62)} Q ${p(295, 60)} ${p(340, 34)}`}
        />
      </g>

      {/* Fan + spinner. */}
      <ellipse
        cx={x(-315)}
        cy={y(0)}
        rx={14 * scale}
        ry={104 * scale}
        fill={colors.diagram.fill}
        stroke={tone("fan", colors.diagram.stroke)}
        strokeWidth={width("fan", 5)}
      />
      <path
        d={`M ${p(-372, 0)} Q ${p(-360, -34)} ${p(-325, -36)} L ${p(-325, 36)} Q ${p(-360, 34)} ${p(-372, 0)} Z`}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4}
      />

      <g stroke={tone("compressor")} strokeWidth={width("compressor", 5)}>
        {blades(
          "compressor",
          [-235, -205, -175, -145, -115, -85],
          (i) => 50 - i * 3.2,
        )}
      </g>

      <rect
        x={x(-55)}
        y={y(-44)}
        width={110 * scale}
        height={88 * scale}
        rx={24 * scale}
        fill={colors.diagram.fill}
        stroke={tone("combustor")}
        strokeWidth={width("combustor", 4)}
      />
      <path
        d={`M ${p(-38, 0)} Q ${p(-8, -28)} ${p(32, -8)} Q ${p(12, 0)} ${p(32, 8)} Q ${p(-8, 28)} ${p(-38, 0)} Z`}
        fill={keyPart === "combustor" ? colors.amber[500] : colors.diagram.fill}
        stroke={tone("combustor")}
        strokeWidth={width("combustor", 4)}
      />

      <g stroke={tone("turbine")} strokeWidth={width("turbine", 5)}>
        {blades("turbine", [90, 120, 150, 180], (i) => 38 + i * 4)}
      </g>

      {intake ? (
        <g stroke={colors.diagram.soft} strokeWidth={4}>
          {[-70, 70].map((ay) => arrow(-410, -372, ay))}
        </g>
      ) : null}
      {exhaust ? (
        <g stroke={colors.diagram.soft} strokeWidth={4}>
          {[-18, 18].map((ay) => arrow(355, 405, ay))}
        </g>
      ) : null}
    </g>
  );
};
