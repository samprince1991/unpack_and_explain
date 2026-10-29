// Generated index of the original (unbranded) Remotion Elements, for previewing in Studio.
// They render in our 1080x1920 canvas under the 'Elements' folder, separate from posts.
// Do not use these directly in posts: adapt a copy into src/components/elements/ first (see CLAUDE.md).
import { Composition, Folder } from "remotion";
import { video } from "../brand/tokens";
import { AudioOscilloscopeComposition } from "./audio/AudioOscilloscopeComposition";
import { AudioWaveformProgressComposition } from "./audio/AudioWaveformProgressComposition";
import { MirroredAudioSpectrumComposition } from "./audio/MirroredAudioSpectrumComposition";
import { MovingWavesComposition } from "./backgrounds/MovingWavesComposition";
import { NotebookPaperComposition } from "./backgrounds/NotebookPaperComposition";
import { PaperTextureComposition } from "./backgrounds/PaperTextureComposition";
import { RotatingStarburstComposition } from "./backgrounds/RotatingStarburstComposition";
import { BasicCaptionsComposition } from "./captions/BasicCaptionsComposition";
import { MovingPillCaptionsComposition } from "./captions/MovingPillCaptionsComposition";
import { PoppingWordCaptionsComposition } from "./captions/PoppingWordCaptionsComposition";
import { RoundedCaptionsComposition } from "./captions/RoundedCaptionsComposition";
import { WordHighlightCaptionsComposition } from "./captions/WordHighlightCaptionsComposition";
import { HorizontalBarChartComposition } from "./charts/HorizontalBarChartComposition";
import { LineChartComposition } from "./charts/LineChartComposition";
import { NumberCounterComposition } from "./charts/NumberCounterComposition";
import { PieChartComposition } from "./charts/PieChartComposition";
import { VerticalBarChartComposition } from "./charts/VerticalBarChartComposition";
import { PeelComposition } from "./effects/PeelComposition";
import { ProductDiscountCalloutComposition } from "./effects/ProductDiscountCalloutComposition";
import { ShineComposition } from "./effects/ShineComposition";
import { TearComposition } from "./effects/TearComposition";
import { PictureInPictureTransitionComposition } from "./layouts/PictureInPictureTransitionComposition";
import { ProductCollectionComposition } from "./layouts/ProductCollectionComposition";
import { SlideToSplitScreenComposition } from "./layouts/SlideToSplitScreenComposition";
import { MapFlyoverComposition } from "./maps/MapFlyoverComposition";
import { SpinningGlobeComposition } from "./maps/SpinningGlobeComposition";
import { WatercolorMapComposition } from "./maps/WatercolorMapComposition";
import { LocationLowerThirdComposition } from "./overlays/LocationLowerThirdComposition";
import { NameLowerThirdComposition } from "./overlays/NameLowerThirdComposition";
import { SocialSafeZonesComposition } from "./overlays/SocialSafeZonesComposition";
import { NewsArticleHighlightComposition } from "./storytelling/NewsArticleHighlightComposition";
import { OnScreenMessagesComposition } from "./storytelling/OnScreenMessagesComposition";
import { PolaroidPicturesComposition } from "./storytelling/PolaroidPicturesComposition";
import { SpeedLinesComposition } from "./storytelling/SpeedLinesComposition";
import { CircleMarkerComposition } from "./text/CircleMarkerComposition";
import { CrossedOffTextComposition } from "./text/CrossedOffTextComposition";
import { CylinderTextComposition } from "./text/CylinderTextComposition";
import { SpinningTextWheelComposition } from "./text/SpinningTextWheelComposition";
import { StrikeThroughTextComposition } from "./text/StrikeThroughTextComposition";
import { TextMarkerComposition } from "./text/TextMarkerComposition";
import { YouTubeCommentHighlightComposition } from "./youtube/YouTubeCommentHighlightComposition";
import { YouTubeEndCardComposition } from "./youtube/YouTubeEndCardComposition";
import { YouTubeSubscribeNudgeComposition } from "./youtube/YouTubeSubscribeNudgeComposition";

export const ElementsGallery: React.FC = () => {
  return (
    <Folder name="Elements">
      <Folder name="Audio">
        <Composition id="El-Oscilloscope" component={AudioOscilloscopeComposition} durationInFrames={271} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-WaveformProgress" component={AudioWaveformProgressComposition} durationInFrames={271} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-MirroredSpectrum" component={MirroredAudioSpectrumComposition} durationInFrames={271} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Backgrounds">
        <Composition id="El-MovingWaves" component={MovingWavesComposition} durationInFrames={240} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-NotebookPaper" component={NotebookPaperComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-PaperTexture" component={PaperTextureComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-RotatingStarburst" component={RotatingStarburstComposition} durationInFrames={240} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Captions">
        <Composition id="El-BasicCaptions" component={BasicCaptionsComposition} durationInFrames={210} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-MovingPillCaptions" component={MovingPillCaptionsComposition} durationInFrames={210} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-PoppingWordCaptions" component={PoppingWordCaptionsComposition} durationInFrames={210} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-RoundedCaptions" component={RoundedCaptionsComposition} durationInFrames={210} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-WordHighlightCaptions" component={WordHighlightCaptionsComposition} durationInFrames={210} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Charts">
        <Composition id="El-HorizontalBarChart" component={HorizontalBarChartComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-LineChart" component={LineChartComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-NumberCounter" component={NumberCounterComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-PieChart" component={PieChartComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-VerticalBarChart" component={VerticalBarChartComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Effects">
        <Composition id="El-Peel" component={PeelComposition} durationInFrames={60} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-ProductDiscountCallout" component={ProductDiscountCalloutComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-Shine" component={ShineComposition} durationInFrames={45} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-Tear" component={TearComposition} durationInFrames={45} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Layouts">
        <Composition id="El-PictureInPictureTransition" component={PictureInPictureTransitionComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-ProductCollection" component={ProductCollectionComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SlideToSplitScreen" component={SlideToSplitScreenComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Maps">
        <Composition id="El-MapFlyover" component={MapFlyoverComposition} durationInFrames={285} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SpinningGlobe" component={SpinningGlobeComposition} durationInFrames={240} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-WatercolorMap" component={WatercolorMapComposition} durationInFrames={200} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Overlays">
        <Composition id="El-LocationLowerThird" component={LocationLowerThirdComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-NameLowerThird" component={NameLowerThirdComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SocialSafeZones" component={SocialSafeZonesComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Storytelling">
        <Composition id="El-NewsArticleHighlight" component={NewsArticleHighlightComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-OnScreenMessages" component={OnScreenMessagesComposition} durationInFrames={162} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-PolaroidPictures" component={PolaroidPicturesComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SpeedLines" component={SpeedLinesComposition} durationInFrames={45} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Text">
        <Composition id="El-CircleMarker" component={CircleMarkerComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-CrossedOff" component={CrossedOffTextComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-CylinderText" component={CylinderTextComposition} durationInFrames={180} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SpinningTextWheel" component={SpinningTextWheelComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-StrikeThrough" component={StrikeThroughTextComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-TextMarker" component={TextMarkerComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Youtube">
        <Composition id="El-YoutubeCommentHighlight" component={YouTubeCommentHighlightComposition} durationInFrames={180} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-YoutubeEndCard" component={YouTubeEndCardComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-YoutubeSubscribeNudge" component={YouTubeSubscribeNudgeComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
    </Folder>
  );
};
