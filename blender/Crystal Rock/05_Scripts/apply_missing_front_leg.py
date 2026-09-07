"""
apply_missing_front_leg.py
Duplicates and mirrors the front-left leg across X=0 to build the missing front-right leg in Blocky_Creature.blend.
"""

import bpy
import bmesh
from mathutils import Matrix, Vector

blend_file = r"C:\Users\marke\Desktop\Blocky Creature\Blocky_Creature.blend"
bpy.ops.wm.open_mainfile(filepath=blend_file)

front_left_cubes = [
    'Cube.010', 'Cube.011', 'Cube.012', 'Cube.013', 'Cube.014',
    'Cube.015', 'Cube.016', 'Cube.017', 'Cube.018', 'Cube.019', 'Cube.020'
]
front_left_plates = ['Creature_Carapace_Plates.005']

Sx = Matrix.Scale(-1, 4, Vector((1, 0, 0)))

def mirror_object(src_name, target_name):
    src_obj = bpy.data.objects[src_name]
    
    # Copy mesh
    new_mesh = src_obj.data.copy()
    new_mesh.name = target_name + "_Mesh"
    
    # Flip local X and reverse face normals in bmesh
    bm = bmesh.new()
    bm.from_mesh(new_mesh)
    for v in bm.verts:
        v.co.x = -v.co.x
    bmesh.ops.reverse_faces(bm, faces=bm.faces)
    bm.to_mesh(new_mesh)
    bm.free()
    new_mesh.update()
    
    new_obj = bpy.data.objects.new(target_name, new_mesh)
    new_obj.matrix_world = Sx @ src_obj.matrix_world @ Sx
    
    # Copy materials
    for slot in src_obj.material_slots:
        if slot.material:
            new_obj.data.materials.append(slot.material)
            
    # Copy modifiers
    for mod in src_obj.modifiers:
        new_mod = new_obj.modifiers.new(name=mod.name, type=mod.type)
        for prop in mod.bl_rna.properties:
            if not prop.is_readonly and prop.identifier not in ('name', 'type', 'rna_type'):
                try:
                    setattr(new_mod, prop.identifier, getattr(mod, prop.identifier))
                except Exception:
                    pass
                    
    # Link to exact source collection
    for col in src_obj.users_collection:
        col.objects.link(new_obj)
        
    return new_obj

# Create all front right leg objects
created_objects = []
for i, name in enumerate(front_left_cubes):
    target_name = f"Cube.{21+i:03d}"
    obj = mirror_object(name, target_name)
    created_objects.append(obj)
    print(f"Created {target_name} from {name}")

plate_obj = mirror_object('Creature_Carapace_Plates.005', 'Creature_Carapace_Plates.006')
created_objects.append(plate_obj)
print("Created Creature_Carapace_Plates.006 from Creature_Carapace_Plates.005")

# Save the blend file
bpy.ops.wm.save_mainfile()
print(f"Successfully saved updated blend file: {blend_file}")

# Render presentation images
artifact_dir = r"C:\Users\marke\.gemini\antigravity-ide\brain\21295ccc-419a-4bcd-a7b1-7367d41f912d"

# Hide reference tripo objects from renders
for o in bpy.data.objects:
    if o.name.startswith('tripo_node_'):
        o.hide_render = True

scene = bpy.context.scene
scene.render.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in [e.identifier for e in bpy.types.RenderSettings.bl_rna.properties['engine'].enum_items] else 'BLENDER_EEVEE'
scene.render.resolution_x = 1280
scene.render.resolution_y = 720

def create_cam(name, loc, target):
    cam = bpy.data.objects.new(name, bpy.data.cameras.new(name))
    scene.collection.objects.link(cam)
    cam.location = Vector(loc)
    direction = Vector(target) - cam.location
    cam.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    return cam

# 1. Front-Right close-up view showcasing the newly placed leg
cam_fr = create_cam('Cam_FR', (4.5, 3.2, 2.0), (0.0, 0.4, 0.75))
scene.camera = cam_fr
scene.render.filepath = artifact_dir + r"\render_front_right_leg.png"
bpy.ops.render.render(write_still=True)
print("Render 1: Front Right Leg complete")

# 2. Symmetrical Front View showing both front legs balanced
cam_sym = create_cam('Cam_Sym', (0.0, 4.4, 1.4), (0.0, 0.3, 0.8))
scene.camera = cam_sym
scene.render.filepath = artifact_dir + r"\render_bilateral_symmetry.png"
bpy.ops.render.render(write_still=True)
print("Render 2: Bilateral Symmetry complete")

# 3. Overview Perspective showing all four legs
cam_over = create_cam('Cam_Over', (-4.8, 3.8, 2.6), (0.0, -0.6, 0.8))
scene.camera = cam_over
scene.render.filepath = artifact_dir + r"\render_full_overview.png"
bpy.ops.render.render(write_still=True)
print("Render 3: Full Overview complete")

# 4. Top-Down Quadruped Stance View
cam_top = create_cam('Cam_Top', (0.0, -0.6, 6.0), (0.0, -0.6, 0.0))
# Top cam pointing straight down, Y is up
cam_top.rotation_euler = (0, 0, 0)
scene.camera = cam_top
scene.render.filepath = artifact_dir + r"\render_top_stance.png"
bpy.ops.render.render(write_still=True)
print("Render 4: Top Stance complete")

# Remove temporary render cameras and save again so scene stays clean
for cam in [cam_fr, cam_sym, cam_over, cam_top]:
    bpy.data.objects.remove(cam, do_unlink=True)

# Restore default scene camera
scene.camera = bpy.data.objects['Creature_Camera']
bpy.ops.wm.save_mainfile()
print("Scene cleaned up and saved successfully.")
