// Photo textures for the Blender worlds (docs/blender.md "Textures").
//
// Each entry is a Poly Haven asset (polyhaven.com/a/<asset>; every Poly Haven asset is CC0,
// so no caption credit). `npm run blender` downloads the maps a post's world needs into
// blender/textures/<id>/ (gitignored) and pins their md5 in blender/textures/textures.lock.json
// (tracked), so every machine renders the same pixels. To add one: add an entry here, list
// the worlds that use it, then run `npm run textures` (or just `npm run blender`).
//
// Color maps are graded in the shader; they never replace the token colors of the model or
// diagrams.

export type TextureMap = "diff" | "nor_gl" | "rough";
export type TextureResolution = "1k" | "2k" | "4k";

export type TextureEntry = {
  source: "polyhaven";
  /** Poly Haven asset id. */
  asset: string;
  name: string;
  resolution: TextureResolution;
  maps: readonly TextureMap[];
  /** World ids (see WORLDS) whose Blender code loads this texture. */
  worlds: readonly string[];
  /** What it is for, in a phrase. */
  use: string;
};

export const textures = {
  leafy_grass: {
    source: "polyhaven",
    asset: "leafy_grass",
    name: "Leafy Grass",
    resolution: "2k",
    maps: ["diff", "nor_gl", "rough"],
    worlds: ["coast", "track", "rail"],
    use: "Grass on the coast, track and rail ground (and the blades' color)",
  },
} as const satisfies Record<string, TextureEntry>;

export type TextureId = keyof typeof textures;
