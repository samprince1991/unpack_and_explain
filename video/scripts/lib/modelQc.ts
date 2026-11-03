import { spawnSync } from "node:child_process";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import type { ModelEntry } from "../../src/brand/models";
import { findBlender } from "./blender";

const VIDEO = resolve(__dirname, "..", "..");
const REPO = resolve(VIDEO, "..");

// Runs blender/qc.py on a model GLB (path under public/). With the catalog entry, part
// contacts are errors unless listed in `contacts`; without it (a new model) they warn.
// Returns true when there are no errors. Throws if Blender is missing.
export const runModelQc = (file: string, entry?: ModelEntry): boolean => {
  const exe = findBlender();
  if (!exe) {
    throw new Error("Blender not found (set BLENDER_PATH in video/.env): can't run geometry QC");
  }
  const args = ["-b", "--factory-startup", "--python", join(REPO, "blender", "qc.py"), "--", join(VIDEO, "public", file)];
  if (entry) {
    const json = join(mkdtempSync(join(tmpdir(), "model-qc-")), "model.json");
    writeFileSync(json, JSON.stringify(entry));
    args.push(json);
  }
  const res = spawnSync(exe, args, { encoding: "utf8" });
  const lines = `${res.stdout}\n${res.stderr}`.split(/\r?\n/).filter((l) => l.startsWith("[qc]"));
  lines.forEach((l) => console.log(l));
  if (!lines.length) {
    throw new Error(`Geometry QC didn't run:\n${res.stderr || res.stdout}`);
  }
  return res.status === 0;
};
