import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-28-tesla-roadster-myth",
  postNumber: 28,
  format: "Q",
  title: "Myth: Tesla's new Roadster is a flying car",
  hookText: "Flying on bottled air",
  hookHighlight: "bottled air",
  topic: "Roadster",
  source: "Tesla Roadster unveil, 15 Oct 2026 (TechCrunch, CNN, Drive Tesla Canada)",
  sfx: {
    custom: {
      valve: { prompt: "soft short hiss of a high-pressure air valve opening, clean, no clank", seconds: 1.0 },
      blast: { prompt: "sharp burst of compressed air from a nozzle, cold gas thruster puff, short whoosh", seconds: 1.2 },
    },
    cues: [
      { sound: "valve", section: "hook", cue: "compressed" },
      { sound: "sweep", section: "setup", cue: "jumped" },
      { sound: "stamp", section: "setup", cue: "myth" },
      { sound: "blast", section: "mechanism", cue: "blasts" },
      { sound: "stamp", section: "payoff", cue: "fact" },
      { sound: "tick", section: "payoff", cue: "sucking" },
    ],
  },
  blender: {
    // A generic coupe (no Tesla body or badges: trademark), on a test track at dusk.
    // yaw +35 looks at the front three-quarter of the -Y side (the key nozzle's side);
    // yaw -40 at the rear three-quarter, where the two tail nozzles show.
    model: "coupe",
    world: "track",
    coverText: "Flying on bottled air",
    coverHighlight: "bottled air",
    cover: { yaw: -40, pitch: 10, zoom: 2.4, keyPart: "rear", frameY: 0.6 },
    opener: { yaw: -40, pitch: 9, zoom: 2.4, keyPart: "rear", drift: 1, frameY: 0.64 },
    hook: {
      yaw: 60,
      pitch: 8,
      zoom: 2.6,
      drift: 1.5,
      // Below the hook title, above the captions.
      frameY: 0.56,
      beats: [
        // The camera slides along the side toward the back of the car...
        { cue: "flying", fallback: 0.35, do: "shot", shot: { yaw: -35, pitch: 12 } },
        // ...and the shell drops away: a cutaway with the air tanks amber.
        // Zooms set by hand throughout: the world's wider lens makes automatic close-ups small.
        { cue: "compressed", fallback: 0.7, do: "explode", shot: { yaw: -40, pitch: 32, zoom: 2.8 } },
        { cue: "compressed", fallback: 0.7, do: "shot", shot: { keyPart: "tanks" } },
        { cue: "air", fallback: 0.85, do: "focus", part: "tanks", shot: { zoom: 4.5 } },
      ],
    },
    mechanism: {
      yaw: 35,
      pitch: 10,
      zoom: 2.6,
      drift: 1,
      beats: [
        // No wings: high and wide, the whole roofline and flanks bare.
        { cue: "wings", fallback: 0.04, do: "shot", shot: { yaw: 15, pitch: 28 } },
        // Tanks: the shell drops away (cutaway), close on the tank stack. "600 L (159 US gal)"
        // is 2D text in MechanismScene.
        { cue: "tanks", fallback: 0.12, do: "explode", shot: { yaw: -20, pitch: 20 } },
        // Zooms set by hand: the world's wider lens makes automatic close-ups small.
        { cue: "liters", fallback: 0.22, do: "focus", part: "tanks", shot: { zoom: 5 } },
        // Ten nozzles: the shell comes back; low and close on the key nozzle under the sill.
        { cue: "ten", fallback: 0.32, do: "collapse", shot: { yaw: 25, pitch: 5 } },
        { cue: "nozzles", fallback: 0.36, do: "focus", part: "nozzle", shot: { yaw: 20, pitch: 7, zoom: 13 } },
        // Air blasts one way: the jet comes out of the nozzle and takes the amber.
        { cue: "blasts", fallback: 0.47, do: "appear", part: "jet" },
        { cue: "blasts", fallback: 0.47, do: "shot", shot: { keyPart: "jet" } },
        // ...so the car is shoved the other way: wide, all the jets fire, the push arrow
        // (amber) shows over the roof and the whole car lifts off the tarmac.
        { cue: "shoved", fallback: 0.57, do: "wide", shot: { yaw: 30, pitch: 8, zoom: 1.9 } },
        { cue: "shoved", fallback: 0.57, do: "appear", part: "jets" },
        { cue: "shoved", fallback: 0.57, do: "appear", part: "push" },
        { cue: "shoved", fallback: 0.57, do: "shot", shot: { keyPart: "push" } },
        { cue: "shoved", fallback: 0.57, do: "shift", part: "car", by: [0, 0, 0.45] },
        // Rockets: the 2D spacecraft silhouette (MechanismScene); the car hangs on its jets.
        // The nozzles stop: jets and arrow go, amber off, and the car drops back down.
        { cue: "stop", fallback: 0.86, do: "vanish", part: "jet" },
        { cue: "stop", fallback: 0.86, do: "vanish", part: "jets" },
        { cue: "stop", fallback: 0.86, do: "vanish", part: "push" },
        { cue: "stop", fallback: 0.86, do: "stop" },
        { cue: "straight", fallback: 0.92, do: "shift", part: "car", by: [0, 0, 0] },
        { cue: "down", fallback: 0.96, do: "wide", shot: { yaw: 25, pitch: 9, zoom: 2 } },
      ],
    },
  },
  verify: [
    "'About 600 liters of compressed air' and 'ten nozzles' are Lars Moravy's words at the unveil as reported by TechCrunch; one report says only two main thrusters plus attitude thrusters. Check Tesla's own Roadster page before rendering",
    "The fan 'sucking the car down' is the Performance trim's 'multi-mode suction system' (TechCrunch); confirm the jump car (Thrust/Rocket trim) also has it, or say 'the road version'",
    "Five cars jumped (Cybercab, Cybertruck, Semi, Model Y, Model 3) per TechCrunch; heights (27 ft) are only in one report, so they are not in the script",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how Tesla's Roadster actually flies?",
      visual:
        "Question card over the Blender opener: a low, generic two-seat sports coupe (procedural, no Tesla badges or logo) on a test-track ramp at dusk; the rear nozzles amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you Tesla's flying car runs on compressed air.",
      visual: "Blender hook: camera slides along the side of the car to a cutaway of the air tanks (amber on 'compressed air').",
    },
    {
      id: "setup",
      voiceover: "In October, Tesla's new Roadster jumped over five parked cars. Myth: it's a flying car.",
      visual:
        "2D kinetic type + line art: five simple car silhouettes in a row on 'five parked cars', a dashed arc jumps over them on 'jumping'; MYTH stamp (coral) on 'flying car'.",
    },
    {
      id: "mechanism",
      voiceover:
        "There are no wings. Tanks hold about 600 liters of compressed air, and ten nozzles let it out. Air blasts one way, so the car gets shoved the other way. It's the same trick rockets use to steer in space. When the nozzles stop, the car comes straight back down.",
      visual:
        "Blender cutaway: wide on the car; close on the tank stack on '600 liters' (amber) with on-screen \"600 L (159 US gal)\"; close on one nozzle on 'ten nozzles', a cone of air out (amber) and an arrow on the car the opposite way on 'shoved'; small spacecraft silhouette with a puff on 'rockets'; wide: the arc of the jump, air cone cuts off on 'stop' and the car drops back to the ground line.",
    },
    {
      id: "payoff",
      voiceover:
        "FACT: it's a car that jumps. And a fan underneath does the opposite job, sucking the car down onto the road for grip.",
      visual:
        "2D: FACT stamp (teal) on 'car that jumps'; side-view line art of the underbody, a fan (amber) and arrows pulling down into the road on 'sucking the car down'.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how Tesla's Roadster really jumps.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
