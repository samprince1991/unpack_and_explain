"""Procedural light hovercraft (our own model, license "own").

An open-cockpit rescue-style craft: a rounded boat hull with a raised bow and a thick
rounded rim around the cockpit, a segmented "finger" skirt of separate bulging pods, and one
big fan in a round duct at the back, behind a wire guard, with rudder vanes behind it. One
fan both lifts and drives: part of its air is ducted down under the hull.

Axis: X forward (the bow points to +X), Z up, the ground at Z = 0. Parts:

- skirt:    the finger skirt, one pod per segment, small gaps between them
- hull:     the hull, swept around the plan: outer side, rounded rim, inner wall, floor
- seat:     a bench in the cockpit
- duct:     the fan's round duct on two struts
- guard:    the wire guard in front of the duct
- fan:      hub and blades inside the duct (spins about X)
- rudders:  three vanes behind the duct
- cushion:  the trapped air, a flat slab inside the skirt (appear-only, the key part)
- pushgrid: small arrows pushing up on the hull bottom (appear-only)
- leaks:    short curved wisps escaping outward under the skirt (appear-only)

Parts never cross: each sits on the next with a small gap (blender/qc.py). Curves are
finely segmented so no edge bends 28-80 degrees; flat blades and vanes are `hardEdges`.

  blender -b --factory-startup --python blender/models/hovercraft.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

SIDES = 16
LOOP = 256  # points around the plan
GAP = 0.012

# plan: rounder at the bow, squarer at the stern
A, B = 1.6, 0.85
N_BOW, N_STERN = 2.4, 3.6

# hull section
Z_BOTTOM = 0.36  # hull bottom (the skirt tucks under it)
Z_FLOOR = 0.5  # cockpit floor
# cockpit opening: its own rounded plan, set back from the bow, so the front is a covered cowl
IN_X, IN_A, IN_B, IN_N = -0.32, 1.0, 0.6, 3.0
# deck height at the outer edge and at the cockpit edge: the bow cowl rises toward the cockpit
H_OUT_SIDE, H_OUT_BOW, H_OUT_STERN = 0.8, 0.7, 0.84
H_IN_SIDE, H_IN_BOW, H_IN_STERN = 0.8, 1.04, 0.84
FILLET = 0.06
FLARE = 0.09  # the outer side leans out toward the top, like a boat's

# finger skirt
FINGERS = 52
F_Z0, F_Z1 = 0.02, Z_BOTTOM - GAP - 0.006
F_DEPTH = 0.19  # radial half-depth (bulges outward)
F_FILL = 0.97  # fraction of the spacing each pod fills (the rest is the gap)
F_INSET = 0.1
F_N = 2.8  # pod cross-section: a rounded rectangle, so neighbours pack tight

# cushion and arrows
CUSH_INSET = 0.34
CUSH_Z0, CUSH_Z1 = 0.03, 0.17
PUSH_Z0, PUSH_Z1 = CUSH_Z1 + 0.02, Z_BOTTOM - GAP

# fan and duct (axis along X)
DUCT_X0, DUCT_X1 = -1.0, -0.7
DUCT_RI, DUCT_RO = 0.4, 0.45
DUCT_Z = Z_FLOOR + GAP + 0.06 + DUCT_RO
GUARD_X = DUCT_X1 + 0.035
RUD_X0, RUD_X1 = -1.2, -1.06

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


def _se(t, a, b, n):
    c, s = math.cos(t), math.sin(t)
    return a * math.copysign(abs(c) ** (2 / n), c), b * math.copysign(abs(s) ** (2 / n), s)


def _raw(t):
    w = (1 + math.cos(t)) / 2  # 1 at the bow, 0 at the stern: the exponent blends between them
    return _se(t, A, B, N_STERN + (N_BOW - N_STERN) * w * w)


def outward(t, h=1e-4):
    x0, y0 = _raw(t - h)
    x1, y1 = _raw(t + h)
    tx, ty = x1 - x0, y1 - y0
    n = math.hypot(tx, ty) or 1.0
    return ty / n, -tx / n


def plan_point(t, inset=0.0):
    """Point on the plan outline at parameter t (0 = bow), moved `inset` inward."""
    x, y = _raw(t)
    if inset:
        nx, ny = outward(t)
        x, y = x - inset * nx, y - inset * ny
    return x, y


def loop_ts(count=LOOP):
    return [2 * math.pi * k / count for k in range(count)]


def _inner_raw(u):
    c, si = math.cos(u), math.sin(u)
    return IN_X + IN_A * math.copysign(abs(c) ** (2 / IN_N), c), IN_B * math.copysign(abs(si) ** (2 / IN_N), si)


_INNER = sorted(
    (math.atan2(y, x - IN_X) % (2 * math.pi), x, y)
    for x, y in (_inner_raw(2 * math.pi * k / 4000) for k in range(4000))
)


def inner_point(t):
    """The cockpit-edge point in the same direction (seen from the cockpit's center) as the
    outer edge at t, so neighbouring sections stay parallel and the deck doesn't twist."""
    ox, oy = plan_point(t)
    ang = math.atan2(oy, ox - IN_X) % (2 * math.pi)
    lo, hi = 0, len(_INNER)
    while lo < hi:
        mid = (lo + hi) // 2
        if _INNER[mid][0] < ang:
            lo = mid + 1
        else:
            hi = mid
    a0 = _INNER[lo - 1] if lo > 0 else (_INNER[-1][0] - 2 * math.pi, *_INNER[-1][1:])
    a1 = _INNER[lo % len(_INNER)] if lo < len(_INNER) else (_INNER[0][0] + 2 * math.pi, *_INNER[0][1:])
    f = (ang - a0[0]) / max(a1[0] - a0[0], 1e-12)
    return a0[1] + (a1[1] - a0[1]) * f, a0[2] + (a1[2] - a0[2]) * f


def _blend(t, side, bow, stern):
    c = math.cos(t)
    return side + (bow - side) * max(c, 0.0) ** 2 + (stern - side) * max(-c, 0.0) ** 4


def hull_section(t):
    """Section points from the cockpit floor edge, up the inner wall, over the deck (sloped
    at the bow), down the flared outer side and round into the bottom."""
    po, pi = plan_point(t), inner_point(t)
    nx, ny = outward(t)
    dx, dy = po[0] - pi[0], po[1] - pi[1]
    span = math.hypot(dx, dy)
    dx, dy = dx / span, dy / span
    h_in = _blend(t, H_IN_SIDE, H_IN_BOW, H_IN_STERN)
    h_out = _blend(t, H_OUT_SIDE, H_OUT_BOW, H_OUT_STERN)

    def at_inner(o, z):
        return (pi[0] + dx * o, pi[1] + dy * o, z)

    def at_outer(o, z, flare=0.0):
        return (po[0] - dx * o + nx * flare, po[1] - dy * o + ny * flare, z)

    # The deck slopes down outward by `slope` (the bow cowl); both rounded edges end on that
    # slope, so the deck meets them without a kink.
    slope = math.degrees(math.atan2(h_in - h_out, max(span - 2 * FILLET, 1e-6)))
    pts = [at_inner(0.0, Z_FLOOR)]
    steps = 7  # fixed, so every section has the same point count
    for k in range(steps + 1):  # inner wall rounds onto the deck
        a = math.radians(180 - (90 + slope) * k / steps)
        pts.append(at_inner(FILLET + FILLET * math.cos(a), h_in - FILLET + FILLET * math.sin(a)))
    for k in range(steps + 1):  # deck rounds over the outer edge
        a = math.radians((90 - slope) * (1 - k / steps))
        pts.append(at_outer(FILLET - FILLET * math.cos(a), h_out - FILLET + FILLET * math.sin(a), FLARE))
    r = 0.1
    top = h_out - FILLET
    for k in range(1, 11):  # the flared side eases back in toward the bottom (smoothstep)
        f = k / 10
        ease = f * f * (3 - 2 * f)
        pts.append(at_outer(0.0, top + (Z_BOTTOM + r - top) * f, FLARE * (1 - ease)))
    for k in range(1, 7):  # and rounds into the bottom in 15-degree steps
        a = math.radians(-15 * k)
        pts.append(at_outer(r - r * math.cos(a), Z_BOTTOM + r + r * math.sin(a)))
    return pts


def build_hull():
    bm = bmesh.new()
    rings = [[bm.verts.new(p) for p in hull_section(t)] for t in loop_ts()]
    n = len(rings[0])
    for k in range(len(rings)):
        a, b = rings[k], rings[(k + 1) % len(rings)]
        for i in range(n - 1):
            bm.faces.new((a[i], b[i], b[i + 1], a[i + 1]))
    bm.faces.new([r[0] for r in rings])  # cockpit floor
    bm.faces.new([r[-1] for r in rings][::-1])  # bottom
    new_object("hull", bm)


def build_skirt():
    """One pod per finger: an egg around a vertical axis, squeezed along the loop."""
    bm = bmesh.new()
    seg, rings_n = 32, 20
    # Even spacing by distance along the loop (the plan parameter bunches up at the corners).
    ts = loop_ts(4000)
    pts = [plan_point(t, F_INSET) for t in ts]
    run = [0.0]
    for k in range(1, len(pts) + 1):
        run.append(run[-1] + math.dist(pts[k - 1], pts[k % len(pts)]))
    perim = run[-1]
    half_w = F_FILL * perim / FINGERS / 2
    k = 0
    for f in range(FINGERS):
        target = perim * (f + 0.5) / FINGERS
        while run[k + 1] < target:
            k += 1
        t = ts[k] + (ts[(k + 1) % len(ts)] - ts[k] if k + 1 < len(ts) else 2 * math.pi / len(ts)) * (target - run[k]) / (run[k + 1] - run[k])
        cx, cy = plan_point(t, F_INSET)
        nx, ny = outward(t)
        tx, ty = -ny, nx
        rings = []
        for j in range(1, rings_n):
            phi = math.pi * j / rings_n  # even angle steps from pole to pole, like a sphere
            z = F_Z0 + (F_Z1 - F_Z0) * (1 - math.cos(phi)) / 2
            bulge = math.sin(phi)
            ring = []
            for s in range(seg):
                a = 2 * math.pi * s / seg
                ca, sa = math.cos(a), math.sin(a)
                ro = F_DEPTH * bulge * math.copysign(abs(ca) ** (2 / F_N), ca)
                rt = half_w * bulge * math.copysign(abs(sa) ** (2 / F_N), sa)
                ring.append(bm.verts.new((cx + ro * nx + rt * tx, cy + ro * ny + rt * ty, z)))
            rings.append(ring)
        for a, b in zip(rings, rings[1:]):
            for s in range(seg):
                j = (s + 1) % seg
                bm.faces.new((a[s], a[j], b[j], b[s]))
        bottom = bm.verts.new((cx, cy, F_Z0))
        top = bm.verts.new((cx, cy, F_Z1))
        for s in range(seg):
            j = (s + 1) % seg
            bm.faces.new((bottom, rings[0][j], rings[0][s]))
            bm.faces.new((top, rings[-1][s], rings[-1][j]))
    new_object("skirt", bm)


def build_seat():
    """A rounded bench across the cockpit: walls, then a seat edge rounded in 15-degree steps."""
    bm = bmesh.new()
    cx, a, b = 0.12, 0.24, 0.48
    z0, z1, r = Z_FLOOR + GAP, Z_FLOOR + GAP + 0.2, 0.05
    rings = []
    for k in range(-1, 7):
        if k < 0:
            inset, z = 0.0, z0
        else:
            ang = math.radians(15 * k)
            inset, z = r * (1 - math.cos(ang)), z1 - r + r * math.sin(ang)
        rings.append([bm.verts.new((cx + x, y, z)) for x, y in (_se(t, a - inset, b - inset, 4.0) for t in loop_ts(96))])
    n = len(rings[0])
    for p, q in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((p[i], p[j], q[j], q[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    new_object("seat", bm)


def lathe_x(bm, profile, cy, cz, seg=96):
    """Revolve a closed (x, r) profile around a line parallel to X through (cy, cz)."""
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((x, cy + r * math.cos(a), cz + r * math.sin(a))) for x, r in profile])
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))


