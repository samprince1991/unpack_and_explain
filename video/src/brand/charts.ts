import { typeScale } from "./tokens";

// Chart kit rules (src/components/charts). Data only, no React.
// Limits keep every chart readable at phone size with 46 px labels.
export const charts = {
  // Main shapes / axes and guides.
  stroke: 4,
  strokeSoft: 3,
  labelSize: typeScale.label,
  // Average glyph width of Inter Medium, in em. Used to fit-check labels.
  charWidth: 0.55,
  radius: 10,
  // Gap between vertical bars, as a fraction of the band.
  barGap: 0.3,
  // Thickest horizontal bar (px), so a few bars don't turn into slabs.
  barMax: 64,
  // Frames between items entering one after another.
  stagger: 5,
  // How far the key pie slice pulls out (px).
  pull: 18,
  limits: {
    bars: 6,
    points: 8,
    slices: 6,
    stages: 6,
    leaves: 8,
    treeLevel: 5,
    treeDepth: 3,
    sankeyColumn: 4,
    sankeyColumns: 3,
  },
} as const;
