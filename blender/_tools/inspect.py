"""Dump the VELOCE_S4 scene structure so the GLB export can target the car only.

  blender <file.blend> --background --factory-startup --python inspect.py
"""

import bpy

print("=== COLLECTIONS ===")
for c in bpy.data.collections:
    names = [o.name for o in c.objects]
    print("COL %-28s n=%-3d %s" % (c.name, len(c.objects), names[:40]))

print("=== BY TYPE ===")
kinds = {}
for o in bpy.data.objects:
    kinds.setdefault(o.type, []).append(o.name)
for k in sorted(kinds):
    print("TYPE %-10s n=%-3d %s" % (k, len(kinds[k]), kinds[k][:60]))

print("=== MESHES ===")
for o in bpy.data.objects:
    if o.type != "MESH":
        continue
    d = o.dimensions
    mats = [m.name for m in o.data.materials if m]
    print("MESH %-30s tris=%-6d dim=(%.2f,%.2f,%.2f) parent=%-20s mats=%s"
          % (o.name,
             sum(len(p.vertices) - 2 for p in o.data.polygons),
             d.x, d.y, d.z,
             o.parent.name if o.parent else "-",
             mats[:4]))

print("=== SCENES ===")
for s in bpy.data.scenes:
    print("SCENE %s engine=%s view=%s objects=%d"
          % (s.name, s.render.engine, s.view_settings.view_transform, len(s.objects)))
print("INSPECT_DONE")
