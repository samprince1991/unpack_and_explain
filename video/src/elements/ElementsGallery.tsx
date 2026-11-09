// Generated index of the original (unbranded) Remotion Elements, for previewing in Studio.
// They render in our 1080x1920 canvas under the 'Elements' folder, separate from posts.
// Do not use these directly in posts: adapt a copy into src/components/elements/ first (see CLAUDE.md).
// Only the Elements that fit this channel are listed. The rest stay in src/elements/ as reference;
// add a <Composition> line here to preview one again.
import { Composition, Folder } from "remotion";
import { video } from "../brand/tokens";
import { MovingWavesComposition } from "./backgrounds/MovingWavesComposition";
import { NumberCounterComposition } from "./charts/NumberCounterComposition";
import { MapFlyoverComposition } from "./maps/MapFlyoverComposition";
import { SpinningGlobeComposition } from "./maps/SpinningGlobeComposition";
import { NewsArticleHighlightComposition } from "./storytelling/NewsArticleHighlightComposition";
import { CircleMarkerComposition } from "./text/CircleMarkerComposition";
import { CrossedOffTextComposition } from "./text/CrossedOffTextComposition";
import { StrikeThroughTextComposition } from "./text/StrikeThroughTextComposition";
import { TextMarkerComposition } from "./text/TextMarkerComposition";
import { YouTubeCommentHighlightComposition } from "./youtube/YouTubeCommentHighlightComposition";
import { YouTubeEndCardComposition } from "./youtube/YouTubeEndCardComposition";
import { YouTubeSubscribeNudgeComposition } from "./youtube/YouTubeSubscribeNudgeComposition";

export const ElementsGallery: React.FC = () => {
  return (
    <Folder name="Elements">
      <Folder name="Backgrounds">
        <Composition id="El-MovingWaves" component={MovingWavesComposition} durationInFrames={240} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Charts">
        <Composition id="El-NumberCounter" component={NumberCounterComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Maps">
        <Composition id="El-MapFlyover" component={MapFlyoverComposition} durationInFrames={285} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-SpinningGlobe" component={SpinningGlobeComposition} durationInFrames={240} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Storytelling">
        <Composition id="El-NewsArticleHighlight" component={NewsArticleHighlightComposition} durationInFrames={150} fps={video.fps} width={video.width} height={video.height} />
      </Folder>
      <Folder name="Text">
        <Composition id="El-CircleMarker" component={CircleMarkerComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
        <Composition id="El-CrossedOff" component={CrossedOffTextComposition} durationInFrames={120} fps={video.fps} width={video.width} height={video.height} />
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
