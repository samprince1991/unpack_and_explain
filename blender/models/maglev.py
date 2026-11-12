"""Procedural maglev train in its guideway (our own model, license "own").

A generic long-nose maglev car, not a copy of any real train and with no livery: one smooth
body shell with a long tapered nose, a window band down its sides, two bogies under it with
a magnet block on each side, and a short section of U-shaped guideway whose walls are lined
with figure-8 coils, the two loops of each coil stacked one above the other.

Axis: X forward (the nose points to +X), Z up, the guideway floor at Z = 0. The cameras sit on
the -Y side, so the coils that show are on the far (+Y) wall: the key coil faces the front
bogie's +Y magnet. Parts:

- body:     the car shell (an `away` part: explode drops it so the bogies show)
- windows:  seven windows a side, the windshield on the nose and two headlights: thin panels
            just proud of the shell, so their open edges draw their outlines (away)
- trim:     door outlines, the belt line and the rear gangway door, the same way (away)
- bogie:    the two bogie frames under the car
- magnet:   the key magnet block: front bogie, +Y side, facing the key coil
- magnets:  the other three magnet blocks on the bogie sides, facing the walls
- guideway: the floor slab and the far (+Y) wall
- wall:     the near (-Y) wall and its coils (away: the cutaway drops it with the shell)
- coil:     the key figure-8 coil on the +Y wall, level with the front +Y magnet
- coils:    the other 11 coils along the far wall
- current:  arrows round the key coil's two loops, opposite ways (appear-only)
- push:     arrows up from the magnets and in from both walls (appear-only)
- wheels:   eight rubber wheels at the bogie ends, for running below lift-off speed
            (appear-only; a `shift` on the `train` group lowers the car onto them)

The magnets sit a little below the middle of each coil, which is what makes the coil's two
loops push the car up. Parts never cross: each sits clear of the next with a small gap
(blender/qc.py). The arrows overlap the shell only in space the shell has left: they show
in the cutaway, after `explode` drops it (`contacts` in models.ts). Curves are finely
segmented so no edge bends 28-80 degrees; boxes have only 90-degree edges.

  blender -b --factory-startup --python blender/models/maglev.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

# body: x from REAR to FRONT, the nose tapers from NOSE0 to FRONT
REAR, FRONT, NOSE0 = -5.0, 5.0, -0.6
BODY_Z0 = 1.0  # body bottom
BODY_B = 1.45  # half width
BODY_H = 1.15  # half height (top at BODY_Z0 + 2 * BODY_H)
BODY_N = 3.5  # superellipse exponent of the cross-section
TIP_RISE = 0.6  # the bottom lifts this much toward the tip (above the wall top)
SEC = 128  # points round a section
WIN_Z0, WIN_Z1 = 2.32, 2.74  # window height

# guideway: floor top at 0, walls' inner faces at +-WALL_IN
LEN = 5.5  # half length of the section
WALL_IN, WALL_OUT, WALL_TOP, FLOOR_BOT = 1.9, 2.3, 1.5, -0.4
WALL_GAP = 0.004  # between the near wall and the floor slab

# bogies and magnets
BOGIES = (3.0, -3.0)
BOGIE_HX, BOGIE_HY, BOGIE_Z0, BOGIE_Z1 = 0.8, 1.65, 0.18, 0.95
MAG_HX, MAG_Y0, MAG_Y1, MAG_Z0, MAG_Z1 = 0.6, 1.66, 1.80, 0.45, 0.95  # top flush with the bogie: seen from above

# figure-8 coils on the inner wall faces
COIL_Y = 1.87
COIL_R = 0.022
COIL_STEP = 0.9
COIL_XS = [BOGIES[0] + COIL_STEP * k for k in range(-9, 3)]  # one is level with the front bogie
COIL_A, COIL_B, COIL_CORNER = 0.30, 0.15, 0.07  # loop half width, half height, corner radius
COIL_LO, COIL_HI = 0.54, 0.90  # loop centers: the magnets' middle (0.65) sits below the coil's (0.72)

# rubber wheels at the bogie ends
WHEEL_DX, WHEEL_Y, WHEEL_Z = 1.0, 1.2, 0.27
WHEEL_R, WHEEL_T = 0.12, 0.05  # ring radius and tube radius: outer radius 0.17, bottom at 0.10

X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm, smooth=True):
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = smooth
    return obj


def spow(v, p):
    return math.copysign(abs(v) ** p, v)


def norm(v):
    n = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / n for c in v)


# ---------- body ----------

def nose_t(x):
    return min(max((x - NOSE0) / (FRONT - NOSE0), 0.0), 1.0)


def section_size(x):
    """(half width, half height, center z) of the body section at x."""
    t = nose_t(x)
    b = BODY_B * math.sqrt(max(1.0 - t ** 2.2, 0.0))
    # Zero slope where the nose starts (no kink in the roof line), round at the tip.
    h = BODY_H * math.sqrt(max(1.0 - t ** 1.4, 0.0))
    bottom = BODY_Z0 + TIP_RISE * t * t
    return b, h, bottom + h


def section_point(x, a, off=0.0):
    """Point at angle a round the superellipse section at x, `off` out along its normal."""
    b, h, zc = section_size(x)
    c, s = math.cos(a), math.sin(a)
    y = b * spow(c, 2 / BODY_N)
    z = h * spow(s, 2 / BODY_N)
    if off:
        ny = spow(y / b, BODY_N - 1) / b if b else 0.0
        nz = spow(z / h, BODY_N - 1) / h if h else 0.0
        n = math.hypot(ny, nz) or 1.0
        y, z = y + off * ny / n, z + off * nz / n
    return (x, y, zc + z)


def body_xs():
    xs = [REAR + (NOSE0 - REAR) * k / 30 for k in range(30)]
    # Denser toward the tip, where the section shrinks fastest.
    # Stops short of the tip so the last ring closes onto the tip point without a kink.
    xs += [NOSE0 + (FRONT - NOSE0) * (1 - (1 - k / 96) ** 2) for k in range(94)]
    return xs


def build_body():
    bm = bmesh.new()
    angles = [2 * math.pi * k / SEC for k in range(SEC)]
    rings = [[bm.verts.new(section_point(x, a)) for a in angles] for x in body_xs()]
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(SEC):
            j = (k + 1) % SEC
            bm.faces.new((r0[k], r0[j], r1[j], r1[k]))
    bm.faces.new(rings[0][::-1])  # flat rear end: its 90-degree rim draws the outline
    _, _, tip_z = section_size(FRONT)
    tip = bm.verts.new((FRONT, 0.0, tip_z))
    last = rings[-1]
    for k in range(SEC):
        bm.faces.new((last[k], last[(k + 1) % SEC], tip))
    new_object("body", bm)


def _band_angles(z0, z1):
    """Angles on the +Y side of the full section between heights z0 and z1."""
    _, h, zc = section_size(REAR)
    def angle(z):
        return math.asin(spow((z - zc) / h, BODY_N / 2))
    return angle(z0), angle(z1)


def _rounded_outline(cx, cy, hx, hy, rx, ry, steps=6):
    """Rounded rectangle round (cx, cy) with half sizes hx, hy and elliptic corners rx, ry,
    counter-clockwise, no repeated end point."""
    pts = []
    corners = [(cx + hx - rx, cy - hy + ry, -90), (cx + hx - rx, cy + hy - ry, 0), (cx - hx + rx, cy + hy - ry, 90), (cx - hx + rx, cy - hy + ry, 180)]
    for ox, oy, start in corners:
        for k in range(steps + 1):
            t = math.radians(start + 90 * k / steps)
            pts.append((ox + rx * math.cos(t), oy + ry * math.sin(t)))
    return pts


def _resample(outline, step):
    """Splits outline edges longer than `step` (in outline units), so the panel's straight
    sides follow a curved surface instead of cutting under it as chords."""
    out = []
    for k, p in enumerate(outline):
        q = outline[(k + 1) % len(outline)]
        n = max(1, math.ceil(math.hypot(q[0] - p[0], q[1] - p[1]) / step))
        out += [(p[0] + (q[0] - p[0]) * i / n, p[1] + (q[1] - p[1]) * i / n) for i in range(n)]
    return out


def _panel(bm, outline, center, to_3d, rings=8):
    """A panel lying on a surface: rings shrinking from the outline to the center, each point
    mapped onto the surface by `to_3d(u, v)`, so it follows the curve with no chords cutting in.
    Its open outer edge draws the panel's outline."""
    count = len(outline)
    grid = []
    for r in range(rings + 1):
        s = 1 - r / rings
        if s == 0:
            grid.append([bm.verts.new(to_3d(*center))])
            break
        grid.append([
            bm.verts.new(to_3d(center[0] + s * (u - center[0]), center[1] + s * (v - center[1])))
            for u, v in outline
        ])
    for r0, r1 in zip(grid, grid[1:]):
        for k in range(count):
            j = (k + 1) % count
            if len(r1) == 1:
                bm.faces.new((r0[k], r0[j], r1[0]))
            else:
                bm.faces.new((r0[k], r0[j], r1[j], r1[k]))


