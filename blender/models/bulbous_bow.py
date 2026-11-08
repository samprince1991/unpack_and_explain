"""Procedural bow of a ship with a bulbous bow (our own model, license "own").

Axis: X forward (the bow points to +X), Z up, the still waterline at Z = 0. The hull is
the front part of a ship cut square at the back; the stem rakes forward with height.
Below the waterline a bulb on a short neck sits just ahead of the stem (a small gap, no
crossing, see blender/qc.py). Three thin tubes show the water on both sides:

- waterline: the calm water line hugging the hull (always there)
- bowwave:   the wave the bow piles up (crest at the stem)
- bulbwave:  the bulb's own wave, out of step with it (trough at the stem)

The two waves are the explode `away` parts in video/src/brand/models.ts, so "explode"
makes them sink away (they cancel) and "collapse" brings them back. Objects are named
after the catalog parts.

Every curve is segmented finely enough that no edge bends 28-80 degrees; the edges that
should read as lines (deck edge, square back, cap rims, the stem) are 90+ degrees.

  blender -b --factory-startup --python blender/models/bulbous_bow.py -- <out.glb>
"""

import math
import os
import sys

import bmesh
import bpy

TUBE_SIDES = 16

# hull (before the rake shear)
AFT = -2.6  # square cut at the back
ENTRY = 2.0  # length over which the hull narrows to the stem
BEAM = 0.5  # half beam
KEEL = -0.55
DECK = 0.4  # deck height amidships
SHEER = 0.16  # the deck rises this much toward the bow
FLARE = 0.35  # the topsides lean out this much (fraction of beam) at the bow
BILGE = 0.15
RAKE = 0.3  # x shift per unit of height above the keel
SECTIONS = 96

# bulb
BULB_Z = -0.3
NECK_R, BULB_R = 0.07, 0.17
NECK_LEN, BULB_LEN = 0.18, 0.3

# water lines
WAVE_R = 0.012
WATER_GAP = 0.03
BOW_OFF, BULB_OFF = 0.14, 0.3
WAVE_A = 0.24


def args():
    return sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []


def new_object(name, bm):
    mesh = bpy.data.meshes.new(name)
    bm.to_mesh(mesh)
    bm.free()
    obj = bpy.data.objects.new(name, mesh)
    bpy.context.scene.collection.objects.link(obj)
    for poly in mesh.polygons:
        poly.use_smooth = True
    return obj


def half_beam(xu):
    """Half beam at unsheared x: full aft, easing to 0 at the stem (x = 0)."""
    f = min(max(-xu / ENTRY, 0.0), 1.0)
    return BEAM * math.sin(f * math.pi / 2)


def rake_weight(xu):
    """The rake fades out toward the back, so the square back cut stays 90 degrees."""
    f = min(max((xu - AFT) / (-ENTRY - AFT), 0.0), 1.0)
    return (1 - math.cos(math.pi * f)) / 2


def shear(x, z):
    return x + RAKE * (z - KEEL) * rake_weight(x)


def stem_x(z):
    return shear(0.0, z)


def bow_weight(xu):
    """0 aft of the entry, easing to 1 at the stem."""
    f = min(max(1 + xu / ENTRY, 0.0), 1.0)
    return f * f


def deck_z(xu):
    return DECK + SHEER * bow_weight(xu)


def half_profile(xu):
    """(y, z) from the keel centre round the bilge up the side to the deck centre."""
    b = half_beam(xu)
    r = min(BILGE, 0.6 * b)
    top = deck_z(xu)
    flare = FLARE * bow_weight(xu)
    pts = [(0.0, KEEL), (b - r, KEEL)]
    for k in range(1, 9):  # bilge, 11.25 degrees a step
        t = (math.pi / 2) * k / 8
        pts.append((b - r + r * math.sin(t), KEEL + r - r * math.cos(t)))
    z0 = KEEL + r
    for k in range(1, 11):  # topsides, leaning out above the waterline
        z = z0 + (top - z0) * k / 10
        pts.append((b * (1 + flare * (max(z, 0.0) / top) ** 2), z))
    pts.append((0.0, top))
    return pts


def build_hull():
    bm = bmesh.new()
    rings = []
    for s in range(SECTIONS + 1):
        xu = AFT + (0.0 - AFT) * s / SECTIONS
        half = half_profile(xu)
        # closed ring: starboard (+y) keel -> deck, then port (-y) deck -> keel, centres once
        loop = half + [(-y, z) for y, z in reversed(half[1:-1])]
        rings.append([bm.verts.new((shear(xu, z), y, z)) for y, z in loop])
    n = len(rings[0])
    for a, b in zip(rings, rings[1:]):
        for i in range(n):
            j = (i + 1) % n
            bm.faces.new((a[i], a[j], b[j], b[i]))
    bm.faces.new(rings[0][::-1])
    # the last ring has zero beam: weld it into the stem line
    bmesh.ops.remove_doubles(bm, verts=rings[-1], dist=1e-5)
    bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-6)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    new_object("hull", bm)