def lathe_z(bm, profile, cx, cy, seg=SIDES):
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((cx + r * math.cos(a), cy + r * math.sin(a), z)) for r, z in profile])
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((ra[i], ra[j], rb[j], rb[i]))


def obox(bm, center, axes, half):
    vs = []
    for d in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        vs.append(bm.verts.new(tuple(center[i] + sum(d[k] * half[k] * axes[k][i] for k in range(3)) for i in range(3))))
    for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
        bm.faces.new([vs[i] for i in f])


def tube(bm, points, radius, closed=False, sides=SIDES, normal=None):
    """Round tube through points; open tubes get flat caps (90-degree rims). `normal` fixes the
    ring frame for tubes lying in one plane, so the frame never flips."""
    rings = []
    count = len(points)
    for k, p in enumerate(points):
        q = points[(k + 1) % count] if closed else points[min(k + 1, count - 1)]
        o = points[k - 1] if closed else points[max(k - 1, 0)]
        t = [q[i] - o[i] for i in range(3)]
        n = math.sqrt(sum(c * c for c in t)) or 1.0
        t = [c / n for c in t]
        if normal:
            u = list(normal)
        else:
            up = (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0)
            u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
            un = math.sqrt(sum(c * c for c in u)) or 1.0
            u = [c / un for c in u]
        v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
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


