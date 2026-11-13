"""Builds one clip's scene from a job (video/src/templates/blenderJob.ts): imports the
catalog model, groups it into parts, applies look A, a camera rig, and the beats as
keyframes. Returns the 2D label tracks (projected part positions)."""

import math
import os
from contextlib import contextmanager

import bpy
from bpy_extras.object_utils import world_to_camera_view
from mathutils import Matrix, Vector

import look
import qc

GLIDE = 18  # frames for camera moves and explode / collapse
AMBER_FADE = 6  # frames for the amber hand-off between parts
STAGGER = 4  # frames between parts in a reveal
ENTER = 12  # frames for one part to appear
FLOW_FRAMES = 24
ORBIT_DEG_PER_S = 4  # slow constant drift so nothing sits still
SPIN_TURNS_PER_S = 0.35
SPIN_DOWN = 36  # frames for a spinning part to coast to a stop
# Close / wide rhythm (docs/blender.md): a focus beat
# frames the part so it fills CLOSE_FILL of the frame, centered on it, between CLOSE_MIN and
# CLOSE_MAX times the clip's wide framing. `wide` (and explode / collapse) pull back.
CLOSE_FILL = 0.6
CLOSE_MIN = 1.6
CLOSE_MAX = 3.5
PUSH = 1.1  # slow push-in over every clip (lens), so the camera never sits still
FSTOP = 5.6  # at zoom 1; scaled with zoom so close-ups keep the same light depth of field
SHIFT_FRAMES = 14  # a `shift` beat: a part slides, flex parts (springs) stretch with it
TILT_FRAMES = 14  # a `tilt` beat: a part turns to `by` degrees
AWAY = 0.6  # how far "away" parts (e.g. a casing) drop while they shrink out of view
LENS = 50
SENSOR = 36
COLUMN_FRACTION = 780 / 1080  # keep the model inside the 540-centered column
HIDDEN = 0.001
SEA_FLAT = 0.02  # how flat the wave lines get as they settle into the water
SEA_SETTLE = 30  # frames for the water to flatten when the waves cancel


@contextmanager
def interpolation(kind):
    edit = bpy.context.preferences.edit
    old = edit.keyframe_new_interpolation_type
    edit.keyframe_new_interpolation_type = kind
    try:
        yield
    finally:
        edit.keyframe_new_interpolation_type = old


def _link(obj, coll=None):
    (coll or bpy.context.scene.collection).objects.link(obj)
    return obj


def _empty(name, parent=None, location=(0, 0, 0)):
    obj = _link(bpy.data.objects.new(name, None))
    obj.location = location
    obj.parent = parent
    return obj


# ---------- model ----------

def _selftest_model():
    bpy.ops.mesh.primitive_cube_add(size=1.4)
    bpy.context.active_object.name = "body"


def import_model(model, repo_root):
    if model.get("selftest"):
        _selftest_model()
    else:
        blend = os.path.join(repo_root, "blender", "models", f"{model['id']}.blend")
        if os.path.exists(blend):
            with bpy.data.libraries.load(blend, link=False) as (src, dst):
                dst.objects = src.objects
            for obj in dst.objects:
                if obj is not None:
                    _link(obj)
        else:
            glb = os.path.join(repo_root, "video", "public", model["file"])
            if not os.path.exists(glb):
                raise SystemExit(f"Model file missing: {glb}")
            bpy.ops.import_scene.gltf(filepath=glb)

    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    for obj in meshes:
        world = obj.matrix_world.copy()
        obj.parent = None
        obj.matrix_world = world
    for obj in [o for o in bpy.context.scene.objects if o.type != "MESH"]:
        bpy.data.objects.remove(obj)

    # Center on the origin, longest side = 2 units.
    corners = [o.matrix_world @ Vector(c) for o in meshes for c in o.bound_box]
    lo = Vector((min(c[i] for c in corners) for i in range(3)))
    hi = Vector((max(c[i] for c in corners) for i in range(3)))
    center = (lo + hi) / 2
    scale = 2 / max(max(hi - lo), 1e-6)
    normalize = Matrix.Scale(scale, 4) @ Matrix.Translation(-center)
    for obj in meshes:
        obj.matrix_world = normalize @ obj.matrix_world
    radius = max((normalize @ c).length for c in corners)
    return meshes, radius


