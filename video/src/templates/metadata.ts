import { getRemotionEnvironment, type CalculateMetadataFunction } from "remotion";
import { durations } from "../brand/motion";
import { video } from "../brand/tokens";
import { voice } from "../brand/voice";
import type { ReelProps } from "./Reel";
import { loadAudioLibrary } from "./audioLibrary";
import { blenderProblems, clipStatuses, loadBlenderManifest } from "./blender";
import { buildBlenderJob, isBlenderPlan } from "./blenderJob";
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

  let blender3d = null;
  if (isBlenderPlan(props.script.blender)) {
    blender3d = await loadBlenderManifest(props.script.id);
    const job = buildBlenderJob(props.script, vo, video.fps);
    const problem = blenderProblems(
      props.script.id,
      clipStatuses(job, blender3d),
      props.allowBlenderPreview,
    );
    if (problem && getRemotionEnvironment().isRendering) {
      throw new Error(problem);
    }
    if (problem) {
      console.warn(`[${props.script.id}] ${problem}`);
    }
  }
  return { durationInFrames: totalFrames, props: { ...props, vo, audio, blender3d } };
};
