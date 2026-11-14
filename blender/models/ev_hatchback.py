"""Procedural compact electric hatchback, built to be cut away (our own model, license "own";
idea 37).

A generic five-door electric hatchback (no maker's badges or styling), sized like the real
class: 4.2 m long, 1.8 m wide, 1.55 m tall, a 2.7 m wheelbase and 17-inch wheels on 215/50
tyres. Sizes in meters (the build normalizes the longest side to 2).

- Body: lofted sections, keyed along the car (bumper line, hood, steep windshield, long
  roof, a steep hatch). Each section is a lower body with near-vertical sides and a
  greenhouse that leans in above the belt line, its corners rounded by corner cutting.
  The wheel arches are real openings: near each axle the bottom of the section lifts
  into an arch over the tyre, with a wheel-house wall inboard of it. The nose and the
  tail close with a rounded edge onto a flat face.
- Shut lines (thin tubes lying on the shell): both doors and their window frames, the
  hood, the bumper split, the hatch, sills, arch trims, door handles and the charge flap.
- Glass: windshield, four door windows, two quarter windows and the hatch glass, panels
  just proud of the shell (their edges draw the window outlines).
- Lights: slim headlights wrapping the nose corners, joined by a light bar across the
  nose; a full-width tail-light bar.
- Inside: the battery pack (a flat case filling the floor between the axles, twelve
  modules on it), the rear drive unit (motor, gearbox, inverter and two half shafts),
  the cabin heater (an HVAC box behind the dashboard with a grille facing the cabin),
  the two cables from the battery to the inverter and to the heater, the dashboard and
  screen, two front seats and a rear bench with headrests, and the steering wheel.

Axis: X forward (the nose points to +X), Y to the left, Z up, the ground at Z = 0, the
origin halfway between the axles. Parts:

- body:      shell, shut lines, handles, charge flap (an `away` part: explode removes it)
- glass:     every window (away)
- lights:    headlights, nose light bar, tail lights (away)
- trim:      arch trims, sills, number plates (away)
- mirrors:   the two door mirrors (away)
- interior:  dashboard, screen, seats and headrests (an `away` part: the X-ray keeps only
             what the reel talks about)
- steering:  the steering wheel and its column
- battery:   the pack (the key part)
- motor:     the rear drive unit and its half shafts
- heater:    the HVAC box with its heater grille
- drive:     cable from the back of the pack to the inverter
- heat:      cable from the front of the pack up to the heater
- heatsurge: a thick open sleeve over the heat cable (appear-only)
- frost:     six-armed ice crystals on the pack's sides and ends (appear-only)
- wheels:    four tyres with aero rims, brake discs and calipers

Parts never cross, except the half shafts, which pass through the wheel-house walls to
reach the wheels (a `contacts` pair in models.ts; seen only from under the car). Curves
step under 25 degrees.

  blender -b --factory-startup --python blender/models/ev_hatchback.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

GAP = 0.012
X, Y, Z = (1.0, 0.0, 0.0), (0.0, 1.0, 0.0), (0.0, 0.0, 1.0)

# ---------- package ----------
AXLE_F, AXLE_R = 1.35, -1.32  # 2.67 m wheelbase
TYRE_R, TYRE_W = 0.33, 0.214  # 215/50 R17
RIM_R = 0.216  # 17-inch rim
AXLE_Z = TYRE_R
TRACK_Y = 0.78  # wheel center (1.56 m track)
TYRE_IN = TRACK_Y - TYRE_W / 2  # 0.673
ARCH_C, ARCH_R = 0.29, 0.40  # arch circle center height and radius
WALL_Y = 0.63  # wheel-house wall, inboard of the tyre

X_FRONT, X_REAR = 2.08, -1.9  # last lofted sections; the end caps round off from here
CAP_R = 0.12  # radius of the rounded edge onto the nose and tail faces

# (x, value) keys from the tail to the nose
TOP_KEYS = [(-1.9, 1.06), (-1.8, 1.2), (-1.66, 1.4), (-1.5, 1.5), (-1.0, 1.545), (-0.3, 1.555),
            (0.25, 1.49), (0.55, 1.33), (0.85, 1.1), (1.05, 0.99), (1.6, 0.9), (2.08, 0.79)]
BELT_KEYS = [(-1.9, 1.01), (-1.5, 1.04), (0.0, 1.0), (1.05, 0.95), (1.6, 0.86), (2.08, 0.75)]
WIDTH_KEYS = [(-1.9, 0.855), (-1.75, 0.885), (-1.4, 0.9), (1.0, 0.9), (1.6, 0.895), (1.9, 0.865), (2.08, 0.81)]
BOTTOM_KEYS = [(-1.9, 0.28), (-1.78, 0.21), (-1.4, 0.2), (1.6, 0.2), (1.85, 0.22), (2.08, 0.27)]


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


# ---------- small vector helpers ----------

def add(a, b):
    return tuple(x + y for x, y in zip(a, b))


def sub(a, b):
    return tuple(x - y for x, y in zip(a, b))


def mul(a, k):
    return tuple(x * k for x in a)


def dot(a, b):
    return sum(x * y for x, y in zip(a, b))


def cross(a, b):
    return (a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0])


def unit(a):
    n = math.sqrt(dot(a, a)) or 1.0
    return mul(a, 1 / n)


def lerp(a, b, t):
    return a + (b - a) * t


def spow(v, p):
    return math.copysign(abs(v) ** p, v)


def pchip(keys, x):
    """Monotone cubic through (x, y) keys, flat at both ends: no overshoot, no bumps."""
    xs = [k[0] for k in keys]
    ys = [k[1] for k in keys]
    n = len(keys)
    d = [(ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]) for i in range(n - 1)]
    m = [0.0] * n
    for i in range(1, n - 1):
        if d[i - 1] * d[i] > 0:
            w1 = 2 * (xs[i + 1] - xs[i]) + (xs[i] - xs[i - 1])
            w2 = (xs[i + 1] - xs[i]) + 2 * (xs[i] - xs[i - 1])
            m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i])
    x = min(max(x, xs[0]), xs[-1])
    for i in range(n - 1):
        if x <= xs[i + 1]:
            h = xs[i + 1] - xs[i]
            t = (x - xs[i]) / h
            h00, h10 = 2 * t**3 - 3 * t**2 + 1, t**3 - 2 * t**2 + t
            h01, h11 = -2 * t**3 + 3 * t**2, t**3 - t**2
            return h00 * ys[i] + h10 * h * m[i] + h01 * ys[i + 1] + h11 * h * m[i + 1]
    return ys[-1]


def chaikin(points, rounds=3, closed=True):
    """Corner cutting: rounds a polyline's corners into smooth curves."""
    for _ in range(rounds):
        out = []
        n = len(points)
        for k in range(n if closed else n - 1):
            a, b = points[k], points[(k + 1) % n]
            out.append(tuple(0.75 * p + 0.25 * q for p, q in zip(a, b)))
            out.append(tuple(0.25 * p + 0.75 * q for p, q in zip(a, b)))
        if not closed:
            out = [points[0]] + out + [points[-1]]
        points = out
    return points


