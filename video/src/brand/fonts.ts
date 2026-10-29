import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadPoppins } from "@remotion/google-fonts/Poppins";

const poppins = loadPoppins("normal", { weights: ["600"], subsets: ["latin"] });
const inter = loadInter("normal", { weights: ["500", "600"], subsets: ["latin"] });

export const fonts = {
  heading: poppins.fontFamily,
  body: inter.fontFamily,
} as const;

export const weights = {
  heading: 600,
  bodyMedium: 500,
  bodySemibold: 600,
} as const;
