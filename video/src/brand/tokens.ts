// The only file allowed to contain color values. See CLAUDE.md.
export const colors = {
  bg: { base: "#0f172a", raised: "#1e293b" },
  teal: {
    100: "#99f6e4",
    300: "#5eead4",
    400: "#2dd4bf",
    600: "#0d9488",
    700: "#0f766e",
  },
  amber: { 300: "#fcd34d", 500: "#f59e0b", 600: "#d97706" },
  coral: "#FF5A5F",
  text: { primary: "#f8fafc", secondary: "#cbd5e1", muted: "#94a3b8" },
  // Neutral line art for all scene diagrams. Teal is reserved for brand moments
  // (logo, step badges, CTA, FACT); amber marks the one key element per scene.
  diagram: { stroke: "#e2e8f0", soft: "#94a3b8", faint: "#475569", fill: "#1e293b" },
  // Muted world tones for Blender environments (docs/blender.md).
  // Backdrop only: amber stays the one key color, and scene objects keep diagram colors.
  env: {
    skyTop: "#111c30",
    horizon: "#6b7a8c",
    // Sea (sea and coast worlds): daylight water. Blue, never teal (teal is brand only).
    surface: "#2b5d86",
    seaShallow: "#1e5a85",
    seaDeep: "#0a2340",
    light: "#f6d7a3",
    // Outdoor daylight (sea, coast, track, rail): sky top, horizon haze and the sun.
    // Indoor worlds (bench, cafe) keep the dark skyTop / horizon / light above.
    skyDay: "#24508f",
    horizonDay: "#8aa6c4",
    sunDay: "#fff3dc",
    // Snow world (a night world): the night haze, cool white LED lamp light (never warm: warm
    // light sits too close to amber), snow (a mid grey-blue, darker than the white line art
    // so outlines still read on it), ploughed slush and the falling flakes. Its sky top is
    // the dark skyTop above.
    horizonNight: "#25344a",
    lamp: "#dce6ff",
    snow: "#8b9cb1",
    slush: "#4a5464",
    flake: "#dfe7f0",
    // Coast world: beach, grassland, roads and the posts, poles and lamps on them.
    sand: "#4d4838",
    land: "#1f2c25",
    road: "#1b2029",
    structure: "#3b4553",
  },
} as const;

export const withAlpha = (hex: string, alpha: number): string => {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) {
    throw new Error(`withAlpha expects #rrggbb, got ${hex}`);
  }
  const channel = Math.round(Math.min(1, Math.max(0, alpha)) * 255);
  return `${hex}${channel.toString(16).padStart(2, "0")}`;
};

export const brand = {
  name: "Unpack & Explain",
  tagline: "How things actually work",
  ctaLine: "Follow Unpack and Explain for how things actually work.",
  handle: "@unpack_and_explain",
} as const;

export const typeScale = {
  // One big word as a whole beat (question card bigTopic, kinetic type).
  display: 128,
  // Reel cover title: the one text on the profile grid, so bigger than anything in the reel.
  cover: 150,
  hook: 104,
  // Opening question card: longer than the hook, so a step smaller to sit in ~3 lines.
  question: 88,
  title: 72,
  caption: 64,
  label: 46,
  source: 32,
} as const;

export const video = { width: 1080, height: 1920, fps: 30 } as const;


// Carousels (format C): 4:5 feed slides, read on a phone at about a third of real size,
// so body text stays >= 44 px and the footer/source >= 32 px.
export const carousel = { width: 1080, height: 1350 } as const;

export const carouselType = {
  cover: 100,
  headline: 76,
  body: 46,
  footer: 32,
} as const;
