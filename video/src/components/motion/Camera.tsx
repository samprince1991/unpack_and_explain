import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { layout } from "../../brand/layout";
import { clamp, ease, idle } from "../../brand/motion";

export type CameraShot = {
  // Local frame the camera arrives at this shot (usually a useCue value).
  at: number;
  // Point (frame coordinates) to center on, and zoom (1 = no zoom).
  x: number;
  y: number;
  zoom: number;
};

type CameraProps = {
  // Shots in time order. Between shots the camera glides.
  shots?: CameraShot[];
  // Frames to travel into each shot.
  travel?: number;
  // Slow push-in over the whole scene, on top of the shots (1 = off).
  pushIn?: number;
  // Frames the push-in spans. In a reel pass useSection().durationInFrames;
  // defaults to the composition length.
  duration?: number;
  children: React.ReactNode;
};

// Center of the visual region on the frame-center axis.
export const cameraCenter = {
  x: layout.column.x + layout.column.width / 2,
  y: (layout.regions.visual.top + layout.regions.visual.bottom) / 2,
};

// Wrap the drawing inside SceneCanvas: the clip stays put while the drawing moves, so
// zooms never spill into captions. With no shots it is just the slow push-in.
export const Camera: React.FC<CameraProps> = ({
  shots = [],
  travel = 24,
  pushIn = idle.pushIn,
  duration,
  children,
}) => {
  const frame = useCurrentFrame();
  const config = useVideoConfig();
  const durationInFrames = duration ?? config.durationInFrames;
  const all: CameraShot[] = [{ at: 0, ...cameraCenter, zoom: 1 }, ...shots];

  // The latest shot whose move has started, and how far along that move we are.
  let from = all[0];
  let to = all[0];
  let t = 1;
  for (let i = 1; i < all.length; i++) {
    if (frame >= all[i].at - travel) {
      from = all[i - 1];
      to = all[i];
      t = interpolate(frame, [all[i].at - travel, all[i].at], [0, 1], {
        ...clamp,
        easing: ease.smooth,
      });
    }
  }
  const x = from.x + (to.x - from.x) * t;
  const y = from.y + (to.y - from.y) * t;
  const push = interpolate(frame, [0, durationInFrames], [1, pushIn], clamp);
  const zoom = (from.zoom + (to.zoom - from.zoom) * t) * push;

  return (
    <g
      style={{
        transformBox: "view-box",
        transformOrigin: "0px 0px",
        // Puts (x, y) at the canvas center, then zooms around it.
        translate: `${cameraCenter.x - zoom * x}px ${cameraCenter.y - zoom * y}px`,
        scale: String(zoom),
      }}
    >
      {children}
    </g>
  );
};