def build_duct():
    bm = bmesh.new()
    lathe_x(bm, [(DUCT_X0, DUCT_RI), (DUCT_X1, DUCT_RI), (DUCT_X1, DUCT_RO), (DUCT_X0, DUCT_RO)], 0.0, DUCT_Z)
    # two struts from the floor up into the duct's underside
    xc = (DUCT_X0 + DUCT_X1) / 2
    bottom = Z_FLOOR + GAP
    for y in (-0.16, 0.16):
        top = DUCT_Z - math.sqrt(DUCT_RO**2 - y * y) + 0.015
        obox(bm, (xc, y, (bottom + top) / 2), (X, Y, Z), (0.06, 0.025, (top - bottom) / 2))
    new_object("duct", bm)


def build_guard():
    """Concentric wire rings and spokes on the duct's front face."""
    bm = bmesh.new()
    wire = 0.008
    for r in (0.14, 0.28, DUCT_RO - 0.02):
        ring = [(GUARD_X, r * math.cos(a), DUCT_Z + r * math.sin(a)) for a in (2 * math.pi * k / 96 for k in range(96))]
        tube(bm, ring, wire, closed=True, normal=X)
    for k in range(12):
        a = 2 * math.pi * k / 12
        tube(bm, [(GUARD_X, r * math.cos(a), DUCT_Z + r * math.sin(a)) for r in (0.03, DUCT_RO - 0.02)], wire, normal=X)
    new_object("guard", bm)


