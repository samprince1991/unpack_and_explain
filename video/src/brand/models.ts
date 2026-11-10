// Approved 3D models for Blender renders (docs/blender.md).
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
  // Parts hidden in every clip until an `appear` beat (arrows, axes).
  appearOnly?: readonly string[];
  // `shift` beats stretch these parts along `axis`, keeping the end named by the part's
  // value fixed (a spring on an anchor), so the other end stays on the part that slides.
  flex?: { axis: "x" | "y" | "z"; parts: Readonly<Record<string, "min" | "max">> };
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
  "data-center": {
    title: "Data-center campus: open hall with server racks, two more sites, feed and link cables",
    file: "models/data-center.glb",
    source: "Procedural, blender/models/data_center.py",
    license: "own",
    parts: {
      hall: ["hall"],
      racks: ["racks"],
      rack: ["rack"],
      drive: ["drive"],
      site2: ["site2"],
      site3: ["site3"],
      feed: ["feed"],
      links: ["links"],
    },
    keyPart: "rack",
    // The hall's racks lift out of the open roof (the key rack and its drive highest);
    // the other sites and the cables drop out of the way.
    explode: {
      axis: "z",
      order: ["hall", "racks", "rack", "drive"],
      spacing: 0.18,
      away: ["site2", "site3", "feed", "links"],
    },
    spinAxis: "z",
    useFor: "Cloud storage, data centers, servers, backups, redundancy (idea 12)",
  },
  "bulbous-bow": {
    title: "Ship's bow with a bulbous bow, calm waterline, bow wave and the bulb's own wave",
    file: "models/bulbous-bow.glb",
    source: "Procedural, blender/models/bulbous_bow.py",
    license: "own",
    parts: {
      hull: ["hull"],
      bulb: ["bulb"],
      waterline: ["waterline"],
      bowwave: ["bowwave"],
      bulbwave: ["bulbwave"],
    },
    keyPart: "bulb",
    // Nothing spreads out (spacing 0): "explode" means the waves cancel. The two wave
    // lines are `away` parts, so explode sinks them out of view and leaves the calm
    // waterline; collapse brings them back up. Clips that start without waves start
    // exploded.
    explode: {
      axis: "z",
      order: ["hull", "bulb", "waterline"],
      spacing: 0,
      away: ["bowwave", "bulbwave"],
    },
    spinAxis: "x",
    useFor: "Ships, hulls, bow waves, wave cancelling, fuel use at sea (idea 26)",
  },
  "credit-weights": {
    title: "Five calibration weights on a rack, sized by importance, with a half-ring dial on a post",
    file: "models/credit-weights.glb",
    source: "Procedural, blender/models/credit_weights.py",
    license: "own",
    parts: {
      payment: ["payment"],
      owed: ["owed"],
      history: ["history"],
      newcredit: ["newcredit"],
      mix: ["mix"],
      dial: ["dial"],
      post: ["post"],
      rack: ["rack"],
    },
    keyPart: "payment",
    // Nothing spreads out (spacing 0): weights lift forward with `shift` beats. "explode" clears
    // the dial and its post out of the close-ups, and "collapse" brings them back.
    explode: {
      axis: "x",
      order: ["payment", "owed", "history", "newcredit", "mix"],
      spacing: 0,
      away: ["dial", "post"],
    },
    spinAxis: "z",
    useFor: "Weighing things up, scores and ratings, how much each factor counts (idea 7)",
  },
  "mems-accelerometer": {
    title: "Phone with an accelerometer chip: LGA package, control chip, bond wires, MEMS die, perforated weight with comb fingers, folded springs, axis arrows",
    file: "models/mems-accelerometer.glb",
    source: "Procedural, blender/models/mems_accelerometer.py",
    license: "own",
    parts: {
      phone: ["phone"],
      lid: ["lid"],
      base: ["base"],
      asic: ["asic"],
      wires: ["wires"],
      frame: ["frame"],
      weight: ["weight"],
      fixedtop: ["fixedtop"],
      fixedbottom: ["fixedbottom"],
      springleft: ["springleft"],
      springright: ["springright"],
      axisx: ["axisx"],
      axisy: ["axisy"],
      ground: ["ground"],
    },
    keyPart: "weight",
    // Nothing spreads out (spacing 0): "explode" means opening up. The phone and the chip's
    // lid are `away` parts, so explode removes them and leaves the die.
    explode: {
      axis: "y",
      order: ["base", "asic", "wires", "frame", "fixedtop", "fixedbottom", "springleft", "springright", "weight"],
      spacing: 0,
      away: ["phone", "lid"],
    },
    spinAxis: "z",
    appearOnly: ["axisx", "axisy", "ground"],
    // The arrows only appear after the lid has gone, so the two are never on screen together.
    contacts: [
      ["axisx", "lid"],
      ["axisy", "lid"],
      ["ground", "lid"],
    ],
    flex: { axis: "x", parts: { springleft: "min", springright: "max" } },
    useFor: "Phone sensors, MEMS, accelerometers, tilt and free fall, tiny machines in chips (idea 21)",
  },
  hovercraft: {
    title: "Light open-cockpit hovercraft: finger skirt, rounded hull, bench, one big ducted fan with a wire guard, rudder vanes, air cushion and push arrows",
    file: "models/hovercraft.glb",
    source: "Procedural, blender/models/hovercraft.py",
    license: "own",
    parts: {
      skirt: ["skirt"],
      hull: ["hull"],
      seat: ["seat"],
      duct: ["duct"],
      guard: ["guard"],
      fan: ["fan"],
      rudders: ["rudders"],
      cushion: ["cushion"],
      pushgrid: ["pushgrid"],
      leaks: ["leaks"],
    },
    keyPart: "cushion",
    // Nothing spreads out (spacing 0). The skirt is the `away` part: "explode" drops it out of
    // view so the air cushion under the hull shows; "collapse" brings it back.
    explode: { axis: "z", order: ["hull", "seat"], spacing: 0, away: ["skirt"] },
    // The one fan (lift and thrust) spins about the forward axis.
    spinAxis: "x",
    // The air under the hull, the arrows it pushes up with and the air leaking out.
    appearOnly: ["cushion", "pushgrid", "leaks"],
    hardEdges: ["fan", "rudders"],
    useFor: "Hovercraft, air cushions, lift from pressure x area, amphibious craft (idea 27; coast world)",
  },
} as const satisfies Record<string, ModelEntry>;

export type ModelId = keyof typeof models;

export const isModelId = (id: string): id is ModelId => id in models;

export const modelParts = (id: ModelId): string[] => Object.keys(models[id].parts);
