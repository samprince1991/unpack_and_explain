// Studio previews of our own motion kit (src/components/motion, transitions, LineIcon, three).
// Demos only: posts never import from src/kit.
import { Composition, Folder } from "remotion";
import { carousel, video } from "../brand/tokens";
import { calculateCoverMetadata, Cover } from "../templates/Cover";
import { calculateReelMetadata } from "../templates/metadata";
import { blenderSample } from "./blenderSample";
import { KitBlender } from "./KitBlender";
import {
  KitCharts,
  kitChartsFrames,
  KitChartsSlides,
  kitChartsSlideCount,
} from "./KitCharts";
import { KitIcons } from "./KitIcons";
import { KitLooks, kitLooksFrames } from "./KitLooks";
import { KitStyles, kitStylesFrames } from "./KitStyles";
import { KitMotion } from "./KitMotion";
import { KitThree, kitThreeFrames } from "./KitThree";
import { KitTransitions, kitTransitionsFrames } from "./KitTransitions";

const size = {
  fps: video.fps,
  width: video.width,
  height: video.height,
} as const;

export const KitGallery: React.FC = () => (
  <Folder name="Kit">
    <Composition
      id="Kit-Motion"
      component={KitMotion}
      durationInFrames={180}
      {...size}
    />
    <Composition
      id="Kit-Transitions"
      component={KitTransitions}
      durationInFrames={kitTransitionsFrames}
      {...size}
    />
    <Composition
      id="Kit-Looks"
      component={KitLooks}
      durationInFrames={kitLooksFrames}
      {...size}
    />
    <Composition
      id="Kit-Styles"
      component={KitStyles}
      durationInFrames={kitStylesFrames}
      {...size}
    />
    <Composition
      id="Kit-Charts"
      component={KitCharts}
      durationInFrames={kitChartsFrames}
      {...size}
    />
    <Composition
      id="Kit-ChartsSlides"
      component={KitChartsSlides}
      durationInFrames={kitChartsSlideCount}
      fps={video.fps}
      width={carousel.width}
      height={carousel.height}
    />
    <Composition
      id="Kit-Icons"
      component={KitIcons}
      durationInFrames={120}
      {...size}
    />
    <Composition
      id="Kit-Three"
      component={KitThree}
      durationInFrames={kitThreeFrames}
      {...size}
    />
    <Composition
      id="Kit-Blender"
      component={KitBlender}
      durationInFrames={video.fps * 30}
      {...size}
      defaultProps={{
        script: blenderSample,
        vo: null,
        audio: null,
        showGuides: false,
      }}
      calculateMetadata={calculateReelMetadata}
    />
    <Composition
      id="Kit-BlenderCover"
      component={Cover}
      durationInFrames={1}
      {...size}
      defaultProps={{
        script: blenderSample,
        blender3d: null,
        showGuides: false,
      }}
      calculateMetadata={calculateCoverMetadata}
    />
  </Folder>
);
