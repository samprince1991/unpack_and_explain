import { Carousel, type CarouselProps } from "../../templates/Carousel";
import { BroadcastVisual } from "./scenes/BroadcastVisual";
import { CoverVisual } from "./scenes/CoverVisual";
import { DistanceVisual } from "./scenes/DistanceVisual";
import { FixVisual } from "./scenes/FixVisual";
import { RelativityVisual } from "./scenes/RelativityVisual";
import { StakeVisual } from "./scenes/StakeVisual";
import { TimingVisual } from "./scenes/TimingVisual";

export const Carousel18: React.FC<CarouselProps> = (props) => {
  return (
    <Carousel
      {...props}
      visuals={{
        1: CoverVisual,
        2: StakeVisual,
        3: BroadcastVisual,
        4: TimingVisual,
        5: DistanceVisual,
        6: FixVisual,
        7: RelativityVisual,
      }}
    />
  );
};
