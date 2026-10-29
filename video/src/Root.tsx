import { Composition } from "remotion";
import { video } from "./brand/tokens";
import { ElementsGallery } from "./elements/ElementsGallery";
import { Post02 } from "./posts/post-02-gps";
import { script as post02 } from "./posts/post-02-gps/script";
import { calculateReelMetadata } from "./templates/metadata";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Post02-Gps"
        component={Post02}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post02, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <ElementsGallery />
    </>
  );
};
