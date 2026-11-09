import { brand } from "../brand/tokens";
import type { PostScript } from "../templates/types";

// Sample reel for Kit-Blender: exercises every Blender clip and beat on the jet-engine
// model. Not a post (text is placeholder, never published). Render its 3D with
// `npm run blender -- kit-blender --preview`.
export const blenderSample: PostScript = {
  id: "kit-blender",
  postNumber: 0,
  format: "E",
  title: "Kit: Blender pipeline",
  hookText: "Suck, squeeze, bang, blow",
  hookHighlight: "bang",
  topic: "jet engine",
  source: "Kit sample",
  verify: [],
  sfx: { optOut: "kit sample" },
  blender: {
    model: "jet-engine",
    coverText: "Inside a jet engine",
    coverHighlight: "jet engine",
    cover: { yaw: -35, pitch: 18, zoom: 1.05 },
    opener: { yaw: -50, pitch: 14, zoom: 0.95 },
    hook: {
      yaw: -30,
      pitch: 12,
      zoom: 1,
      beats: [
        { cue: "four", fallback: 0.2, do: "reveal" },
        { cue: "spin", fallback: 0.6, do: "spin", part: "fan" },
      ],
    },
    mechanism: {
      yaw: -25,
      pitch: 30,
      zoom: 1,
      beats: [
        { cue: "fan", fallback: 0.1, do: "focus", part: "fan" },
        { cue: "squeezes", fallback: 0.3, do: "focus", part: "compressor" },
        { cue: "squeezes", fallback: 0.3, do: "label", part: "compressor", label: "40:1" },
        { cue: "burns", fallback: 0.5, do: "focus", part: "combustor" },
        { cue: "apart", fallback: 0.7, do: "explode" },
        { cue: "turbine", fallback: 0.85, do: "flow", part: "combustor", to: "turbine" },
      ],
    },
  },
  sections: [
    { id: "question", voiceover: "Do you know how a jet engine actually works?", visual: "" },
    { id: "hook", voiceover: "It does four things, and it never stops doing them. Watch it spin.", visual: "" },
    { id: "setup", voiceover: "Air goes in the front and comes out the back much faster.", visual: "" },
    {
      id: "mechanism",
      voiceover:
        "First the fan pulls air in. Then the compressor squeezes it hard. Fuel burns in that squeezed air. Pull it apart and you can see the hot gas spin the turbine on its way out.",
      visual: "",
    },
    { id: "payoff", voiceover: "That push out the back is what moves the plane forward.", visual: "" },
    { id: "congrats", voiceover: "Congrats, you just learned how a jet engine works.", visual: "" },
    { id: "cta", voiceover: brand.ctaLine, visual: "" },
  ],
};
