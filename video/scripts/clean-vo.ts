import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { VoManifest } from "../src/templates/types";
import { voManifestPath } from "../src/templates/vo";
import { cleanVoSection } from "./lib/voClean";

// Removes ElevenLabs stitching bleed from an existing post's VO without regenerating it.
// `npm run tts` already does this for new files; safe to run again (clean files are skipped).
// Usage: npm run vo:clean -- post-02-gps
const main = () => {
  const postId = process.argv[2];
  if (!postId) {
    throw new Error("Usage: npm run vo:clean -- <post-id>");
  }
  const publicDir = join(process.cwd(), "public");
  const manifestFile = join(publicDir, voManifestPath(postId));
  const manifest = JSON.parse(readFileSync(manifestFile, "utf8")) as VoManifest;
  console.log(`Checking ${postId} VO for bleed...`);
  const sections = manifest.sections.map((s) => cleanVoSection(publicDir, s));
  writeFileSync(manifestFile, `${JSON.stringify({ ...manifest, sections }, null, 2)}\n`);
  console.log("Done.");
};

main();