def _part_lookup(model):
    lookup = {}
    for part, names in model["parts"].items():
        for name in names:
            lookup[name] = part
    return lookup


def group_parts(meshes, model, tokens):
    """part -> {pivot, coll, mat, base}. Unlisted meshes go to "rest" (soft lines)."""
    lookup = _part_lookup(model)
    members = {}
    for obj in meshes:
        part = lookup.get(obj.name) or lookup.get(obj.name.split(".")[0]) or "rest"
        members.setdefault(part, []).append(obj)
    missing = [p for p in model["parts"] if p not in members]
    if missing:
        names = ", ".join(sorted(o.name for o in meshes))
        raise SystemExit(f"Model {model['id']} has no objects for parts {missing}. Objects: {names}")

    parts = {}
    for part, objs in members.items():
        coll = bpy.data.collections.new(f"part-{part}")
        bpy.context.scene.collection.children.link(coll)
        corners = [o.matrix_world @ Vector(c) for o in objs for c in o.bound_box]
        center = sum(corners, Vector()) / len(corners)
        pivot = _empty(f"pivot-{part}", location=center)
        bpy.context.view_layer.update()  # pivot.matrix_world is stale until updated
        mat = look.part_material(part, tokens)
        for obj in objs:
            for c in list(obj.users_collection):
                c.objects.unlink(obj)
            coll.objects.link(obj)
            world = obj.matrix_world.copy()
            obj.parent = pivot
            obj.matrix_parent_inverse = pivot.matrix_world.inverted()
            obj.matrix_world = world
            obj.data.materials.clear()
            obj.data.materials.append(mat)
        lo = Vector((min(c[i] for c in corners) for i in range(3)))
        hi = Vector((max(c[i] for c in corners) for i in range(3)))
        size = (hi - lo).length / 2  # half the box diagonal: sizes the close-up
        parts[part] = {"pivot": pivot, "coll": coll, "mat": mat, "base": center.copy(), "size": size, "extent": hi - lo, "objects": objs}
    attach_parts(parts, model)
    return parts


def attach_parts(parts, model):
    """Catalog `attach` (child part -> parent part): the child's pivot rides on the parent's,
    so it follows the parent's shifts and tilts (a swashplate's spinning upper plate on its
    lower plate, blades on a hub). Every pivot turns in ZYX order: a spin about its own
    (possibly tilted) axis first, then the tilt."""
    for info in parts.values():
        info["pivot"].rotation_mode = "ZYX"
        info["parent"] = None
    for child, parent in model.get("attach", {}).items():
        if child not in parts or parent not in parts:
            raise SystemExit(f"Model {model['id']}: attach {child} -> {parent} names a missing part")
        pivot = parts[child]["pivot"]
        pivot.parent = parts[parent]["pivot"]
        pivot.matrix_parent_inverse = Matrix.Identity(4)
        pivot.location = parts[child]["base"] - parts[parent]["base"]
        parts[child]["parent"] = parent
    bpy.context.view_layer.update()


# ---------- camera ----------

def _fit_distance(radius, width, height):
    """Distance that fits the model inside the column and the clip height."""
    half_h = math.atan(SENSOR / 2 / LENS)
    half_w_eff = math.atan(math.tan(half_h) * COLUMN_FRACTION)
    half_v = math.atan(math.tan(half_h) * height / width) * 0.92
    return radius / math.sin(min(half_w_eff, half_v))


