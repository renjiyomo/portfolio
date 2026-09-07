"""
apply_crystals_to_model.py
Adds complete, professional amethyst crystal formations to Blocky_Creature.blend
matching Blocky Creature.png in geometry, position, and styling.
"""

import bpy
import bmesh
import math
from mathutils import Vector, Euler, Matrix

def srgb_to_linear(r, g, b, a=1.0):
    def conv(c):
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return (conv(r), conv(g), conv(b), a)

def get_or_create_crystal_mat():
    name = "Mat_Crystal_Amethyst"
    mat = bpy.data.materials.get(name)
    if not mat:
        mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    
    # Deep royal amethyst with vibrant specular highlights matching Blocky Creature.png
    base_lin = srgb_to_linear(0.48, 0.10, 0.90)
    em_lin = srgb_to_linear(0.60, 0.15, 0.98)
    
    if bsdf:
        if "Base Color" in bsdf.inputs:
            bsdf.inputs["Base Color"].default_value = base_lin
        if "Roughness" in bsdf.inputs:
            bsdf.inputs["Roughness"].default_value = 0.14
        if "Specular IOR Level" in bsdf.inputs:
            bsdf.inputs["Specular IOR Level"].default_value = 0.98
        elif "Specular" in bsdf.inputs:
            bsdf.inputs["Specular"].default_value = 0.98
        if "Coat Weight" in bsdf.inputs:
            bsdf.inputs["Coat Weight"].default_value = 0.40
        if "Coat Roughness" in bsdf.inputs:
            bsdf.inputs["Coat Roughness"].default_value = 0.08
        if "Subsurface Weight" in bsdf.inputs:
            bsdf.inputs["Subsurface Weight"].default_value = 0.15
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = em_lin
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.12
            
    mat.diffuse_color = base_lin
    return mat

def add_box(bm, center, size, rot_euler=(0, 0, 0), chamfer_front_z=0.0, chamfer_back_z=0.0, taper_x=0.0):
    sx, sy, sz = size[0]*0.5, size[1]*0.5, size[2]*0.5
    bot_sx = sx * (1.0 - taper_x)
    
    local_verts = [
        Vector((-bot_sx, -sy, -sz)),
        Vector(( bot_sx, -sy, -sz)),
        Vector(( bot_sx,  sy, -sz)),
        Vector((-bot_sx,  sy, -sz)),
        Vector((-sx,     -sy,  sz)),
        Vector(( sx,     -sy,  sz)),
        Vector(( sx,      sy,  sz)),
        Vector((-sx,      sy,  sz)),
    ]
    
    if chamfer_front_z > 0:
        local_verts[4].z -= chamfer_front_z
        local_verts[5].z -= chamfer_front_z

    if chamfer_back_z > 0:
        local_verts[6].z -= chamfer_back_z
        local_verts[7].z -= chamfer_back_z

    R = Euler(rot_euler).to_matrix().to_4x4()
    T = Matrix.Translation(Vector(center))
    M = T @ R
    
    vs = [bm.verts.new(M @ v) for v in local_verts]
    
    bm.faces.new((vs[3], vs[2], vs[1], vs[0]))
    bm.faces.new((vs[4], vs[5], vs[6], vs[7]))
    bm.faces.new((vs[0], vs[1], vs[5], vs[4]))
    bm.faces.new((vs[2], vs[3], vs[7], vs[6]))
    bm.faces.new((vs[0], vs[4], vs[7], vs[3]))
    bm.faces.new((vs[1], vs[2], vs[6], vs[5]))
    return vs

