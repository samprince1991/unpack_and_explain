import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-27-hovercraft",
  postNumber: 27,
  format: "E",
  title: "How a hovercraft floats on air",
  hookText: "Weak air lifts 11 tonnes",
  hookHighlight: "Weak",
  topic: "a hovercraft",
  source: "SR.N6 worked example (Wikipedia); National Historic Ships UK",
  sfx: {
    custom: {
      // Quieter than the 0.3 default: a broadband whoosh under the voice measured only 2.7 dB below it.
      fanspin: { prompt: "large ducted fan spinning up, smooth rising whoosh of air, no engine roar", seconds: 1.5, volume: 0.15 },
      airhiss: { prompt: "soft steady hiss of air escaping from under a rubber edge, gentle", seconds: 1.5 },
      spray: { prompt: "light water spray misting up, soft splashy hiss, short", seconds: 1.2 },
    },
    cues: [
      { sound: "spray", section: "hook", cue: "air" },
      { sound: "sweep", section: "setup", cue: "drags" },
      { sound: "swell", section: "setup", cue: "touches" },
      { sound: "fanspin", section: "mechanism", cue: "blows" },
      { sound: "tick", section: "mechanism", cue: "barely" },
      { sound: "airhiss", section: "mechanism", cue: "leaking" },
      { sound: "tick", section: "payoff", cue: "cars" },
    ],
  },
  blender: {
    model: "hovercraft",
    // Coast world, on the water: the cushion presses a dip and a ring of spray rises around the
    // skirt. Yaw about -35 looks at the bow and the fan guard together. The backdrop behind
    // the 2D setup and payoff shows the shore (the payoff is about crossing to land).
    world: "coast",
    coverText: "It floats on air",
    coverHighlight: "air",
    cover: { yaw: -35, pitch: 11, zoom: 2.2, keyPart: "skirt", coast: "sea", frameY: 0.6 },
    opener: { yaw: -35, pitch: 11, zoom: 2.2, keyPart: "skirt", coast: "sea", drift: 1, frameY: 0.66 },
    hook: {
      yaw: -45,
      pitch: 14,
      zoom: 2,
      coast: "sea",
      drift: 1.5,
      // Low in the frame: the hook title sits in the sky above the craft.
      frameY: 0.62,
      beats: [
        // The camera drops toward the waterline; the skirt, where the air is, turns amber.
        // Zooms set by hand: an automatic close-up on the skirt (a ring as big as the craft)
        // crops the craft and pushes its duct up into the hook title.
        { cue: "strong", fallback: 0.3, do: "shot", shot: { pitch: 5, zoom: 2.1 } },
        { cue: "air", fallback: 0.42, do: "focus", part: "skirt", shot: { pitch: 4, zoom: 2.3 } },
        { cue: "hovercraft", fallback: 0.85, do: "wide", shot: { pitch: 10, zoom: 2 } },
      ],
    },
    mechanism: {
      yaw: -35,
      pitch: 12,
      zoom: 1.8,
      coast: "sea",
      drift: 1,
      beats: [
        // A fan blows air under the hull: close on the fan, which spins up.
        { cue: "fan", fallback: 0.03, do: "focus", part: "fan", shot: { yaw: -30, pitch: 14 } },
        { cue: "blows", fallback: 0.07, do: "spin", part: "fan" },
        // ...and a rubber skirt traps it. A wide shot, not a close-up: the skirt is a ring, so a
        // close-up would aim at its middle, inside the craft.
        // (`wide` leaves the amber alone, so a `shot` beat moves the key.)
        { cue: "rubber", fallback: 0.16, do: "wide", shot: { yaw: -20, pitch: 8, zoom: 2 } },
        { cue: "skirt", fallback: 0.18, do: "shot", shot: { keyPart: "skirt" } },
        // That air pushes barely harder: the skirt drops away and the cushion shows, amber.
        // Cues are unique words ("air" and "skirt" also come earlier). Aimed at the cushion,
        // the low camera sits between the water and the hull bottom.
        { cue: "pushes", fallback: 0.27, do: "explode", shot: { yaw: -10, pitch: 2, zoom: 2, aim: "cushion" } },
        { cue: "pushes", fallback: 0.27, do: "appear", part: "cushion" },
        { cue: "barely", fallback: 0.31, do: "shot", shot: { keyPart: "cushion" } },
        // The "+0.75%" number is 2D text in MechanismScene (one line in the sky; a pinned
        // label wrapped and ran off the column).
        // ...on the whole underside: arrows push up across the hull bottom.
        { cue: "whole", fallback: 0.5, do: "appear", part: "pushgrid" },
        { cue: "underside", fallback: 0.54, do: "shot", shot: { keyPart: "pushgrid", zoom: 2.2 } },
        // ...adds up to the full weight: pull back, the hull is the key.
        { cue: "adds", fallback: 0.66, do: "wide", shot: { pitch: 10, zoom: 1.8 } },
        { cue: "full", fallback: 0.7, do: "shot", shot: { keyPart: "hull" } },
        // Air keeps leaking out under the skirt: the skirt returns, wisps escape.
        { cue: "keeps", fallback: 0.76, do: "collapse", shot: { yaw: -25, pitch: 6, zoom: 2 } },
        { cue: "keeps", fallback: 0.76, do: "appear", part: "leaks" },
        { cue: "leaking", fallback: 0.8, do: "shot", shot: { keyPart: "leaks" } },
        // ...so the fan never stops: wide, the fan is the key again.
        { cue: "never", fallback: 0.92, do: "wide", shot: { yaw: -35, pitch: 12, zoom: 1.8 } },
        { cue: "stops", fallback: 0.95, do: "shot", shot: { keyPart: "fan" } },
      ],
    },
  },
  verify: [
    "765 Pa (about 0.75% above atmospheric) for the 11-tonne SR.N6 is a rounded worked example on Wikipedia (W = 107 kN, A = 140 m2); the source line says Wikipedia",
    "'Up to 60 cars' is the SR.N4 Mk3 class figure (Wikipedia); National Historic Ships lists The Princess Anne at 55",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how air actually lifts 60 cars?",
      visual:
        "Question card (template) over the Blender opener in the coast world (placement `sea`): low three-quarter view of a hovercraft on the water, spray ring around the skirt, the skirt amber.",
    },
    {
      id: "hook",
      voiceover: "You don't need strong air to lift an 11-tonne hovercraft.",
      visual:
        "Blender hook: the camera drops toward the waterline; the skirt turns amber on 'air'; wide again on 'hovercraft'. On-screen: \"11 t (12 US tons)\".",
    },
    {
      id: "setup",
      voiceover: "A boat drags through water. A car grips the road. A hovercraft touches neither.",
      visual:
        "2D, three quick panels in one line-art style: a hull with a drag wake on 'drags', a tyre on tarmac on 'grips', then a hovercraft lifting clear of the ground line on 'neither' (gap amber). Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "A fan blows air under the hull, and a rubber skirt traps it. That air pushes barely harder than the air outside. But it pushes on the whole underside, and over that much area, it adds up to the full weight. Air keeps leaking out under the skirt, so the fan never stops.",
      visual:
        "Blender mechanism, coast world: close on the fan on 'fan', it spins on 'blows'; the skirt amber on 'rubber'; on 'pushes' the skirt drops away and the cushion (amber) shows under the hull, label \"+0.75% (765 Pa, 0.11 psi)\" on 'harder'; on 'whole' arrows push up across the hull bottom; wide on 'weight'; on 'keeps' the skirt returns and wisps escape under it; wide on 'stops' with the fan amber.",
    },
    {
      id: "payoff",
      voiceover:
        "The same trick scales up. The biggest ones weighed 320 tonnes and carried up to 60 cars across the English Channel.",
      visual:
        "2D: a small hovercraft outline grows into a big one on 'scales up'; on screen \"SR.N4: 320 t (353 US tons)\"; the Channel drawn between two coasts, Dover and Calais, with the craft crossing on 'Channel'; a row of car icons counts up on 'cars', the last car amber.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a hovercraft floats.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
