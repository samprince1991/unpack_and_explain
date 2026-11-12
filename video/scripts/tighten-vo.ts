import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VoManifest } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";
import { tightenVoSection } from "./lib/voTighten";

// Shortens pauses between words longer than 450 ms to 400 ms of silence (cuts only inside
// silence) and shifts the captions to match. For a reel just over length. Safe to run twice.
// Usage: npm run vo:tighten -- post-31-maglev
const main = () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run vo:tighten -- <post-id>");
  }
  const publicDir = join(process.cwd(), "public");
  const manifestFile = join(publicDir, voManifestPath(postId));
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as VoManifest;
  console.log(`Shortening long pauses in ${postId} VO...`);
  const sections = manifest.sections.map((s) => tightenVoSection(publicDir, s));
  writeFileSync(manifestFile, `${JSON.stringify({ ...manifest, sections }, null, 2)}\n`);
  console.log("Done.");
};

try {
  main();
} catch (err) {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
}
