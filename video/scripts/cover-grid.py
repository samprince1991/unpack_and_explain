# QA: lays reel covers out like the Instagram profile grid (3 across, 3:4 crop, phone size),
# so a cover is judged where it has to work. Run by `npm run cover`; also by hand:
#   python scripts/cover-grid.py out/qa/cover-grid.png cover1.png cover2.png ...
# Covers are 1080x1920; the grid shows the centered 1080x1440 (3:4) area.
import sys
from PIL import Image

TILE_W, TILE_H, GAP = 360, 480, 3  # one tile on a ~390 pt phone at 3x is about 390 px wide
CROP_H = 1440


def tile(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    crop_h = round(CROP_H * w / 1080)
    top = (h - crop_h) // 2
    return img.crop((0, top, w, top + crop_h)).resize((TILE_W, TILE_H), Image.LANCZOS)


def main():
    out, paths = sys.argv[1], sys.argv[2:]
    if not paths:
        raise SystemExit("usage: cover-grid.py out.png cover.png [cover.png ...]")
    cols = 3
    rows = (len(paths) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * TILE_W + (cols - 1) * GAP, rows * TILE_H + (rows - 1) * GAP))
    for i, path in enumerate(paths):
        sheet.paste(tile(path), ((i % cols) * (TILE_W + GAP), (i // cols) * (TILE_H + GAP)))
    sheet.save(out)
    print(out)


main()
