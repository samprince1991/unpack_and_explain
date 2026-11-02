// Approved 3D models for Blender renders (docs/specs/2026-11-02-blender-3d-design.md).
// Only these can be used in a reel (validateScript enforces it). Add one with
// `npm run model:add -- <raw.glb> --id <id>`, then fill in every TODO field.
//
// license: CC0 and NASA need no credit; CC-BY needs `credit` in the caption;
// "own" = built by us (procedural scripts in blender/models/).
export type ModelLicense = "CC0" | "CC-BY" | "NASA" | "own";

export type ModelEntry = {
  title: string;
  // GLB under public/. A hand-prepared blender/models/<id>.blend wins when present.
  file: string;
  source: string;
  license: ModelLicense;
  // Required for CC-BY: the exact credit line for the caption.
  credit?: string;
  // Part name -> object names inside the model. Beats and shots refer to part names.
  parts: Record<string, string[]>;
  // Default amber part.
  keyPart: string;
  // Axis parts slide along when exploded, and the order they spread in. `away` parts
  // (e.g. a casing) lift out of the way instead, so the inside shows.
  explode: { axis: "x" | "y" | "z"; order: string[]; spacing: number; away?: string[] };
  // Axis a `spin` beat rotates parts around.
  spinAxis: "x" | "y" | "z";
  useFor: string;
};

export const models = {
  "jet-engine": {
    title: "Turbofan jet engine (cutaway)",
    file: "models/jet-engine.glb",
    source: "Procedural, blender/models/jet_engine.py",
    license: "own",
    parts: {
      spinner: ["spinner"],
      fan: ["fan"],
      compressor: ["compressor"],
      combustor: ["combustor"],
      turbine: ["turbine"],
      nozzle: ["nozzle"],
      casing: ["casing"],
    },
    keyPart: "combustor",
    explode: {
      axis: "x",
      order: ["spinner", "fan", "compressor", "combustor", "turbine", "nozzle"],
      spacing: 0.22,
      away: ["casing"],
    },
    spinAxis: "x",
    useFor: "Jet engines, turbines, airflow: suck, squeeze, bang, blow (ideas 3, 19)",
  },
} as const satisfies Record<string, ModelEntry>;

export type ModelId = keyof typeof models;

export const isModelId = (id: string): id is ModelId => id in models;

export const modelParts = (id: ModelId): string[] => Object.keys(models[id].parts);
