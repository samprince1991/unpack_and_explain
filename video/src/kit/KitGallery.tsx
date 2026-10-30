// Studio previews of our own motion kit (src/components/motion, transitions, LineIcon, three).
// Demos only: posts never import from src/kit.
import { Composition, Folder } from "remotion";
import { video } from "../brand/tokens";
import { KitIcons } from "./KitIcons";
import { KitLooks, kitLooksFrames } from "./KitLooks";
import { KitMotion } from "./KitMotion";
import { KitThree } from "./KitThree";
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
      id="Kit-Icons"
      component={KitIcons}
      durationInFrames={120}
      {...size}
    />
    <Composition
      id="Kit-Three"
      component={KitThree}
      durationInFrames={150}
      {...size}
    />
  </Folder>
);
