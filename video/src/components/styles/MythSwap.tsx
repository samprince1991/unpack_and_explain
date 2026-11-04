import { Interactive, interpolate, useCurrentFrame } from "remotion";
import { clamp, durations, ease } from "../../brand/motion";
import { enterProgress } from "../motion/progress";

type MythSwapProps = {
  // What people picture (the myth), drawn around (0, 0) in local coordinates.
  myth: React.ReactNode;
  // What is actually there (the fact), drawn around (0, 0) as well.
  fact: React.ReactNode;
  // Where the myth sits, and how far down (or up, negative) the fact lands from it.
  x: number;
  y: number;
  drop?: number;
  // Local frames: the myth enters at `at`; at `swapAt` it falls away (fading) and the
  // fact settles in at its place.
  at?: number;
  swapAt: number;
};

// Myth / fact swap (Q posts): the picture people have in their head gives way to the
// real thing, e.g. a cloud in the sky dropping into a building on the ground. Neutral
// line art; make the fact drawing the amber key if anything is. Place MYTH / FACT
// stamps (components/Stamp) next to it in the scene. SVG, for use inside SceneCanvas.
export const MythSwap: React.FC<MythSwapProps> = ({ myth, fact, x, y, drop = 0, at = 0, swapAt }) => {
  const frame = useCurrentFrame();
  const mythIn = enterProgress(frame, at);
  const fall = interpolate(frame, [swapAt, swapAt + durations.enter + 4], [0, 1], {
    ...clamp,
    easing: ease.smooth,
  });
  const factIn = enterProgress(frame, swapAt + 6, durations.enter + 4, ease.out);

  return (
    <Interactive.G name="Myth swap">
      <g
        style={{
          opacity: mythIn * (1 - fall),
          translate: `${x}px ${y + (1 - mythIn) * 16 + fall * drop * 0.6}px`,
          scale: String(1 - fall * 0.15),
        }}
      >
        {myth}
      </g>
      <g
        style={{
          opacity: factIn,
          translate: `${x}px ${y + drop + (1 - factIn) * -40}px`,
          scale: String(0.9 + factIn * 0.1),
        }}
      >
        {fact}
      </g>
    </Interactive.G>
  );
};
