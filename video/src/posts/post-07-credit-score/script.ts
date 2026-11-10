import type { PostScript } from "../../templates/types";

// Each weight lifts towards the camera as it is named. Same offset for all, so the row keeps
// its order and only the size difference reads.
const LIFT: [number, number, number] = [0, -0.34, 0.1];

export const script: PostScript = {
  id: "post-07-credit-score",
  postNumber: 7,
  format: "E",
  title: "How credit scores work",
  hookText: "Salary doesn't count",
  hookHighlight: "Salary",
  topic: "credit score",
  source: "myFICO; CFPB",
  sfx: {
    custom: {
      weightclunk: { prompt: "heavy brass calibration weight set down on a steel plate, one solid clunk", seconds: 1, volume: 0.17 },
      dialsweep: { prompt: "mechanical gauge needle sweeping with fine ratchet clicks, brief", seconds: 1.5 },
    },
    cues: [
      { sound: "weightclunk", section: "hook", cue: "credit" },
      { sound: "sweep", section: "setup", cue: "prediction" },
      { sound: "dialsweep", section: "setup", cue: "scores" },
      { sound: "weightclunk", section: "mechanism", cue: "paying" },
      { sound: "weightclunk", section: "mechanism", cue: "owe" },
      { sound: "tick", section: "mechanism", cue: "long" },
      { sound: "snap", section: "mechanism", cue: "mix" },
      { sound: "tick", section: "payoff", cue: "only" },
    ],
  },
  blender: {
    model: "credit-weights",
    worldOptOut: "built before worlds were required",
    // One line: "Salary doesn't count" wraps to three at cover size and hits the dial.
    coverText: "Salary: 0%",
    coverHighlight: "0%",
    cover: { yaw: -24, pitch: 14, zoom: 1.2, keyPart: "payment", drift: 0 },
    opener: { yaw: -30, pitch: 12, zoom: 1.35, keyPart: "payment", drift: 2 },
    hook: {
      yaw: -34,
      pitch: 16,
      zoom: 1.35,
      drift: 2,
      beats: [
        // No close-up here: the hook's clip is short, and centering on the dial crops the rack.
        { cue: "salary", fallback: 0.45, do: "shot", shot: { yaw: -14, pitch: 8, zoom: 1.5, keyPart: "dial" } },
        { cue: "credit", fallback: 0.75, do: "shot", shot: { yaw: -22, pitch: 12, zoom: 1.45, keyPart: "payment" } },
      ],
    },
    mechanism: {
      yaw: -18,
      pitch: 16,
      zoom: 1.25,
      drift: 1.5,
      beats: [
        // Keep the wide moving through the long first sentence.
        { cue: "weighs", fallback: 0.08, do: "shot", shot: { yaw: -6, pitch: 20, zoom: 1.35 } },
        { cue: "credit", fallback: 0.17, do: "shot", shot: { yaw: -26, pitch: 14, zoom: 1.45 } },
        { cue: "paying", fallback: 0.22, do: "explode" },
        { cue: "paying", fallback: 0.22, do: "shift", part: "payment", by: LIFT },
        { cue: "paying", fallback: 0.22, do: "focus", part: "payment", shot: { yaw: -22, pitch: 12 } },
        { cue: "35", fallback: 0.33, do: "label", part: "payment", label: "35%" },
        { cue: "owe", fallback: 0.42, do: "shift", part: "owed", by: LIFT },
        { cue: "owe", fallback: 0.42, do: "focus", part: "owed", shot: { yaw: -12, pitch: 12 } },
        { cue: "30", fallback: 0.48, do: "label", part: "owed", label: "30%" },
        { cue: "long", fallback: 0.54, do: "shift", part: "history", by: LIFT },
        { cue: "long", fallback: 0.54, do: "focus", part: "history", shot: { yaw: -4, pitch: 12 } },
        { cue: "15", fallback: 0.64, do: "label", part: "history", label: "15%" },
        { cue: "applications", fallback: 0.7, do: "shift", part: "newcredit", by: LIFT },
        { cue: "applications", fallback: 0.7, do: "focus", part: "newcredit", shot: { yaw: 6, pitch: 12 } },
        { cue: "applications", fallback: 0.7, do: "label", part: "newcredit", label: "10%" },
        { cue: "mix", fallback: 0.84, do: "shift", part: "mix", by: LIFT },
        { cue: "mix", fallback: 0.84, do: "focus", part: "mix", shot: { yaw: 14, pitch: 12 } },
        { cue: "mix", fallback: 0.84, do: "label", part: "mix", label: "10%" },
        // All five settle back on the rack as the camera pulls out.
        { cue: "each", fallback: 0.96, do: "stop" },
        { cue: "each", fallback: 0.96, do: "collapse", shot: { yaw: -10, pitch: 18 } },
        { cue: "each", fallback: 0.96, do: "shift", part: "payment", by: [0, 0, 0] },
        { cue: "each", fallback: 0.96, do: "shift", part: "owed", by: [0, 0, 0] },
        { cue: "each", fallback: 0.96, do: "shift", part: "history", by: [0, 0, 0] },
        { cue: "each", fallback: 0.96, do: "shift", part: "newcredit", by: [0, 0, 0] },
        { cue: "each", fallback: 0.96, do: "shift", part: "mix", by: [0, 0, 0] },
      ],
    },
  },
  verify: [
    "35/30/15/10/10 is FICO's general breakdown; the mix can differ from person to person. Script says 'a FICO score weighs', keep the source on screen",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Does your credit score know your salary?",
      visual: "Question card (template) over the Blender opener: five weights on a rack, the biggest amber.",
    },
    {
      id: "hook",
      voiceover: "You don't need a big salary for a high credit score.",
      visual: "Blender hook: the camera turns to the rack, the dial amber on 'salary', then the biggest weight amber on 'credit'.",
    },
    {
      id: "setup",
      voiceover: "It isn't a grade on your wealth. It's a prediction: how likely are you to repay what you borrow? Most scores run from 300 to 850.",
      visual:
        "2D: wallet icon struck through on 'wealth'; a dashed path draws forward on 'prediction'; a Gauge settles in on 'scores' with a counter running 300 to 850, the needle amber.",
    },
    {
      id: "mechanism",
      voiceover:
        "A FICO score weighs five things from your credit report. Paying on time counts most, at 35 percent. How much you owe is 30. How long you've had credit is 15. New applications and your mix of credit are 10 each.",
      visual:
        "Blender mechanism: wide on the rack; the dial drops away and each weight lifts forward, amber, in close-up as it's named, its percent written on it in 2D; wide again on 'each' as the dial returns and all five settle.",
    },
    {
      id: "payoff",
      voiceover: "Lenders may still ask about your salary. But the score itself never sees it. It only sees your habits.",
      visual:
        "2D: PhoneFrame loan form with an income field on 'salary'; the form fades and the five parts return as a PieChart donut with payment history amber and 35% in the hole.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how credit scores work.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
