import { video } from "./tokens";

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
  // Inside the 4:5 cover crop (starts at y 285) and above the visual region.
  watermark: { x: content.x, y: 292, width: 100 },
  regions: {
    // Scene visuals and the hook title. Starts below the watermark.
    visual: { top: 360, bottom: 1230 },
    captions: { top: 1250, bottom: 1470 },
    source: { top: 1490, bottom: 1560 },
  },
} as const;
