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
  // Geometry QC (blender/qc.py, runs before every render). Part pairs that touch or cross
  // on purpose: Freestyle draws no line where surfaces meet, so only list a pair when its
  // junction draws its own line (an open rim, a collar, a flange).
  contacts?: readonly (readonly [string, string])[];
  // Parts whose 52-80 degree edges really are sharp (flat blades, boxes), so QC lets them
  // draw as lines. Round parts never go here: give them more segments instead.
  hardEdges?: readonly string[];
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
  "subsea-cable": {
    title: "Deep-sea fiber cable (stepped cutaway) with repeater and shore ramp",
    file: "models/subsea-cable.glb",
    source: "Procedural, blender/models/subsea_cable.py",
    license: "own",
    parts: {
      jacket: ["jacket"],
      armour: ["armour"],
      copper: ["copper"],
      tube: ["tube"],
      fibers: ["fibers"],
      repeater: ["repeater"],
      shore: ["shore"],
    },
    keyPart: "fibers",
    // Layers slide apart along the cable (fibers out furthest); the repeater and the
    // shore ramp get out of the way so the cross-section reads.
    explode: {
      axis: "x",
      order: ["jacket", "armour", "copper", "tube", "fibers"],
      spacing: 0.14,
      away: ["repeater", "shore"],
    },
    spinAxis: "x",
    useFor: "Undersea / fiber-optic cables, internet backbone, repeaters (idea 10)",
  },
} as const satisfies Record<string, ModelEntry>;

export type ModelId = keyof typeof models;

export const isModelId = (id: string): id is ModelId => id in models;

export const modelParts = (id: ModelId): string[] => Object.keys(models[id].parts);
