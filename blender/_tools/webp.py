"""Convert the VELOCE_S4 render plates to web-weight WebP.

Run headless:
  blender --background --factory-startup --python webp.py -- <srcRoot> <dstDir> [--test]

Uses Blender's own image pipeline, so no extra tooling is needed. The renders are
already display-referred (AgX was applied when they were rendered), so the view
transform is forced to Standard here — otherwise saving would apply a tone map a
second time and wash the plates out.
"""

import bpy
import os
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
SRC = argv[0]
DST = argv[1]
TEST = "--test" in argv

# src relative to SRC, out name, width, height, quality
JOBS = [
    ("Cycle.png",                        "hero.webp", 1600,  900, 84),
    ("Cycle.png",                        "card.webp",  800,  450, 80),
    ("renders/01_front_three_quarter.png", "01.webp", 1600,  900, 82),
    ("renders/02_rear_three_quarter.png",  "02.webp", 1600,  900, 82),
    ("renders/03_side_profile.png",        "03.webp", 1600,  900, 82),
    ("renders/04_front_elevation.png",     "04.webp", 1600,  900, 82),
    ("renders/05_rear_elevation.png",      "05.webp", 1600,  900, 82),
    ("renders/06_wheel_detail.png",        "06.webp", 1600,  900, 82),
    # Wireframe and module plates carry fine line detail, so they get more bits.
    ("renders/07_wireframe.png",           "07.webp", 1600,  900, 90),
    ("renders/08_module_breakdown.png",    "08.webp", 1600,  900, 90),
]

if TEST:
    JOBS = JOBS[:1]

scene = bpy.context.scene
scene.view_settings.view_transform = "Standard"
scene.view_settings.look = "None"
scene.view_settings.exposure = 0.0
scene.view_settings.gamma = 1.0
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGB"

os.makedirs(DST, exist_ok=True)

for src_name, out_name, w, h, q in JOBS:
    src = os.path.join(SRC, src_name)
    out = os.path.join(DST, out_name)

    img = bpy.data.images.load(src)
    img.colorspace_settings.name = "sRGB"
    img.scale(w, h)

    scene.render.image_settings.quality = q
    img.save_render(filepath=out, scene=scene)
    bpy.data.images.remove(img)

    print("WEBP_OK %s -> %s (%dx%d q%d) %d bytes"
          % (src_name, out_name, w, h, q, os.path.getsize(out)))

print("WEBP_DONE %d file(s)" % len(JOBS))
