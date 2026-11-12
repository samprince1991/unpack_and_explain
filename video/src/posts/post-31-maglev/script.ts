import type { PostScript } from "../../templates/types";

// Model units: the maglev model's longest side (its 11 m guideway section) is 2, so 1 m is 2 / 11.
const METER = 2 / 11;

export const script: PostScript = {
  id: "post-31-maglev",
  postNumber: 31,
  format: "E",
  title: "How a maglev train floats",
  hookText: "603 km/h, no wheels",
  hookHighlight: "no wheels",
  topic: "train",
  source: "Wikipedia, SCMaglev; Guinness World Records",
  blender: {
    // A generic long-nose maglev (no JR livery) in its U-shaped guideway, on a raised track
    // at dusk. yaw +35 looks at the front three-quarter of the -Y side; yaw 75 nearly head-on,
    // where the bogie and its side magnets show under the nose.
    model: "maglev",
    world: "rail",
    coverText: "603 km/h, no wheels",
    coverHighlight: "no wheels",
    cover: { yaw: 72, pitch: 20, zoom: 1.4, keyPart: "magnet", drift: 0.5, frameY: 0.6 },
    // Behind the question card: nearly head-on, the magnet beside the bogie amber (the gap the
    // Visual column names is too thin to read at this size; the magnet is what holds it up).
    // Low in the frame, under the question text.
    opener: { yaw: 78, pitch: 22, zoom: 1.6, keyPart: "magnet", drift: 1, frameY: 0.7 },
    hook: {
      // Low, front three-quarter: the train starts far back down the track and streaks in
      // toward the camera.
      yaw: 62,
      pitch: 8,
      zoom: 1.3,
      drift: 0.5,
      frameY: 0.56,
      keyPart: "magnet",
      beats: [
        { cue: "You", fallback: 0, do: "shift", part: "train", by: [-14, 0, 0], frames: 0 },
        { cue: "don't", fallback: 0.08, do: "shift", part: "train", by: [0, 0, 0], frames: 16 },
      ],
    },
    mechanism: {
      yaw: 35,
      pitch: 14,
      zoom: 1.1,
      drift: 0.5,
      frameY: 0.45,
      keyPart: "magnet",
      beats: [
        // Magnets: the shell and the near wall drop away (cutaway), close on the front magnet.
        // Close-ups look down from above, over the bogie, into the gap by the far wall. Zooms set
        // by hand: the magnet and coil are tiny next to the 11 m model, past the automatic cap.
        { cue: "magnets", fallback: 0.03, do: "explode", shot: { yaw: 40, pitch: 30 } },
        { cue: "magnets", fallback: 0.03, do: "focus", part: "magnet", shot: { yaw: 20, pitch: 45, zoom: 5 } },
        // Coils of wire: the coil faces the magnet across a 5 cm gap, so the car eases back
        // 1.4 m to show it, then speeds past it (the magnet sweeping by) as the current flows.
        { cue: "coils", fallback: 0.21, do: "shift", part: "train", by: [-1.4 * METER, 0, 0], frames: 18 },
        { cue: "coils", fallback: 0.21, do: "focus", part: "coil", shot: { yaw: 10, pitch: 32, zoom: 9 } },
        { cue: "speeds", fallback: 0.34, do: "shift", part: "train", by: [1.4 * METER, 0, 0], frames: 20 },
        // Current flows round the coil's two loops, opposite ways.
        { cue: "current", fallback: 0.41, do: "appear", part: "current" },
        { cue: "current", fallback: 0.41, do: "shot", shot: { keyPart: "current" } },
        // ...so the coil becomes a magnet: the amber goes back to the coil.
        { cue: "too", fallback: 0.57, do: "shot", shot: { keyPart: "coil" } },
        // They push it up and keep it centered: wide on the cutaway, the push arrows amber.
        { cue: "push", fallback: 0.62, do: "wide", shot: { aim: "magnet", yaw: 40, pitch: 28, zoom: 3.0 } },
        { cue: "push", fallback: 0.62, do: "appear", part: "push" },
        { cue: "push", fallback: 0.62, do: "shot", shot: { keyPart: "push" } },
        // Below 150 km/h: "150 km/h (93 mph)" pinned to the bogie (not spoken as units).
        { cue: "Below", fallback: 0.75, do: "label", part: "bogie", label: "150 km/h (93 mph)" },
        // Too weak: the current and the push fade out.
        { cue: "weak", fallback: 0.87, do: "vanish", part: "current" },
        { cue: "weak", fallback: 0.87, do: "vanish", part: "push" },
        // Rubber wheels: they come down and the car settles 10 cm onto them.
        { cue: "rubber", fallback: 0.95, do: "appear", part: "wheels" },
        { cue: "rubber", fallback: 0.95, do: "shot", shot: { keyPart: "wheels" } },
        { cue: "rubber", fallback: 0.95, do: "shift", part: "train", by: [1.4 * METER, 0, -0.1 * METER], frames: 18 },
      ],
    },
  },
  sfx: {
    custom: {
      // The hook's streak: a fast, smooth pass with no engine or wheel noise.
      // Quieter than the default: it measured only 3.7 dB under the voice.
      whoosh: { prompt: "fast smooth high-speed train passing by, airy rushing whoosh, no wheels, no horn, short", seconds: 1.4, volume: 0.07 },
      // Current in the coil: a soft electric hum that rises.
      hum: { prompt: "soft electric hum rising gently, clean magnetic buzz, short, no crackle", seconds: 1.2, volume: 0.15 },
      // Rubber wheels touching down: a soft rubbery bump.
      touchdown: { prompt: "soft rubber tyres touching down on concrete, gentle short bump, no squeal", seconds: 0.8 },
    },
    cues: [
      { sound: "whoosh", section: "hook", cue: "need" },
      { sound: "tick", section: "setup", cue: "steel" },
      // Leads the word, so the swell builds under the gap in the voice before "lifts".
      { sound: "swell", section: "setup", cue: "lifts", offsetFrames: -12 },
      { sound: "hum", section: "mechanism", cue: "current" },
      { sound: "touchdown", section: "mechanism", cue: "rubber" },
      { sound: "tick", section: "payoff", cue: "2015" },
    ],
  },
  verify: [
    "Hook says 'you don't need wheels': true only above about 150 km/h (it rolls on wheels below). The mechanism line says so; keep both",
    "Payoff chart: fastest wheeled train 574.8 km/h (357 mph), TGV V150, 3 April 2007 (Wikipedia, Land speed record for rail vehicles)",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how a train actually floats 10 cm up?",
      visual:
        "Question card over the Blender opener: a long-nosed maglev train (procedural, no JR livery) in a U-shaped guideway, the gap under the train amber.",
    },
    {
      id: "hook",
      voiceover: "You don't need wheels to hit 603 kilometers an hour.",
      visual: 'Blender hook: low camera at guideway level, the train streaks past; on screen "603 km/h (375 mph)".',
    },
    {
      id: "setup",
      voiceover: "Normal trains roll on steel wheels. Japan's SCMaglev lifts off instead.",
      visual:
        "2D line art: a steel wheel on a rail with shake lines on 'steel wheels', then the wheel fades and a gap opens on 'lifts off' (amber).",
    },
    {
      id: "mechanism",
      voiceover:
        "Powerful magnets ride inside the train, and the track walls are lined with coils of wire. As the train speeds past, its magnets make current flow in those coils, so the coils become magnets too. They push the train up and keep it centered. Below 150 kilometers an hour, that current is too weak, so it rolls on rubber wheels.",
      visual:
        "Blender cutaway front view: wide; close on a magnet block in the bogie on 'magnets' (amber); coils in the wall on 'coils of wire'; current arrows run round a figure-8 coil as the train passes on 'current flow'; push arrows up and inwards on 'push the train up and keep it centered'; rubber wheels touch down, on screen \"150 km/h (93 mph)\"; wide.",
    },
    {
      id: "payoff",
      voiceover: "Above that, it floats 10 centimeters up. In 2015, it hit 603 kilometers an hour.",
      visual:
        "2D chart: gap measured with a ruler, \"10 cm (4 in)\" on 'floats'; bar chart of train speed records with the 2015 bar amber on '603'.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a maglev train floats.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
