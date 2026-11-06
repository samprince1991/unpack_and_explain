import { slideLayout } from "../../../brand/layout";
import { SlideCanvas } from "../../../components/carousel/SlideCanvas";
import { EngineSide } from "./EngineSide";

const { visual, coverVisual } = slideLayout.regions;
const middle = (r: { top: number; bottom: number }) => (r.top + r.bottom) / 2;

// Cover: the whole engine running, the flame (combustor) is the key.
export const CoverVisual: React.FC = () => (
  <SlideCanvas region={coverVisual}>
    <EngineSide
      cx={540}
      cy={middle(coverVisual)}
      scale={1}
      keyPart="combustor"
      intake
      exhaust
    />
  </SlideCanvas>
);

// Slides 3-7: the same engine, the amber moves through the stages in order.
export const FanVisual: React.FC = () => (
  <SlideCanvas region={visual}>
    <EngineSide cx={540} cy={middle(visual)} keyPart="fan" intake />
  </SlideCanvas>
);

export const CompressorVisual: React.FC = () => (
  <SlideCanvas region={visual}>
    <EngineSide cx={540} cy={middle(visual)} keyPart="compressor" />
  </SlideCanvas>
);

export const CombustorVisual: React.FC = () => (
  <SlideCanvas region={visual}>
    <EngineSide cx={540} cy={middle(visual)} keyPart="combustor" />
  </SlideCanvas>
);

export const TurbineVisual: React.FC = () => (
  <SlideCanvas region={visual}>
    <EngineSide cx={540} cy={middle(visual)} keyPart="turbine" exhaust />
  </SlideCanvas>
);

export const ShaftVisual: React.FC = () => (
  <SlideCanvas region={visual}>
    <EngineSide cx={540} cy={middle(visual)} keyPart="shaft" intake exhaust />
  </SlideCanvas>
);
