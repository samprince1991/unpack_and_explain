import { Composition, Folder } from "remotion";
import { carousel, video } from "./brand/tokens";
import { ElementsGallery } from "./elements/ElementsGallery";
import { KitGallery } from "./kit/KitGallery";
import { Post01 } from "./posts/post-01-card-payment";
import { script as post01 } from "./posts/post-01-card-payment/script";
import { Post02 } from "./posts/post-02-gps";
import { script as post02 } from "./posts/post-02-gps/script";
import { Post03 } from "./posts/post-03-jet-engine";
import { script as post03 } from "./posts/post-03-jet-engine/script";
import { Post07 } from "./posts/post-07-credit-score";
import { script as post07 } from "./posts/post-07-credit-score/script";
import { Post10 } from "./posts/post-10-undersea-cables";
import { script as post10 } from "./posts/post-10-undersea-cables/script";
import { Post12 } from "./posts/post-12-cloud-myth";
import { script as post12 } from "./posts/post-12-cloud-myth/script";
import { Post14 } from "./posts/post-14-qr-code";
import { script as post14 } from "./posts/post-14-qr-code/script";
import { Carousel18 } from "./posts/post-18-gps-steps";
import { script as carousel18 } from "./posts/post-18-gps-steps/slides";
import { Carousel19 } from "./posts/post-19-jet-engine-stages";
import { script as carousel19 } from "./posts/post-19-jet-engine-stages/slides";
import { Post20 } from "./posts/post-20-vibe-coding";
import { script as post20 } from "./posts/post-20-vibe-coding/script";
import { Post21 } from "./posts/post-21-phone-accelerometer";
import { script as post21 } from "./posts/post-21-phone-accelerometer/script";
import { Post26 } from "./posts/post-26-bulbous-bow";
import { script as post26 } from "./posts/post-26-bulbous-bow/script";
import { Post27 } from "./posts/post-27-hovercraft";
import { script as post27 } from "./posts/post-27-hovercraft/script";
import { Post28 } from "./posts/post-28-tesla-roadster-myth";
import { script as post28 } from "./posts/post-28-tesla-roadster-myth/script";
import { Post31 } from "./posts/post-31-maglev";
import { script as post31 } from "./posts/post-31-maglev/script";
import { Post38 } from "./posts/post-38-gold-jewellery";
import { script as post38 } from "./posts/post-38-gold-jewellery/script";
import { calculateCoverMetadata, Cover } from "./templates/Cover";
import { calculateReelMetadata } from "./templates/metadata";

// Folders only change the Studio sidebar; composition ids stay the same for rendering.
// Keep each id written inline: scripts/lib/qaAudio.ts finds reels by searching this file.
export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Folder name="Reels">
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
          id="Post14-QrCode"
          component={Post14}
          durationInFrames={video.fps * 40}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post14, vo: null, audio: null, showGuides: false }}
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
          id="Post27-Hovercraft"
          component={Post27}
          durationInFrames={video.fps * 40}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post27, vo: null, audio: null, showGuides: false }}
          calculateMetadata={calculateReelMetadata}
        />
        <Composition
          id="Post28-TeslaRoadsterMyth"
          component={Post28}
          durationInFrames={video.fps * 40}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post28, vo: null, audio: null, showGuides: false }}
          calculateMetadata={calculateReelMetadata}
        />
        <Composition
          id="Post31-Maglev"
          component={Post31}
          durationInFrames={video.fps * 40}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post31, vo: null, audio: null, showGuides: false }}
          calculateMetadata={calculateReelMetadata}
        />
        <Composition
          id="Post38-GoldJewellery"
          component={Post38}
          durationInFrames={video.fps * 40}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post38, vo: null, audio: null, showGuides: false }}
          calculateMetadata={calculateReelMetadata}
        />
      </Folder>
      <Folder name="Covers">
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
          id="Cover07-CreditScore"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post07, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
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
          id="Cover14-QrCode"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post14, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
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
          id="Cover27-Hovercraft"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post27, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
        />
        <Composition
          id="Cover28-TeslaRoadsterMyth"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post28, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
        />
        <Composition
          id="Cover31-Maglev"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post31, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
        />
        <Composition
          id="Cover38-GoldJewellery"
          component={Cover}
          durationInFrames={1}
          fps={video.fps}
          width={video.width}
          height={video.height}
          defaultProps={{ script: post38, blender3d: null, showGuides: false }}
          calculateMetadata={calculateCoverMetadata}
        />
      </Folder>
      <Folder name="Carousels">
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
      </Folder>
      <KitGallery />
      <ElementsGallery />
    </>
  );
};