def build_fan():
    bm = bmesh.new()
    xc = (DUCT_X0 + DUCT_X1) / 2
    hub_r = 0.09
    lathe_x(bm, [(xc - 0.06, 0.0), (xc + 0.06, 0.0), (xc + 0.06, hub_r), (xc - 0.06, hub_r)], 0.0, DUCT_Z, seg=48)
    span = DUCT_RI - GAP - hub_r - GAP
    lean = math.radians(35)
    for k in range(6):
        a = 2 * math.pi * k / 6
        radial = (0.0, math.cos(a), math.sin(a))
        tangent = (0.0, -math.sin(a), math.cos(a))
        chord = tuple(math.cos(lean) * c + math.sin(lean) * t for c, t in zip(X, tangent))
        normal = tuple(-math.sin(lean) * c + math.cos(lean) * t for c, t in zip(X, tangent))
        r = hub_r + GAP + span / 2
        obox(bm, (xc, r * radial[1], DUCT_Z + r * radial[2]), (radial, chord, normal), (span / 2, 0.06, 0.008))
    new_object("fan", bm, smooth=False)


def build_rudders():
    bm = bmesh.new()
    z0, z1 = Z_FLOOR + GAP + 0.1, DUCT_Z + 0.36
    for y in (-0.28, 0.0, 0.28):
        obox(bm, ((RUD_X0 + RUD_X1) / 2, y, (z0 + z1) / 2), (X, Y, Z), ((RUD_X1 - RUD_X0) / 2, 0.012, (z1 - z0) / 2))
    new_object("rudders", bm, smooth=False)


def build_cushion():
    bm = bmesh.new()
    lo = [bm.verts.new((*plan_point(t, CUSH_INSET), CUSH_Z0)) for t in loop_ts()]
    hi = [bm.verts.new((*plan_point(t, CUSH_INSET), CUSH_Z1)) for t in loop_ts()]
    n = len(lo)
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((lo[i], lo[j], hi[j], hi[i]))
    bm.faces.new(lo[::-1])
    bm.faces.new(hi)
    new_object("cushion", bm)


def build_pushgrid():
    bm = bmesh.new()
    head_len, head_r, r = 0.06, 0.035, 0.012
    shaft_top = PUSH_Z1 - head_len - 0.006
    for i in range(5):
        for j in range(3):
            x, y = -0.95 + i * 0.475, -0.3 + j * 0.3
            lathe_z(bm, [(0.0, PUSH_Z0), (r, PUSH_Z0), (r, shaft_top), (0.0, shaft_top)], x, y)
            lathe_z(bm, [(0.0, PUSH_Z1 - head_len), (head_r, PUSH_Z1 - head_len), (0.0, PUSH_Z1)], x, y, seg=32)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    new_object("pushgrid", bm)


def build_leaks():
    bm = bmesh.new()
    for k in range(10):
        t = 2 * math.pi * k / 10
        x, y = plan_point(t, F_INSET)
        nx, ny = outward(t)
        pts = []
        for s in range(24):
            f = s / 23
            out = F_DEPTH + 0.07 + 0.32 * f
            pts.append((x + nx * out, y + ny * out, 0.03 + 0.12 * f * f))
        tube(bm, pts, 0.012)
    new_object("leaks", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "hovercraft.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_skirt()
    build_cushion()
    build_pushgrid()
    build_leaks()
    build_hull()
    build_seat()
    build_duct()
    build_guard()
    build_fan()
    build_rudders()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[hovercraft] wrote {out}")


main()
