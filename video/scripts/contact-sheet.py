# QA: tile every Nth frame of a rendered image sequence into contact sheets.
# Usage: python scripts/contact-sheet.py out/seq out/qa/sheet 15 32
import sys, os, glob
from PIL import Image, ImageDraw
src, out, step, per = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
files = sorted(glob.glob(os.path.join(src, "*.jpeg")))
picked = files[::step]
cols = 8
for s in range(0, len(picked), per):
    chunk = picked[s:s+per]
    w, h = Image.open(chunk[0]).size
    rows = (len(chunk) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * w, rows * (h + 20)), "white")
    d = ImageDraw.Draw(sheet)
    for i, f in enumerate(chunk):
        x, y = (i % cols) * w, (i // cols) * (h + 20)
        sheet.paste(Image.open(f), (x, y + 20))
        d.text((x + 4, y + 4), "f" + str(int(os.path.basename(f).split(".")[0].split("-")[-1])), fill="black")
    sheet.save(f"{out}-{s // per}.png")
    print(f"{out}-{s // per}.png", len(chunk))
