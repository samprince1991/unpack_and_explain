import { staticFile } from "remotion";
import { audioLibraryPath, type AudioLibrary } from "../brand/audio";

const EMPTY: AudioLibrary = { sfx: {}, music: null };

// Empty until `npm run brand-audio` has been run; reels render silently without it.
export const loadAudioLibrary = async (): Promise<AudioLibrary> => {
  try {
    const res = await fetch(staticFile(audioLibraryPath));
    return res.ok ? ((await res.json()) as AudioLibrary) : EMPTY;
  } catch {
    return EMPTY;
  }
};
