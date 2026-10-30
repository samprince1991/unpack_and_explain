import type { PostScript } from "../../templates/types";

export const script: PostScript = {
  id: "post-20-vibe-coding",
  postNumber: 20,
  format: "E",
  title: "How vibe coding actually works in 2026",
  hookText: "Apps with zero code",
  hookHighlight: "zero",
  topic: "vibe coding",
  source: "Anthropic, How Claude Code works",
  hero3d: "mechanism",
  verify: [],
  sections: [
    {
      id: "question",
      voiceover: "Do you know how vibe coding actually works in 2026?",
      visual: "Question card (template).",
    },
    {
      id: "hook",
      voiceover: "In 2026, you don't need to read one line of code to build an app.",
      visual:
        "A single line of plain text types itself into a chat box; a stack of code lines below it blurs and fades out.",
    },
    {
      id: "setup",
      voiceover:
        "It's called vibe coding. You type 'make me a habit tracker app', and an AI agent writes all the code.",
      visual:
        "Speech bubble with a sentence flows into a small agent icon; code files stack up on the other side.",
    },
    {
      id: "mechanism",
      voiceover:
        "Here's the trick. The agent doesn't answer once. It reads your project, plans the steps, and writes the code. Then it runs it. If it crashes, it reads the error, fixes the code, and runs again. It loops until it works.",
      visual:
        '3D hero: a tilted ring of four steps (folder, checklist, code, play) around the agent, slowly orbiting; a faint guide ring draws in first, then the steps build node by node. On "crashes" an amber error dot pops above "run", rides the ring once more and turns into a check.',
    },
    {
      id: "payoff",
      voiceover:
        "But it's still predicting likely code. It doesn't know what you meant. So \"it runs\" doesn't mean \"it's right\". Always test what it builds.",
      visual:
        "The finished app screen with a check; a second look shows one wrong detail circled in amber.",
    },
    {
      id: "congrats",
      voiceover: "Congrats, you just learned how vibe coding works.",
      visual: "Congrats card (template).",
    },
    {
      id: "cta",
      voiceover: "Follow Unpack and Explain for how things actually work.",
      visual: "Logo + tagline card.",
    },
  ],
};
