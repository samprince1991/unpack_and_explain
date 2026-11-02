"""Shared helpers for the Blender scripts. Colors come only from tokens.json
(exported from video/src/brand/tokens.ts by `npm run blender`); never write color
values in this folder (the brand guard test scans it)."""

import json
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
TOKENS_PATH = os.path.join(HERE, "tokens.json")


def script_args():
    """Arguments after `--` on the Blender command line."""
    argv = sys.argv
    return argv[argv.index("--") + 1 :] if "--" in argv else []


def load_json(path):
    with open(path, encoding="utf-8") as f:
        return json.load(f)


def load_tokens():
    if not os.path.exists(TOKENS_PATH):
        raise SystemExit("blender/tokens.json missing: run through `npm run blender`")
    return load_json(TOKENS_PATH)


def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def color(token, alpha=1.0):
    """Token string (from tokens.json) -> linear RGBA for Blender."""
    h = token.lstrip("#")
    rgb = [int(h[i : i + 2], 16) / 255 for i in (0, 2, 4)]
    return (*[srgb_to_linear(c) for c in rgb], alpha)


def color_srgb(token):
    """Token string -> sRGB RGB (Freestyle line colors are display-referred)."""
    h = token.lstrip("#")
    return tuple(int(h[i : i + 2], 16) / 255 for i in (0, 2, 4))


def eevee_engine():
    items = bpy.types.RenderSettings.bl_rna.properties["engine"].enum_items.keys()
    return "BLENDER_EEVEE_NEXT" if "BLENDER_EEVEE_NEXT" in items else "BLENDER_EEVEE"


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    return bpy.context.scene
