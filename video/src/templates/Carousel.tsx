import { AbsoluteFill, Img, Interactive, staticFile, useCurrentFrame } from "remotion";
import { fonts, weights } from "../brand/fonts";
import { slideLayout } from "../brand/layout";
import { brand, carouselType, colors } from "../brand/tokens";
import { Background } from "../components/Background";
import { CarouselGuide } from "../components/carousel/CarouselGuide";
import { SlideFooter } from "../components/carousel/SlideFooter";
import { HighlightedText } from "../components/HighlightedText";
import { recapSteps } from "./recap";
import type { CarouselScript, CarouselSlide } from "./types";

type Region = { top: number; bottom: number };

export type CarouselProps = {
  script: CarouselScript;
  showGuides: boolean;
};

// Visuals per slide number (1-based), drawn by the post into a SlideCanvas.
export type CarouselVisuals = Partial<Record<number, React.FC>>;

const { column, regions } = slideLayout;

// Centered text block filling one region of the column.
const TextBlock: React.FC<{
  name: string;
  region: Region;
  style: React.CSSProperties;
  align?: React.CSSProperties["alignItems"];
  children: React.ReactNode;
}> = ({ name, region, style, align = "center", children }) => {
  return (
    <Interactive.Div
      name={name}
      style={{
        position: "absolute",
        left: column.x,
        top: region.top,
        width: column.width,
        height: region.bottom - region.top,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: align,
        textAlign: "center",
        textWrap: "balance",
        ...style,
      }}
    >
      {children}
    </Interactive.Div>
  );
};

const headlineStyle: React.CSSProperties = {
  fontFamily: fonts.heading,
  fontWeight: weights.heading,
  fontSize: carouselType.headline,
  lineHeight: 1.12,
  color: colors.text.primary,
};

const bodyStyle: React.CSSProperties = {
  fontFamily: fonts.body,
  fontWeight: weights.bodyMedium,
  fontSize: carouselType.body,
  lineHeight: 1.35,
  color: colors.text.secondary,
};

const CoverSlide: React.FC<{ slide: CarouselSlide; highlight?: string; Visual?: React.FC }> = ({
  slide,
  highlight,
  Visual,
}) => {
  return (
    <>
      <TextBlock
        name="Cover hook"
        region={regions.coverHook}
        style={{ ...headlineStyle, fontSize: carouselType.cover, lineHeight: 1.08 }}
      >
        <div>{highlight ? <HighlightedText text={slide.headline} highlight={highlight} /> : slide.headline}</div>
      </TextBlock>
      {Visual ? <Visual /> : null}
      <TextBlock name="Cover promise" region={regions.coverBody} style={bodyStyle}>
        {slide.body}
      </TextBlock>
    </>
  );
};

const ContentSlide: React.FC<{ slide: CarouselSlide; Visual?: React.FC }> = ({ slide, Visual }) => {
  return (
    <>
      <TextBlock name="Headline" region={regions.headline} style={headlineStyle} align="flex-end">
        {slide.headline}
      </TextBlock>
      {Visual ? <Visual /> : null}
      <TextBlock name="Body" region={regions.body} style={bodyStyle} align="flex-start">
        {slide.body}
      </TextBlock>
    </>
  );
};

// Line height of a recap step, and the size of its number badge.
const RECAP_LINE = 64;

const recapList: Region = { top: regions.visual.top, bottom: regions.body.bottom - 80 };
const recapSource: Region = { top: recapList.bottom, bottom: regions.body.bottom };

