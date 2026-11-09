import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-10-undersea-cables",
  postNumber: 10,
  format: "E",
  title: "How undersea cables carry the internet",
  hookText: "1.5 million km of cable",
  hookHighlight: "1.5",
  topic: "internet",
  source: "TeleGeography (2026); International Cable Protection Committee",
  sfx: { optOut: "sounds not made yet" },
  blender: {
    model: "subsea-cable",
    coverText: "The internet is underwater",
    coverHighlight: "underwater",
    cover: { yaw: -32, pitch: 20, zoom: 1.15, keyPart: "fibers" },
    opener: { yaw: 35, pitch: 16, zoom: 1.1, keyPart: "fibers" },
    hook: {
      yaw: -18,
      pitch: 10,
      zoom: 1.3,
      beats: [
        // The cable builds up layer by layer, then the camera swings round to the
        // fibers on "cable": the one thing nobody sees.
        { cue: "Nobody", fallback: 0, do: "reveal" },
        { cue: "cable", fallback: 0.6, do: "focus", part: "fibers", shot: { yaw: 45, pitch: 16 } },
      ],
    },
    mechanism: {
      yaw: -28,
      pitch: 18,
      zoom: 1.1,
      keyPart: "jacket",
      beats: [
        // Garden hose = the whole jacket; then the layers slide apart to the fibers.
        { cue: "glass", fallback: 0.12, do: "explode" },
        // Swing round to the stepped end (positive yaw = camera on the fibers side).
        { cue: "fibers", fallback: 0.16, do: "focus", part: "fibers", shot: { yaw: 55, pitch: 20 } },
        // The fibers stay amber (the light) through the laser line; on "Every" the light
        // runs down the cable and arrives as "repeater" is said.
        { cue: "laser", fallback: 0.3, do: "collapse", shot: { yaw: -28, pitch: 18 } },
        { cue: "Every", fallback: 0.55, do: "flow", part: "fibers", to: "repeater" },
        { cue: "repeater", fallback: 0.6, do: "focus", part: "repeater", shot: { yaw: -10 } },
        { cue: "boosts", fallback: 0.66, do: "label", part: "repeater", label: "30-50 mi" },
        { cue: "shore", fallback: 0.8, do: "flow", part: "repeater", to: "shore" },
        // Pull back so the whole route (cable, repeater, shore) reads after the close-ups.
        { cue: "data", fallback: 0.95, do: "wide" },
      ],
    },
  },
  verify: [
    "Repeater spacing 50-80 km (engineering sources, not TeleGeography FAQ)",
    "Lasers flash billions of times a second (modern line rates are tens of gigabaud)",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how your internet actually crosses the Atlantic?",
      visual:
        "Question card (template) over the Blender opener: a cable segment lying on the seabed, the fiber core amber.",
    },
    {
      id: "hook",
      voiceover: "Nobody sees the 1.5 million kilometers of cable your internet runs on.",
      visual:
        "Blender hook: camera glides low along the cable on the seabed, the core glows amber on 'cable'. 930,000 mi conversion under the title.",
    },
    {
      id: "setup",
      voiceover:
        "Your messages to another continent almost never go to space. They dive under the ocean.",
      visual:
        "2D SeaSection (new style): side view of an ocean between two coasts, phone on one, laptop on the other; a dashed route through a satellite draws, then fades on 'space'; on 'dive' the cable draws down the slope and along the seabed, an amber pulse travels it. Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "The cable is as wide as a garden hose, with glass fibers as thin as a hair. A laser flashes light down each fiber, billions of times a second. Every 50 to 80 kilometers, a repeater boosts the light. On the far shore, it turns back into data.",
      visual:
        "Blender mechanism: the cable explodes into its layers (sheath, steel armour, copper, tube), the fibers amber on 'fibers'; collapse, an amber pulse flows along the fiber on 'laser', reaches a repeater on 'repeater' (it becomes the key, 30-50 mi label), then flows on to the shore end on 'shore'.",
    },
    {
      id: "payoff",
      voiceover:
        "Anchors and fishing gear break these cables about 200 times a year. Your data just takes another cable until a ship fixes it.",
      visual:
        "2D SeaSection: a ship drags its anchor (amber) along the seabed until the cable snaps on 'break'; on 'another' the ship fades and an amber pulse runs the second cable instead; on 'ship' a repair ship parks over the break.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how the internet crosses oceans.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
