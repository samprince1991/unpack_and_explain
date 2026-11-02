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

GLIDE = 18  # frames for camera moves and explode / collapse
AMBER_FADE = 6  # frames for the amber hand-off between parts
STAGGER = 4  # frames between parts in a reveal
ENTER = 12  # frames for one part to appear
FLOW_FRAMES = 24
ORBIT_DEG_PER_S = 4  # slow constant drift so nothing sits still
SPIN_TURNS_PER_S = 0.35
SPIN_DOWN = 36  # frames for a spinning part to coast to a stop
FOCUS_ZOOM = 1.2
FOCUS_PULL = 0.5  # camera target moves this far from the model center toward the part
AWAY = 0.6  # how far "away" parts (e.g. a casing) drop while they shrink out of view
LENS = 50
SENSOR = 36
COLUMN_FRACTION = 780 / 1080  # keep the model inside the 540-centered column
HIDDEN = 0.001


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
        parts[part] = {"pivot": pivot, "coll": coll, "mat": mat, "base": center.copy(), "objects": objs}
    return parts


# ---------- camera ----------

def _fit_distance(radius, width, height):
    """Distance that fits the model inside the column and the clip height."""
    half_h = math.atan(SENSOR / 2 / LENS)
    half_w_eff = math.atan(math.tan(half_h) * COLUMN_FRACTION)
    half_v = math.atan(math.tan(half_h) * height / width) * 0.92
    return radius / math.sin(min(half_w_eff, half_v))


