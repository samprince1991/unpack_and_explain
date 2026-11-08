import type { WaveBox } from "../../../components/styles/WaveProfile";

// One hull for setup and payoff, so the two scenes read as the same ship.
export const BOW: WaveBox = {
  left: 150,
  right: 930,
  stem: 700,
  surface: 860,
  deck: 700,
  keel: 1080,
};

// Gauge above the deck, clear of the bow.
export const GAUGE = { cx: 380, cy: 530, r: 110 };