def _side_panel(bm, x0, x1, z0, z1, corner, side, off=0.008, a_box=None):
    """A panel on the car's side between x0-x1 and heights z0-z1 (measured on the full
    section), in (x, angle) space so it follows the nose taper too."""
    a0, a1 = a_box if a_box else _band_angles(z0, z1)
    hx, ha = (x1 - x0) / 2, (a1 - a0) / 2
    outline = _resample(_rounded_outline((x0 + x1) / 2, (a0 + a1) / 2, hx, ha, min(corner, hx), min(corner / BODY_H, ha)), 0.04)
    def to_3d(x, a):
        return section_point(x, a if side > 0 else math.pi - a, off=off)
    rings = max(4, math.ceil(min(hx, ha * BODY_H) / 0.03))
    _panel(bm, outline, ((x0 + x1) / 2, (a0 + a1) / 2), to_3d, rings)


def _strip(bm, x0, x1, z0, z1, side, off=0.008):
    """A thin straight band on the car's side as a plain grid (rings would collapse)."""
    a0, a1 = _band_angles(z0, z1)
    nx = max(2, math.ceil((x1 - x0) / 0.04))
    grid = [
        [bm.verts.new(section_point(x0 + (x1 - x0) * i / nx, a if side > 0 else math.pi - a, off=off)) for a in (a0, a1)]
        for i in range(nx + 1)
    ]
    for i in range(nx):
        bm.faces.new((grid[i][0], grid[i + 1][0], grid[i + 1][1], grid[i][1]))