class Rig:
    """focus (target location) > drift (slow orbit) > rig (yaw, pitch) > camera (distance)."""

    def __init__(self, scene, radius, width, height, frames, fps):
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
        self.base = _fit_distance(radius, width, height)
        self.radius = radius
        look.setup_dof(self.cam, self.focus)
        with interpolation("LINEAR"):
            self.drift.rotation_euler = (0, 0, 0)
            self.drift.keyframe_insert("rotation_euler", index=2, frame=0)
            self.drift.rotation_euler = (0, 0, math.radians(ORBIT_DEG_PER_S * max(frames, 1) / fps))
            self.drift.keyframe_insert("rotation_euler", index=2, frame=max(frames, 1))

    def set(self, state, frame):
        self.rig.rotation_euler = (math.radians(-state["pitch"]), 0, math.radians(state["yaw"]))
        self.cam.location = (0, -self.base / state["zoom"], 0)
        self.focus.location = state["target"]
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
        self.rig = Rig(scene, radius, clip["width"], clip["height"], self.frames, job["fps"])
        self.styles = look.setup_freestyle(scene, {p: v["coll"] for p, v in parts.items()}, tokens)
        self.exploded = False
        self.amber = None
        self.labels = []
        self.cuts = []  # frames where the camera or the key part changes (labels end there)
        self.spins = []  # {"part", "start", "end"}; keyed in finish() once ends are known
        start = clip["start"]
        self.cam = {"yaw": start["yaw"], "pitch": start["pitch"], "zoom": start["zoom"], "target": Vector()}
        self.start_zoom = start["zoom"]

    # explode offsets
    def _offset(self, part, exploded):
        order = self.model["explode"]["order"]
        if exploded and part in self.model["explode"].get("away", []):
            return Vector((0, 0, -AWAY))  # drops below, out of the way of the camera
        if not exploded or part not in order:
            return Vector()
        axis = Vector({"x": (1, 0, 0), "y": (0, 1, 0), "z": (0, 0, 1)}[self.model["explode"]["axis"]])
        return axis * (order.index(part) - (len(order) - 1) / 2) * self.model["explode"]["spacing"]

    def explode_zoom(self):
        """Zoom that keeps the spread-out parts inside the column."""
        e = self.model["explode"]
        spread = e["spacing"] * (len(e["order"]) - 1)
        return 2 / (2 + spread)

    def center(self, part, exploded=None):
        exploded = self.exploded if exploded is None else exploded
        return self.parts[part]["base"] + self._offset(part, exploded)

    def set_explode(self, exploded, frame, glide=True):
        away = self.model["explode"].get("away", [])
        for part, info in self.parts.items():
            pivot = info["pivot"]
            if part in away:
                # Away parts (a casing) drop and shrink out of view, so the inside reads.
                gone = HIDDEN if exploded else 1.0
                if glide:
                    pivot.keyframe_insert("scale", frame=frame)
                pivot.scale = (gone, gone, gone)
                pivot.keyframe_insert("scale", frame=frame + (GLIDE if glide else 0))
            if glide:
                pivot.location = self.center(part)
                pivot.keyframe_insert("location", frame=frame)
            pivot.location = info["base"] + self._offset(part, exploded)
            pivot.keyframe_insert("location", frame=frame + (GLIDE if glide else 0))
        self.exploded = exploded

    # amber hand-off
    def _paint(self, part, on, frame):
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
        if part == self.amber:
            return
        for p in {self.amber, part} - {None}:
            if fade:
                self._paint(p, p == self.amber, frame)
            self._paint(p, p == part, frame + (AMBER_FADE if fade else 0))
        self.amber = part

    def move_camera(self, change, frame):
        self.rig.set(self.cam, frame)
        self.cam.update({k: v for k, v in change.items() if v is not None})
        self.rig.set(self.cam, frame + GLIDE)

    def start(self):
        start = self.clip["start"]
        for part in self.parts:
            self._paint(part, False, 0)
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

    def spin(self, part, frame):
        self.spins.append({"part": part, "start": frame, "end": None})

    def stop(self, frame):
        self.set_amber(None, frame)
        for spin in self.spins:
            if spin["end"] is None and spin["start"] <= frame:
                spin["end"] = frame

    def finish(self):
        """Spin keys: constant speed from start, then a coast-down if stopped."""
        axis = "xyz".index(self.model["spinAxis"])
        rate = 2 * math.pi * SPIN_TURNS_PER_S / self.scene.render.fps  # radians per frame
        for spin in self.spins:
            pivot = self.parts[spin["part"]]["pivot"]
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

    def flow(self, src, dst, frame):
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

    def apply(self, beat):
        f = beat["frame"]
        shot = beat.get("shot") or {}
        kind = beat["do"]
        if kind in ("focus", "explode", "collapse", "shot", "flow", "stop"):
            self.cuts.append(f)
        if kind == "reveal":
            self.reveal(f)
        elif kind == "focus":
            part = beat["part"]
            self.set_amber(part, f)
            base = (self.explode_zoom() if self.exploded else 1.0) * self.start_zoom
            self.move_camera(
                {
                    "target": self.center(part) * FOCUS_PULL,
                    "zoom": shot.get("zoom", FOCUS_ZOOM * base),
                    "yaw": shot.get("yaw"),
                    "pitch": shot.get("pitch"),
                },
                f,
            )
        elif kind in ("explode", "collapse"):
            exploding = kind == "explode"
            self.set_explode(exploding, f)
            self.move_camera(
                {
                    "target": Vector(),
                    "zoom": shot.get("zoom", (self.explode_zoom() if exploding else 1.0) * self.start_zoom),
                    "yaw": shot.get("yaw"),
                    "pitch": shot.get("pitch"),
                },
                f,
            )
        elif kind == "spin":
            self.spin(beat["part"], f)
        elif kind == "stop":
            self.stop(f)
        elif kind == "flow":
            self.flow(beat["part"], beat["to"], f)
        elif kind == "label":
            self.labels.append({"text": beat["label"], "part": beat["part"], "from": f})
        elif kind == "shot":
            self.move_camera({"yaw": shot.get("yaw"), "pitch": shot.get("pitch"), "zoom": shot.get("zoom")}, f)
            if shot.get("keyPart"):
                self.set_amber(shot["keyPart"], f)
            if "exploded" in shot:
                self.set_explode(bool(shot["exploded"]), f)
                if "zoom" not in shot:
                    self.move_camera({"zoom": self.explode_zoom() if shot["exploded"] else 1.0}, f)

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
                    t["points"].append([round(co.x, 4), round(1 - co.y, 4)] if co.z > 0 else None)
                else:
                    t["points"].append(None)
        return [{"text": t["text"], "points": t["points"]} for t in tracks]


def build_clip(scene, job, clip, tokens, preview, repo_root):
    look.setup_render(scene, clip["width"], clip["height"], job["fps"], clip["frames"], preview)
    look.setup_world(scene, tokens)
    meshes, radius = import_model(job["model"], repo_root)
    parts = group_parts(meshes, job["model"], tokens)
    look.setup_lights(radius)
    look.setup_glow(scene)
    c = Clip(scene, job, clip, tokens, parts, radius)
    c.start()
    for beat in clip["beats"]:
        c.apply(beat)
    c.finish()
    return c.label_tracks()