def create_all_crystals_in_scene():
    mat = get_or_create_crystal_mat()
    
    col_name = "Blocky_Creature"
    col = bpy.data.collections.get(col_name)
    if not col:
        col = bpy.context.scene.collection

    crystals_data = [
        # 1. HEAD CRYSTALS
        {
            "name": "Crystal_Head_Horn_L",
            "center": (-0.46, 0.92, 1.58),
            "size": (0.22, 0.28, 0.46),
            "rot": (math.radians(-16), math.radians(-15), math.radians(-5)),
            "chamfer_front": 0.12
        },
        {
            "name": "Crystal_Head_Horn_R",
            "center": (0.46, 0.92, 1.58),
            "size": (0.22, 0.28, 0.46),
            "rot": (math.radians(-16), math.radians(15), math.radians(5)),
            "chamfer_front": 0.12
        },
        {
            "name": "Crystal_Head_Cheek_L",
            "center": (-0.60, 0.72, 1.15),
            "size": (0.19, 0.22, 0.26),
            "rot": (math.radians(-8), math.radians(-32), math.radians(-12)),
            "chamfer_front": 0.07
        },
        {
            "name": "Crystal_Head_Cheek_R",
            "center": (0.60, 0.72, 1.15),
            "size": (0.19, 0.22, 0.26),
            "rot": (math.radians(-8), math.radians(32), math.radians(12)),
            "chamfer_front": 0.07
        },

        # 2. CARAPACE DORSAL SPINE CRYSTALS
        {
            "name": "Crystal_Dorsal_01_FrontL",
            "center": (-0.24, 0.04, 2.14),
            "size": (0.36, 0.36, 0.42),
            "rot": (math.radians(-18), math.radians(-6), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Dorsal_02_Crown",
            "center": (-0.08, -0.50, 2.38),
            "size": (0.42, 0.40, 0.62),
            "rot": (math.radians(-16), math.radians(-2), 0),
            "chamfer_front": 0.05
        },
        {
            "name": "Crystal_Dorsal_03_PeakR",
            "center": (0.28, -0.42, 2.26),
            "size": (0.36, 0.36, 0.48),
            "rot": (math.radians(-15), math.radians(10), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Dorsal_04_MidR",
            "center": (0.25, -1.06, 2.22),
            "size": (0.34, 0.34, 0.44),
            "rot": (math.radians(-18), math.radians(8), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Dorsal_05_MidL",
            "center": (-0.20, -1.38, 2.14),
            "size": (0.32, 0.32, 0.40),
            "rot": (math.radians(-18), math.radians(-6), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Dorsal_06_Post",
            "center": (0.12, -1.80, 2.04),
            "size": (0.30, 0.30, 0.36),
            "rot": (math.radians(-20), math.radians(4), 0),
            "chamfer_front": 0.03
        },
        {
            "name": "Crystal_Dorsal_07_Sacral",
            "center": (-0.06, -2.26, 1.94),
            "size": (0.26, 0.26, 0.32),
            "rot": (math.radians(-22), math.radians(-2), 0),
            "chamfer_front": 0.03
        },

        # 3. LATERAL FLANK CRYSTALS
        {
            "name": "Crystal_Flank_R",
            "center": (1.24, -0.85, 1.48),
            "size": (0.20, 0.20, 0.22),
            "rot": (math.radians(-6), math.radians(20), math.radians(4)),
            "chamfer_front": 0.03
        },
        {
            "name": "Crystal_Flank_L",
            "center": (-1.24, -0.85, 1.48),
            "size": (0.20, 0.20, 0.22),
            "rot": (math.radians(-6), math.radians(-20), math.radians(-4)),
            "chamfer_front": 0.03
        },

        # 4. TAIL CRYSTALS
        {
            "name": "Crystal_Tail_01_Base",
            "center": (0.02, -2.85, 1.54),
            "size": (0.22, 0.22, 0.26),
            "rot": (math.radians(-14), math.radians(2), 0),
            "chamfer_front": 0.03
        },
        {
            "name": "Crystal_Tail_02_Mid",
            "center": (0.04, -3.50, 1.34),
            "size": (0.24, 0.24, 0.28),
            "rot": (math.radians(-16), math.radians(3), 0),
            "chamfer_front": 0.03
        },
        {
            "name": "Crystal_Tail_03_Ascent",
            "center": (0.12, -4.85, 1.05),
            "size": (0.24, 0.24, 0.32),
            "rot": (math.radians(35), math.radians(6), 0),
            "chamfer_front": 0.03
        },
        {
            "name": "Crystal_Tail_04_TipTop",
            "center": (0.22, -5.72, 1.94),
            "size": (0.28, 0.28, 0.44),
            "rot": (math.radians(72), math.radians(8), 0),
            "chamfer_front": 0.05
        },
        {
            "name": "Crystal_Tail_05_TipR",
            "center": (0.50, -5.74, 1.62),
            "size": (0.24, 0.24, 0.32),
            "rot": (math.radians(25), math.radians(60), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Tail_06_TipL",
            "center": (-0.06, -5.74, 1.62),
            "size": (0.24, 0.24, 0.32),
            "rot": (math.radians(25), math.radians(-60), 0),
            "chamfer_front": 0.04
        },
        {
            "name": "Crystal_Tail_07_TipRear",
            "center": (0.22, -6.08, 1.62),
            "size": (0.22, 0.26, 0.28),
            "rot": (math.radians(-24), math.radians(6), 0),
            "chamfer_front": 0.03
        }
    ]

    for c in crystals_data:
        old = bpy.data.objects.get(c["name"])
        if old:
            bpy.data.objects.remove(old, do_unlink=True)
            
        mesh = bpy.data.meshes.new(c["name"] + "_Mesh")
        bm = bmesh.new()
        add_box(
            bm,
            c["center"],
            c["size"],
            rot_euler=c.get("rot", (0,0,0)),
            chamfer_front_z=c.get("chamfer_front", 0.0),
            taper_x=c.get("taper", 0.0)
        )
        bm.to_mesh(mesh)
        bm.free()
        
        obj = bpy.data.objects.new(c["name"], mesh)
        obj.data.materials.append(mat)
        
        bev = obj.modifiers.new("Bevel", "BEVEL")
        bev.width = 0.009
        bev.segments = 2
        bev.limit_method = "ANGLE"
        bev.angle_limit = math.radians(35)
        
        wn = obj.modifiers.new("WeightedNormal", "WEIGHTED_NORMAL")
        wn.keep_sharp = True
        
        col.objects.link(obj)

def process_file(filepath):
    print(f"Opening and updating {filepath}...")
    bpy.ops.wm.open_mainfile(filepath=filepath)
    create_all_crystals_in_scene()
    bpy.ops.wm.save_mainfile()
    print(f"Successfully saved {filepath}")

# 1. Update CrystalROck blend file
blend1 = r"c:\Users\marke\Desktop\Tripo\CrystalROck\Blocky_Creature.blend"
process_file(blend1)

# 2. Update Blocky Creature blend file
blend2 = r"C:\Users\marke\Desktop\Blocky Creature\Blocky_Creature.blend"
process_file(blend2)

# Now render 4 high-definition presentation renders using blend1
bpy.ops.wm.open_mainfile(filepath=blend1)

for o in bpy.data.objects:
    if o.name.startswith("tripo_node_"):
        o.hide_render = True

artifact_dir = r"C:\Users\marke\.gemini\antigravity-ide\brain\21295ccc-419a-4bcd-a7b1-7367d41f912d"

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
scene.render.resolution_x = 1920
scene.render.resolution_y = 1080

def create_cam(name, loc, target):
    cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    cam.data.lens = 50
    scene.collection.objects.link(cam)
    cam.location = Vector(loc)
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return cam

# View 1: Hero Concept Match (Matching Blocky Creature.png)
cam1 = create_cam('Hero_Cam', (-4.6, 3.6, 2.7), (0.0, -0.8, 1.2))
scene.camera = cam1
scene.render.filepath = artifact_dir + r"\render_crystal_hero.png"
bpy.ops.render.render(write_still=True)
print("Hero Render Done!")

# View 2: Front Bilateral View
cam2 = create_cam('Front_Cam', (0.0, 4.4, 1.5), (0.0, 0.4, 0.9))
scene.camera = cam2
scene.render.filepath = artifact_dir + r"\render_crystal_front.png"
bpy.ops.render.render(write_still=True)
print("Front Render Done!")

# View 3: Dorsal Carapace Spine View
cam3 = create_cam('Dorsal_Cam', (-3.4, -0.6, 3.8), (0.0, -0.8, 1.8))
scene.camera = cam3
scene.render.filepath = artifact_dir + r"\render_crystal_dorsal.png"
bpy.ops.render.render(write_still=True)
print("Dorsal Render Done!")

# View 4: Tail Club View
cam4 = create_cam('Tail_Cam', (2.4, -4.2, 2.6), (0.2, -5.6, 1.5))
scene.camera = cam4
scene.render.filepath = artifact_dir + r"\render_crystal_tail.png"
bpy.ops.render.render(write_still=True)
print("Tail Render Done!")

# Clean up temporary cameras
for c in [cam1, cam2, cam3, cam4]:
    bpy.data.objects.remove(c, do_unlink=True)

scene.camera = bpy.data.objects['Creature_Camera']
bpy.ops.wm.save_mainfile()
print("All files updated and renders saved successfully!")
