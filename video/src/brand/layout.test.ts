import { describe, expect, it } from "vitest";
import { contentBox, coverCrop, layout } from "./layout";

describe("layout", () => {
  it("computes the IG-safe content box for 1080x1920", () => {
    expect(contentBox(1080, 1920)).toEqual({ x: 80, y: 250, width: 850, height: 1320 });
  });

  it("computes the centered 4:5 cover crop", () => {
    expect(coverCrop(1080, 1920)).toEqual({ y: 285, height: 1350 });
  });

  it("keeps every region inside the content box", () => {
    const bottom = layout.content.y + layout.content.height;
    for (const region of Object.values(layout.regions)) {
      expect(region.top).toBeGreaterThanOrEqual(layout.content.y);
      expect(region.bottom).toBeLessThanOrEqual(bottom);
    }
  });

  it("keeps the watermark inside the cover crop and above the visual region", () => {
    const crop = coverCrop(1080, 1920);
    // avatar.svg is cropped to 700x470
    const height = (layout.watermark.width * 470) / 700;
    expect(layout.watermark.y).toBeGreaterThanOrEqual(crop.y);
    expect(layout.watermark.y + height).toBeLessThanOrEqual(layout.regions.visual.top);
  });

  it("keeps the visual region inside the cover crop", () => {
    const crop = coverCrop(1080, 1920);
    expect(layout.regions.visual.top).toBeGreaterThanOrEqual(crop.y);
    expect(layout.regions.visual.bottom).toBeLessThanOrEqual(crop.y + crop.height);
  });
});
