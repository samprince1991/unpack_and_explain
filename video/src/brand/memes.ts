// Approved meme templates from public/memes/. Only these can be used in a reel
// (validateScript enforces it). Everything else in the folder is NOT approved: it was
// either off-brand (sexual, political, violent, profanity, bullying, tragedy) or shows
// a real celebrity/politician photo (likeness rights). See CLAUDE.md "Memes".
export const memes = {
  "they-dont-know": {
    file: "memes/They don_t know.jpg",
    useFor: "Most people don't know this fact (e.g. GPS works offline)",
  },
  "this-is-fine": {
    file: "memes/This is fine - 01.jpg",
    useFor: "Ignoring a problem that quietly grows (drift, debt, a slow failure)",
  },
  "hard-to-swallow-pills": {
    file: "memes/Hard to swallow pills pilules médicaments avaler.jpg",
    useFor: "An uncomfortable truth, good for Q (myth) posts",
  },
  "scroll-of-truth": {
    file: "memes/The scroll of truth.jpg",
    useFor: "Rejecting the real explanation in favour of the myth (Q posts)",
  },
  "doesnt-exist": {
    file: "memes/Discovering something that doesn_t exist.jpg",
    useFor: "A belief in something that isn't real (myths)",
  },
  "expanding-brain": {
    file: "memes/Expanding brain cerveau mind 2.jpg",
    useFor: "Levels of understanding, from naive to correct",
  },
  "small-vs-big-brain": {
    file: "memes/Small brain vs big brain petit gros cerveau.jpg",
    useFor: "Loud wrong take vs quiet correct one",
  },
  "monkey-puppet": {
    file: "memes/Monkey puppet look singe regarde yeux.jpg",
    useFor: "Awkward realization / side-eye after a surprising fact",
  },
  "visible-confusion": {
    file: "memes/Star wars - luke skywalker - visible confusion.jpg",
    useFor: "A fact that sounds wrong at first",
  },
  "facts-book": {
    file: "memes/Facts.jpg",
    useFor: "Presenting the facts against a myth",
  },
  "its-blank": {
    file: "memes/Its blank kung ffu panda.jpg",
    useFor: "Expecting something and finding nothing (e.g. no data sent)",
  },
  "kirby-sign": {
    file: "memes/Kirby sign.jpg",
    useFor: "Holding up a simple point; needs our own short text",
  },
} as const;

export type MemeId = keyof typeof memes;

// Sections where a meme may appear. Never the question/congrats/CTA cards, and never
// the mechanism: that is the explanation itself and must not be interrupted.
export const MEME_SECTIONS = ["hook", "setup", "payoff"] as const;
export const MEME_MAX_SECONDS = 2.5;
export const MEME_DEFAULT_SECONDS = 2;
