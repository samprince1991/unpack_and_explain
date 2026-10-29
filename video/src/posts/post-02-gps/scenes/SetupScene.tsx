import { AbsoluteFill, Interactive, interpolate, useCurrentFrame } from "remotion";
import { fonts, weights } from "../../../brand/fonts";
import { layout } from "../../../brand/layout";
import { clamp, durations } from "../../../brand/motion";
import { colors, typeScale } from "../../../brand/tokens";
import { NumberCounter } from "../../../components/elements/NumberCounter";
import { EarthIcon } from "../../../components/icons/EarthIcon";
import { SatelliteIcon } from "../../../components/icons/SatelliteIcon";
import { SceneCanvas } from "../../../components/SceneCanvas";
import { useCue } from "../../../templates/SectionContext";

const EARTH = { x: 540, y: 830 };
const ORBITS = [
  { rx: 330, ry: 100, tilt: -18, speed: 0.012, phase: 0 },
  { rx: 300, ry: 120, tilt: 24, speed: 0.016, phase: 2.1 },
  { rx: 230, ry: 80, tilt: 70, speed: 0.01, phase: 4.2 },
];
const RING_PERIOD = 40;

const orbitPoint = (orbit: (typeof ORBITS)[number], frame: number) => {
  const a = orbit.phase + frame * orbit.speed;
  const t = (orbit.tilt * Math.PI) / 180;
  const px = orbit.rx * Math.cos(a);
  const py = orbit.ry * Math.sin(a);
  return {
    x: EARTH.x + px * Math.cos(t) - py * Math.sin(t),
    y: EARTH.y + px * Math.sin(t) + py * Math.cos(t),
  };
};

export const SetupScene: React.FC = () => {
  const frame = useCurrentFrame();
  // Signal rings start pulsing as "broadcasting" is spoken.
  const broadcast = useCue("broadcasting", 0.5);
  // Count up after the section fade-in, landing as "thirty" is spoken.
  const thirty = useCue("thirty", 0.15);
  const countFrames = Math.max(18, thirty + 6 - durations.crossfade);

  return (
    <AbsoluteFill>
      <SceneCanvas>
        <EarthIcon x={EARTH.x} y={EARTH.y} size={240} />
        {ORBITS.map((orbit) => {
          const p = orbitPoint(orbit, frame);
          const t = ((frame + orbit.phase * 10) % RING_PERIOD) / RING_PERIOD;
          return (
            <g key={orbit.tilt}>
              <ellipse
                cx={EARTH.x}
                cy={EARTH.y}
                rx={orbit.rx}
                ry={orbit.ry}
                transform={`rotate(${orbit.tilt} ${EARTH.x} ${EARTH.y})`}
                fill="none"
                stroke={colors.diagram.faint}
                strokeWidth={3}
                strokeDasharray="6 10"
              />
              <circle
                cx={p.x}
                cy={p.y}
                r={20 + t * 50}
                fill="none"
                stroke={colors.diagram.soft}
                strokeWidth={3}
                opacity={(1 - t) * 0.7 * interpolate(frame, [broadcast, broadcast + 10], [0, 1], clamp)}
              />
              <SatelliteIcon x={p.x} y={p.y} size={80} />
            </g>
          );
        })}
      </SceneCanvas>
      <Interactive.Div
        name="Satellite count"
        style={{
          position: "absolute",
          left: layout.column.x,
          top: 390,
          width: layout.column.width,
          textAlign: "center",
          fontFamily: fonts.heading,
          fontWeight: weights.heading,
          fontSize: typeScale.title,
          color: colors.text.primary,
          opacity: interpolate(frame, [0, durations.enter], [0, 1], clamp),
        }}
      >
        <span style={{ color: colors.amber[500] }}>
          ~<NumberCounter to={30} start={durations.crossfade} countFrames={countFrames} />
        </span>{" "}
        satellites
      </Interactive.Div>
    </AbsoluteFill>
  );
};
