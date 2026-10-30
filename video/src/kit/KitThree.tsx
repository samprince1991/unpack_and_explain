import { AbsoluteFill } from "remotion";
import { Background } from "../components/Background";
import { WireGlobe } from "../components/three/WireGlobe";

// 3D globe demo. Render with --gl=angle.
export const KitThree: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <WireGlobe marker={{ lat: 20, lon: 10 }} markerAt={30} />
  </AbsoluteFill>
);
