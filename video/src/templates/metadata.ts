import type { CalculateMetadataFunction } from "remotion";
import { durations } from "../brand/motion";
import { video } from "../brand/tokens";
import { voice } from "../brand/voice";
import type { ReelProps } from "./Reel";
import { loadAudioLibrary } from "./audioLibrary";
import { computeTimeline } from "./timing";
import { validateScript } from "./validate";
import { loadVo } from "./vo";

export const calculateReelMetadata: CalculateMetadataFunction<ReelProps> = async ({ props }) => {
  const { errors, warnings } = validateScript(props.script);
  if (errors.length > 0) {
    throw new Error(`Script ${props.script.id} is invalid:\n- ${errors.join("\n- ")}`);
  }
  warnings.forEach((w) => console.warn(`[${props.script.id}] ${w}`));

  const vo = await loadVo(props.script, voice.wordsPerSecond);
  if (vo.estimated) {
    console.warn(`[${props.script.id}] Using estimated timing. Run: npm run tts -- ${props.script.id}`);
  }
  const { totalFrames } = computeTimeline(vo.sections, video.fps, durations.crossfade);
  const audio = await loadAudioLibrary();
  return { durationInFrames: totalFrames, props: { ...props, vo, audio } };
};
