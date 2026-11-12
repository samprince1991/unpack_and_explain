"""Procedural QR code table stand (our own model, license "own"). Z is up, the table is
z = 0, the camera looks from -y. Objects are named after the catalog parts in
video/src/brand/models.ts.

  blender -b --factory-startup --python blender/models/qr_code.py -- <out.glb>

A real QR code (version 1, 21 x 21, error correction level H, byte mode, the text
"unpack", generated with segno and pasted below), printed as raised modules
on a card that stands upright in a small block, facing the camera:

  stand:   the block on the table that holds the card
  card:    the card, rounded corners, a quiet-zone margin round the code
  finders: the three big corner squares
  data:    every other dark module (timing, alignment, format and data)
  bit:     one dark module (the "one bit" close-up)
  byte:    a 2 x 4 block of modules (8 bits) read bottom-up, right then left: 01101110;
           its dark modules raised (byte) and its light ones as thin flat plates (bytezeros)
  patch:   a 6 x 6 block of data modules that tears away and comes back (the backup bits)

Dark modules are flat panels (no walls), welded per part, so neighbouring modules of the
same part merge into one surface with no line between them, and only the region's open
border draws as its outline. Where two modules touch only at a corner, each keeps its own
vertex, pulled a hair apart. `bit`, `byte` and `patch` are inset a small gap from the data
around them. Panels float a small gap in front of the card.
"""

import math
import os
import sys

import bmesh
import bpy

MATRIX = """
111111100101001111111
100000101110101000001
101110101000101011101
101110101101001011101
101110101100101011101
100000101010101000001
111111101010101111111
000000000100100000000
001001111100010111110
100011010101110001101
010111100001101111001
000001001011110001010
101010110111011110001
000000001101001000011
111111101001111111101
100000101010100111001
101110100101010101001
101110100101110010000
101110101010011010111
100000100110011111000
111111100010001111001
"""

GRID = [[c == "1" for c in line.strip()] for line in MATRIX.strip().splitlines()]
N = len(GRID)

M = 0.05  # module size
RELIEF = 0.005  # how far a dark module stands out of the card (thin: thick walls drew jagged double lines head-on)
GAP = 0.004  # between parts
INSET = 0.004  # isolated parts pull back this far from the data around them
MARGIN = 3  # quiet zone, in modules
CORNER_PULL = 0.002  # checkerboard corners pull apart this far

CARD_W = (N + 2 * MARGIN) * M
CARD_T = 0.04
CARD_R = 0.1  # corner radius
STAND_H, STAND_W, STAND_D = 0.14, 0.9, 0.34
CARD_Z0 = STAND_H + GAP
CARD_ZC = CARD_Z0 + CARD_W / 2

BIT = {(11, 10)}
BYTE = {(9 + i, 16 + j) for i in range(4) for j in range(2)}
PATCH = {(13 + i, 9 + j) for i in range(6) for j in range(6)}


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm, smooth=False, recalc=True):
    if recalc:
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = smooth
    return obj


def in_finder(r, c):
    return (r < 8 and c < 8) or (r < 8 and c >= N - 8) or (r >= N - 8 and c < 8)


def dark(r, c):
    return 0 <= r < N and 0 <= c < N and GRID[r][c]


def cells_for(part):
    out = set()
    for r in range(N):
        for c in range(N):
            if not GRID[r][c]:
                continue
            if part == "finders":
                ok = in_finder(r, c)
            elif part == "bit":
                ok = (r, c) in BIT
            elif part == "byte":
                ok = (r, c) in BYTE
            elif part == "patch":
                ok = (r, c) in PATCH
            else:
                ok = not in_finder(r, c) and (r, c) not in BIT | BYTE | PATCH
            if ok:
                out.add((r, c))
    return out


def corner_xz(i, j):
    """Grid corner (row line i, column line j) in model space; row 0 is the top."""
    return (j - N / 2) * M, CARD_ZC + (N / 2 - i) * M


