import { describe, expect, it } from "vitest";
import { coverCrop, gridCrop, layout } from "../brand/layout";
import { video } from "../brand/tokens";
import { coverCompositionId } from "./coverId";

describe("cover", () => {
  it("names the composition after the post", () => {
    expect(coverCompositionId("post-21-jet-engine")).toBe("Cover21-JetEngine");
  });

  it("keeps the 4:5 feed crop inside the 3:4 grid crop, which the cover clip fills", () => {
    const feed = coverCrop(video.width, video.height);
    const grid = gridCrop();
    expect(feed.y).toBeGreaterThanOrEqual(grid.y);
    expect(feed.y + feed.height).toBeLessThanOrEqual(grid.y + grid.height);
    expect(layout.blender.cover).toMatchObject({ y: grid.y, height: grid.height });
  });
});