def densify(points, step, closed=True):
    out = []
    n = len(points)
    for k in range(n if closed else n - 1):
        a, b = points[k], points[(k + 1) % n]
        m = max(1, math.ceil(math.dist(a, b) / step))
        out.extend(tuple(p + (q - p) * i / m for p, q in zip(a, b)) for i in range(m))
    if not closed:
        out.append(points[-1])
    return out


# ---------- body profile ----------

def top(x):
    return pchip(TOP_KEYS, x)


def belt(x):
    a, b = pchip(BELT_KEYS, x), top(x) - 0.07  # smooth minimum: no kink where they cross
    return (a + b - math.sqrt((a - b) ** 2 + 0.02**2)) / 2


def width(x):
    return pchip(WIDTH_KEYS, x)


def bottom(x):
    return pchip(BOTTOM_KEYS, x)


def corner_r(x):
    """Radius of the roof edge (small over the hood, where the greenhouse is flat)."""
    return min(0.11, 0.5 * (top(x) - belt(x)))


def roof_edge(x):
    return top(x) - corner_r(x)


def _arch_table(step=0.002, sigma=0.03):
    """Lift of the arch over a flat 0.2 m sill against distance from the axle: the arch
    circle, clipped at the sill, then blurred (Gaussian, sigma 30 mm) so the arch ends
    round into the sill with no kink anywhere."""
    span = ARCH_R + 4 * sigma
    ds = [-span + step * k for k in range(int(2 * span / step) + 1)]
    raw = []
    for d in ds:
        c = ARCH_C + math.sqrt(ARCH_R**2 - d * d) if abs(d) < ARCH_R else 0.0
        raw.append(max(c - 0.2, 0.0))
    w = [math.exp(-0.5 * (k * step / sigma) ** 2) for k in range(-int(3 * sigma / step), int(3 * sigma / step) + 1)]
    half = len(w) // 2
    out = []
    for i in range(len(ds)):
        acc = tot = 0.0
        for j, wj in enumerate(w):
            k = i + j - half
            if 0 <= k < len(ds):
                acc += raw[k] * wj
                tot += wj
        out.append(acc / tot)
    return ds[0], step, out


_ARCH = _arch_table()


def arch_lift(x):
    d0, step, table = _ARCH
    best = 0.0
    for ax in (AXLE_F, AXLE_R):
        f = (x - ax - d0) / step
        i = int(math.floor(f))
        if 0 <= i < len(table) - 1:
            best = max(best, lerp(table[i], table[i + 1], f - i))
    return best


def arch_z(x):
    """Height the section bottom lifts to beside the tyre."""
    return bottom(x) + arch_lift(x)


def wall_h(x):
    """Height of the wheel-house wall: the arch lift, eased (smooth maximum) onto a small
    minimum with no kink, so the sections change smoothly where the arch starts."""
    lift = arch_lift(x)
    return (lift + 0.012 + math.sqrt((lift - 0.012) ** 2 + 0.03**2)) / 2


def lip_z(x):
    """Height of the arch's outer edge (the lip where the side turns under)."""
    return bottom(x) + wall_h(x) + 0.04


def _half(x):
    """Right-hand half of the section at x, from the bottom center up to the roof center."""
    zb, zt, zbelt, w = bottom(x), top(x), belt(x), width(x)
    zl = max(arch_z(x), zb)
    lift = zl - zb
    wall = wall_h(x)
    rr = corner_r(x)
    taper = 0.2 * min(max((zt - zbelt - 0.07) / 0.4, 0.0), 1.0)
    w5 = w - 0.012
    wt = w5 - taper
    p5 = (w5, zbelt)
    p7 = (wt + 0.25 * rr, zt - rr)
    return [
        (0.0, zb),
        (0.3, zb),
        # wheel-house wall: a vertical face (so its strips stay flat as the arch rises),
        # 12 mm high away from the wheels
        (WALL_Y, zb),
        (WALL_Y, zb + wall),
        (w - 0.09, zb + wall),
        (w - 0.005, zb + wall + 0.04),
        (w, zbelt - 0.08),
        p5,
        ((p5[0] + p7[0]) / 2, (p5[1] + p7[1]) / 2),
        p7,
        (wt - rr, zt - 0.08 * rr),
        (0.35 * wt, zt),
        (0.0, zt),
    ]


# Corner radius at each point of `_half` (bottom center to roof center); the last entry is
# filled in per section with the roof edge radius.
# The wheel-house wall's two corners (entries 2 and 3) are sharp on purpose: a hard 90-degree
# edge draws one clean line, where a small rounding would shear as the arch rises.
HALF_RADII = [0.0, 0.0, 0.0, 0.0, 0.04, 0.05, 0.1, 0.1, 0.0, None, None, 0.3, 0.0]
HALF_STEPS = [5, 5, 1, 1, 9, 9, 9, 7, 3, 7, 7, 5, 3]  # points - 1 per corner
ROUND_STEPS = 5  # points per corner - 1 (an even point count keeps the ring mirror-symmetric)


