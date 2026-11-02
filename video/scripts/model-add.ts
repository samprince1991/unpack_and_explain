// Adds a 3D model to the catalog (docs/specs/2026-11-02-blender-3d-design.md).
//
//   npm run model:add -- <raw.glb|gltf> --id <id> [--max-tris=80000]
//
// Cleans the model with glTF Transform (dedup, weld, drop textures, center, simplify to
// the triangle budget), writes public/models/<id>.glb, lists its mesh names (to map into
// `parts`), adds a TODO stub to src/brand/models.ts (the catalog test fails until it is
// filled in) and renders 4 look-A preview stills to out/models/<id>/ for approval.
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { NodeIO, type Document } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { center, dedup, prune, simplify, weld } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import { findBlender } from "./lib/blender";

const VIDEO = resolve(__dirname, "..");
const REPO = resolve(VIDEO, "..");

const triangles = (doc: Document) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute("POSITION")?.getCount() ?? 0) / 3, 0);

const stub = (id: string, file: string, names: string[]) => `  "${id}": {
    title: "TODO",
    file: "${file}",
    source: "TODO (URL)",
    license: "CC0", // TODO: CC0 | CC-BY (+ credit) | NASA | own
    parts: {
      // TODO: part name -> object names. Objects: ${names.join(", ")}
      body: ${JSON.stringify(names)},
    },
    keyPart: "body",
    explode: { axis: "x", order: ["body"], spacing: 0.3 },
    spinAxis: "x",
    useFor: "TODO",
  },
`;

const main = async () => {
  const args = process.argv.slice(2);
  const raw = args.find((a) => !a.startsWith("--"));
  const idArg = args.indexOf("--id");
  const id = idArg >= 0 ? args[idArg + 1] : undefined;
  const maxTris = Number(args.find((a) => a.startsWith("--max-tris="))?.split("=")[1] ?? 80000);
  if (!raw || !id || !/^[a-z0-9-]+$/.test(id)) {
    throw new Error("Usage: npm run model:add -- <raw.glb> --id <kebab-id> [--max-tris=80000]");
  }

  await MeshoptSimplifier.ready;
  const io = new NodeIO().registerExtensions(ALL_EXTENSIONS);
  const doc = await io.read(resolve(raw));
  // Look A replaces every material, so textures are dead weight.
  doc.getRoot().listTextures().forEach((t) => t.dispose());
  await doc.transform(dedup(), weld(), center({ pivot: "center" }), prune());
  const before = triangles(doc);
  if (before > maxTris) {
    await doc.transform(
      simplify({ simplifier: MeshoptSimplifier, ratio: maxTris / before, error: 0.01 }),
      prune(),
    );
  }
  const after = triangles(doc);
  if (after > maxTris * 1.2) {
    throw new Error(
      `${Math.round(after)} triangles after simplify (budget ${maxTris}): too dense for line art. Clean it in Blender first.`,
    );
  }

  const file = `models/${id}.glb`;
  mkdirSync(join(VIDEO, "public", "models"), { recursive: true });
  await io.write(join(VIDEO, "public", file), doc);
  const names = doc
    .getRoot()
    .listNodes()
    .filter((n) => n.getMesh())
    .map((n) => n.getName() || "(unnamed)");
  console.log(`[model:add] ${file}: ${Math.round(before)} -> ${Math.round(after)} triangles`);
  console.log(`[model:add] mesh objects: ${names.join(", ")}`);

  const catalog = join(VIDEO, "src", "brand", "models.ts");
  const code = readFileSync(catalog, "utf8");
  if (code.includes(`"${id}": {`)) {
    console.log(`[model:add] ${id} is already in models.ts; not adding a stub`);
  } else {
    const marker = "} as const satisfies Record<string, ModelEntry>;";
    writeFileSync(catalog, code.replace(marker, `${stub(id, file, names)}${marker}`));
    console.log("[model:add] added a TODO stub to src/brand/models.ts: fill it in (npm test checks it)");
  }

  const exe = findBlender();
  if (!exe) {
    console.warn("[model:add] Blender not found: skipped preview stills");
    return;
  }
  const out = join(VIDEO, "out", "models", id);
  const res = spawnSync(
    exe,
    ["-b", "--factory-startup", "--python", join(REPO, "blender", "preview.py"), "--", id, file, out],
    { stdio: "inherit" },
  );
  if (res.status !== 0 || !existsSync(join(out, "view-0.png"))) {
    throw new Error("Blender preview failed");
  }
  console.log(`[model:add] previews: ${out} (check them before using the model)`);
};

main().catch((err: unknown) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
