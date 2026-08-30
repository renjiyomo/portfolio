"""
ROBLOX_WEAPONRY_SET_01 -- shared palette + atlas layout.

This module is imported by BOTH sides of the pipeline:
  * make_atlas.py  (writes the PNG maps, plain CPython + Pillow)
  * armory_lib.py  (assigns UVs inside Blender)

It must therefore import NOTHING but the standard library, so that the swatch
table and the UV maths can never drift out of sync. If you change a colour,
re-run make_atlas.py; the UVs do not need to change.

ATLAS LAYOUT
------------
1024 x 1024, an 8 x 8 grid of 128 px cells (64 slots, 28 used).
Cell (0,0) is BOTTOM-LEFT, matching Blender/Roblox UV origin.
Each cell holds a vertical value ramp: v = 1 is the lit tint, v = 0 the shade.
Geometry samples a single point inside its cell, so "shading" is a UV offset,
not a second texture -- the whole set is one material and one texture fetch.

PAD is the inset from the cell border, in pixels, to stop neighbouring swatches
bleeding into each other under mip filtering.
"""

ATLAS_PX = 1024
GRID = 8
CELL_PX = ATLAS_PX // GRID          # 128
PAD_PX = 12                          # 9.4% inset per side
PAD = PAD_PX / ATLAS_PX
SPAN = 1.0 / GRID

# ----------------------------------------------------------------------------
# Swatch table.
#   name, hex, shade, tint, pattern, metalness, roughness, emission
#     shade  -- how far the bottom of the ramp darkens toward black (0..1)
#     tint   -- how far the top of the ramp lifts toward the tint colour (0..1)
#     pattern-- 'grad' | 'grain' | 'band' | 'brush' | 'gem' | 'flat'
# ----------------------------------------------------------------------------
SWATCHES = [
    # --- row 0 : ferrous + precious metal ----------------------------------
    # Metalness is held below 1.0 on purpose. Fully metallic surfaces lose their
    # base colour to the environment, which reads as grey plastic under Roblox's
    # simple lighting. 0.7-0.85 keeps the hue and still reads as metal.
    ("STEEL_COLD",    "9BA7B5", 0.46, 0.30, "brush", 0.70, 0.38, 0.0),
    ("STEEL_DARK",    "5D6775", 0.44, 0.26, "brush", 0.70, 0.46, 0.0),
    ("IRON_RAW",      "4B4F58", 0.40, 0.22, "brush", 0.55, 0.66, 0.0),
    ("BLUED_STEEL",   "3B4A63", 0.46, 0.30, "brush", 0.75, 0.40, 0.0),
    ("SILVER_BRIGHT", "D9E1EB", 0.42, 0.22, "brush", 0.80, 0.26, 0.0),
    ("BRASS",         "C8A24C", 0.46, 0.28, "brush", 0.78, 0.34, 0.0),
    ("BRASS_DARK",    "8B6B2B", 0.44, 0.24, "brush", 0.78, 0.48, 0.0),
    ("GOLD_RICH",     "E7C25B", 0.44, 0.26, "brush", 0.85, 0.28, 0.0),
    # --- row 1 : timber, hide, textile -------------------------------------
    ("WOOD_ASH",      "B18B56", 0.42, 0.20, "grain", 0.00, 0.60, 0.0),
    ("WOOD_WALNUT",   "6C4B2F", 0.40, 0.22, "grain", 0.00, 0.62, 0.0),
    ("WOOD_EBON",     "3A2B23", 0.36, 0.24, "grain", 0.00, 0.55, 0.0),
    ("LEATHER_TAN",   "8D6243", 0.38, 0.20, "band",  0.00, 0.70, 0.0),
    ("LEATHER_OXB",   "6F2C2C", 0.38, 0.20, "band",  0.00, 0.68, 0.0),
    ("CLOTH_CRIMSON", "A32F34", 0.40, 0.22, "band",  0.00, 0.85, 0.0),
    ("CLOTH_BLUE",    "2F4B7B", 0.40, 0.24, "band",  0.00, 0.85, 0.0),
    ("CORD_LINEN",    "C9B58D", 0.38, 0.18, "band",  0.00, 0.80, 0.0),
    # --- row 2 : gem, stone, bone, rune ------------------------------------
    ("GEM_SAPPHIRE",  "1E4FB8", 0.66, 0.30, "gem",   0.00, 0.08, 0.14),
    ("GEM_AMBER",     "D97416", 0.64, 0.28, "gem",   0.00, 0.10, 0.12),
    ("GEM_EMERALD",   "17864F", 0.66, 0.28, "gem",   0.00, 0.09, 0.12),
    ("STONE_GREY",    "7B7F83", 0.40, 0.20, "brush", 0.00, 0.75, 0.0),
    ("BONE_IVORY",    "DDD3B9", 0.36, 0.18, "grad",  0.00, 0.55, 0.0),
    ("RUNE_CYAN",     "64E7E3", 0.10, 0.10, "flat",  0.00, 0.25, 0.85),
    ("RUNE_VIOLET",   "9C6CE7", 0.10, 0.10, "flat",  0.00, 0.25, 0.85),
    ("PAINT_BLACK",   "24272C", 0.30, 0.24, "grad",  0.00, 0.55, 0.0),
    # --- row 3 : accents ----------------------------------------------------
    ("STRING_PALE",   "E7E1CF", 0.34, 0.14, "grad",  0.00, 0.70, 0.0),
    ("COPPER_PATINA", "4E8C78", 0.40, 0.24, "brush", 0.70, 0.52, 0.0),
    ("STEEL_EDGE",    "E8EEF5", 0.30, 0.20, "brush", 0.85, 0.16, 0.0),
    ("LEATHER_DARK",  "4A3428", 0.36, 0.20, "band",  0.00, 0.72, 0.0),
]

# name -> index, so builders read `P["STEEL_COLD"]` instead of a magic number.
P = {s[0]: i for i, s in enumerate(SWATCHES)}


def hex_rgb(h):
    """'9BA7B5' -> (0.607, 0.654, 0.709) in 0..1 sRGB."""
    return tuple(int(h[i:i + 2], 16) / 255.0 for i in (0, 2, 4))


def cell_origin(idx):
    """Bottom-left UV of swatch `idx`."""
    return (idx % GRID) * SPAN, (idx // GRID) * SPAN


def cell_uv(idx, t, s=0.5):
    """UV of a point inside swatch `idx`.

    t -- 0 = shade (bottom of ramp), 1 = lit tint (top).
    s -- 0..1 across the cell; only matters for grain/band patterns, where it
         shifts which streak or wrap-ring the face lands on.
    """
    u0, v0 = cell_origin(idx)
    inner = SPAN - 2 * PAD
    t = 0.0 if t < 0.0 else (1.0 if t > 1.0 else t)
    s = 0.0 if s < 0.0 else (1.0 if s > 1.0 else s)
    return u0 + PAD + s * inner, v0 + PAD + t * inner


def cell_px_box(idx):
    """Pixel box (x0, y0, x1, y1) of swatch `idx`, y measured from the BOTTOM."""
    col, row = idx % GRID, idx // GRID
    return col * CELL_PX, row * CELL_PX, (col + 1) * CELL_PX, (row + 1) * CELL_PX


MAPS = ("color", "metalness", "roughness", "emissive")
