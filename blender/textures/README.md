# Textures

Photo textures for the Blender worlds. The catalog is `video/src/brand/textures.ts`; this
folder holds what `npm run blender` (or `npm run textures`) downloads from it.

- `<id>/<asset>_<map>_<res>.jpg`: the maps (`diff` color, `nor_gl` OpenGL normal, `rough`).
  Gitignored: they're fetched on demand.
- `textures.lock.json`: md5 of every file (tracked), so every machine renders the same pixels.
  A changed upstream file fails the fetch; check it, then `npm run textures -- --update`.

Only CC0 sources (every Poly Haven asset is CC0), so no caption credit is needed. Color maps
are graded in the shader and never replace the token colors of the model or diagrams.
