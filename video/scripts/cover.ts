// Renders a post's 3D cover still for Instagram's "Edit cover".
// Usage: npm run cover -- post-NN-slug   ->  out/post-NN-slug-cover.png
import { spawnSync } from "node:child_process";
import { coverCompositionId } from "../src/templates/coverId";

const postId = process.argv[2];
if (!postId) {
  console.error("Usage: npm run cover -- post-NN-slug");
  process.exit(1);
}
const res = spawnSync(
  "npx",
  ["remotion", "still", coverCompositionId(postId), `out/${postId}-cover.png`, "--frame=0"],
  { stdio: "inherit", shell: true },
);
process.exit(res.status ?? 1);
