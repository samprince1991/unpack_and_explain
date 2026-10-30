import { Interactive } from "remotion";
import { fonts, weights } from "../../brand/fonts";
import { slideLayout } from "../../brand/layout";
import { brand, carouselType, colors } from "../../brand/tokens";

// Slide number and handle on every slide: completion goes up when people can see the
// end, and screenshots travel with the handle on them.
export const SlideFooter: React.FC<{ index: number; total: number }> = ({ index, total }) => {
  const { footer } = slideLayout.regions;

  return (
    <Interactive.Div
      name="Slide footer"
      style={{
        position: "absolute",
        left: slideLayout.column.x,
        top: footer.top,
        width: slideLayout.column.width,
        height: footer.bottom - footer.top,
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        fontFamily: fonts.body,
        fontWeight: weights.bodyMedium,
        fontSize: carouselType.footer,
        color: colors.text.muted,
      }}
    >
      <span>{`${index}/${total}`}</span>
      <span>{brand.handle}</span>
    </Interactive.Div>
  );
};