# Window and door layout along the car (x ranges); the belt line breaks at the doors.
DOORS = ((-4.85, -4.15), (-0.85, -0.1))
WINDOWS = [(-3.95 + 0.41 * k, -3.65 + 0.41 * k) for k in range(7)]
WIN_CORNER = 0.08
BELT_Z0, BELT_Z1 = 2.04, 2.1
BELTS = ((-4.05, -0.95), (0.0, 2.6))
DOOR_Z0, DOOR_Z1 = 1.25, 2.95


def build_windows():
    """Seven windows a side, a windshield up on the nose and two headlights low on it."""
    bm = bmesh.new()
    for side in (1, -1):
        for x0, x1 in WINDOWS:
            _side_panel(bm, x0, x1, WIN_Z0, WIN_Z1, WIN_CORNER, side)
        _side_panel(bm, 3.9, 4.35, 0, 0, 0.12, side, a_box=(-0.55, -0.25))  # headlight
    # Windshield: on top of the nose, both sides of the ridge in one panel.
    outline = _resample(_rounded_outline(1.6, math.pi / 2, 0.7, 0.55, 0.3, 0.25), 0.03)
    _panel(bm, outline, (1.6, math.pi / 2), lambda x, a: section_point(x, a, off=0.008), rings=20)
    new_object("windows", bm)


def build_trim():
    """Door outlines, the belt line along each side, and the gangway door on the rear end."""
    bm = bmesh.new()
    for side in (1, -1):
        for x0, x1 in DOORS:
            _side_panel(bm, x0, x1, DOOR_Z0, DOOR_Z1, 0.1, side)
        for x0, x1 in BELTS:
            _strip(bm, x0, x1, BELT_Z0, BELT_Z1, side)
    outline = _resample(_rounded_outline(0.0, 2.1, 0.5, 0.85, 0.12, 0.12), 0.05)
    _panel(bm, outline, (0.0, 2.1), lambda y, z: (REAR - 0.008, y, z))
    new_object("trim", bm)


# ---------- boxes, tubes ----------

