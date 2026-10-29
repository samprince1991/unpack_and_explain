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
} as const;

export type SfxName = keyof typeof sfx;

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
