// Renders a post's 3D cover still for Instagram's "Edit cover".
// Usage: npm run cover -- post-NN-slug   ->  out/post-NN-slug/post-NN-slug-cover.png
import { coverCompositionId } from "../src/templates/coverId";
import { postOutPath } from "./lib/cli";
import { remotion } from "./lib/remotion";

const postId = process.argv[2];
if (!postId) {
  console.error("Usage: npm run cover -- post-NN-slug");
  process.exit(1);
}
process.exit(remotion(["still", coverCompositionId(postId), postOutPath(postId, "cover.png"), "--frame=0"]) ? 0 : 1);