def box(bm, x0, x1, y0, y1, z0, z1):
    vs = [bm.verts.new((x, y, z)) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
    for f in [(0, 2, 3, 1), (4, 5, 7, 6), (0, 1, 5, 4), (1, 3, 7, 5), (3, 2, 6, 7), (2, 0, 4, 6)]:
        bm.faces.new([vs[i] for i in f])


def tube(bm, points, radius, closed=False, sides=16, normal=None):
    """Round tube through points; open tubes get flat caps. `normal` fixes the ring frame for
    tubes lying in one plane, so the frame never flips."""
    rings = []
    count = len(points)
    for k, p in enumerate(points):
        q = points[(k + 1) % count] if closed else points[min(k + 1, count - 1)]
        o = points[k - 1] if closed else points[max(k - 1, 0)]
        t = norm(tuple(q[i] - o[i] for i in range(3)))
        if normal:
            u = normal
        else:
            up = Z if abs(t[2]) < 0.9 else Y
            u = norm((t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]))
        v = (t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0])
        rings.append([
            bm.verts.new(tuple(p[i] + radius * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3)))
            for a in (2 * math.pi * s / sides for s in range(sides))
        ])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((a[s], a[j], b[j], b[s]))
    if not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])


def lathe(bm, profile, origin, axis, seg=48):
    """Solid of revolution: profile is (distance along axis, radius) pairs; both ends close on
    the axis (radius 0)."""
    axis = norm(axis)
    ref = X if abs(axis[0]) < 0.9 else Y
    u = norm((axis[1] * ref[2] - axis[2] * ref[1], axis[2] * ref[0] - axis[0] * ref[2], axis[0] * ref[1] - axis[1] * ref[0]))
    v = (axis[1] * u[2] - axis[2] * u[1], axis[2] * u[0] - axis[0] * u[2], axis[0] * u[1] - axis[1] * u[0])
    rows = []
    for d, r in profile:
        c = tuple(origin[i] + d * axis[i] for i in range(3))
        if r == 0:
            rows.append([bm.verts.new(c)])
            continue
        rows.append([
            bm.verts.new(tuple(c[i] + r * (math.cos(a) * u[i] + math.sin(a) * v[i]) for i in range(3)))
            for a in (2 * math.pi * s / seg for s in range(seg))
        ])
    for r0, r1 in zip(rows, rows[1:]):
        if len(r0) == 1:
            for s in range(seg):
                bm.faces.new((r0[0], r1[(s + 1) % seg], r1[s]))
        elif len(r1) == 1:
            for s in range(seg):
                bm.faces.new((r0[s], r0[(s + 1) % seg], r1[0]))
        else:
            for s in range(seg):
                j = (s + 1) % seg
                bm.faces.new((r0[s], r0[j], r1[j], r1[s]))


def arrow(bm, start, direction, length, shaft_r=0.03, head_r=0.08, head_len=0.14):
    """A straight arrow from start along direction: a round shaft and a cone head."""
    shaft = length - head_len
    lathe(bm, [(0.0, 0.0), (0.0, shaft_r), (shaft, shaft_r), (shaft, 0.0)], start, direction)
    tip_base = tuple(start[i] + (shaft + 0.004) * norm(direction)[i] for i in range(3))
    lathe(bm, [(0.0, 0.0), (0.0, head_r), (head_len, 0.0)], tip_base, direction)


def rounded_rect(cx, cz, a, b, r, steps=8):
    """Closed loop in the x-z plane round (cx, cz), counter-clockwise seen from -Y."""
    pts = []
    corners = [(cx + a - r, cz - b + r, -90), (cx + a - r, cz + b - r, 0), (cx - a + r, cz + b - r, 90), (cx - a + r, cz - b + r, 180)]
    for ox, oz, start in corners:
        for k in range(steps + 1):
            t = math.radians(start + 90 * k / steps)
            pts.append((ox + r * math.cos(t), oz + r * math.sin(t)))
    return pts


# ---------- guideway, bogies, magnets ----------

def build_guideway():
    """The floor slab and the far (+Y) wall in one L-shaped sweep along x, flat ends split into
    convex faces. The near wall is its own part (`wall`), full height and a few mm clear of the
    slab: faces lying on each other make Freestyle's edge visibility flicker frame to frame."""
    bm = bmesh.new()
    y0 = -WALL_IN + WALL_GAP
    profile = [
        (y0, FLOOR_BOT), (WALL_OUT, FLOOR_BOT), (WALL_OUT, 0.0), (WALL_OUT, WALL_TOP), (WALL_IN, WALL_TOP),
        (WALL_IN, 0.0), (y0, 0.0),
    ]
    ends = [[bm.verts.new((x, y, z)) for y, z in profile] for x in (-LEN, LEN)]
    n = len(profile)
    for k in range(n):
        j = (k + 1) % n
        bm.faces.new((ends[0][k], ends[0][j], ends[1][j], ends[1][k]))
    for ring, flip in ((ends[0], True), (ends[1], False)):
        for idx in ([0, 1, 2, 5, 6], [2, 3, 4, 5]):
            face = [ring[i] for i in idx]
            bm.faces.new(face[::-1] if flip else face)
    new_object("guideway", bm, smooth=False)
    wall = bmesh.new()
    box(wall, -LEN, LEN, -WALL_OUT, -WALL_IN, FLOOR_BOT, WALL_TOP)
    new_object("wall", wall, smooth=False)