const RecapSlide: React.FC<{ slide: CarouselSlide; source: string }> = ({ slide, source }) => {
  return (
    <>
      <TextBlock name="Headline" region={regions.headline} style={headlineStyle} align="flex-end">
        {slide.headline}
      </TextBlock>
      <Interactive.Div
        name="Recap list"
        style={{
          position: "absolute",
          left: column.x,
          top: recapList.top,
          width: column.width,
          height: recapList.bottom - recapList.top,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 36,
          fontFamily: fonts.body,
          fontWeight: weights.bodySemibold,
          fontSize: carouselType.body,
          lineHeight: `${RECAP_LINE}px`,
          color: colors.text.primary,
        }}
      >
        {recapSteps(slide.body).map((step, i) => (
          <div key={step} style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
            {/* Badge height = one line of step text, so it centers on the first line
                even when the step wraps. */}
            <span
              style={{
                width: RECAP_LINE,
                height: RECAP_LINE,
                flexShrink: 0,
                borderRadius: RECAP_LINE / 2,
                border: `4px solid ${colors.amber[500]}`,
                boxSizing: "border-box",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: fonts.heading,
                fontWeight: weights.heading,
                fontSize: carouselType.footer,
                lineHeight: 1,
                color: colors.amber[500],
              }}
            >
              {i + 1}
            </span>
            <span>{step}</span>
          </div>
        ))}
      </Interactive.Div>
      <TextBlock
        name="Source"
        region={recapSource}
        style={{
          fontFamily: fonts.body,
          fontWeight: weights.bodyMedium,
          fontSize: carouselType.footer,
          color: colors.text.muted,
        }}
      >
        {`Source: ${source}`}
      </TextBlock>
    </>
  );
};

const CtaSlide: React.FC<{ slide: CarouselSlide }> = ({ slide }) => {
  // The stacked SVG is square with wide transparent padding around the mark, so it is
  // drawn larger than the region and centered on it.
  const logo = 620;
  const middle = (regions.visual.top + regions.visual.bottom) / 2;
  return (
    <>
      <TextBlock name="Headline" region={regions.headline} style={headlineStyle} align="flex-end">
        {slide.headline}
      </TextBlock>
      <Img
        name="CTA logo"
        src={staticFile("brand/stacked.svg")}
        style={{
          position: "absolute",
          left: (column.x * 2 + column.width - logo) / 2,
          top: middle - logo / 2,
          width: logo,
          height: logo,
        }}
      />
      <TextBlock name="Body" region={regions.body} style={bodyStyle} align="flex-start">
        <div>{slide.body}</div>
        <div
          style={{
            marginTop: 40,
            fontWeight: weights.bodySemibold,
            color: colors.teal[400],
          }}
        >
          {brand.handle}
        </div>
      </TextBlock>
    </>
  );
};

const guideRegions = (kind: CarouselSlide["kind"]): Region[] =>
  kind === "cover"
    ? [regions.coverHook, regions.coverVisual, regions.coverBody, regions.footer]
    : kind === "recap"
      ? [regions.headline, recapList, recapSource, regions.footer]
      : [regions.headline, regions.visual, regions.body, regions.footer];

// One frame per slide: frame 0 is slide 1. Render all slides with
// `npx remotion render CarouselNN-Slug out/post-NN-slug --sequence --image-format=png`.
export const Carousel: React.FC<CarouselProps & { visuals: CarouselVisuals }> = ({
  script,
  showGuides,
  visuals,
}) => {
  const frame = useCurrentFrame();
  const index = Math.min(frame, script.slides.length - 1);
  const slide = script.slides[index];
  const Visual = visuals[index + 1];

  return (
    <AbsoluteFill>
      <Background />
      {slide.kind === "cover" ? (
        <CoverSlide slide={slide} highlight={script.coverHighlight} Visual={Visual} />
      ) : slide.kind === "recap" ? (
        <RecapSlide slide={slide} source={script.source} />
      ) : slide.kind === "cta" ? (
        <CtaSlide slide={slide} />
      ) : (
        <ContentSlide slide={slide} Visual={Visual} />
      )}
      <SlideFooter index={index + 1} total={script.slides.length} />
      {showGuides ? <CarouselGuide regions={guideRegions(slide.kind)} /> : null}
    </AbsoluteFill>
  );
};
