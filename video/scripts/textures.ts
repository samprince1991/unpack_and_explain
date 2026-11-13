// Downloads and verifies the Blender photo textures (docs/blender.md "Textures").
//
//   npm run textures                 (every texture in src/brand/textures.ts)
//   npm run textures -- --update     (accept changed upstream files: re-pin their md5)
//
// `npm run blender` runs the same check for the textures its world needs, so this is only
// needed to fetch ahead of time or after --update.
import { join, resolve } from "node:path";
import { textures } from "../src/brand/textures";
import { ensureTextures, httpIo } from "./lib/textures";

const REPO = resolve(__dirname, "..", "..");
const DIR = join(REPO, "blender", "textures");

const main = async () => {
  const update = process.argv.includes("--update");
  const ids = Object.keys(textures);
  const { paths } = await ensureTextures({
    catalog: textures,
    ids,
    dir: DIR,
    lockPath: join(DIR, "textures.lock.json"),
    io: httpIo,
    update,
  });
  for (const id of ids) {
    console.log(`[textures] ${id}: ${Object.keys(paths[id]).join(", ")} OK`);
  }
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