def round_poly(poly, radii, steps):
    """Closed polygon with every corner replaced by a quadratic curve of `steps` + 1
    points, its tangent length set by the corner's radius. Every corner gets the same
    number of points (straight ones too), so every section has the same count and the
    loft never twists."""
    n = len(poly)
    out = []
    for i in range(n):
        p, a, b = poly[i], poly[i - 1], poly[(i + 1) % n]
        la, lb = math.dist(p, a), math.dist(p, b)
        ua = ((p[0] - a[0]) / la, (p[1] - a[1]) / la)
        ub = ((b[0] - p[0]) / lb, (b[1] - p[1]) / lb)
        delta = math.acos(max(-1.0, min(1.0, ua[0] * ub[0] + ua[1] * ub[1])))
        if radii[i] == 0 and delta > 0.17:
            d = 0.0  # a sharp corner: its points coincide (welded into one on import)
        else:
            d = min(max(radii[i] * math.tan(delta / 2), 0.01), 0.45 * min(la, lb))
        s0 = (p[0] - ua[0] * d, p[1] - ua[1] * d)
        s1 = (p[0] + ub[0] * d, p[1] + ub[1] * d)
        for k in range(steps[i] + 1):
            t = k / steps[i]
            out.append(tuple((1 - t) ** 2 * s0[c] + 2 * (1 - t) * t * p[c] + t * t * s1[c] for c in range(2)))
    shift = (steps[0] + 1) // 2
    return out[-shift:] + out[:-shift]


_RING_CACHE = {}


def ring(x):
    """Closed section at x as (y, z) points: mirror-symmetric, so point i and point
    M - 1 - i are mirror images."""
    key = round(x, 6)
    if key not in _RING_CACHE:
        half = _half(x)
        rr = corner_r(x)
        radii = [rr if r is None else r for r in HALF_RADII]
        poly = half + [(-y, z) for y, z in reversed(half[1:-1])]
        _RING_CACHE[key] = round_poly(poly, radii + list(reversed(radii[1:-1])), HALF_STEPS + list(reversed(HALF_STEPS[1:-1])))
    return _RING_CACHE[key]


M = len(ring(0.0))


def surf(x, t):
    """Shell point at station x, fractional ring index t (0 bottom center, M/2 roof)."""
    r = ring(x)
    i = math.floor(t)
    f = t - i
    a, b = r[i % M], r[(i + 1) % M]
    return (x, lerp(a[0], b[0], f), lerp(a[1], b[1], f))


def surf_normal(x, t):
    e = 1e-4
    dx = sub(surf(x + e, t), surf(x - e, t))
    dt = sub(surf(x, t + 0.25), surf(x, t - 0.25))
    n = unit(cross(dx, dt))
    p = surf(x, t)
    out = (0.0, p[1], p[2] - (bottom(x) + top(x)) / 2)
    return n if dot(n, out) >= 0 else mul(n, -1)


