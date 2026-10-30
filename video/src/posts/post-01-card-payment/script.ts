import { classicLook } from "../../templates/look";
import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-01-card-payment",
  postNumber: 1,
  format: "E",
  title: "How a card payment works",
  hookText: "A card tap moves $0",
  hookHighlight: "$0",
  topic: "card payment",
  // Built before per-post looks: keep the approved look on re-renders.
  look: classicLook,
  source: "Card network / acquirer docs",
  // Built before 3D hero scenes: keep the approved mechanism on re-renders.
  hero3d: { optOut: "built before 3D heroes" },
  verify: [
    "Settlement timing (varies by country and card network); cite the source on screen",
    "Up to five companies in the chain (terminal provider/processor, shop's bank, card network, your bank)",
  ],
  sections: [
    {
      id: "question",
      voiceover: "Who approves your card in 2 seconds?",
      visual: "Question card (template).",
    },
    {
      id: "hook",
      voiceover: "Nobody tells you a card tap moves zero money.",
      visual:
        'Card taps a terminal; amber ping on contact. Hook title "A card tap moves $0".',
    },
    {
      id: "setup",
      voiceover:
        "Your card doesn't hold your money. It holds a number that points to your bank. Up to five companies pass that number along.",
      visual:
        "Card outline turns into a number; a line draws to a bank icon; five dots appear one by one.",
    },
    {
      id: "mechanism",
      voiceover:
        "The terminal sends it to the shop's bank. That bank hands it to the card network. That's Visa or Mastercard. The network finds your bank. Your bank checks your balance and fraud signals. It says yes or no, and the answer races back.",
      visual:
        "Chain terminal > shop's bank > network > your bank. Amber packet travels along it, camera follows; teal check at your bank; packet races back. Enters with `push`.",
    },
    {
      id: "payoff",
      voiceover:
        "That yes is only a promise. The real money moves later, in settlement. That's a day or two after your tap.",
      visual:
        'Chain fades to a dashed "promise" line; calendar flips forward 1-2 days; line turns solid as the money moves. Enters with `zoomDip`.',
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how a card payment works.",
      visual: "Congrats card: teal check + chime (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
