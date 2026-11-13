// Renders a post's 3D cover still for Instagram's "Edit cover", then the profile-grid check.
// Usage: npm run cover -- post-NN-slug
//   -> out/post-NN-slug/post-NN-slug-cover.png (the previous one kept as -cover.prev.png)
//   -> out/qa/cover-grid.png: the new cover first, then the previous version (if any), then
//      the other posts' covers, newest first, at profile-grid size (docs/blender.md "Cover").
import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { coverCompositionId } from "../src/templates/coverId";
import { postOutPath } from "./lib/cli";
import { remotion } from "./lib/remotion";

const GRID_TILES = 9;
const postId = process.argv[2];
if (!postId) {
  console.error("Usage: npm run cover -- post-NN-slug");
  process.exit(1);
}

const coverPath = postOutPath(postId, "cover.png");
const prevPath = postOutPath(postId, "cover.prev.png");
if (existsSync(coverPath)) {
  copyFileSync(coverPath, prevPath);
}
if (!remotion(["still", coverCompositionId(postId), coverPath, "--frame=0"])) {
  process.exit(1);
}

const others = readdirSync("out", { withFileTypes: true })
  .filter((d) => d.isDirectory() && /^post-\d+/.test(d.name) && d.name !== postId)
  .map((d) => join("out", d.name, `${d.name}-cover.png`))
  .filter((p) => existsSync(p))
  .sort((a, b) => Number(b.match(/post-(\d+)/)?.[1]) - Number(a.match(/post-(\d+)/)?.[1]));
const tiles = [coverPath, ...(existsSync(prevPath) ? [prevPath] : []), ...others].slice(0, GRID_TILES);
mkdirSync("out/qa", { recursive: true });
const python = process.env.PYTHON ?? (process.platform === "win32" ? "python" : "python3");
const grid = spawnSync(python, ["scripts/cover-grid.py", "out/qa/cover-grid.png", ...tiles], { stdio: "inherit" });
if (grid.status !== 0) {
  console.warn("[cover] grid check skipped (needs Python + Pillow): judge the cover at grid size by hand");
} else {
  console.log(`[cover] grid order: ${tiles.join(", ")}`);
  console.log("[cover] check out/qa/cover-grid.png: is the subject clear and the title readable at that size?");
}
