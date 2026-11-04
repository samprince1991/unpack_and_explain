import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { colors } from "../../brand/tokens";
import { enterProgress, exitProgress, stagger } from "../motion/progress";

type ShareGridProps = {
  // Center of the grid and the size of one cell.
  cx: number;
  cy: number;
  cell: number;
  gap?: number;
  // Grid size; 10 x 10 = one cell per percent.
  cols?: number;
  rows?: number;
  // Cells that turn amber (fractions allowed: 1.5 = one full cell and half of the next).
  share: number;
  // Local frames: cells fill in row by row from `at`; the share turns amber at
  // `highlightAt`; everything fades from `exitAt`.
  at?: number;
  highlightAt: number;
  exitAt?: number;
};

// "X out of 100" share chart: a grid of neutral cells where the share fills in amber.
// Reads at a glance for small percentages that a pie or bar would hide. Amber starts at
// the top-left cell. SVG, for use inside SceneCanvas.
export const ShareGrid: React.FC<ShareGridProps> = ({
  cx,
  cy,
  cell,
  gap = 10,
  cols = 10,
  rows = 10,
  share,
  at = 0,
  highlightAt,
  exitAt,
}) => {
  const frame = useCurrentFrame();
  const width = cols * cell + (cols - 1) * gap;
  const height = rows * cell + (rows - 1) * gap;
  const x0 = cx - width / 2;
  const y0 = cy - height / 2;
  const fillIn = interpolate(frame, [highlightAt, highlightAt + durations.enter + 6], [0, 1], {
    ...clamp,
    easing: ease.out,
  });
  const out = exitProgress(frame, exitAt);

  return (
    <Interactive.G name="Share grid" style={{ opacity: out }}>
      {Array.from({ length: rows * cols }, (_, i) => {
        const col = i % cols;
        const row = Math.floor(i / cols);
        const x = x0 + col * (cell + gap);
        const y = y0 + row * (cell + gap);
        const p = enterProgress(frame, stagger(at, row, 2), durations.enter);
        // How much of this cell is amber (0-1), growing left to right.
        const amber = Math.max(0, Math.min(1, share - i)) * fillIn;
        return (
          <g key={i} style={{ opacity: p }}>
            <rect
              x={x}
              y={y}
              width={cell}
              height={cell}
              rx={6}
              fill={colors.diagram.fill}
              stroke={colors.diagram.faint}
              strokeWidth={3}
            />
            {amber > 0 ? (
              <rect x={x} y={y} width={cell * amber} height={cell} rx={6} fill={colors.amber[500]} />
            ) : null}
          </g>
        );
      })}
    </Interactive.G>
  );
};
