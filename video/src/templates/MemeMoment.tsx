import { Sequence, useVideoConfig } from "remotion";
import { MEME_DEFAULT_SECONDS, memes } from "../brand/memes";
import { MemeCut } from "../components/MemeCut";
import { useCue } from "./SectionContext";
import type { PostScript } from "./types";

// Lets the cue word finish before the meme appears.
const AFTER_CUE_FRAMES = 8;

export const MemeMoment: React.FC<{ meme: NonNullable<PostScript["meme"]> }> = ({ meme }) => {
  const { fps } = useVideoConfig();
  const cue = useCue(meme.cue, 0.5);

  return (
    <Sequence
      name={`Meme ${meme.id}`}
      from={cue + AFTER_CUE_FRAMES}
      durationInFrames={Math.round((meme.seconds ?? MEME_DEFAULT_SECONDS) * fps)}
    >
      <MemeCut file={memes[meme.id].file} />
    </Sequence>
  );
};
