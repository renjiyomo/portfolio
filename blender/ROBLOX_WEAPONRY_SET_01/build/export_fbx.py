"""
export_fbx.py -- turn the modular scene into the files a Roblox dev imports.

The source and the deliverable are deliberately NOT the same shape:

  * the .blend keeps every weapon as 2-5 separate objects (HAFT, HEAD, RIVETS,
    ...) because that is what makes a rarity variant a parameter change instead
    of a remodel;
  * each FBX ships ONE merged mesh, because a Roblox Tool wants one MeshPart.
    Five MeshParts per weapon is five things to weld, five things to stream and
    five chances for the welds to drift.

Merging is lossless here only because of a decision made much earlier: every
part in the set shares one material and one 1024 UV atlas. If the parts carried
separate materials, merging would create a multi-material mesh and Roblox would
need a separate SurfaceAppearance per material -- so the atlas is what buys the
single MeshPart, not the merge.

Sharp edges are baked per-edge BEFORE the merge, so they survive it. Nothing
here recomputes shading.
"""
import os

import bmesh
import bpy
from mathutils import Matrix

import build_all as BA

# FBX settings, and why each one is what it is:
#
#   axis_up='Y'          Roblox is Y-up, Blender is Z-up. This is the exporter
#                        default and the conversion Roblox expects. CONSEQUENCE:
#                        in Roblox each weapon's length runs along +Y, not +Z.
#                        Documented in SPEC.md; do not "fix" it by rotating the
#                        objects, which would break the .blend's own convention.
#   apply_unit_scale     True with global_scale 1.0 and a unitless scene, so one
#                        Blender unit leaves as 1.0 and lands as one stud.
#   mesh_smooth_type     'EDGE' writes the per-edge sharp flags. FACE would
#                        throw away the smooth/sharp split the whole shading
#                        pass is built on.
#   use_triangles=False  Quads are kept so the client can edit them. Safe for a
#                        quoted triangle count because a quad is 2 triangles
#                        under ANY triangulation -- the number cannot drift.
#   bake_space_transform False -- leave the axis conversion in the node
#                        transform rather than baking it into the vertices, so
#                        a re-import into Blender comes back upright.
FBX = dict(
    use_selection=True, use_visible=False, use_active_collection=False,
    global_scale=1.0, apply_unit_scale=True, apply_scale_options='FBX_SCALE_NONE',
    axis_forward='-Z', axis_up='Y', bake_space_transform=False,
    object_types={'MESH'}, use_mesh_modifiers=True, mesh_smooth_type='EDGE',
    use_subsurf=False, use_mesh_edges=False, use_tspace=False,
    use_triangles=False, use_custom_props=False,
    add_leaf_bones=False, path_mode='COPY', embed_textures=False,
    batch_mode='OFF', use_metadata=True,
)


def _merge(parts, name, shift_x=0.0):
    """One mesh from many, with the rack offset removed.

    Shells are NOT welded together. remove_doubles across parts would fuse a
    rivet to the cheek it sits on and turn two clean closed shells into one
    non-manifold mess. Several disjoint closed shells in a single mesh is a
    perfectly valid MeshPart.
    """
    bm = bmesh.new()
    for ob in parts:
        tmp = ob.data.copy()
        tmp.transform(ob.matrix_world)
        bm.from_mesh(tmp)
        bpy.data.meshes.remove(tmp)
    if shift_x:
        bmesh.ops.translate(bm, verts=bm.verts, vec=(-shift_x, 0.0, 0.0))
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    ob = bpy.data.objects.new(name, me)
    if parts and parts[0].data.materials:
        me.materials.append(parts[0].data.materials[0])
    bpy.context.scene.collection.objects.link(ob)
    return ob


def _select_only(objs):
    for o in bpy.data.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    if objs:
        bpy.context.view_layer.objects.active = objs[0]


def export(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    rows = BA.manifest()
    made, log = [], []

    # one merged mesh per weapon, origin at the grip
    for r in rows:
        parts = [o for o in bpy.data.objects
                 if o.type == 'MESH' and o.name.startswith(r["obj"] + "__")]
        parts.sort(key=lambda o: o.name)
        if not parts:
            log.append("MISSING %s" % r["obj"])
            continue
        m = _merge(parts, "EXP_" + r["obj"], shift_x=r["x"])
        made.append((r, m, parts))

    # per-weapon files
    for r, m, parts in made:
        _select_only([m])
        path = os.path.join(out_dir, r["obj"] + ".fbx")
        bpy.ops.export_scene.fbx(filepath=path, **FBX)
        log.append("%-32s %5d tris  %5d verts  %s"
                   % (os.path.basename(path), len(m.data.polygons) * 2,
                      len(m.data.vertices),
                      "%d parts merged" % len(parts)))

    # one combined file, weapons left where the rack put them, so the client can
    # import once and see the whole set in relative scale
    for r, m, _ in made:
        m.location = (r["x"], 0.0, 0.0)
    _select_only([m for _, m, _ in made])
    allp = os.path.join(out_dir, "ROBLOX_WEAPONRY_SET_01_ALL.fbx")
    bpy.ops.export_scene.fbx(filepath=allp, **FBX)
    log.append("%-32s %5d tris  (%d meshes, rack layout)"
               % (os.path.basename(allp),
                  sum(len(m.data.polygons) * 2 for _, m, _ in made), len(made)))

    for _, m, _ in made:
        me = m.data
        bpy.data.objects.remove(m, do_unlink=True)
        bpy.data.meshes.remove(me)
    return "\n".join(log)
