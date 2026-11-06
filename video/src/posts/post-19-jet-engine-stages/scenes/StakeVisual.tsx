import { slideLayout } from "../../../brand/layout";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { GlidePath } from "../../../components/styles/GlidePath";

// A slide is one frame (frame = slide index), so the timings below are chosen to land on
// the finished route with the aircraft (amber) mid-glide, halfway to the runway.
const FLY_FRAMES = 20;

// Slide 2: engines out, the jet glides down to a runway (same style as reel 3's payoff).
export const StakeVisual: React.FC = () => (
  <SlideCanvas region={slideLayout.regions.visual}>
    <GlidePath
      from={{ x: 200, y: 470 }}
      to={{ x: 600, y: 760 }}
      runway={260}
      at={-60}
      flyAt={1 - FLY_FRAMES / 2}
      flyFrames={FLY_FRAMES}
    />
  </SlideCanvas>
);
