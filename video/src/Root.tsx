import { Composition } from "remotion";
import { carousel, video } from "./brand/tokens";
import { ElementsGallery } from "./elements/ElementsGallery";
import { KitGallery } from "./kit/KitGallery";
import { Post01 } from "./posts/post-01-card-payment";
import { script as post01 } from "./posts/post-01-card-payment/script";
import { Post02 } from "./posts/post-02-gps";
import { Carousel18 } from "./posts/post-18-gps-steps";
import { script as carousel18 } from "./posts/post-18-gps-steps/slides";
import { script as post02 } from "./posts/post-02-gps/script";
import { Post20 } from "./posts/post-20-vibe-coding";
import { script as post20 } from "./posts/post-20-vibe-coding/script";
import { calculateReelMetadata } from "./templates/metadata";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Post01-CardPayment"
        component={Post01}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post01, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
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
      <Composition
        id="Post20-VibeCoding"
        component={Post20}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post20, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Carousel18-GpsSteps"
        component={Carousel18}
        durationInFrames={carousel18.slides.length}
        fps={video.fps}
        width={carousel.width}
        height={carousel.height}
        defaultProps={{ script: carousel18, showGuides: false }}
      />
      <ElementsGallery />
      <KitGallery />
    </>
  );
};
