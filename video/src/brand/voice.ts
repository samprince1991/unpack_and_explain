// One voice for every reel. Changing anything here changes the channel's voice.
export const voice = {
  // ElevenLabs premade "Brian": deep, calm American narrator.
  voiceId: "nPczCjzI2devNBz1zQrb",
  modelId: "eleven_multilingual_v2",
  // Upbeat, warm delivery: lower stability lets the voice vary its intonation, and
  // style adds energy. Applies to every reel; keep scripts punctuated for it
  // ("?" on the question, "!" on the congrats line).
  settings: {
    stability: 0.35,
    similarity_boost: 0.75,
    style: 0.45,
    use_speaker_boost: true,
  },
  // Used for estimated timing before VO exists.
  wordsPerSecond: 2.5,
} as const;
