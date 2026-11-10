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
  sfx: { optOut: "sounds not made yet" },
  blender: {
    model: "bulbous-bow",
    // Reel-worlds pilot: the sea is cut along the hull, so the bulb reads below the surface.
    // The cut line only reads at low yaw, so the camera stays under about 20 degrees and barely
    // drifts. Zooms are set by hand here: the clip's 30 mm lens frames tighter than `fit` assumes.
    world: "sea",
    coverText: "Ships hide this bump",
    coverHighlight: "bump",
    cover: { yaw: 20, pitch: 9, zoom: 3, keyPart: "bulb", aim: "bulb", exploded: true, frameY: 0.64 },
    opener: { yaw: 20, pitch: 9, zoom: 3, keyPart: "bulb", aim: "bulb", exploded: true, drift: 0.4, frameY: 0.7 },
    hook: {
      yaw: 18,
      pitch: 11,
      zoom: 2.6,
      aim: "bulb",
      exploded: true,
      drift: 0.4,
      // Low in the frame: the hook title sits in the sky above the ship.
      frameY: 0.6,
      beats: [
        { cue: "noticed", fallback: 0.2, do: "shot", shot: { yaw: 20, pitch: 9 } },
        { cue: "bump", fallback: 0.45, do: "focus", part: "bulb", shot: { yaw: 14, pitch: 7, zoom: 4 } },
      ],
    },
    mechanism: {
      // The water starts with only the bow wave standing; "cancel" adds the bulb's wave to it.
      yaw: 18,
      pitch: 9,
      zoom: 3,
      aim: "bulb",
      exploded: true,
      drift: 0.3,
      sea: "bowWave",
      beats: [
        { cue: "bulb", fallback: 0.08, do: "focus", part: "bulb", shot: { yaw: 14, pitch: 7, zoom: 5 } },
        { cue: "makes", fallback: 0.3, do: "collapse", shot: { yaw: 6, pitch: 9, zoom: 3.4, aim: "bulb" } },
        { cue: "own", fallback: 0.33, do: "shot", shot: { keyPart: "bulbwave" } },
        { cue: "step", fallback: 0.42, do: "shot", shot: { keyPart: "bowwave" } },
        // Where one rises, the other dips: the key hops between the two lines.
        { cue: "rises", fallback: 0.58, do: "shot", shot: { keyPart: "bulbwave" } },
        { cue: "dips", fallback: 0.66, do: "shot", shot: { keyPart: "bowwave" } },
        // They cancel: the lines settle into the water, the surface flattens, and we pull back.
        { cue: "cancel", fallback: 0.78, do: "explode", shot: { yaw: 14, pitch: 10, zoom: 2.6, aim: "bulb" } },
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
        "Blender mechanism in the sea world: wide on the bow with its wave standing; focus on the bulb on 'bulb'; on 'makes' the two wave lines rise from the water; 'own' the bulb's wave is amber, 'step' the bow wave; 'rises' / 'dips' the key hops between them; on 'cancel' the lines settle in, the surface flattens and the camera pulls back.",
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
