// One voice for every reel. Changing anything here changes the channel's voice.
export const voice = {
  // TODO: pick the ElevenLabs voice and paste its ID here.
  voiceId: "REPLACE_WITH_VOICE_ID",
  modelId: "eleven_multilingual_v2",
  settings: {
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0,
    use_speaker_boost: true,
  },
  // Used for estimated timing before VO exists.
  wordsPerSecond: 2.5,
} as const;
