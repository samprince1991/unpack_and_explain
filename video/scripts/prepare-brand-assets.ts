import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cropViewBox, stripBackground } from "./lib/svg";

const LOGO_DIR = join(process.cwd(), "..", "logo", "svg");
const OUT_DIR = join(process.cwd(), "public", "brand");

const read = (name: string) => readFileSync(join(LOGO_DIR, name), "utf8");

mkdirSync(OUT_DIR, { recursive: true });

writeFileSync(
  join(OUT_DIR, "avatar.svg"),
  cropViewBox(stripBackground(read("unpack-and-explain_Avatar-Dark.svg")), {
    x: 190,
    y: 300,
    width: 700,
    height: 470,
  }),
);

writeFileSync(
  join(OUT_DIR, "stacked.svg"),
  stripBackground(read("unpack-and-explain_Stacked-Dark.svg")),
);

console.log(`Wrote avatar.svg and stacked.svg to ${OUT_DIR}`);
