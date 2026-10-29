const BACKGROUND_GROUP = /<g id="Background">[\s\S]*?<\/g>\s*/;

export const stripBackground = (svg: string): string => {
  if (!BACKGROUND_GROUP.test(svg)) {
    throw new Error('SVG has no <g id="Background"> group');
  }
  return svg.replace(BACKGROUND_GROUP, "");
};

export const cropViewBox = (
  svg: string,
  box: { x: number; y: number; width: number; height: number },
): string =>
  svg
    .replace(/viewBox="[^"]*"/, `viewBox="${box.x} ${box.y} ${box.width} ${box.height}"`)
    .replace(/(<svg[^>]*?)\swidth="[^"]*"/, `$1 width="${box.width}"`)
    .replace(/(<svg[^>]*?)\sheight="[^"]*"/, `$1 height="${box.height}"`);
