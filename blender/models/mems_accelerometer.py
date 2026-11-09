"""Procedural phone with a MEMS accelerometer chip (our own model, license "own").

Axis: X across the phone, Z up the phone, the camera looks along +Y (yaw 0) at the open
back of the phone, so the die lies in the XZ plane. The chip sits at the exact centre of
the phone, because "wide" shots aim at the model's centre. Not to scale: a true 2 mm chip
would be a speck in a phone, so it is drawn about a quarter of the phone's width.

Built like a real part, from the outside in:

- phone:  open tray with a board, a battery, a larger chip and small parts around ours (`away`)
- lid:    metal can of an LGA package, a hollow shell with a pin-1 dot, no leads (`away`)
- base:   the package's laminate, with its solder pads underneath and bond pads on top
- asic:   the control chip, with bond pads, under the MEMS die
- wires:  gold bond wires, MEMS die to control chip and control chip to laminate
- frame:  MEMS die: floor, seal ring, bond pads, spring anchors
- weight: the proof mass: a plate with etch holes and its moving comb fingers (slides along X)
- fixedtop / fixedbottom: anchored rails with the fingers that don't move, between the moving ones
- springleft / springright: flat folded silicon beams from the weight to the anchors
- axisx / axisy / ground: arrows, hidden until `appear` beats. Ground points down (-Z)

Left out on purpose: the silicon cap that seals a real MEMS die, which would hide the comb.

Objects are named after the catalog parts. Parts never touch (small gaps, see blender/qc.py),
except the arrows and the lid, which are never on screen together. Etched silicon is built
from rectangles on one grid, so it is one closed surface with only true 90-degree edges.

  blender -b --factory-startup --python blender/models/mems_accelerometer.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

# phone tray (y runs from the open back at -PHONE_D to the screen side at +PHONE_D)
PHONE_W, PHONE_H, PHONE_D = 1.5, 3.0, 0.25
PHONE_R = 0.35
WALL = 0.07
FLOOR = 0.2  # inner floor of the tray
BOARD_Y = 0.13  # the board's face, where parts sit
PART_GAP = 0.002

# package, front (-Y) to back. Square and low, like a 2 x 2 x 1 mm LGA.
LID_W = 0.385
LID_R = 0.03
LID_FILLET = 0.012
LID_SHELL = 0.012
LID_Y0, LID_Y1 = -0.12, 0.078
BASE_W = 0.405
BASE_Y0, BASE_Y1 = 0.08, 0.11
SOLDER_Y1 = 0.125  # solder pads under the laminate, just clear of the board
LANDING_X = 0.36  # bond pads on the laminate
LANDING_Y = 0.078

# control chip
ASIC_W = 0.33
ASIC_Y0, ASIC_Y1 = 0.05, 0.078
ASIC_PAD_X = 0.305
ASIC_PAD_Y = 0.0485

# MEMS die: a floor, then one etched layer in front of it
FLOOR_W, FLOOR_TOP, FLOOR_BOTTOM = 0.245, 0.245, -0.265
FLOOR_Y0, FLOOR_Y1 = 0.035, 0.048
RING_OUT, RING_IN = 0.235, 0.21
ETCH_Y0, ETCH_Y1 = 0.0, 0.03  # deep and narrow, as etched silicon really is
MEMS_PAD_Z = -0.25
MEMS_PAD_Y = 0.034

# proof mass and comb
MASS_W, MASS_H = 0.118, 0.06
HOLE, HOLE_PITCH = 0.012, 0.024
HOLE_COLS, HOLE_ROWS = 9, 4
FINGERS = 9
PITCH = 0.026  # between two moving fingers; fixed fingers sit halfway
FINGER = 0.008
MOVING_TIP = 0.135
FIXED_TIP = 0.075
RAIL_Z0, RAIL_Z1 = 0.15, 0.168
RAIL_W = 0.125
RAIL_ANCHOR = 0.19  # anchor blocks at the ends of each rail

# springs: four flat beams folded back and forth, stretching along X
SPRING_X0, SPRING_X1 = 0.12, 0.176
SPRING_RUNS = (0.13, 0.1433, 0.1567, 0.17)
SPRING_A = 0.095  # how far the runs reach above and below the centre line
BEAM = 0.005
ANCHOR_X0, ANCHOR_X1 = 0.178, 0.2
ANCHOR_H = 0.02

# bond wires
WIRE_R = 0.0028
TUBE_SIDES = 16

# arrows, in front of the die
ARROW_Y = -0.07
ARROW_START = 0.012  # off the shared centre, so the three arrows don't cross each other
ARROW_LEN = 0.36  # long enough for the tips to clear the die
ARROW_LEN_Y = 0.14  # toward the camera, where perspective makes it much bigger
ARROW_R = 0.009
HEAD_R, HEAD_LEN = 0.024, 0.055


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm, smooth=False):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = smooth
    return obj


def box(bm, x0, x1, y0, y1, z0, z1):
    v = [bm.verts.new((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (z0, z1)]
    for f in ((0, 1, 3, 2), (4, 6, 7, 5), (0, 4, 5, 1), (2, 3, 7, 6), (0, 2, 6, 4), (1, 5, 7, 3)):
        bm.faces.new([v[i] for i in f])


def etched(name, rects, holes=()):
    """Extrudes a union of (x0, x1, z0, z1) rectangles, minus `holes`, through the etched
    layer. Everything sits on one grid and shares vertices, so a comb or a folded beam is
    one closed surface: no inner walls, so no stray lines where a finger meets the plate."""
    xs = sorted({r[i] for r in (*rects, *holes) for i in (0, 1)})
    zs = sorted({r[i] for r in (*rects, *holes) for i in (2, 3)})

    def solid(i, k):
        if not (0 <= i < len(xs) - 1 and 0 <= k < len(zs) - 1):
            return False
        x, z = (xs[i] + xs[i + 1]) / 2, (zs[k] + zs[k + 1]) / 2
        inside = lambda r: r[0] < x < r[1] and r[2] < z < r[3]
        return any(inside(r) for r in rects) and not any(inside(h) for h in holes)

    bm = bmesh.new()
    verts = {}

    def vert(i, k, y):
        key = (i, k, y)
        if key not in verts:
            verts[key] = bm.verts.new((xs[i], y, zs[k]))
        return verts[key]

    for i in range(len(xs) - 1):
        for k in range(len(zs) - 1):
            if not solid(i, k):
                continue
            for y in (ETCH_Y0, ETCH_Y1):
                bm.faces.new((vert(i, k, y), vert(i + 1, k, y), vert(i + 1, k + 1, y), vert(i, k + 1, y)))
            for (ni, nk), a, b in (
                ((i - 1, k), (i, k), (i, k + 1)),
                ((i + 1, k), (i + 1, k), (i + 1, k + 1)),
                ((i, k - 1), (i, k), (i + 1, k)),
                ((i, k + 1), (i, k + 1), (i + 1, k + 1)),
            ):
                if not solid(ni, nk):
                    bm.faces.new((vert(*a, ETCH_Y0), vert(*b, ETCH_Y0), vert(*b, ETCH_Y1), vert(*a, ETCH_Y1)))
    new_object(name, bm)


def rounded_rect(w, h, r, steps=12):
    """Closed (x, z) loop, 7.5 degrees a step round each corner."""
    pts = []
    for cx, cz, a0 in ((w - r, h - r, 0), (-w + r, h - r, 90), (-w + r, -h + r, 180), (w - r, -h + r, 270)):
        for k in range(steps + 1):
            a = math.radians(a0 + 90 * k / steps)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return pts


def capacitor(bm, x, z, along_x, top):
    """A surface-mount capacitor: a body between two slightly bigger metal ends."""
    half, end, w, body_w = 0.055, 0.016, 0.03, 0.027
    y0 = top - 0.04
    for a0, a1, h, y in (
        (-half, -half + end, w, y0),
        (-half + end, half - end, body_w, y0 + 0.003),
        (half - end, half, w, y0),
    ):
        if along_x:
            box(bm, x + a0, x + a1, y, top, z - h, z + h)
        else:
            box(bm, x - h, x + h, y, top, z + a0, z + a1)


def build_phone():
    bm = bmesh.new()
    outer = rounded_rect(PHONE_W, PHONE_H, PHONE_R)
    inner = rounded_rect(PHONE_W - WALL, PHONE_H - WALL, PHONE_R - WALL)
    n = len(outer)
    rim_out = [bm.verts.new((x, -PHONE_D, z)) for x, z in outer]
    rim_in = [bm.verts.new((x, -PHONE_D, z)) for x, z in inner]
    back_out = [bm.verts.new((x, PHONE_D, z)) for x, z in outer]
    floor_in = [bm.verts.new((x, FLOOR, z)) for x, z in inner]
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((rim_out[i], rim_out[j], back_out[j], back_out[i]))  # outer wall
        bm.faces.new((rim_in[i], rim_in[j], rim_out[j], rim_out[i]))  # rim
        bm.faces.new((floor_in[i], floor_in[j], rim_in[j], rim_in[i]))  # inner wall
    bm.faces.new(back_out)
    bm.faces.new(floor_in)
    # Board behind the chip and a battery below it, standing on the tray floor with a gap.
    box(bm, -1.2, 1.2, BOARD_Y, 0.18, -0.95, 2.5)
    box(bm, -1.15, 1.15, -0.05, 0.18, -2.75, -1.1)
    # A larger chip and small capacitors around ours, so it reads as one part on a busy board.
    # Everything stops just short of the board: a shared face would break up the outlines.
    top = BOARD_Y - PART_GAP
    box(bm, -0.55, 0.55, 0.05, top, 0.95, 1.85)
    box(bm, -0.98, -0.62, 0.08, top, -0.42, -0.06)
    for x, z, along_x in (
        (0.6, 0.2, True),
        (0.6, 0.08, True),
        (0.84, 0.14, False),
        (0.6, -0.3, True),
        (-0.53, 0.3, False),
        (-0.66, 0.3, False),
        (-0.16, 0.56, True),
        (0.2, 0.52, False),
        (-0.3, -0.56, True),
        (0.06, -0.54, True),
        (0.3, -0.6, False),
    ):
        capacitor(bm, x, z, along_x, top)
    new_object("phone", bm)


def build_lid():
    """A pressed metal can: rounded corners, a rounded top edge, open at the back so it
    clears the bond wires, with a raised pin-1 dot."""
    bm = bmesh.new()
    steps = 6  # 15 degrees a step round the top edge
    rings = []
    for k in range(steps + 1):
        a = math.radians(90 * k / steps)
        inset = LID_FILLET * (1 - math.sin(a))
        y = LID_Y0 + LID_FILLET * (1 - math.cos(a))
        loop = rounded_rect(LID_W - inset, LID_W - inset, LID_R - inset)
        rings.append([bm.verts.new((x, y, z)) for x, z in loop])
    wall = LID_W - LID_SHELL
    outer_rim = [bm.verts.new((x, LID_Y1, z)) for x, z in rounded_rect(LID_W, LID_W, LID_R)]
    inner_rim = [bm.verts.new((x, LID_Y1, z)) for x, z in rounded_rect(wall, wall, LID_R - LID_SHELL)]
    ceiling = [bm.verts.new((x, LID_Y0 + LID_SHELL, z)) for x, z in rounded_rect(wall, wall, LID_R - LID_SHELL)]
    n = len(outer_rim)
    for a, b in (*zip(rings, rings[1:]), (rings[-1], outer_rim), (outer_rim, inner_rim), (inner_rim, ceiling)):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(rings[0])
    bm.faces.new(ceiling)
    cylinder(bm, -0.3, 0.3, 0.018, LID_Y0 - 0.002, LID_Y0 + 0.001)
    new_object("lid", bm)


def cylinder(bm, cx, cz, r, y0, y1, seg=24):
    """A short disc along Y, 15 degrees a step."""
    front, back = [], []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        x, z = cx + r * math.cos(a), cz + r * math.sin(a)
        front.append(bm.verts.new((x, y0, z)))
        back.append(bm.verts.new((x, y1, z)))
    for s in range(seg):
        j = (s + 1) % seg
        bm.faces.new((front[s], front[j], back[j], back[s]))
    bm.faces.new(front)
    bm.faces.new(back)


def side_positions(count, span):
    return [span * (2 * k / (count - 1) - 1) for k in range(count)]


def build_base():
    bm = bmesh.new()
    box(bm, -BASE_W, BASE_W, BASE_Y0, BASE_Y1, -BASE_W, BASE_W)
    # LGA: solder pads on the underside, showing only as a thin line along each edge.
    for p in side_positions(4, 0.24):
        box(bm, p - 0.035, p + 0.035, BASE_Y1, SOLDER_Y1, BASE_W - 0.06, BASE_W - 0.01)
        box(bm, p - 0.035, p + 0.035, BASE_Y1, SOLDER_Y1, -BASE_W + 0.01, -BASE_W + 0.06)
    for x, z in landings():
        box(bm, x - 0.008, x + 0.008, LANDING_Y, BASE_Y0, z - 0.006, z + 0.006)
    new_object("base", bm)


def landings():
    """(x, z) of the laminate's bond pads: the wires' outer ends."""
    return [(s * LANDING_X, z) for s in (-1, 1) for z in side_positions(5, 0.2)]


def build_asic():
    bm = bmesh.new()
    box(bm, -ASIC_W, ASIC_W, ASIC_Y0, ASIC_Y1, -ASIC_W, ASIC_W)
    for x, z in landings():
        px = math.copysign(ASIC_PAD_X, x)
        box(bm, px - 0.007, px + 0.007, ASIC_PAD_Y, ASIC_Y0, z - 0.006, z + 0.006)
    for x in mems_pad_xs():
        box(bm, x - 0.007, x + 0.007, ASIC_PAD_Y, ASIC_Y0, -ASIC_PAD_X - 0.006, -ASIC_PAD_X + 0.006)
    new_object("asic", bm)


def mems_pad_xs():
    return side_positions(6, 0.2)


def build_frame():
    bm = bmesh.new()
    box(bm, -FLOOR_W, FLOOR_W, FLOOR_Y0, FLOOR_Y1, FLOOR_BOTTOM, FLOOR_TOP)
    # Seal ring around the moving parts, one closed shape.
    o, i = RING_OUT, RING_IN
    outer = [(o, o), (-o, o), (-o, -o), (o, -o)]
    inner = [(i, i), (-i, i), (-i, -i), (i, -i)]
    o0 = [bm.verts.new((x, ETCH_Y0, z)) for x, z in outer]
    i0 = [bm.verts.new((x, ETCH_Y0, z)) for x, z in inner]
    o1 = [bm.verts.new((x, FLOOR_Y0, z)) for x, z in outer]
    i1 = [bm.verts.new((x, FLOOR_Y0, z)) for x, z in inner]
    for a in range(4):
        b = (a + 1) % 4
        bm.faces.new((o0[a], o0[b], i0[b], i0[a]))
        bm.faces.new((o0[a], o1[a], o1[b], o0[b]))
        bm.faces.new((i0[a], i0[b], i1[b], i1[a]))
    for x0, x1 in ((ANCHOR_X0, ANCHOR_X1), (-ANCHOR_X1, -ANCHOR_X0)):
        box(bm, x0, x1, ETCH_Y0, FLOOR_Y0, -ANCHOR_H, ANCHOR_H)
    for x in mems_pad_xs():
        box(bm, x - 0.008, x + 0.008, MEMS_PAD_Y, FLOOR_Y0, MEMS_PAD_Z - 0.008, MEMS_PAD_Z + 0.008)
    new_object("frame", bm)


def moving_xs():
    return [PITCH * (k - (FINGERS - 1) / 2) for k in range(FINGERS)]


def fixed_xs():
    return [PITCH * (k - FINGERS / 2) for k in range(FINGERS + 1)]


def build_weight():
    half = FINGER / 2
    rects = [(-MASS_W, MASS_W, -MASS_H, MASS_H)]
    for x in moving_xs():
        rects.append((x - half, x + half, MASS_H, MOVING_TIP))
        rects.append((x - half, x + half, -MOVING_TIP, -MASS_H))
    holes = []
    h = HOLE / 2
    for c in range(HOLE_COLS):
        for r in range(HOLE_ROWS):
            x = HOLE_PITCH * (c - (HOLE_COLS - 1) / 2)
            z = HOLE_PITCH * (r - (HOLE_ROWS - 1) / 2)
            holes.append((x - h, x + h, z - h, z + h))
    etched("weight", rects, holes)


def build_fixed(name, sign):
    half = FINGER / 2
    rects = [
        (-RAIL_W, RAIL_W, RAIL_Z0, RAIL_Z1),
        (-RAIL_W, -RAIL_W + 0.05, RAIL_Z1, RAIL_ANCHOR),
        (RAIL_W - 0.05, RAIL_W, RAIL_Z1, RAIL_ANCHOR),
    ]
    rects += [(x - half, x + half, FIXED_TIP, RAIL_Z0) for x in fixed_xs()]
    if sign < 0:
        rects = [(x0, x1, -z1, -z0) for x0, x1, z0, z1 in rects]
    etched(name, rects)


def build_spring(name, side):
    """Right-hand spring, mirrored for the left: leaves the weight along the centre line,
    folds up and down through four runs, and arrives at the anchor on the centre line."""
    b = BEAM / 2
    r0, r1, r2, r3 = SPRING_RUNS
    a = SPRING_A
    rects = [
        (SPRING_X0, r0 + b, -b, b),  # from the weight
        (r0 - b, r0 + b, -b, a + b),
        (r0 - b, r1 + b, a - b, a + b),  # fold at the top
        (r1 - b, r1 + b, -a - b, a + b),
        (r1 - b, r2 + b, -a - b, -a + b),  # fold at the bottom
        (r2 - b, r2 + b, -a - b, a + b),
        (r2 - b, r3 + b, a - b, a + b),  # fold at the top
        (r3 - b, r3 + b, -b, a + b),
        (r3 - b, SPRING_X1, -b, b),  # to the anchor
    ]
    if side < 0:
        rects = [(-x1, -x0, z0, z1) for x0, x1, z0, z1 in rects]
    etched(name, rects)


def tube_along(bm, points, radius, sides=TUBE_SIDES):
    """Round tube through (x, y, z) points, flat-capped. The ring's axes are carried along
    the path, so the tube never twists, whichever way the path turns."""
    def norm(c):
        n = math.sqrt(sum(a * a for a in c)) or 1.0
        return [a / n for a in c]

    def cross(a, b):
        return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]

    u = None
    rings = []
    for k, p in enumerate(points):
        q = points[min(k + 1, len(points) - 1)]
        o = points[max(k - 1, 0)]
        t = norm([q[i] - o[i] for i in range(3)])
        if u is None:
            seed = [1.0, 0.0, 0.0] if abs(t[0]) < 0.9 else [0.0, 0.0, 1.0]
            u = norm(cross(t, seed))
        else:
            dot = sum(u[i] * t[i] for i in range(3))
            u = norm([u[i] - dot * t[i] for i in range(3)])
        v = cross(t, u)
        ring = []
        for s in range(sides):
            a = 2 * math.pi * s / sides
            ring.append(bm.verts.new(tuple(p[i] + radius * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3))))
        rings.append(ring)
    for k in range(len(rings) - 1):
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((rings[k][s], rings[k][j], rings[k + 1][j], rings[k + 1][s]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


def wire_path(start, end, apex, steps=28):
    """A bond wire's loop: up off the first pad, over in a shallow arc, and a long slope down
    to the second, stopping just short of each pad."""
    p0, p3 = start, end
    p1 = (p0[0], apex, p0[2])
    p2 = (p0[0] + (p3[0] - p0[0]) * 0.6, apex, p0[2] + (p3[2] - p0[2]) * 0.6)
    pts = []
    for k in range(steps + 1):
        t = k / steps
        m = 1 - t
        pts.append(
            tuple(m**3 * p0[i] + 3 * m * m * t * p1[i] + 3 * m * t * t * p2[i] + t**3 * p3[i] for i in range(3))
        )
    return pts


def build_wires():
    bm = bmesh.new()
    lift = 0.0015  # stops just short of the pad, so parts don't touch
    # MEMS die down to the control chip, along the die's bottom edge.
    for x in mems_pad_xs():
        start = (x, MEMS_PAD_Y - lift, MEMS_PAD_Z)
        end = (x, ASIC_PAD_Y - lift, -ASIC_PAD_X)
        tube_along(bm, wire_path(start, end, -0.02), WIRE_R)
    # Control chip out to the laminate, along both sides.
    for x, z in landings():
        start = (math.copysign(ASIC_PAD_X, x), ASIC_PAD_Y - lift, z)
        end = (x, LANDING_Y - lift, z)
        tube_along(bm, wire_path(start, end, 0.01), WIRE_R)
    new_object("wires", bm, smooth=True)


def build_arrow(name, direction, length=ARROW_LEN):
    """Shaft and cone in front of the die's centre, revolved around `direction`. The cone
    closes on a single point: a flat tip cap would draw as a faceted ring (see qc.py)."""
    d = direction
    # Two axes perpendicular to the arrow.
    u = (0.0, 1.0, 0.0) if abs(d[1]) < 0.9 else (0.0, 0.0, 1.0)
    v = (d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0])
    origin = (0.0, ARROW_Y, 0.0)
    profile = [
        (ARROW_START, ARROW_R),
        (ARROW_START + length - HEAD_LEN, ARROW_R),
        (ARROW_START + length - HEAD_LEN, HEAD_R),
    ]
    seg = 32
    bm = bmesh.new()
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        ring = []
        for along, r in profile:
            ring.append(
                bm.verts.new(
                    tuple(origin[i] + along * d[i] + r * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3))
                )
            )
        rings.append(ring)
    for s in range(seg):
        a, b = rings[s], rings[(s + 1) % seg]
        for i in range(len(profile) - 1):
            bm.faces.new((a[i], a[i + 1], b[i + 1], b[i]))
    bm.faces.new([r[0] for r in rings][::-1])
    apex = bm.verts.new(tuple(origin[i] + (ARROW_START + length) * d[i] for i in range(3)))
    for s in range(seg):
        bm.faces.new((rings[s][-1], apex, rings[(s + 1) % seg][-1]))
    # Flat shading: smooth normals round the cone off into a blob.
    new_object(name, bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "mems-accelerometer.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_phone()
    build_lid()
    build_base()
    build_asic()
    build_wires()
    build_frame()
    build_weight()
    build_fixed("fixedtop", 1)
    build_fixed("fixedbottom", -1)
    build_spring("springleft", -1)
    build_spring("springright", 1)
    build_arrow("axisx", (1.0, 0.0, 0.0))
    build_arrow("axisy", (0.0, -1.0, 0.0), ARROW_LEN_Y)
    build_arrow("ground", (0.0, 0.0, -1.0))
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[mems_accelerometer] wrote {out}")


main()
