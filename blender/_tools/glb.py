"""Export the VELOCE_S4 car as a web-ready .glb for <model-viewer>.

  blender <file.blend> --background --factory-startup --python glb.py -- <outPath>

Only the car collections are exported. SED_studio holds the floor, the 13-light
studio rig and the render camera — model-viewer supplies its own environment
lighting, so shipping that rig would double-light the asset and bloat the file.
"""

import bpy
import os
import sys

argv = sys.argv[sys.argv.index("--") + 1:]
OUT = argv[0]

CAR = ["SED_body", "SED_detail", "SED_front", "SED_rear", "SED_wheels"]

# --- report modifiers, so the exported tri count can be checked against the spec
evaluated = 0
base = 0
dg = bpy.context.evaluated_depsgraph_get()
for o in bpy.data.objects:
    if o.type != "MESH":
        continue
    if o.name == "SED_Floor":
        continue
    mods = [m.type for m in o.modifiers if m.show_viewport]
    b = sum(len(p.vertices) - 2 for p in o.data.polygons)
    ev = o.evaluated_get(dg)
    e = sum(len(p.vertices) - 2 for p in ev.data.polygons)
    base += b
    evaluated += e
    if mods or e != b:
        print("MOD %-28s base=%-6d eval=%-6d %s" % (o.name, b, e, mods))

print("TRIS base=%d evaluated=%d" % (base, evaluated))

# --- select the car only
bpy.ops.object.select_all(action="DESELECT")
picked = 0
for name in CAR:
    col = bpy.data.collections.get(name)
    if not col:
        print("WARN missing collection %s" % name)
        continue
    for o in col.objects:
        o.select_set(True)
        picked += 1
print("SELECTED %d object(s)" % picked)

os.makedirs(os.path.dirname(OUT), exist_ok=True)

bpy.ops.export_scene.gltf(
    filepath=OUT,
    export_format="GLB",
    use_selection=True,
    export_apply=True,          # bake modifiers
    export_yup=True,            # glTF is Y-up
    export_cameras=False,
    export_lights=False,
    export_materials="EXPORT",
    export_image_format="WEBP",  # shrink the embedded tyre maps
    export_image_quality=85,
    export_normals=True,
    export_tangents=False,
    export_texcoords=True,
    export_extras=False,
    export_animations=False,
)

print("GLB_OK %s %d bytes" % (OUT, os.path.getsize(OUT)))
print("GLB_DONE")