def build_bogies():
    bm = bmesh.new()
    for cx in BOGIES:
        box(bm, cx - BOGIE_HX, cx + BOGIE_HX, -BOGIE_HY, BOGIE_HY, BOGIE_Z0, BOGIE_Z1)
    new_object("bogie", bm, smooth=False)


def build_magnets():
    """The key magnet (front bogie, +Y side, facing the key coil) and the other three."""
    key, rest = bmesh.new(), bmesh.new()
    for cx in BOGIES:
        for side in (1, -1):
            y0, y1 = sorted((side * MAG_Y0, side * MAG_Y1))
            target = key if (cx == BOGIES[0] and side > 0) else rest
            box(target, cx - MAG_HX, cx + MAG_HX, y0, y1, MAG_Z0, MAG_Z1)
    new_object("magnet", key, smooth=False)
    new_object("magnets", rest, smooth=False)


# ---------- coils, current ----------

def coil(bm, cx, y):
    for cz in (COIL_LO, COIL_HI):
        pts = [(x, y, z) for x, z in rounded_rect(cx, cz, COIL_A, COIL_B, COIL_CORNER)]
        tube(bm, pts, COIL_R, closed=True, normal=Y)


def build_coils():
    key = bmesh.new()
    coil(key, BOGIES[0], COIL_Y)
    new_object("coil", key)
    far = bmesh.new()
    near = bmesh.new()
    for cx in COIL_XS:
        if abs(cx - BOGIES[0]) > 1e-6:
            coil(far, cx, COIL_Y)
        coil(near, cx, -COIL_Y)
    new_object("coils", far)
    new_object("nearcoils", near)  # part of `wall`: they drop with it


def build_current():
    """Arrows round the inside of the key coil's two loops: the lower loop one way, the upper
    the other (that is what makes it a figure 8)."""
    bm = bmesh.new()
    cx = BOGIES[0]
    a, b, r = COIL_A - 0.09, COIL_B - 0.075, 0.04
    y = COIL_Y - 0.012  # clear of the wall behind
    for cz, sign in ((COIL_LO, 1), (COIL_HI, -1)):
        pts = [(x, y, z) for x, z in rounded_rect(cx, cz, a, b, r)]
        if sign < 0:
            pts = pts[::-1]
        tube(bm, pts, 0.012, closed=True, normal=Y)
        for z_edge, dir_x in ((cz - b, sign), (cz + b, -sign)):
            base = (cx - 0.05 * dir_x, y, z_edge)
            lathe(bm, [(0.0, 0.0), (0.0, 0.03), (0.1, 0.0)], base, (dir_x, 0.0, 0.0), seg=32)
    new_object("current", bm)


def build_push():
    """Up from the front bogie's magnets, and in from the top of both walls."""
    bm = bmesh.new()
    cx = BOGIES[0]
    for side in (1, -1):
        arrow(bm, (cx, side * 1.73, 1.0), Z, 0.8, shaft_r=0.05, head_r=0.12, head_len=0.22)
        arrow(bm, (cx, side * 2.5, 1.95), (0.0, -side, 0.0), 0.6, shaft_r=0.05, head_r=0.12, head_len=0.22)
    new_object("push", bm)


def build_wheels():
    bm = bmesh.new()
    for cx in BOGIES:
        for dx in (-WHEEL_DX, WHEEL_DX):
            for side in (1, -1):
                pts = [
                    (cx + dx + WHEEL_R * math.cos(2 * math.pi * k / 48), side * WHEEL_Y, WHEEL_Z + WHEEL_R * math.sin(2 * math.pi * k / 48))
                    for k in range(48)
                ]
                tube(bm, pts, WHEEL_T, closed=True, normal=Y)
    new_object("wheels", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "maglev.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_body()
    build_windows()
    build_trim()
    build_guideway()
    build_bogies()
    build_magnets()
    build_coils()
    build_current()
    build_push()
    build_wheels()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[maglev] wrote {out}")


main()
