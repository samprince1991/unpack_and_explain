// Brand sound library, generated once with `npm run brand-audio` (ElevenLabs).
// Every reel uses the same sounds, which builds a recognizable audio identity.
export const sfx = {
  pop: {
    prompt: "Short soft UI pop, gentle rounded click, clean, for a logo appearing on screen",
    seconds: 0.5,
    volume: 0.4,
  },
  chime: {
    prompt: "Bright gentle two-note chime, warm and positive, clean ending, for a congratulations moment",
    seconds: 1.2,
    volume: 0.4,
  },
  tick: { prompt: "Short soft mechanical tick, clean and dry, no reverb", seconds: 0.5, volume: 0.25 },
  thud: { prompt: "Soft low thud, short and rounded, no reverb tail", seconds: 0.6, volume: 0.3 },
  swell: { prompt: "Short airy rising swell, gentle, builds and stops with no impact", seconds: 1.5, volume: 0.25 },
  sweep: { prompt: "Soft airy sweep passing by, light and short", seconds: 0.8, volume: 0.2 },
  snap: { prompt: "Crisp soft mechanical snap, something clicking into place, clean", seconds: 0.5, volume: 0.3 },
  stamp: { prompt: "Soft rubber stamp pressed on paper, muted and short", seconds: 0.5, volume: 0.3 },
  buzz: { prompt: "Short low error buzz, muted, not harsh", seconds: 0.7, volume: 0.25 },
} as const;

export type SfxName = keyof typeof sfx;

// Placed by the template (audioCues.ts), never by a post's sfx plan.
export const TEMPLATE_SFX: readonly SfxName[] = ["pop", "chime"];

// Pinned so every sound comes from one model. v3 is limited access (other accounts get
// "Unknown model"); moving to it is a deliberate change that regenerates the library.
export const SFX_MODEL = "eleven_text_to_sound_v2";
export const SFX_PROMPT_INFLUENCE = 0.6;
// Topic sounds without their own volume.
export const SFX_CUSTOM_VOLUME = 0.3;

export const music = {
  prompt:
    "Calm, curious, minimal electronic background music for a science explainer video. Soft plucks, light pulse, warm pads, steady around 100 BPM, no vocals, no big drops, even energy throughout",
  lengthMs: 60000,
  // ~ -20 dB under the voice.
  volume: 0.1,
  fadeFrames: 30,
} as const;

export const audioPath = (name: string) => `brand/audio/${name}.mp3`;
export const audioLibraryPath = "brand/audio/library.json";

// Written by the generator; lists only the files that exist.
export type AudioLibrary = {
  sfx: Partial<Record<SfxName, string>>;
  music: string | null;
};
