// One voice for every reel. Changing anything here changes the channel's voice.
export const voice = {
  // Channel voice: ElevenLabs library voice, from post 38 on (2026-11-11). It replaced the
  // premade "Brian" (nPczCjzI2devNBz1zQrb), which is too widely used. Library voices need a
  // paid ElevenLabs plan for API use.
  voiceId: "ktkP7Nsj67dw2zcplQYt",
  modelId: "eleven_multilingual_v2",
  // Upbeat, warm delivery: lower stability lets the voice vary its intonation, and
  // style adds energy. Applies to every reel; keep scripts punctuated for it
  // ("?" on the question, "!" on the congrats line).
  // Tuned for the library voice (2026-11-11): at stability 0.35 it rushed some lines (a hook
  // at 3.9 words/s, target 2.5), so it's steadier and a touch slower.
  settings: {
    stability: 0.5,
    speed: 0.92,
    similarity_boost: 0.75,
    style: 0.45,
    use_speaker_boost: true,
  },
  // Used for estimated timing before VO exists.
  wordsPerSecond: 2.5,
} as const;
