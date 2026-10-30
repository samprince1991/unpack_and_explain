import { carousel, video } from "./tokens";

// Instagram Reels UI overlays. Nothing important may sit in these margins.
// Bottom 350 covers the organic Reels overlay (username, 2-line caption, audio label) with margin;
// Meta's ~670 px applies to ads only.
export const safeZone = { top: 250, bottom: 350, left: 80, right: 150 } as const;

export const contentBox = (width: number, height: number) => ({
  x: safeZone.left,
  y: safeZone.top,
  width: width - safeZone.left - safeZone.right,
  height: height - safeZone.top - safeZone.bottom,
});

// Centered 4:5 area used by the feed preview of the cover frame.
export const coverCrop = (width: number, height: number) => {
  const cropHeight = Math.round((width * 5) / 4);
  return { y: Math.round((height - cropHeight) / 2), height: cropHeight };
};

const content = contentBox(video.width, video.height);

export const layout = {
  content,
  // Symmetric column for anything centered (text, cards). The content box is lopsided
  // (left 80 / right 150), so centering inside it would sit 35 px left of the frame center
  // that diagrams use.
  column: { x: safeZone.right, width: video.width - safeZone.right * 2 },
  // Inside the 4:5 cover crop (starts at y 285) and above the visual region.
  watermark: { x: content.x, y: 292, width: 100 },
  regions: {
    // Scene visuals and the hook title. Starts below the watermark.
    visual: { top: 360, bottom: 1230 },
    captions: { top: 1250, bottom: 1470 },
    source: { top: 1490, bottom: 1560 },
  },
} as const;

// Carousel slides: keep everything clear of the outer 120 px (grid crop and the app's
// rounded corners), centered on the slide. Regions are y ranges; text uses the column.
export const carouselLayout = (width: number, height: number) => {
  const margin = 120;
  const at = (top: number, bottom: number) => ({ top, bottom });
  return {
    margin,
    column: { x: margin, width: width - margin * 2 },
    regions: {
      headline: at(150, 390),
      visual: at(420, 800),
      body: at(830, height - 220),
      footer: at(height - 180, height - margin),
      coverHook: at(190, 560),
      coverVisual: at(590, 930),
      coverBody: at(960, height - 250),
    },
  };
};

export const slideLayout = carouselLayout(carousel.width, carousel.height);
