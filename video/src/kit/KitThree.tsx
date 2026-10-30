import { AbsoluteFill, Series, interpolate, useCurrentFrame } from "remotion";
import { clamp } from "../brand/motion";
import { Background } from "../components/Background";
import { Bars3D, barTop } from "../components/three/Bars3D";
import { ExplodedView } from "../components/three/ExplodedView";
import { Label3D } from "../components/three/Label3D";
import { NetworkGraph3D } from "../components/three/NetworkGraph3D";
import { Stage3D, useStageView } from "../components/three/Stage3D";
import { WireGlobe } from "../components/three/WireGlobe";
import { WireObject } from "../components/three/WireObject";

const FRAMES = 120;

const Objects: React.FC = () => {
  const view = useStageView({ orbit: 20, duration: FRAMES });
  return (
    <Stage3D view={view}>
      <WireObject shape="phone" position={[-1, 0, 0]} />
      <WireObject shape="card" position={[0.6, 0.6, 0]} role="amber" drawAt={10} />
      <WireObject shape="cylinder" position={[0.8, -0.8, 0]} drawAt={20} />
    </Stage3D>
  );
};

const Exploded: React.FC = () => {
  const view = useStageView({ orbit: 10, angle: 30, tilt: 25, duration: FRAMES });
  const layers = Array.from({ length: 4 }, () => ({ shape: "slab" as const }));
  return (
    <Stage3D view={view}>
      <ExplodedView layers={layers} keyIndex={2} explodeAt={30} stagger={3} />
    </Stage3D>
  );
};

const Network: React.FC = () => {
  const view = useStageView({
    orbit: 6,
    duration: FRAMES,
    shots: [{ at: 95, pan: [0.2, 0.2], zoom: 1.1 }],
  });
  return (
    <Stage3D view={view}>
      <NetworkGraph3D
        nodes={[
          { id: "phone", pos: [-1.3, -0.6, 0], shape: "box" },
          { id: "tower", pos: [-0.5, 0.6, 0.5] },
          { id: "hub", pos: [0.3, -0.2, -0.6] },
          { id: "isp", pos: [0.6, 1, 0.2] },
          { id: "server", pos: [1.3, 0.4, 0], shape: "box" },
        ]}
        edges={[
          ["phone", "tower"],
          ["tower", "hub"],
          ["tower", "isp"],
          ["hub", "server"],
          ["isp", "server"],
        ]}
        route={["phone", "tower", "isp", "server"]}
        travelAt={40}
        travelFrames={45}
      />
    </Stage3D>
  );
};

const Bars: React.FC = () => {
  const frame = useCurrentFrame();
  const view = useStageView({ orbit: 8, angle: -20, tilt: 18, duration: FRAMES });
  const props = { values: [3, 5, 2, 8], keyIndex: 3, riseAt: 10 };
  return (
    <>
      <Stage3D view={view}>
        <Bars3D {...props} />
      </Stage3D>
      <Label3D
        view={view}
        at={barTop(3, frame, props)}
        offsetY={-50}
        opacity={interpolate(frame, [40, 52], [0, 1], clamp)}
        accent
      >
        8x
      </Label3D>
    </>
  );
};

const DEMOS = [
  { name: "WireGlobe", draw: <WireGlobe marker={{ lat: 20, lon: 10 }} markerAt={30} /> },
  { name: "WireObject", draw: <Objects /> },
  { name: "ExplodedView", draw: <Exploded /> },
  { name: "NetworkGraph3D", draw: <Network /> },
  { name: "Bars3D", draw: <Bars /> },
];

// 3D style demos, one after another. WebGL: rendered with ANGLE (remotion.config.ts).
export const KitThree: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      {DEMOS.map((d) => (
        <Series.Sequence key={d.name} durationInFrames={FRAMES} name={d.name}>
          {d.draw}
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const kitThreeFrames = DEMOS.length * FRAMES;
