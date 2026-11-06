// Studio previews of the chart kit (src/components/charts). Demo data is made up:
// kit only, never in a post.
import { AbsoluteFill, Series, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { layout, slideLayout } from "../brand/layout";
import { colors, typeScale } from "../brand/tokens";
import { Background } from "../components/Background";
import { SlideCanvas } from "../components/carousel/SlideCanvas";
import { BarChart } from "../components/charts/bar/BarChart";
import type { ChartTiming } from "../components/charts/common";
import { Funnel } from "../components/charts/funnel/Funnel";
import type { Box } from "../components/charts/geometry";
import { LineChart } from "../components/charts/line/LineChart";
import { PieChart } from "../components/charts/pie/PieChart";
import { Sankey } from "../components/charts/sankey/Sankey";
import { TreeDiagram } from "../components/charts/tree/TreeDiagram";
import { Treemap } from "../components/charts/treemap/Treemap";
import { SceneCanvas } from "../components/SceneCanvas";

const FRAMES = 100;
const REEL_TIMING: ChartTiming = { at: 0, keyAt: 55, exitAt: 86 };
const REEL_BOX: Box = { x: 190, y: 480, width: 700, height: 640 };
const SLIDE_BOX: Box = {
  x: slideLayout.column.x,
  y: slideLayout.regions.visual.top,
  width: slideLayout.column.width,
  height: slideLayout.regions.visual.bottom - slideLayout.regions.visual.top,
};

const demos = (
  box: Box,
  t: ChartTiming,
): { name: string; draw: React.ReactNode }[] => [
  {
    name: "BarChart",
    draw: (
      <BarChart
        box={box}
        keyId="thu"
        {...t}
        data={[
          { id: "mon", name: "Mon", value: 12 },
          { id: "tue", name: "Tue", value: 18 },
          { id: "wed", name: "Wed", value: 9 },
          { id: "thu", name: "Thu", value: 27 },
          { id: "fri", name: "Fri", value: 15 },
        ]}
      />
    ),
  },
  {
    name: "BarChart horizontal",
    draw: (
      <BarChart
        box={box}
        orientation="horizontal"
        keyId="rent"
        unit="%"
        values="all"
        {...t}
        data={[
          { id: "rent", name: "Rent", value: 40 },
          { id: "food", name: "Food", value: 25 },
          { id: "travel", name: "Travel", value: 20 },
          { id: "fun", name: "Fun", value: 15 },
        ]}
      />
    ),
  },
  {
    name: "LineChart",
    draw: (
      <LineChart
        box={box}
        keyId="y24"
        {...t}
        data={[
          { id: "y20", name: "2020", value: 4 },
          { id: "y21", name: "2021", value: 7 },
          { id: "y22", name: "2022", value: 6 },
          { id: "y23", name: "2023", value: 11 },
          { id: "y24", name: "2024", value: 19 },
        ]}
      />
    ),
  },
  {
    name: "PieChart",
    draw: (
      <PieChart
        box={box}
        keyId="a"
        unit="%"
        values="all"
        {...t}
        data={[
          { id: "a", value: 45 },
          { id: "b", value: 30 },
          { id: "c", value: 15 },
          { id: "d", value: 10 },
        ]}
      />
    ),
  },
  {
    name: "PieChart donut",
    draw: (
      <PieChart
        box={box}
        donut
        keyId="a"
        unit="%"
        {...t}
        data={[
          { id: "a", name: "Video", value: 65 },
          { id: "b", value: 20 },
          { id: "c", value: 15 },
        ]}
      />
    ),
  },
  {
    name: "Treemap",
    draw: (
      <Treemap
        box={box}
        keyId="chip"
        format={(v) => `$${v}`}
        {...t}
        data={{
          id: "phone",
          children: [
            { id: "chip", name: "Chip", value: 130 },
            { id: "screen", name: "Screen", value: 90 },
            {
              id: "rest",
              children: [
                { id: "camera", name: "Camera", value: 60 },
                { id: "battery", name: "Battery", value: 20 },
                { id: "case", name: "Case", value: 25 },
              ],
            },
          ],
        }}
      />
    ),
  },
  {
    name: "TreeDiagram",
    draw: (
      <TreeDiagram
        box={box}
        keyId="shop"
        {...t}
        data={{
          id: "root",
          name: ".",
          children: [
            {
              id: "com",
              name: "com",
              children: [
                { id: "shop", name: "shop" },
                { id: "mail", name: "mail" },
              ],
            },
            { id: "org", name: "org" },
            { id: "net", name: "net" },
          ],
        }}
      />
    ),
  },
  {
    name: "Sankey",
    draw: (
      <Sankey
        box={box}
        keyId="net->save"
        unit="%"
        {...t}
        data={{
          nodes: [
            { id: "pay", name: "Pay" },
            { id: "tax", name: "Tax" },
            { id: "net", name: "Net" },
            { id: "rent", name: "Rent" },
            { id: "save", name: "Save" },
          ],
          links: [
            { source: "pay", target: "tax", value: 20 },
            { source: "pay", target: "net", value: 80 },
            { source: "net", target: "rent", value: 50 },
            { source: "net", target: "save", value: 30 },
          ],
        }}
      />
    ),
  },
  {
    name: "Funnel",
    draw: (
      <Funnel
        box={box}
        keyId="buy"
        values="all"
        {...t}
        data={[
          { id: "visit", name: "Visit", value: 1000 },
          { id: "signup", name: "Sign up", value: 300 },
          { id: "buy", name: "Buy", value: 40 },
        ]}
      />
    ),
  },
];

const Name: React.FC<{
  text: string;
  top: number;
  left: number;
  width: number;
}> = ({ text, top, left, width }) => (
  <div
    style={{
      position: "absolute",
      left,
      width,
      top,
      textAlign: "center",
      fontFamily: fonts.body,
      fontWeight: weights.bodySemibold,
      fontSize: typeScale.label,
      color: colors.text.muted,
    }}
  >
    {text}
  </div>
);

const REEL = demos(REEL_BOX, REEL_TIMING);

// Chart kit as reel scenes: entrance, key at frame 55, exit.
export const KitCharts: React.FC = () => (
  <AbsoluteFill>
    <Background />
    <Series>
      {REEL.map((d) => (
        <Series.Sequence key={d.name} durationInFrames={FRAMES}>
          <SceneCanvas>{d.draw}</SceneCanvas>
          <Name
            text={d.name}
            top={layout.regions.captions.top}
            left={layout.column.x}
            width={layout.column.width}
          />
        </Series.Sequence>
      ))}
    </Series>
  </AbsoluteFill>
);

export const kitChartsFrames = REEL.length * FRAMES;

const SLIDES = demos(SLIDE_BOX, { still: true });

// The same charts as carousel visuals (still): one frame per chart, 1080x1350.
export const KitChartsSlides: React.FC = () => {
  const frame = useCurrentFrame();
  const d = SLIDES[frame];
  return (
    <AbsoluteFill>
      <Background />
      <SlideCanvas region={slideLayout.regions.visual}>{d.draw}</SlideCanvas>
      <Name
        text={d.name}
        top={slideLayout.regions.body.top}
        left={slideLayout.column.x}
        width={slideLayout.column.width}
      />
    </AbsoluteFill>
  );
};

export const kitChartsSlideCount = SLIDES.length;