def height_field(cells, inset, relief=RELIEF):
    """Raised modules for a set of cells, welded: one front face per cell, walls only where
    the neighbour is outside the set, one back face per cell. `inset` pulls the region's
    outline inwards (corners move toward the inside of the region)."""
    bm = bmesh.new()
    y_front = -GAP - relief
    y_back = -GAP
    verts = {}

    def diagonal_only(i, j):
        """Two cells of the set touch only at this corner (a checkerboard corner)."""
        tl, tr, bl, br = ((i - 1, j - 1) in cells, (i - 1, j) in cells, (i, j - 1) in cells, (i, j) in cells)
        return (tl and br and not tr and not bl) or (tr and bl and not tl and not br)

    def vert(i, j, layer, cell):
        # A checkerboard corner gets one vertex per cell, so the two squares stay separate
        # surfaces: one shared vertex there lets Freestyle chain strokes diagonally through
        # it, which bends the outlines.
        key = (i, j, layer, cell if diagonal_only(i, j) else None)
        if key not in verts:
            x, z = corner_xz(i, j)
            if inset:
                # The four cells around corner (i, j): which are in the region.
                sx = sz = 0
                for di, dj in ((-1, -1), (-1, 0), (0, -1), (0, 0)):
                    if (i + di, j + dj) in cells:
                        sx += 1 if dj == 0 else -1
                        sz += 1 if di == -1 else -1  # row above the line = higher z
                x += inset * ((sx > 0) - (sx < 0))
                z += inset * ((sz > 0) - (sz < 0))
            if key[3] is not None:
                # Pull the corner a hair into its own cell (cell right of / below the corner).
                r, c = cell
                x += CORNER_PULL if j == c else -CORNER_PULL
                z += -CORNER_PULL if i == r else CORNER_PULL
            verts[key] = bm.verts.new((x, y_front if layer == 0 else y_back, z))
        return verts[key]

    for r, c in cells:
        a, b, cc, d = (r, c), (r, c + 1), (r + 1, c + 1), (r + 1, c)
        # One flat panel per cell, facing the camera (-y). No walls: seen head-on, thin walls
        # sit edge-on and Freestyle hops between their front and back edges, so straight
        # outlines wobble. The open border of the welded panels draws the region outline.
        bm.faces.new([vert(*p, 0, (r, c)) for p in (d, cc, b, a)])
    return bm


def rounded_rect(cx, cz, half_w, half_h, r, steps=8):
    pts = []
    for (ox, oz), a0 in (((half_w - r, half_h - r), 0), ((-half_w + r, half_h - r), 90), ((-half_w + r, -half_h + r), 180), ((half_w - r, -half_h + r), 270)):
        for k in range(steps + 1):
            a = math.radians(a0 + 90 * k / steps)
            pts.append((cx + ox + r * math.cos(a), cz + oz + r * math.sin(a)))
    return pts


def slab_y(bm, outline, y0, y1):
    """A prism along y from an XZ outline (no repeated end point)."""
    front = [bm.verts.new((x, y0, z)) for x, z in outline]
    back = [bm.verts.new((x, y1, z)) for x, z in outline]
    n = len(outline)
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((front[k], back[k], back[j], front[j]))
    bm.faces.new(front[::-1])
    bm.faces.new(back)


def build():
    bm = bmesh.new()
    slab_y(bm, rounded_rect(0.0, CARD_ZC, CARD_W / 2, CARD_W / 2, CARD_R), 0.0, CARD_T)
    new_object("card", bm)

    # The stand: a block with a slot the card stands in (drawn as a plain block just below
    # the card's bottom edge, a gap clear of it).
    bm = bmesh.new()
    half = STAND_W / 2
    outline = rounded_rect(0.0, STAND_H / 2, half, STAND_H / 2, 0.03, steps=4)
    slab_y(bm, outline, CARD_T / 2 - STAND_D / 2, CARD_T / 2 + STAND_D / 2)
    new_object("stand", bm)

    for part in ("finders", "data", "bit", "patch"):
        inset = INSET if part in ("bit", "patch") else 0.0
        new_object(part, height_field(cells_for(part), inset), recalc=False)
    # The byte: every cell is its own box so all 8 can be counted when it lights up. Dark
    # cells (1s) are raised; light cells (0s) are thin flat plates. Blender names repeats
    # byte.001, bytezeros.001 ... (the catalog matches the name before the dot).
    for cell in sorted(BYTE):
        if GRID[cell[0]][cell[1]]:
            new_object("byte", height_field({cell}, INSET), recalc=False)
        else:
            # The 0s sit a little further back than the 1s, so the two read apart.
            new_object("bytezeros", height_field({cell}, INSET, relief=-0.003), recalc=False)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "qr-code.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build()
    os.makedirs(os.path.dirname(out), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[qr_code] wrote {out}")


main()
