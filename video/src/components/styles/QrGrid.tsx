import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";

type Cell = readonly [number, number];

type QrGridProps = {
  // Rows of "1" (dark module) and "0" (light), top row first. A real encoded code reads best.
  matrix: readonly string[];
  // Center of the code and the size of one module, in px.
  cx: number;
  cy: number;
  cell: number;
  // Quiet zone round the code, in modules (drawn as the card).
  margin?: number;
  // The one amber cell group (e.g. one bit), shown from `accentAt` to `accentExitAt`.
  accent?: readonly Cell[];
  accentAt?: number;
  accentExitAt?: number;
  // Cells that go missing (torn, covered): they fade out from `missingAt`.
  missing?: (row: number, col: number) => boolean;
  missingAt?: number;
  // Local frame the whole code fades in.
  at?: number;
};

// Line-art QR code: neutral modules on a raised card, one amber cell group, and an optional
// set of cells that go missing. SVG, for use inside SceneCanvas. Wrap it in a group to tilt
// or scale it.
export const QrGrid: React.FC<QrGridProps> = ({
  matrix,
  cx,
  cy,
  cell,
  margin = 2,
  accent = [],
  accentAt,
  accentExitAt,
  missing,
  missingAt,
  at = 0,
}) => {
  const frame = useCurrentFrame();
  const n = matrix.length;
  const size = n * cell;
  const x0 = cx - size / 2;
  const y0 = cy - size / 2;
  const pad = margin * cell;
  const inset = Math.max(1, cell * 0.08);
  const enter = interpolate(frame, [at, at + durations.enter], [0, 1], { ...clamp, easing: ease.smooth });
  const gone =
    missingAt === undefined ? 1 : interpolate(frame, [missingAt, missingAt + durations.enter], [1, 0], { ...clamp, easing: ease.smooth });
  const accentIn =
    accentAt === undefined ? 0 : interpolate(frame, [accentAt, accentAt + durations.enter], [0, 1], { ...clamp, easing: ease.out });
  const accentOut =
    accentExitAt === undefined ? 1 : interpolate(frame, [accentExitAt, accentExitAt + durations.enter], [1, 0], clamp);
  const isAccent = new Set(accent.map(([r, c]) => `${r},${c}`));

  const modules: React.ReactNode[] = [];
  matrix.forEach((row, r) => {
    [...row].forEach((bit, c) => {
      if (bit !== "1" || isAccent.has(`${r},${c}`)) {
        return;
      }
      const lost = missing?.(r, c) ?? false;
      modules.push(
        <rect
          key={`${r}-${c}`}
          x={x0 + c * cell + inset / 2}
          y={y0 + r * cell + inset / 2}
          width={cell - inset}
          height={cell - inset}
          rx={cell * 0.12}
          fill={colors.diagram.soft}
          opacity={lost ? gone : 1}
        />,
      );
    });
  });

  return (
    <Interactive.G name="QR code" style={{ opacity: enter }}>
      <rect
        x={x0 - pad}
        y={y0 - pad}
        width={size + 2 * pad}
        height={size + 2 * pad}
        rx={cell * 1.2}
        fill={colors.diagram.fill}
        stroke={colors.diagram.stroke}
        strokeWidth={4}
      />
      {modules}
      {accent.map(([r, c]) => (
        <rect
          key={`a-${r}-${c}`}
          x={x0 + c * cell + inset / 2}
          y={y0 + r * cell + inset / 2}
          width={cell - inset}
          height={cell - inset}
          rx={cell * 0.12}
          fill={matrix[r][c] === "1" ? colors.diagram.soft : colors.diagram.fill}
        />
      ))}
      {accent.map(([r, c]) => (
        <rect
          key={`h-${r}-${c}`}
          x={x0 + c * cell + inset / 2}
          y={y0 + r * cell + inset / 2}
          width={cell - inset}
          height={cell - inset}
          rx={cell * 0.12}
          fill={colors.amber[500]}
          opacity={accentIn * accentOut}
        />
      ))}
    </Interactive.G>
  );
};
