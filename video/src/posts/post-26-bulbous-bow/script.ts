import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-26-bulbous-bow",
  postNumber: 26,
  format: "E",
  title: "Why big ships have a bump on their nose",
  hookText: "Up to 14% less fuel",
  hookHighlight: "14%",
  topic: "ships",
  source: "FAO; Wallenius Wilhelmsen; Maersk via Ships Monthly",
  hero3d: "mechanism",
  blender: {
    model: "bulbous-bow",
    coverText: "Ships hide this bump",
    coverHighlight: "bump",
    // Yaw 0 looks at the side the wave lines are on (-y); positive yaw swings toward the bow.
    // The waves start sunk away (exploded) and only come up in the mechanism.
    cover: { yaw: 38, pitch: 6, zoom: 1.5, keyPart: "bulb", exploded: true },
    opener: { yaw: 32, pitch: 4, zoom: 1.5, keyPart: "bulb", exploded: true },
    hook: {
      yaw: 24,
      pitch: 14,
      zoom: 1.4,
      exploded: true,
      beats: [
        // Above the water on the whole bow, then down to the bulb on "bump".
        { cue: "noticed", fallback: 0.2, do: "shot", shot: { yaw: 28, pitch: 6 } },
        { cue: "bump", fallback: 0.45, do: "focus", part: "bulb", shot: { yaw: 40, pitch: 2 } },
      ],
    },
    mechanism: {
      yaw: 12,
      pitch: 10,
      zoom: 1.35,
      exploded: true,
      beats: [
        { cue: "bulb", fallback: 0.08, do: "focus", part: "bulb", shot: { yaw: 35, pitch: 4 } },
        // The two waves rise out of the water and the camera pulls back to show them.
        { cue: "makes", fallback: 0.3, do: "collapse", shot: { yaw: 8, pitch: 8 } },
        { cue: "own", fallback: 0.33, do: "focus", part: "bulbwave", shot: { yaw: 14, pitch: 6 } },
        { cue: "step", fallback: 0.42, do: "focus", part: "bowwave", shot: { yaw: 6, pitch: 8 } },
        // Where one rises, the other dips: the key hops between the two lines.
        { cue: "rises", fallback: 0.58, do: "shot", shot: { yaw: 10, keyPart: "bulbwave" } },
        { cue: "dips", fallback: 0.66, do: "shot", shot: { yaw: 4, keyPart: "bowwave" } },
        // They cancel: both sink away, leaving the calm waterline; pull back wide. Yaw -25
        // offsets the slow orbit drift (4 deg/s, ~44 deg by here), so the end is a side view again.
        { cue: "cancel", fallback: 0.78, do: "explode", shot: { yaw: -25, pitch: 10, zoom: 1.35 } },
        { cue: "smaller", fallback: 0.9, do: "stop" },
      ],
    },
  },
  verify: [
    "140 tonnes is the upper end for Maersk's big container-ship bows (Maersk via Ships Monthly)",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Do you know why ships actually have a 140-tonne bump?",
      visual:
        "Question card (template) over the Blender opener: low three-quarter view of a ship's bow at the waterline, the bulb below the surface amber.",
    },
    {
      id: "hook",
      voiceover: "You've never noticed the bump that saves ships up to 14% fuel.",
      visual:
        "Blender hook: camera starts above the water on the bow, then dips below the waterline and finds the bulb, which turns amber on 'bump'.",
    },
    {
      id: "setup",
      voiceover:
        "Every ship shoves water aside. It piles up into a wave at the bow, and making that wave burns fuel.",
      visual:
        "2D WaveProfile (new style): side view of a hull at the waterline; a plain bow with no bulb pushes forward; on 'piles' the water line bunches up into a crest at the bow (amber on 'wave'); on 'fuel' a fuel gauge needle drops. Parallax + dust.",
    },
    {
      id: "mechanism",
      voiceover:
        "So shipbuilders add a bulb below the waterline, ahead of the bow. It makes its own wave, out of step with the bow wave. Where one rises, the other dips. They partly cancel, so the ship drags a smaller wave.",
      visual:
        "Blender mechanism: wide on the bow; focus on the bulb on 'bulb'; on 'makes' the two wave lines rise out of the water; 'own' the bulb's wave is amber, 'step' the bow wave; 'rises' / 'dips' the key hops between them; on 'cancel' both sink away and the camera pulls back wide on the calm waterline.",
    },
    {
      id: "payoff",
      voiceover:
        "But it only works at the speed it was built for. When Maersk slowed its ships, it swapped the old bulbs for new ones.",
      visual:
        "2D WaveProfile + speed gauge: the gauge needle (amber) on 'speed' drops on 'slowed'; on 'swapped' the long old bulb slides away and a new, shorter bulb settles into place.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned why ships have a bump.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
