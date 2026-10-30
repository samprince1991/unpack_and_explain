import { interpolate } from "remotion";
import { Euler, PerspectiveCamera, Vector3 } from "three";
import { layout } from "../../brand/layout";
import { clamp, ease, idle } from "../../brand/motion";

export type Vec3 = [number, number, number];

export type Shot3D = {
  // Local frame the camera arrives (usually a useCue value).
  at: number;
  // View-space point to center (scene units, after the orbit), and zoom (1 = none).
  pan: [number, number];
  zoom: number;
};

export type StageOptions = {
  // Degrees per second around the vertical axis, and the starting angle.
  orbit?: number;
  angle?: number;
  // Degrees the scene leans toward the camera.
  tilt?: number;
  shots?: Shot3D[];
  // Frames to travel into each shot.
  travel?: number;
  // Slow push-in across the section (1 = off).
  pushIn?: number;
  // Frames the push-in spans: useSection().durationInFrames in reels.
  duration: number;
  fps: number;
};

export type StageView = { rotation: Vec3; pan: [number, number]; zoom: number };

// The 3D canvas fills the visual region on the centered column (same box as WireGlobe).
export const STAGE = {
  left: layout.column.x,
  top: layout.regions.visual.top,
  width: layout.column.width,
  height: layout.regions.visual.bottom - layout.regions.visual.top,
  fov: 40,
  distance: 6,
} as const;

const rad = (deg: number) => (deg * Math.PI) / 180;
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

// Same glide logic as the 2D Camera: the latest shot whose move has started wins.
export const cameraAt = (frame: number, options: StageOptions): StageView => {
  const {
    orbit = 0,
    angle = 0,
    tilt = 15,
    shots = [],
    travel = 24,
    pushIn = idle.pushIn,
    duration,
    fps,
  } = options;
  const all: Shot3D[] = [{ at: 0, pan: [0, 0], zoom: 1 }, ...shots];
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
  const push = interpolate(frame, [0, Math.max(1, duration)], [1, pushIn], clamp);
  return {
    rotation: [rad(tilt), rad(angle + (orbit * frame) / fps), 0],
    pan: [lerp(from.pan[0], to.pan[0], t), lerp(from.pan[1], to.pan[1], t)],
    zoom: lerp(from.zoom, to.zoom, t) * push,
  };
};

const camera = new PerspectiveCamera(STAGE.fov, STAGE.width / STAGE.height, 0.1, 100);
camera.position.set(0, 0, STAGE.distance);
camera.updateMatrixWorld();

// Frame pixels of a scene point under `view`. Mirrors Stage3D's groups:
// rotate, then pan and zoom, then the fixed camera. `scale` is the on-screen size of
// one unit there, relative to the origin at zoom 1 (bigger when nearer the camera).
export const projectToScreen = (point: Vec3, view: StageView) => {
  const v = new Vector3(...point).applyEuler(new Euler(...view.rotation));
  v.set((v.x - view.pan[0]) * view.zoom, (v.y - view.pan[1]) * view.zoom, v.z * view.zoom);
  const scale = (view.zoom * STAGE.distance) / (STAGE.distance - v.z);
  v.project(camera);
  return {
    x: STAGE.left + ((v.x + 1) / 2) * STAGE.width,
    y: STAGE.top + ((1 - v.y) / 2) * STAGE.height,
    scale,
  };
};