def revolve_x(bm, profile, center, seg=48):
    """Revolve (x, r) around a line parallel to X through center (y, z). Returns rings."""
    cy, cz = center
    rings = []
    for s in range(seg):
        a = 2 * math.pi * s / seg
        rings.append([bm.verts.new((x, cy + r * math.cos(a), cz + r * math.sin(a))) for x, r in profile])
    n = len(profile)
    for s in range(seg):
        ra, rb = rings[s], rings[(s + 1) % seg]
        for i in range(n - 1):
            bm.faces.new((ra[i], ra[i + 1], rb[i + 1], rb[i]))
    return rings


def build_bulb():
    # just ahead of the stem at the top of the neck (the stem rakes forward with height)
    x0 = stem_x(BULB_Z + NECK_R) + 0.025
    prof = []
    steps = 12
    for k in range(steps + 1):  # neck swelling into the bulb (cosine ease)
        f = k / steps
        prof.append((x0 + NECK_LEN * f, NECK_R + (BULB_R - NECK_R) * (1 - math.cos(math.pi * f)) / 2))
    xc = x0 + NECK_LEN
    for k in range(1, 13):  # rounded nose, 7 degrees a step, flat tiny cap at the tip
        t = math.radians(7 * k)
        prof.append((xc + BULB_LEN * math.sin(t), BULB_R * math.cos(t)))
    bm = bmesh.new()
    rings = revolve_x(bm, prof, (0.0, BULB_Z))
    bm.faces.new([ring[0] for ring in rings][::-1])
    bm.faces.new([ring[-1] for ring in rings])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    new_object("bulb", bm)


def tube_along(bm, points, radius, sides=TUBE_SIDES):
    """Round tube through (x, y, z) points, flat-capped (the cap rim is a 90-degree edge)."""
    rings = []
    for k, p in enumerate(points):
        q = points[min(k + 1, len(points) - 1)]
        o = points[max(k - 1, 0)]
        t = [q[i] - o[i] for i in range(3)]
        n = math.sqrt(sum(c * c for c in t)) or 1.0
        t = [c / n for c in t]
        up = (0.0, 0.0, 1.0) if abs(t[2]) < 0.9 else (0.0, 1.0, 0.0)
        u = [t[1] * up[2] - t[2] * up[1], t[2] * up[0] - t[0] * up[2], t[0] * up[1] - t[1] * up[0]]
        un = math.sqrt(sum(c * c for c in u)) or 1.0
        u = [c / un for c in u]
        v = [t[1] * u[2] - t[2] * u[1], t[2] * u[0] - t[0] * u[2], t[0] * u[1] - t[1] * u[0]]
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


STEM_W = stem_x(0.0)  # where the stem cuts the waterline


def beam_at_waterline(x):
    """Hull half beam at the waterline for a (sheared) x: solve shear(xu, 0) = x."""
    lo, hi = AFT - 1.0, 1.0
    for _ in range(50):
        mid = (lo + hi) / 2
        if shear(mid, 0.0) < x:
            lo = mid
        else:
            hi = mid
    return half_beam(lo)


def bump(x, at, width):
    return math.exp(-(((x - at) / width) ** 2))


def bow_wave(x):
    # crest at the stem, trough behind it
    return WAVE_A * (bump(x, STEM_W, 0.3) - 0.55 * bump(x, STEM_W - 0.75, 0.35))


def bulb_wave(x):
    # out of step: trough where the bow wave peaks, crest where it dips
    return -0.85 * WAVE_A * (bump(x, STEM_W, 0.3) - 0.55 * bump(x, STEM_W - 0.75, 0.35))


def wave_line(fn, offset, x0=-1.3, x1=0.8, steps=140):
    side = []
    for k in range(steps + 1):
        x = x0 + (x1 - x0) * k / steps
        side.append((x, beam_at_waterline(x) + offset, fn(x)))
    return side


def build_waves():
    for name, fn, off in (("bowwave", bow_wave, BOW_OFF), ("bulbwave", bulb_wave, BULB_OFF)):
        bm = bmesh.new()
        # the camera side only (yaw 0 looks at -y)
        tube_along(bm, [(x, -y, z) for x, y, z in wave_line(fn, off)], WAVE_R)
        new_object(name, bm)

    # calm water hugging the hull, one line from the back on one side, round the stem
    # (a half ellipse a little ahead of it) and back down the other side
    xj = STEM_W - 0.06
    yj = beam_at_waterline(xj) + WATER_GAP
    ahead = 0.1
    ripple = lambda x: 0.012 * math.sin(6 * x)  # noqa: E731
    side = []
    steps = 120
    x0 = AFT + 0.1
    for k in range(steps):
        x = x0 + (xj - x0) * k / steps
        side.append((x, beam_at_waterline(x) + WATER_GAP))
    arc = []
    for k in range(25):
        phi = math.pi * k / 24
        x = xj + ahead * math.sin(phi)
        arc.append((x, yj * math.cos(phi)))
    outline = side + arc + [(x, -y) for x, y in reversed(side)]
    bm = bmesh.new()
    tube_along(bm, [(x, y, ripple(x)) for x, y in outline], WAVE_R)
    new_object("waterline", bm)


def main():
    out = args()[0] if args() else os.path.join(os.getcwd(), "bulbous-bow.glb")
    bpy.ops.wm.read_factory_settings(use_empty=True)
    build_hull()
    build_bulb()
    build_waves()
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=out, export_format="GLB", export_apply=True)
    print(f"[bulbous_bow] wrote {out}")


main()
