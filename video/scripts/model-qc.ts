// Geometry QC for catalog models (blender/qc.py): crease-band edges that draw as broken or
// faceted lines, and parts that touch or cross without a line at the junction.
//
//   npm run model:qc            every model in src/brand/models.ts
//   npm run model:qc -- <id>    one model
import { isModelId, models, type ModelEntry } from "../src/brand/models";
import { runModelQc } from "./lib/modelQc";

const ids = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const targets = ids.length ? ids : Object.keys(models);
let ok = true;
for (const id of targets) {
  if (!isModelId(id)) {
    console.error(`Unknown model "${id}". Known: ${Object.keys(models).join(", ")}`);
    process.exit(1);
  }
  const entry: ModelEntry = models[id];
  ok = runModelQc(entry.file, entry) && ok;
}
process.exit(ok ? 0 : 1);
