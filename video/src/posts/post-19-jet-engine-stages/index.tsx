import { Carousel, type CarouselProps } from "../../templates/Carousel";
import {
  CombustorVisual,
  CompressorVisual,
  CoverVisual,
  FanVisual,
  ShaftVisual,
  TurbineVisual,
} from "./scenes/EngineVisuals";
import { StakeVisual } from "./scenes/StakeVisual";

export const Carousel19: React.FC<CarouselProps> = (props) => {
  return (
    <Carousel
      {...props}
      visuals={{
        1: CoverVisual,
        2: StakeVisual,
        3: FanVisual,
        4: CompressorVisual,
        5: CombustorVisual,
        6: TurbineVisual,
        7: ShaftVisual,
      }}
    />
  );
};