def side_t(x, z):
    """Ring index on the right side where the shell reaches height z."""
    r = ring(x)
    for i in range(M // 2):
        za, zb = r[i][1], r[i + 1][1]
        if za <= z <= zb and zb > za + 1e-9:
            return i + (z - za) / (zb - za)
    raise SystemExit(f"[ev_hatchback] no side point at x={x:.3f}, z={z:.3f}")


def t_along(x, t, dist):
    """The ring index `dist` meters further round the section from t (toward the roof)."""
    p = surf(x, t)
    while dist > 0 and t < M / 2 - 0.5:
        q = surf(x, t + 0.05)
        dist -= math.dist(p, q)
        p, t = q, t + 0.05
    return t


def off_point(x, t, off):
    return add(surf(x, t), mul(surf_normal(x, t), off))


def flip(p):
    return (p[0], -p[1], p[2])


def body_xs():
    xs = set()
    x = X_REAR
    while x < X_FRONT:
        xs.add(round(x, 6))
        near = min(abs(x - AXLE_F), abs(x - AXLE_R)) < ARCH_R + 0.12
        ends = x > 1.85 or x < -1.7
        step = 0.01 if near else (0.015 if ends else 0.03)
        if near:
            # Step by arc length along the arch edge, so its steep ends get as many
            # sections as its top.
            slope = (arch_z(x + 1e-4) - arch_z(x - 1e-4)) / 2e-4
            step = max(0.012 / math.sqrt(1 + slope * slope), 0.002)
        x += step
    xs.add(X_FRONT)
    return sorted(xs)


def _offset_ring(r, d):
    """The ring drawn in by d at its widest and tallest points: scaled toward its center
    (an inward offset would fold over the small corner radii)."""
    ys = [p[0] for p in r]
    zs = [p[1] for p in r]
    hy = max(ys)
    zc, hz = (max(zs) + min(zs)) / 2, (max(zs) - min(zs)) / 2
    ky, kz = 1 - d / hy, 1 - d / hz
    return [(y * ky, zc + (z - zc) * kz) for y, z in r]


def build_shell(bm):
    rings = []
    xs = body_xs()
    caps = 10
    # rear cap: from the flat tail face round onto the last section
    rear = []
    for k in range(caps, 0, -1):
        a = math.pi / 2 * k / caps
        x = X_REAR - CAP_R * math.sin(a)
        rear.append((x, _offset_ring(ring(X_REAR), CAP_R * (1 - math.cos(a)))))
    front = []
    for k in range(1, caps + 1):
        a = math.pi / 2 * k / caps
        x = X_FRONT + CAP_R * math.sin(a)
        front.append((x, _offset_ring(ring(X_FRONT), CAP_R * (1 - math.cos(a)))))
    for x, r in rear + [(x, ring(x)) for x in xs] + front:
        rings.append([bm.verts.new((x, y, z)) for y, z in r])
    for a, b in zip(rings, rings[1:]):
        for i in range(M):
            j = (i + 1) % M
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


FACE_FRONT = X_FRONT + CAP_R
FACE_REAR = X_REAR - CAP_R


# ---------- tubes and panels on the shell ----------

def tube(bm, points, radius, sides=16, normals=None, closed=False, caps=True):
    rings = []
    count = len(points)
    for k, p in enumerate(points):
        if closed:
            q, o = points[(k + 1) % count], points[(k - 1) % count]
        else:
            q, o = points[min(k + 1, count - 1)], points[max(k - 1, 0)]
        t = unit(sub(q, o))
        if normals:
            u = normals[k]
        elif k == 0:
            u = cross(t, (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0))
        # else: carry the previous ring's u along the path (parallel transport, no twist)
        u = unit(sub(u, mul(t, dot(u, t))))
        v = cross(t, u)
        rings.append([
            bm.verts.new(add(p, mul(add(mul(u, math.cos(a)), mul(v, math.sin(a))), radius)))
            for a in (2 * math.pi * s / sides for s in range(sides))
        ])
    pairs = list(zip(rings, rings[1:])) + ([(rings[-1], rings[0])] if closed else [])
    for a, b in pairs:
        for s in range(sides):
            j = (s + 1) % sides
            bm.faces.new((a[s], a[j], b[j], b[s]))
    if caps and not closed:
        bm.faces.new(rings[0][::-1])
        bm.faces.new(rings[-1])


def relax(points, passes=4, closed=True):
    """Moving-average smoothing (window 5): irons out the kinks a path picks up where it
    crosses the shell's facets."""
    n = len(points)
    for _ in range(passes):
        out = []
        for i in range(n):
            if not closed and (i < 2 or i > n - 3):
                out.append(points[i])
                continue
            js = [(i + d) % n for d in (-2, -1, 0, 1, 2)]
            out.append(tuple(sum(points[j][c] for j in js) / 5 for c in range(3)))
        points = out
    return points


def shell_line(bm, xz, radius=0.007, closed=True, sides=(1, -1)):
    """A thin tube lying on the shell along (x, z) points on the side (both sides)."""
    for side in sides:
        pts, nrms = [], []
        for x, z in xz:
            t = side_t(x, z)
            n = surf_normal(x, t)
            p = add(surf(x, t), mul(n, radius + 0.006))
            if side < 0:
                p, n = flip(p), flip(n)
            pts.append(p)
            nrms.append(n)
        tube(bm, relax(pts, closed=closed), radius, normals=[unit(v) for v in relax(nrms, closed=closed)], closed=closed)


def ring_line(bm, x, t0, radius=0.007):
    """A tube across the top of the shell at station x, from ring index t0 on the right
    to its mirror on the left."""
    t1 = M - 1 - t0
    steps = max(8, int((t1 - t0) * 3))
    pts, nrms = [], []
    for k in range(steps + 1):
        t = t0 + (t1 - t0) * k / steps
        n = surf_normal(x, t)
        pts.append(add(surf(x, t), mul(n, radius + 0.006)))
        nrms.append(n)
    tube(bm, relax(pts, closed=False), radius, normals=[unit(v) for v in relax(nrms, closed=False)], closed=False)


def loop(corners, rounds=3, step=0.01):
    """Closed (x, z) outline with small rounded corners (densified first, so the corner
    cuts stay a few centimeters)."""
    return densify(chaikin(densify(corners, 0.04), rounds=rounds), step)


def panel_tz(bm, x0, x1, t_lo, t_hi, off, nx=40, nt=16, mirror=True):
    """A panel over the shell from x0 to x1 between ring indices t_lo(x) and t_hi(x)."""
    for side in ((1, -1) if mirror else (1,)):
        rows = []
        for i in range(nx + 1):
            x = x0 + (x1 - x0) * i / nx
            lo, hi = t_lo(x), t_hi(x)
            row = []
            for j in range(nt + 1):
                p = off_point(x, lo + (hi - lo) * j / nt, off)
                row.append(bm.verts.new(flip(p) if side < 0 else p))
            rows.append(row)
        for r0, r1 in zip(rows, rows[1:]):
            for j in range(nt):
                bm.faces.new((r0[j], r1[j], r1[j + 1], r0[j + 1]))


def panel_xz(bm, x0, x1, z_lo, z_hi, off=0.012, nx=40, nz=12, mirror=True, min_h=0.03):
    """As panel_tz, between heights; the x range shrinks to where the panel is at least
    min_h tall (a window narrowing into a pillar)."""
    ok = [x0 + (x1 - x0) * k / 400 for k in range(401)]
    ok = [x for x in ok if z_hi(x) - z_lo(x) >= min_h]
    if not ok:
        raise SystemExit(f"[ev_hatchback] empty panel {x0}..{x1}")
    x0, x1 = ok[0], ok[-1]
    panel_tz(bm, x0, x1, lambda x: side_t(x, z_lo(x)), lambda x: side_t(x, z_hi(x)), off, nx, nz, mirror)


# ---------- pillars ----------

def line_z(x, xa, za, xb, zb):
    return za + (zb - za) * (x - xa) / (xb - xa)


A_BOT, A_TOP = 0.97, 0.3  # A-pillar from the cowl up to the roof


def z_a(x):
    return line_z(x, A_BOT, belt(A_BOT), A_TOP, roof_edge(A_TOP))


C_TOP, C_BOT = -1.05, -1.22  # rear door's rear edge


def z_c(x):
    return line_z(x, C_BOT, belt(C_BOT), C_TOP, roof_edge(C_TOP) - 0.01)


D_TOP, D_BOT = -1.46, -1.86  # D-pillar, between the quarter window and the hatch


def z_d(x):
    return line_z(x, D_BOT, belt(D_BOT) + 0.02, D_TOP, roof_edge(D_TOP))


# ---------- body ----------

def build_body():
    bm = bmesh.new()
    build_shell(bm)
    door_lines(bm)
    hood_lines(bm)
    handles_and_flap(bm)
    new_object("body", bm)


SILL_Z = 0.32


def door_lines(bm):
    # Front door: along the A-pillar, the roof drip, the B-pillar, the sill.
    xa = [A_BOT - (A_BOT - A_TOP) * k / 12 for k in range(13)]
    front = [(0.86, SILL_Z), (0.86, 0.6), (0.93, belt(0.93) - 0.01)]
    front += [(x, z_a(x)) for x in xa[1:]]
    front += [(x, roof_edge(x) - 0.012) for x in (0.15, 0.0)]
    front += [(-0.06, roof_edge(-0.06) - 0.012), (-0.06, SILL_Z)]
    shell_line(bm, loop(front))
    # Rear door: roof drip, the C-pillar, round the rear arch, the sill.
    rear = [(-0.11, SILL_Z), (-0.11, roof_edge(-0.11) - 0.012), (-0.6, roof_edge(-0.6) - 0.012)]
    rear += [(C_TOP, z_c(C_TOP)), (C_BOT, belt(C_BOT) - 0.01)]
    ar = ARCH_R + 0.12
    for k in range(13):  # around the arch, from above it to its front
        x = C_BOT + (-0.86 - C_BOT) * k / 12
        d = x - AXLE_R
        rear.append((x, ARCH_C + math.sqrt(max(ar * ar - d * d, 0.0))))
    rear += [(-0.86, SILL_Z)]
    shell_line(bm, loop(rear))
    # Front bumper split and the sills.
    shell_line(bm, [(1.88, 0.33 + 0.015 * k) for k in range(0, 17)], closed=False)
    shell_line(bm, [(-0.78 + 1.56 * k / 60, 0.27) for k in range(61)], radius=0.009, closed=False)


def hood_lines(bm):
    # The hood's side edges along the shoulders, and across the nose.
    xs = [1.0 + (1.95 - 1.0) * k / 60 for k in range(61)]  # stops clear of the line across the nose
    shell_line(bm, [(x, belt(x) - 0.012) for x in xs], closed=False)
    ring_line(bm, 1.98, side_t(1.98, belt(1.98) + 0.02))  # from just above the shoulder


def handles_and_flap(bm):
    for x0, x1 in ((0.5, 0.66), (-0.62, -0.46)):
        z0, z1 = belt(x0) - 0.07, belt(x0) - 0.04
        panel_xz(bm, x0, x1, lambda x, z=z0: z, lambda x, z=z1: z, off=0.006, nx=16, nz=6)
    # Charge flap on the right rear fender (the -Y side faces the default camera).
    flap = loop([(-1.5, 0.84), (-1.5, 0.95), (-1.64, 0.95), (-1.64, 0.84)], rounds=3, step=0.006)
    shell_line(bm, flap, radius=0.006, sides=(-1,))


# ---------- glass, lights, trim ----------

def build_glass():
    bm = bmesh.new()
    lo = lambda x: belt(x) + 0.035  # noqa: E731
    # Front door window: under the roof drip, behind the A-pillar.
    hi_f = lambda x: min(roof_edge(x) - 0.045, z_a(x) - 0.07)  # noqa: E731
    panel_xz(bm, -0.01, 0.86, lo, hi_f, nx=60)
    # Rear door window, its rear edge along the C-pillar.
    hi_r = lambda x: min(roof_edge(x) - 0.045, z_c(x) - 0.09 if x < C_TOP + 0.05 else 9)  # noqa: E731
    panel_xz(bm, -1.19, -0.16, lo, hi_r, nx=60)
    # Quarter window, between the C- and D-pillars.
    hi_q = lambda x: min(roof_edge(x) - 0.045, z_d(x) - 0.07)  # noqa: E731
    panel_xz(bm, -1.66, -1.3, lo, hi_q, nx=30)
    # Windshield and hatch glass across the top, inside the pillars.
    ta = lambda x: t_along(x, side_t(x, z_a(x)), 0.05)  # noqa: E731
    x1 = max(x for x in (0.33 + 0.62 * k / 300 for k in range(301)) if z_a(x) + 0.03 < top(x) and ta(x) < M / 2 - 3)
    panel_tz(bm, 0.33, x1, ta, lambda x: M - 1 - ta(x), 0.012, nx=40, nt=48, mirror=False)
    td = lambda x: t_along(x, side_t(x, z_d(x)), 0.05)  # noqa: E731
    x0 = min(x for x in (D_BOT + (D_TOP - D_BOT) * k / 300 for k in range(301)) if z_d(x) + 0.03 < top(x) and td(x) < M / 2 - 3)
    panel_tz(bm, x0, D_TOP - 0.05, td, lambda x: M - 1 - td(x), 0.012, nx=30, nt=48, mirror=False)
    new_object("glass", bm)


def obox(bm, center, axes, half):
    vs = []
    for d in [(-1, -1, -1), (1, -1, -1), (1, 1, -1), (-1, 1, -1), (-1, -1, 1), (1, -1, 1), (1, 1, 1), (-1, 1, 1)]:
        vs.append(bm.verts.new(tuple(center[i] + sum(d[k] * half[k] * axes[k][i] for k in range(3)) for i in range(3))))
    for f in [(0, 3, 2, 1), (4, 5, 6, 7), (0, 1, 5, 4), (1, 2, 6, 5), (2, 3, 7, 6), (3, 0, 4, 7)]:
        bm.faces.new([vs[i] for i in f])


def face_slab(bm, x_face, sign, y_half, z0, z1, depth=0.008):
    """A flat strip standing just off the nose (sign 1) or tail (sign -1) face."""
    cx = x_face + sign * (0.006 + depth / 2)
    obox(bm, (cx, 0.0, (z0 + z1) / 2), (X, Y, Z), (depth / 2, y_half, (z1 - z0) / 2))


def build_lights():
    bm = bmesh.new()
    # Headlights: slim strips round the nose corners.
    panel_xz(bm, 1.93, X_FRONT, lambda x: belt(x) - 0.12, lambda x: belt(x) - 0.065, off=0.012, nx=24, nz=8)
    face_slab(bm, FACE_FRONT, 1, 0.6, 0.6, 0.625)  # light bar across the nose
    # Tail lights: round the rear corners and a full-width bar across the tail.
    panel_xz(bm, X_REAR, -1.78, lambda x: belt(x) - 0.12, lambda x: belt(x) - 0.06, off=0.012, nx=16, nz=8)
    face_slab(bm, FACE_REAR, -1, 0.66, 0.85, 0.89)
    new_object("lights", bm)


def build_trim():
    bm = bmesh.new()
    # Arch trims along each arch's edge.
    for ax in (AXLE_F, AXLE_R):
        xs = [ax - (ARCH_R + 0.12) + 2 * (ARCH_R + 0.12) * k / 160 for k in range(161)]
        path = densify([(x, lip_z(x) + 0.03) for x in xs], 0.012, closed=False)
        shell_line(bm, path, radius=0.012, closed=False)
    # Number plates and the hatch's lower shut line on the tail face.
    face_slab(bm, FACE_FRONT, 1, 0.25, 0.43, 0.53)
    face_slab(bm, FACE_REAR, -1, 0.25, 0.58, 0.69)
    face_slab(bm, FACE_REAR, -1, 0.68, 0.535, 0.545, depth=0.006)
    new_object("trim", bm)


def slab(bm, origin, U, V, W, a, b, t, n=4.0, steps=8, seg=96):
    """Rounded slab: plan a superellipse (half sizes a along U, b along V), thickness t along
    W from `origin`, every edge rounded with radius t / 2."""
    edge = t / 2
    rings = []
    for k in range(steps + 1):
        ang = math.radians(-90 + 180 * k / steps)
        inset = edge - edge * math.cos(ang)
        w = edge + edge * math.sin(ang)
        rr = []
        for j in range(seg):
            q = 2 * math.pi * j / seg
            pu = (a - inset) * spow(math.cos(q), 2 / n)
            pv = (b - inset) * spow(math.sin(q), 2 / n)
            rr.append(bm.verts.new(tuple(origin[i] + U[i] * pu + V[i] * pv + W[i] * w for i in range(3))))
        rings.append(rr)
    for p, q in zip(rings, rings[1:]):
        for i in range(seg):
            j = (i + 1) % seg
            bm.faces.new((p[i], p[j], q[j], q[i]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])


def build_mirrors():
    bm = bmesh.new()
    x = 0.8
    z = belt(x) + 0.02
    for side in (1, -1):
        p = surf(x, side_t(x, z))
        y0 = p[1] + 0.03
        s = float(side)
        obox(bm, (x - 0.02, s * (y0 + 0.03), z), (X, Y, Z), (0.03, 0.03, 0.018))  # stalk
        slab(bm, (x - 0.08, s * (y0 + 0.06 + 0.1), z), Y, Z, X, 0.1, 0.06, 0.08, n=2.5, steps=12, seg=128)
    new_object("mirrors", bm)


# ---------- wheels ----------

def lathe(bm, profile, origin, axis, seg=96, closed=False):
    """Revolve an (along, radius) profile around `axis` through `origin`; `closed` makes it
    a ring. Points with radius 0 become poles."""
    ax = axis
    up = (0.0, 0.0, 1.0) if abs(ax[2]) < 0.9 else (1.0, 0.0, 0.0)
    u = unit(cross(ax, up))
    v = cross(ax, u)
    poles = {}
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        ca, sa = math.cos(a), math.sin(a)
        rr = []
        for i, (t, r) in enumerate(profile):
            if r == 0:
                if i not in poles:
                    poles[i] = bm.verts.new(add(origin, mul(ax, t)))
                rr.append(poles[i])
            else:
                rr.append(bm.verts.new(tuple(origin[k] + ax[k] * t + r * (ca * u[k] + sa * v[k]) for k in range(3))))
        rings.append(rr)
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(n if closed else n - 1):
            i1 = (i + 1) % n
            quad = []
            for q in (ra[i], ra[i1], rb[i1], rb[i]):
                if q not in quad:
                    quad.append(q)
            if len(quad) >= 3:
                bm.faces.new(quad)


def rounded_profile(t0, t1, r_in, r_out, fillet, steps=8):
    pts = [(t0, r_in)]
    for k in range(steps + 1):
        a = math.radians(90 * k / steps)
        pts.append((t0 + fillet - fillet * math.cos(a), r_out - fillet + fillet * math.sin(a)))
    for k in range(steps + 1):
        a = math.radians(90 * k / steps)
        pts.append((t1 - fillet + fillet * math.sin(a), r_out - fillet + fillet * math.cos(a)))
    pts.append((t1, r_in))
    return pts


def tyre_profile():
    """Closed (along, radius) section of the tyre: beads, bulging sidewalls, rounded
    shoulders and a tread with three grooves."""
    w, r, bead = TYRE_W, TYRE_R, RIM_R + 0.004
    pts = []
    # inner sidewall, bead to shoulder (a slight outward bulge)
    for k in range(9):
        f = k / 8
        pts.append((-0.01 * math.sin(math.pi * f) ** 2, bead + (r - 0.03 - bead) * f))
    for k in range(1, 9):  # inner shoulder
        a = math.radians(90 * k / 8)
        pts.append((0.03 - 0.03 * math.cos(a), r - 0.03 + 0.03 * math.sin(a)))
    grooves = [0.3, 0.5, 0.7]
    x = 0.03
    for g in grooves:
        gx = w * g
        pts += [(gx - 0.006, r), (gx - 0.006, r - 0.008), (gx + 0.006, r - 0.008), (gx + 0.006, r)]
    pts.append((w - 0.03, r))
    for k in range(1, 9):  # outer shoulder
        a = math.radians(90 * k / 8)
        pts.append((w - 0.03 + 0.03 * math.sin(a), r - 0.03 + 0.03 * math.cos(a)))
    for k in range(1, 9):
        f = k / 8
        pts.append((w + 0.01 * math.sin(math.pi * f) ** 2, r - 0.03 - (r - 0.03 - bead) * f))
    return [(t, rr) for t, rr in pts], x


def build_wheels():
    bm = bmesh.new()
    prof, _ = tyre_profile()
    for ax in (AXLE_F, AXLE_R):
        for side in (1, -1):
            s = float(side)
            y_in = s * TYRE_IN
            axis = (0.0, s, 0.0)
            c = (ax, y_in, AXLE_Z)
            lathe(bm, prof, c, axis, seg=96, closed=True)
            # rim barrel inside the beads, and its outer lip
            lathe(bm, rounded_profile(0.01, TYRE_W - 0.01, RIM_R - 0.02, RIM_R - 0.004, 0.004, steps=4), c, axis, seg=96, closed=True)
            face = TYRE_W - 0.022
            lathe(bm, rounded_profile(face, face + 0.014, 0.165, RIM_R - 0.02 - GAP, 0.005, steps=4), c, axis, seg=96, closed=True)
            # hub cap and ten spokes in five pairs (aero rim)
            lathe(bm, rounded_profile(face - 0.004, face + 0.016, 0.0, 0.065, 0.008, steps=6), c, axis, seg=64)
            for k in range(5):
                for d in (-0.11, 0.11):
                    a = 2 * math.pi * k / 5 + d
                    radial = (math.cos(a), 0.0, math.sin(a))
                    tangent = unit(cross(axis, radial))
                    mid = (0.065 + 0.18) / 2
                    half = (0.18 - 0.065) / 2 + 0.006
                    center = add(c, add(mul(radial, mid), mul(axis, face + 0.006)))
                    obox(bm, center, (radial, tangent, axis), (half, 0.018, 0.008))
            # brake disc and caliper, inboard of the spokes
            lathe(bm, rounded_profile(0.05, 0.072, 0.07, 0.17, 0.004, steps=4), c, axis, seg=96, closed=True)
            a = math.radians(35 if ax > 0 else 145)
            radial = (math.cos(a), 0.0, math.sin(a))
            tangent = unit(cross(axis, radial))
            obox(bm, add(c, add(mul(radial, 0.145), mul(axis, 0.061))), (radial, tangent, axis), (0.028, 0.06, 0.03))
    new_object("wheels", bm)


# ---------- battery and frost ----------

BAT_X, BAT_Y = 0.9, 0.6  # inside the wheel-house walls
BAT_Z0, BAT_Z1 = 0.225, 0.34
MOD_Z0, MOD_Z1 = BAT_Z1 + 0.008, 0.4
MOD_XS = (-0.7, -0.42, -0.14, 0.14, 0.42, 0.7)
MOD_YS = (-0.29, 0.29)


def build_battery():
    bm = bmesh.new()
    obox(bm, (0.0, 0.0, (BAT_Z0 + BAT_Z1) / 2), (X, Y, Z), (BAT_X, BAT_Y, (BAT_Z1 - BAT_Z0) / 2))
    for x in MOD_XS:
        for y in MOD_YS:
            obox(bm, (x, y, (MOD_Z0 + MOD_Z1) / 2), (X, Y, Z), (0.128, 0.27, (MOD_Z1 - MOD_Z0) / 2))
    new_object("battery", bm, smooth=False)


def build_frost():
    bm = bmesh.new()
    zc = (BAT_Z0 + BAT_Z1) / 2
    r = 0.045

    def flake(center, n, u):
        v = cross(n, u)
        for k in range(6):
            a = math.pi * k / 3
            d = tuple(math.cos(a) * u[i] + math.sin(a) * v[i] for i in range(3))
            side = cross(n, d)
            obox(bm, add(center, mul(d, 0.008 + r / 2)), (d, side, n), (r / 2, 0.0045, 0.003))
            for s in (1, -1):
                b = math.pi / 3 * s
                bd = tuple(math.cos(b) * d[i] + math.sin(b) * side[i] for i in range(3))
                root = add(center, mul(d, 0.008 + r * 0.62))
                obox(bm, add(root, mul(bd, 0.016)), (bd, cross(n, bd), n), (0.009, 0.0035, 0.003))

    off = 0.012
    for side in (1, -1):
        for x in (-0.72, -0.43, -0.14, 0.14, 0.43, 0.72):
            flake((x, side * (BAT_Y + off), zc), (0.0, float(side), 0.0), X)
        for y in (-0.4, 0.4):
            flake((side * (BAT_X + off), y, zc), (float(side), 0.0, 0.0), Y)
    new_object("frost", bm, smooth=False)


# ---------- rear drive unit ----------

MOTOR_Z = 0.34
DRUM_R = 0.11
INV_C, INV_H = (AXLE_R, -0.12, 0.505), (0.14, 0.13, 0.04)


def build_motor():
    bm = bmesh.new()
    # motor drum (axis along y), gearbox beside it, inverter on top
    lathe(bm, rounded_profile(0.0, 0.3, 0.0, DRUM_R, 0.025, steps=8), (AXLE_R, -0.27, MOTOR_Z), Y, seg=96)
    obox(bm, (AXLE_R, 0.15, MOTOR_Z), (X, Y, Z), (0.12, 0.1, 0.11))
    obox(bm, INV_C, (X, Y, Z), INV_H)
    # half shafts with CV boots, out to each wheel
    for y0, y1 in ((0.25 + GAP, TYRE_IN - 0.02), (-0.27 - GAP, -(TYRE_IN - 0.02))):
        s = 1.0 if y1 > y0 else -1.0
        length = abs(y1 - y0)
        prof = [(0.0, 0.0)]
        for k in range(25):  # inner boot: a bulge with no slope where it meets the shaft
            f = k / 24
            prof.append((0.08 * f, 0.022 + 0.02 * math.sin(math.pi * f) ** 2))
        for k in range(1, 25):
            f = k / 24
            prof.append((length - 0.08 + 0.08 * f, 0.022 + 0.02 * math.sin(math.pi * f) ** 2))
        prof.append((length, 0.0))
        lathe(bm, prof, (AXLE_R, y0, MOTOR_Z), (0.0, s, 0.0), seg=32)
    new_object("motor", bm)


# ---------- heater ----------

HEAT_C, HEAT_H = (1.05, 0.0, 0.585), (0.13, 0.22, 0.135)


def build_heater():
    bm = bmesh.new()
    obox(bm, HEAT_C, (X, Y, Z), HEAT_H)
    face = HEAT_C[0] - HEAT_H[0] - 0.01
    for k in range(6):
        z = HEAT_C[2] - 0.09 + 0.036 * k
        obox(bm, (face - 0.006, 0.0, z), (X, Y, Z), (0.006, HEAT_H[1] - 0.025, 0.007))
    new_object("heater", bm, smooth=False)


HEAT_BEND = 0.1
_HX0 = BAT_X + 0.02
HEAT_PATH = [(_HX0 + HEAT_BEND * math.sin(math.pi / 2 * k / 20), 0.15, 0.28 + HEAT_BEND * (1 - math.cos(math.pi / 2 * k / 20))) for k in range(21)]
HEAT_PATH += [(_HX0 + HEAT_BEND, 0.15, 0.38 + (HEAT_C[2] - HEAT_H[2] - 0.022 - 0.38) * k / 6) for k in range(1, 7)]
DRIVE_KEYS = [(-BAT_X - 0.02, -0.12, 0.28), (-1.04, -0.12, 0.31), (-1.12, -0.12, 0.42), (INV_C[0] + INV_H[0] + 0.03, -0.12, INV_C[2])]


def spline(points, per=16):
    pts = [points[0]] + list(points) + [points[-1]]
    out = []
    for k in range(1, len(pts) - 2):
        p0, p1, p2, p3 = pts[k - 1], pts[k], pts[k + 1], pts[k + 2]
        for j in range(per):
            t = j / per
            out.append(tuple(
                0.5 * (2 * p1[i] + (-p0[i] + p2[i]) * t + (2 * p0[i] - 5 * p1[i] + 4 * p2[i] - p3[i]) * t * t
                       + (-p0[i] + 3 * p1[i] - 3 * p2[i] + p3[i]) * t ** 3)
                for i in range(3)
            ))
    out.append(tuple(points[-1]))
    return out


def build_cables():
    r = 0.022
    for name, pts, rad in (("heat", HEAT_PATH, r), ("drive", spline(DRIVE_KEYS), r), ("heatsurge", HEAT_PATH[6:-1], r + 0.028)):
        bm = bmesh.new()
        tube(bm, pts, rad, sides=16, caps=name != "heatsurge")
        new_object(name, bm)


# ---------- cabin ----------

SEAT_Z = MOD_Z1 + 0.015
TILT = math.radians(15)


def seat(bm, x_front, y, half_w, depth, back_h, head=True):
    up = (-math.sin(TILT), 0.0, math.cos(TILT))
    back = (-math.cos(TILT), 0.0, -math.sin(TILT))
    slab(bm, (x_front - depth / 2, y, SEAT_Z), X, Y, Z, depth / 2, half_w, 0.12)  # cushion
    bx = x_front - depth - 0.02
    origin = (bx + up[0] * back_h / 2, y, SEAT_Z + 0.04 + up[2] * back_h / 2)
    slab(bm, origin, up, Y, back, back_h / 2, half_w, 0.1)  # backrest
    if head:
        top = add(origin, mul(up, back_h / 2 + 0.04 + 0.1))
        slab(bm, add(top, mul(back, -0.01)), up, Y, back, 0.1, 0.13, 0.085)


def build_cabin():
    bm = bmesh.new()
    slab(bm, (0.75, 0.0, 0.76), X, Y, Z, 0.17, 0.72, 0.16)  # dashboard
    up = unit((-0.25, 0.0, 1.0))
    obox(bm, (0.68, 0.0, 1.015), (unit(cross(Y, up)), Y, up), (0.008, 0.16, 0.075))  # screen
    seat(bm, 0.5, 0.37, 0.24, 0.42, 0.62)
    seat(bm, 0.5, -0.37, 0.24, 0.42, 0.62)
    seat(bm, -0.42, 0.0, 0.62, 0.4, 0.56, head=False)
    up_r = (-math.sin(TILT), 0.0, math.cos(TILT))
    back_r = (-math.cos(TILT), 0.0, -math.sin(TILT))
    bx = -0.42 - 0.4 - 0.02
    top_r = (bx + up_r[0] * (0.56 + 0.04 + 0.1), 0.0, SEAT_Z + 0.04 + up_r[2] * (0.56 + 0.04 + 0.1))
    for y in (-0.42, 0.0, 0.42):
        slab(bm, (top_r[0] - back_r[0] * 0.01, y, top_r[2]), up_r, Y, back_r, 0.09, 0.12, 0.08)
    new_object("interior", bm)
    bm = bmesh.new()
    # steering wheel in front of the left (+y) seat, its column into the dash
    c = (0.45, 0.37, 0.9)
    e1 = (0.0, 1.0, 0.0)
    e2 = unit((0.5, 0.0, 0.866))
    rim = [add(c, add(mul(e1, 0.18 * math.cos(t)), mul(e2, 0.18 * math.sin(t)))) for t in (2 * math.pi * k / 72 for k in range(72))]
    tube(bm, rim, 0.018, sides=16, closed=True, normals=[unit(sub(p, c)) for p in rim])
    axis = unit(cross(e1, e2))
    if axis[0] < 0:
        axis = mul(axis, -1)
    start = add(c, mul(axis, 0.03))
    tube(bm, [start, add(start, mul(axis, 0.09))], 0.024, sides=16)
    for a in (math.radians(200), math.radians(340), math.radians(270)):  # three spokes
        d = add(mul(e1, math.cos(a)), mul(e2, math.sin(a)))
        tube(bm, [add(c, mul(d, 0.035)), add(c, mul(d, 0.155))], 0.012, sides=16)
    new_object("steering", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "ev-hatchback.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_body()
    build_glass()
    build_lights()
    build_trim()
    build_mirrors()
    build_cabin()
    build_battery()
    build_frost()
    build_motor()
    build_heater()
    build_cables()
    build_wheels()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[ev_hatchback] wrote {out}")


main()