class Rig:
    """focus (target location) > drift (slow orbit) > rig (yaw, pitch) > camera (distance)."""

    def __init__(self, scene, radius, width, height, frames, fps, drift=ORBIT_DEG_PER_S):
        self.focus = _empty("focus")
        self.drift = _empty("drift", parent=self.focus)
        self.rig = _empty("rig", parent=self.drift)
        data = bpy.data.cameras.new("cam")
        data.lens = LENS
        data.sensor_fit = "HORIZONTAL"
        data.sensor_width = SENSOR
        data.clip_start = 0.01
        data.clip_end = 1000
        self.cam = _link(bpy.data.objects.new("cam", data))
        self.cam.parent = self.rig
        self.cam.rotation_euler = (math.radians(90), 0, 0)
        scene.camera = self.cam
        with interpolation("LINEAR"):
            data.keyframe_insert("lens", frame=0)
            data.lens = LENS * (PUSH if frames > 1 else 1)
            data.keyframe_insert("lens", frame=max(frames, 1))
        self.base = _fit_distance(radius, width, height)
        self.radius = radius
        look.setup_dof(self.cam, self.focus)
        with interpolation("LINEAR"):
            self.drift.rotation_euler = (0, 0, 0)
            self.drift.keyframe_insert("rotation_euler", index=2, frame=0)
            self.drift.rotation_euler = (0, 0, math.radians(drift * max(frames, 1) / fps))
            self.drift.keyframe_insert("rotation_euler", index=2, frame=max(frames, 1))

    def set(self, state, frame):
        self.rig.rotation_euler = (math.radians(-state["pitch"]), 0, math.radians(state["yaw"]))
        self.cam.location = (0, -self.base / state["zoom"], 0)
        # The camera looks along the rig's +Y, so turning around Y rolls it around its view
        # axis. Negative: a positive roll tilts the picture clockwise (the model's +X goes down).
        self.cam.rotation_euler = (math.radians(90), math.radians(-state.get("roll", 0)), 0)
        self.cam.keyframe_insert("rotation_euler", frame=frame)
        self.focus.location = state["target"]
        self.cam.data.dof.aperture_fstop = FSTOP * max(state["zoom"], 1.0)
        self.cam.data.dof.keyframe_insert("aperture_fstop", frame=frame)
        self.rig.keyframe_insert("rotation_euler", frame=frame)
        self.cam.keyframe_insert("location", frame=frame)
        self.focus.keyframe_insert("location", frame=frame)


# ---------- beats ----------

