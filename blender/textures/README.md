# Textures

Photo textures for the Blender worlds. Each folder is one texture: `<name>_diff_2k.jpg` (color),
`<name>_nor_gl_2k.jpg` (OpenGL normal map), `<name>_rough_2k.jpg` (roughness).

| Folder | Source | License | Used by |
|---|---|---|---|
| `leafy_grass` | Poly Haven, "Leafy Grass" (polyhaven.com/a/leafy_grass) | CC0 (no credit needed) | `world/coast.py` grass |

Only CC0 or own textures here, so no caption credit is needed. Color textures are graded in the
shader (`coast._grass_texture`) and never replace the token colors of diagrams or the model.
