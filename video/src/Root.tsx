import { Composition } from "remotion";
import { carousel, video } from "./brand/tokens";
import { ElementsGallery } from "./elements/ElementsGallery";
import { KitGallery } from "./kit/KitGallery";
import { Post01 } from "./posts/post-01-card-payment";
import { script as post01 } from "./posts/post-01-card-payment/script";
import { Post02 } from "./posts/post-02-gps";
import { Carousel18 } from "./posts/post-18-gps-steps";
import { script as carousel18 } from "./posts/post-18-gps-steps/slides";
import { Carousel19 } from "./posts/post-19-jet-engine-stages";
import { script as carousel19 } from "./posts/post-19-jet-engine-stages/slides";
import { script as post02 } from "./posts/post-02-gps/script";
import { Post03 } from "./posts/post-03-jet-engine";
import { script as post03 } from "./posts/post-03-jet-engine/script";
import { Post10 } from "./posts/post-10-undersea-cables";
import { script as post10 } from "./posts/post-10-undersea-cables/script";
import { Post12 } from "./posts/post-12-cloud-myth";
import { script as post12 } from "./posts/post-12-cloud-myth/script";
import { Post20 } from "./posts/post-20-vibe-coding";
import { script as post20 } from "./posts/post-20-vibe-coding/script";
import { Post07 } from "./posts/post-07-credit-score";
import { script as post07 } from "./posts/post-07-credit-score/script";
import { Post21 } from "./posts/post-21-phone-accelerometer";
import { script as post21 } from "./posts/post-21-phone-accelerometer/script";
import { Post26 } from "./posts/post-26-bulbous-bow";
import { script as post26 } from "./posts/post-26-bulbous-bow/script";
import { calculateCoverMetadata, Cover } from "./templates/Cover";
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
        id="Post03-JetEngine"
        component={Post03}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post03, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover03-JetEngine"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post03, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
      />
      <Composition
        id="Post10-UnderseaCables"
        component={Post10}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post10, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover10-UnderseaCables"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post10, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
      />
      <Composition
        id="Post12-CloudMyth"
        component={Post12}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post12, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover12-CloudMyth"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post12, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
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
      <Composition
        id="Carousel19-JetEngineStages"
        component={Carousel19}
        durationInFrames={carousel19.slides.length}
        fps={video.fps}
        width={carousel.width}
        height={carousel.height}
        defaultProps={{ script: carousel19, showGuides: false }}
      />
      <Composition
        id="Post26-BulbousBow"
        component={Post26}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post26, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover26-BulbousBow"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post26, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
      />
      <Composition
        id="Post21-PhoneAccelerometer"
        component={Post21}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post21, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover21-PhoneAccelerometer"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post21, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
      />
      <Composition
        id="Post07-CreditScore"
        component={Post07}
        durationInFrames={video.fps * 40}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post07, vo: null, audio: null, showGuides: false }}
        calculateMetadata={calculateReelMetadata}
      />
      <Composition
        id="Cover07-CreditScore"
        component={Cover}
        durationInFrames={1}
        fps={video.fps}
        width={video.width}
        height={video.height}
        defaultProps={{ script: post07, blender3d: null, showGuides: false }}
        calculateMetadata={calculateCoverMetadata}
      />
      <ElementsGallery />
      <KitGallery />
    </>
  );
};