class Clip:
    def __init__(self, scene, job, clip, tokens, parts, radius):
        self.scene = scene
        self.model = job["model"]
        self.clip = clip
        self.tokens = tokens
        self.parts = parts
        self.frames = clip["frames"]
        self.rig = Rig(
            scene,
            radius,
            clip["width"],
            clip["height"],
            self.frames,
            job["fps"],
            clip["start"].get("drift", ORBIT_DEG_PER_S),
        )
        self.sea = None  # set by the sea world (see build_clip)
        self.radius = radius
        self.styles = look.setup_freestyle(scene, {p: v["coll"] for p, v in parts.items()}, tokens)
        self.exploded = False
        self.amber = None
        self.labels = []
        self.cuts = []  # frames where the camera or the key part changes (labels end there)
        self.spins = []  # {"part", "start", "end"}; keyed in finish() once ends are known
        self.shifts = {}  # part -> offset from `shift` beats, on top of the explode offset
        self.tilts = {}  # part -> rotation (radians, xyz) from `tilt` beats
        start = clip["start"]
        self.cam = {
            "yaw": start["yaw"],
            "pitch": start["pitch"],
            "zoom": start["zoom"],
            "roll": start.get("roll", 0),
            "target": parts[start["aim"]]["base"].copy() if start.get("aim") else Vector(),
        }
        self.start_zoom = start["zoom"]

    # explode offsets
    def _offset(self, part, exploded):
        return self._explode_offset(part, exploded) + self.shifts.get(part, Vector())

    def _members(self, name):
        """A catalog `groups` name stands for its parts; a part for itself."""
        return list(self.model.get("groups", {}).get(name, [name]))

    def _loc(self, part, exploded=None):
        """The pivot's keyed location: world space, or relative to the parent's rest place for
        an attached part (the parent's own moves come through the hierarchy)."""
        exploded = self.exploded if exploded is None else exploded
        loc = self.parts[part]["base"] + self._offset(part, exploded)
        parent = self.parts[part].get("parent")
        return loc - self.parts[parent]["base"] if parent else loc

    def _explode_offset(self, part, exploded):
        order = self.model["explode"]["order"]
        if exploded and part in self.model["explode"].get("away", []):
            if self.sea and self.sea.get("flatAway", True):  # settles into the water instead of dropping through the picture
                return Vector((0, 0, self.sea["level"] - self.parts[part]["base"].z))
            return Vector((0, 0, -AWAY))  # drops below, out of the way of the camera
        if not exploded or part not in order:
            return Vector()
        axis = Vector({"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[self.model["explode"]["axis"]])
        return axis * (order.index(part) - (len(order) - 1) / 2) * self.model["explode"]["spacing"]

    def wide_zoom(self, exploded=None):
        """The clip's whole-model framing (fits the spread-out parts when exploded)."""
        exploded = self.exploded if exploded is None else exploded
        return (self.explode_zoom() if exploded else 1.0) * self.start_zoom

    def close_zoom(self, part):
        """Zoom where the part fills CLOSE_FILL of the frame, within CLOSE_MIN-CLOSE_MAX x wide."""
        wide = self.wide_zoom()
        fit = CLOSE_FILL * self.radius / max(self._size(part), 1e-6)
        return min(max(fit, CLOSE_MIN * wide), CLOSE_MAX * wide)

    def close_up(self, part, shot):
        return {
            "target": self.center(part),
            "zoom": shot.get("zoom", self.close_zoom(part)),
            "yaw": shot.get("yaw"),
            "pitch": shot.get("pitch"),
            "roll": shot.get("roll"),
        }

    def explode_zoom(self):
        """Zoom that keeps the spread-out parts inside the column."""
        e = self.model["explode"]
        spread = e["spacing"] * (len(e["order"]) - 1)
        return 2 / (2 + spread)

    def center(self, part, exploded=None):
        """World-space center (shifts of the parts it's attached to included; tilts ignored).
        A group's center is the mean of its parts'."""
        exploded = self.exploded if exploded is None else exploded
        members = self._members(part)
        if members != [part]:
            return sum((self.center(m, exploded) for m in members), Vector()) / len(members)
        at = self.parts[part]["base"] + self._offset(part, exploded)
        parent = self.parts[part].get("parent")
        while parent:
            at += self._offset(parent, exploded)
            parent = self.parts[parent].get("parent")
        return at

    def _size(self, part):
        members = self._members(part)
        if members == [part]:
            return self.parts[part]["size"]
        mid = self.center(part)
        return max((self.center(m) - mid).length + self.parts[m]["size"] for m in members)

    def set_explode(self, exploded, frame, glide=True):
        away = self.model["explode"].get("away", [])
        for part, info in self.parts.items():
            pivot = info["pivot"]
            if part in away:
                # Away parts (a casing) drop and shrink out of view, so the inside reads.
                gone = HIDDEN if exploded else 1.0
                if glide:
                    pivot.keyframe_insert("scale", frame=frame)
                if self.sea and self.sea.get("flatAway", True):
                    pivot.scale = (1, 1, SEA_FLAT if exploded else 1)
                else:
                    pivot.scale = (gone, gone, gone)
                pivot.keyframe_insert("scale", frame=frame + (GLIDE if glide else 0))
                # Shrunk to HIDDEN, Freestyle still draws a speck: hide it outright while away
                # (hidden once it has shrunk, shown again as soon as it starts growing back).
                for obj in info["objects"]:
                    with interpolation("CONSTANT"):
                        if exploded and glide:
                            # Without this key the part is hidden from frame 0.
                            obj.hide_render = False
                            obj.keyframe_insert("hide_render", frame=frame)
                        obj.hide_render = exploded
                        obj.keyframe_insert("hide_render", frame=frame + (GLIDE if exploded and glide else 0))
            if glide:
                pivot.location = self._loc(part)
                pivot.keyframe_insert("location", frame=frame)
            pivot.location = self._loc(part, exploded)
            pivot.keyframe_insert("location", frame=frame + (GLIDE if glide else 0))
        self.exploded = exploded

    # amber hand-off
    def _paint(self, part, on, frame):
        for member in self._members(part):
            self._paint_part(member, on, frame)

    def _paint_part(self, part, on, frame):
        style = self.styles[part]
        role = "amber" if on else ("soft" if part == "rest" else "stroke")
        style.color = self._srgb(role)
        style.thickness = self.tokens["lines"][role]
        style.keyframe_insert("color", frame=frame)
        style.keyframe_insert("thickness", frame=frame)
        socket = look.emission_socket(self.parts[part]["mat"])
        socket.default_value = look.EMISSION_ON if on else 0.0
        socket.keyframe_insert("default_value", frame=frame)

    def _srgb(self, role):
        from common import color_srgb

        return color_srgb(self.tokens["colors"][role])

    def set_amber(self, part, frame, fade=True):
        """Hands the amber from the current key to `part` (a part or a group: a part in both
        stays amber)."""
        if part == self.amber:
            return
        old = set(self._members(self.amber)) if self.amber else set()
        new = set(self._members(part)) if part else set()
        for p in old ^ new:
            if fade:
                self._paint_part(p, p in old, frame)
            self._paint_part(p, p in new, frame + (AMBER_FADE if fade else 0))
        self.amber = part

    def move_camera(self, change, frame, glide=GLIDE):
        self.rig.set(self.cam, frame)
        self.cam.update({k: v for k, v in change.items() if v is not None})
        self.rig.set(self.cam, frame + glide)

    def start(self):
        start = self.clip["start"]
        for part in self.parts:
            self._paint(part, False, 0)
        # appearOnly parts stay hidden in every clip until an `appear` beat.
        for part in self.model.get("appearOnly", []):
            pivot = self.parts[part]["pivot"]
            pivot.scale = (HIDDEN, HIDDEN, HIDDEN)
            pivot.keyframe_insert("scale", frame=0)
            for obj in self.parts[part]["objects"]:
                with interpolation("CONSTANT"):
                    obj.hide_render = True
                    obj.keyframe_insert("hide_render", frame=0)
        if start.get("exploded"):
            self.set_explode(True, 0, glide=False)
            self.cam["zoom"] *= self.explode_zoom()
        key = start.get("keyPart")
        if key is None and self.clip["id"] in ("cover", "opener"):
            key = self.model["keyPart"]
        if key:
            self.set_amber(key, 0, fade=False)
        self.rig.set(self.cam, 0)

    def reveal(self, frame):
        order = [p for p in self.model["explode"]["order"] if p in self.parts]
        order += [p for p in self.parts if p not in order]
        for i, part in enumerate(order):
            pivot = self.parts[part]["pivot"]
            at = frame + i * STAGGER
            for f, s in ((0, HIDDEN), (at, HIDDEN), (at + ENTER, 1.0)):
                if f == 0 and at == 0:
                    continue
                pivot.scale = (s, s, s)
                pivot.keyframe_insert("scale", frame=f)
            for obj in self.parts[part]["objects"]:
                with interpolation("CONSTANT"):
                    obj.hide_render = True
                    obj.keyframe_insert("hide_render", frame=0)
                    obj.hide_render = False
                    obj.keyframe_insert("hide_render", frame=at)

    def appear(self, part, frame):
        pivot = self.parts[part]["pivot"]
        pivot.scale = (HIDDEN, HIDDEN, HIDDEN)
        pivot.keyframe_insert("scale", frame=frame)
        pivot.scale = (1, 1, 1)
        pivot.keyframe_insert("scale", frame=frame + ENTER)
        for obj in self.parts[part]["objects"]:
            with interpolation("CONSTANT"):
                obj.hide_render = False
                obj.keyframe_insert("hide_render", frame=frame)

    def _slide(self, part, offset, frame, frames=SHIFT_FRAMES):
        pivot = self.parts[part]["pivot"]
        pivot.location = self._loc(part)
        pivot.keyframe_insert("location", frame=frame)
        self.shifts[part] = offset
        pivot.location = self._loc(part)
        pivot.keyframe_insert("location", frame=frame + frames)  # frames 0 overwrites: instant

    def shift(self, part, by, frame, frames=SHIFT_FRAMES):
        """Slides a part to `by` (offset from its rest place, 0 = back home). The model's flex
        parts keep one end fixed and stretch so the other end stays on the moving part. A
        catalog `groups` name moves all its parts together (a whole car hopping)."""
        by = Vector(by)
        group = self.model.get("groups", {}).get(part)
        if group:
            for member in group:
                self._slide(member, by.copy(), frame, frames)
            return
        self._slide(part, by, frame, frames)
        flex = self.model.get("flex")
        if not flex:
            return
        axis = "xyz".index(flex["axis"])
        for name, anchor in flex["parts"].items():
            info = self.parts[name]
            pivot = info["pivot"]
            length = info["extent"][axis]
            pivot.keyframe_insert("scale", index=axis, frame=frame)
            scale = list(pivot.scale)
            sign = 1 if anchor == "min" else -1
            scale[axis] = (length + sign * by[axis]) / length
            pivot.scale = scale
            pivot.keyframe_insert("scale", index=axis, frame=frame + frames)
            half = Vector()
            half[axis] = by[axis] / 2  # the fixed end stays put, so the middle moves half as far
            self._slide(name, half, frame, frames)

    def tilt(self, part, by, frame, frames=TILT_FRAMES):
        """Turns a part (each part of a group, about its own pivot) to `by` degrees about x, y, z
        from its rest pose ([0, 0, 0] turns it back). Attached parts turn with it. Never on a
        part's spin axis while it spins (the spin keys that channel)."""
        new = Vector([math.radians(d) for d in by])
        for member in self._members(part):
            pivot = self.parts[member]["pivot"]
            old = self.tilts.get(member, Vector())
            for i in range(3):
                if old[i] == 0 and new[i] == 0:
                    continue
                rot = list(pivot.rotation_euler)
                rot[i] = old[i]
                pivot.rotation_euler = rot
                pivot.keyframe_insert("rotation_euler", index=i, frame=frame)
                rot[i] = new[i]
                pivot.rotation_euler = rot
                pivot.keyframe_insert("rotation_euler", index=i, frame=frame + frames)
            self.tilts[member] = new.copy()

    def spin_axis(self, part):
        """Catalog `spinAxes` overrides the model's `spinAxis` per part (a tail rotor)."""
        return "xyz".index(self.model.get("spinAxes", {}).get(part, self.model["spinAxis"]))

    def vanish(self, part, frame):
        """An appearOnly part scales back out and hides (air jets switching off)."""
        pivot = self.parts[part]["pivot"]
        pivot.keyframe_insert("scale", frame=frame)
        pivot.scale = (HIDDEN, HIDDEN, HIDDEN)
        pivot.keyframe_insert("scale", frame=frame + ENTER)
        for obj in self.parts[part]["objects"]:
            with interpolation("CONSTANT"):
                obj.hide_render = True
                obj.keyframe_insert("hide_render", frame=frame + ENTER)

    def spin(self, part, frame):
        self.spins.append({"part": part, "start": frame, "end": None})

    def stop(self, frame):
        self.set_amber(None, frame)
        for spin in self.spins:
            if spin["end"] is None and spin["start"] <= frame:
                spin["end"] = frame

    def finish(self):
        """Spin keys: constant speed from start, then a coast-down if stopped."""
        rate = 2 * math.pi * SPIN_TURNS_PER_S / self.scene.render.fps  # radians per frame
        for spin in self.spins:
            pivot = self.parts[spin["part"]]["pivot"]
            axis = self.spin_axis(spin["part"])
            if self.tilts.get(spin["part"], Vector())[axis]:
                raise SystemExit(f"tilt and spin both turn {spin['part']} about {'xyz'[axis]}")
            start, end = spin["start"], spin["end"] or self.frames
            base = pivot.rotation_euler[axis]
            rot = list(pivot.rotation_euler)
            with interpolation("LINEAR"):
                pivot.keyframe_insert("rotation_euler", index=axis, frame=start)
            rot[axis] = base + rate * (end - start)
            pivot.rotation_euler = rot
            with interpolation("BEZIER" if spin["end"] else "LINEAR"):
                pivot.keyframe_insert("rotation_euler", index=axis, frame=end)
            if spin["end"]:
                rot[axis] += rate * SPIN_DOWN / 2  # decelerating: half the distance
                pivot.rotation_euler = rot
                pivot.keyframe_insert("rotation_euler", index=axis, frame=end + SPIN_DOWN)

    def flow(self, src, dst, frame, follow=True, shot=None):
        coll = bpy.data.collections.new("flow")  # no lineset: the dot has no outline
        self.scene.collection.children.link(coll)
        bpy.ops.mesh.primitive_uv_sphere_add(radius=0.05, segments=16, ring_count=8)
        dot = bpy.context.active_object
        for c in list(dot.users_collection):
            c.objects.unlink(dot)
        coll.objects.link(dot)
        mat = look.part_material("flow", self.tokens)
        look.emission_socket(mat).default_value = 4.0
        dot.data.materials.append(mat)
        end = frame + FLOW_FRAMES
        for f, loc, s in (
            (0, self.center(src), 0.0),
            (frame, self.center(src), 0.0),
            (frame + 4, self.center(src), 1.0),
            (end, self.center(dst), 1.0),
            (end + 6, self.center(dst), 0.0),
        ):
            dot.location = loc
            dot.scale = (s, s, s)
            dot.keyframe_insert("location", frame=f)
            dot.keyframe_insert("scale", frame=f)
        self.set_amber(None, frame)
        self.set_amber(dst, end)
        if follow:
            # The camera travels with the dot and lands on a close-up of the destination.
            self.move_camera(self.close_up(dst, shot or {}), frame, glide=FLOW_FRAMES)

    def _wide_target(self, shot):
        """Wide shots aim at the model's centre, or at the part named by `aim`."""
        return self.center(shot["aim"]) if shot.get("aim") else Vector()

    def apply(self, beat):
        f = beat["frame"]
        shot = beat.get("shot") or {}
        kind = beat["do"]
        if kind in ("focus", "explode", "collapse", "shot", "flow", "stop", "wide"):
            self.cuts.append(f)
        if kind == "reveal":
            self.reveal(f)
        elif kind == "focus":
            part = beat["part"]
            self.set_amber(part, f)
            self.move_camera(self.close_up(part, shot), f)
        elif kind in ("explode", "collapse"):
            exploding = kind == "explode"
            self.set_explode(exploding, f)
            if self.sea and exploding:
                self.sea["module"].settle(self.sea, f, f + SEA_SETTLE)
            if self.sea:
                self.sea["module"].show_edge(self.sea, exploding, f + GLIDE)
            self.move_camera(
                {
                    "target": self._wide_target(shot),
                    "zoom": shot.get("zoom", self.wide_zoom(exploding)),
                    "yaw": shot.get("yaw"),
                    "pitch": shot.get("pitch"),
                    "roll": shot.get("roll"),
                },
                f,
            )
        elif kind == "spin":
            self.spin(beat["part"], f)
        elif kind == "shift":
            self.shift(beat["part"], beat["by"], f, beat.get("frames", SHIFT_FRAMES))
        elif kind == "tilt":
            self.tilt(beat["part"], beat["by"], f, beat.get("frames", TILT_FRAMES))
        elif kind == "appear":
            self.appear(beat["part"], f)
        elif kind == "vanish":
            self.vanish(beat["part"], f)
        elif kind == "stop":
            self.stop(f)
        elif kind == "flow":
            self.flow(beat["part"], beat["to"], f, follow=beat.get("follow", True), shot=shot)
        elif kind == "wide":
            self.move_camera(
                {"target": self._wide_target(shot), "zoom": shot.get("zoom", self.wide_zoom()), "yaw": shot.get("yaw"), "pitch": shot.get("pitch"), "roll": shot.get("roll")},
                f,
            )
        elif kind == "label":
            self.labels.append({"text": beat["label"], "part": beat["part"], "from": f})
        elif kind == "shot":
            self.move_camera({"yaw": shot.get("yaw"), "pitch": shot.get("pitch"), "zoom": shot.get("zoom"), "roll": shot.get("roll")}, f)
            if shot.get("keyPart"):
                self.set_amber(shot["keyPart"], f)
            if "exploded" in shot:
                self.set_explode(bool(shot["exploded"]), f)
                if "zoom" not in shot:
                    self.move_camera({"zoom": self.wide_zoom()}, f)

    def label_tracks(self):
        """Each label shows until the next label or the next camera / key-part change
        (or the clip end), pinned to its part."""
        tracks = []
        for i, label in enumerate(self.labels):
            ends = [c for c in self.cuts if c > label["from"]]
            if i + 1 < len(self.labels):
                ends.append(self.labels[i + 1]["from"])
            until = min(ends, default=self.frames)
            tracks.append({"text": label["text"], "part": label["part"], "from": label["from"], "until": until, "points": []})
        if not tracks:
            return []
        for f in range(self.frames):
            self.scene.frame_set(f)
            for t in tracks:
                if t["from"] <= f < t["until"]:
                    pos = self.parts[t["part"]]["pivot"].matrix_world.translation
                    co = world_to_camera_view(self.scene, self.rig.cam, pos)
                    if co.z <= 0:
                        t["points"].append(None)
                        continue
                    # Screen top of the part (highest projected box corner), so the 2D label
                    # sits above the part however big a close-up makes it.
                    corners = [o.matrix_world @ Vector(c) for o in self.parts[t["part"]]["objects"] for c in o.bound_box]
                    top = min(1 - world_to_camera_view(self.scene, self.rig.cam, c).y for c in corners)
                    t["points"].append([round(co.x, 4), round(1 - co.y, 4), round(top, 4)])
                else:
                    t["points"].append(None)
        return [{"text": t["text"], "points": t["points"]} for t in tracks]


def build_clip(scene, job, clip, tokens, preview, repo_root):
    look.setup_render(scene, clip["width"], clip["height"], job["fps"], clip["frames"], preview)
    look.setup_world(scene, tokens)
    meshes, radius = import_model(job["model"], repo_root)
    if not job["model"].get("selftest") and not job["model"].get("skipQc"):
        # Geometry QC before any frame renders: broken / faceted lines, unlined contacts.
        errors, warnings = qc.check(meshes, job["model"])
        qc.report(errors, warnings, job["model"]["id"])
        if errors:
            raise SystemExit(f"[qc] {job['model']['id']} failed geometry QC: fix the model (see blender/qc.py)")
    parts = group_parts(meshes, job["model"], tokens)
    look.setup_lights(radius)
    look.setup_glow(scene)
    c = Clip(scene, job, clip, tokens, parts, radius)
    if clip["id"] == "cover":
        look.setup_cover_lights(c.rig.rig, c.rig.focus, radius)
    if job.get("world"):
        # Before c.start(): the sea reads the wave parts where they rest, and start() moves them.
        import importlib

        world = importlib.import_module(f"world.{job['world']}")
        # The catalog's `hover` (a helicopter off the ground) rides along with the clip.
        world_clip = dict(clip, hover=job["model"].get("hover", 0.0))
        c.sea = world.build_clip_world(scene, tokens, parts, c.rig.cam, world_clip, job["fps"])
    c.start()
    for beat in clip["beats"]:
        c.apply(beat)
    c.finish()
    return c.label_tracks()
