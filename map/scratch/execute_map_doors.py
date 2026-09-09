import bpy
import mathutils

def create_box(name, x_min, x_max, y_min, y_max, z_min, z_max, mat_name, col_name="Arch_Wings"):
    mesh = bpy.data.meshes.new(name)
    obj = bpy.data.objects.new(name, mesh)
    
    dx = x_max - x_min
    dy = y_max - y_min
    dz = z_max - z_min
    cx = (x_min + x_max) / 2.0
    cy = (y_min + y_max) / 2.0
    cz = (z_min + z_max) / 2.0
    
    hx, hy, hz = dx / 2.0, dy / 2.0, dz / 2.0
    verts = [
        (-hx, -hy, -hz), (hx, -hy, -hz), (hx, hy, -hz), (-hx, hy, -hz),
        (-hx, -hy, hz), (hx, -hy, hz), (hx, hy, hz), (-hx, hy, hz)
    ]
    faces = [
        (0, 1, 2, 3), # bottom
        (4, 7, 6, 5), # top
        (0, 4, 5, 1), # front (-Y)
        (2, 6, 7, 3), # back (+Y)
        (0, 3, 7, 4), # left (-X)
        (1, 5, 6, 2)  # right (+X)
    ]
    mesh.from_pydata(verts, [], faces)
    mesh.update()
    
    obj.location = (cx, cy, cz)
    
    if mat_name and mat_name in bpy.data.materials:
        obj.data.materials.append(bpy.data.materials[mat_name])
        
    target_col = bpy.data.collections.get(col_name) or bpy.context.scene.collection
    target_col.objects.link(obj)
        
    return obj

def remove_obj(name):
    obj = bpy.data.objects.get(name)
    if obj:
        bpy.data.objects.remove(obj, do_unlink=True)
        print(f"Removed: {name}")

print("=== STARTING ARCHITECTURAL REMEDIATION ===")

# ==============================================================================
# 1. DOORWAY: Stylized Wing <-> UGC Showroom (X in [-32.0, -28.0])
# ==============================================================================
print("--- 1. Cutting Stylized <-> UGC Doorway ---")
remove_obj("Stylized_Wall_North_Main")
create_box("Stylized_Wall_North_L", -55.0, -32.0, -40.2, -39.8, 0.0, 6.0, "Mat_Arch_Wall_Main")
create_box("Stylized_Wall_North_R", -28.0, -23.0, -40.2, -39.8, 0.0, 6.0, "Mat_Arch_Wall_Main")
create_box("Stylized_Wall_North_Top", -32.0, -28.0, -40.2, -39.8, 3.5, 6.0, "Mat_Arch_Wall_Main")

remove_obj("UGC_Wall_South_L")
create_box("UGC_Wall_South_L_Part1", -48.0, -32.0, -38.4, -38.0, 0.0, 6.5, "Mat_Arch_Wall_Main")
create_box("UGC_Wall_South_L_Part2", -28.0, -22.5, -38.4, -38.0, 0.0, 6.5, "Mat_Arch_Wall_Main")
create_box("UGC_Wall_South_L_Top", -32.0, -28.0, -38.4, -38.0, 3.5, 6.5, "Mat_Arch_Wall_Main")

# Corridor connecting Stylized and UGC
create_box("Corridor_Stylized_UGC_Wall_W", -32.2, -31.8, -40.2, -38.0, 0.0, 3.5, "Mat_Arch_Wall_Main")
create_box("Corridor_Stylized_UGC_Wall_E", -28.2, -27.8, -40.2, -38.0, 0.0, 3.5, "Mat_Arch_Wall_Main")
create_box("Corridor_Stylized_UGC_Floor", -32.0, -28.0, -40.2, -38.0, -0.2, 0.0, "Mat_Arch_Floor_Dark")
create_box("Corridor_Stylized_UGC_Ceiling", -32.0, -28.0, -40.2, -38.0, 3.5, 3.7, "Facility_Wall_Dark")
create_box("Portal_Stylized_UGC_Threshold", -32.0, -28.0, -39.2, -39.0, 0.0, 0.02, "Mat_Sign_UGC_Purple")
create_box("Portal_Stylized_UGC_HeaderTrim", -32.0, -28.0, -39.2, -39.0, 3.45, 3.52, "Mat_Sign_Stylized_Orange")

# ==============================================================================
# 2. CORRIDOR: UGC Showroom <-> Horror Quarantine (X in [-24.0, -20.0], Y in [-16.0, -10.0])
# ==============================================================================
print("--- 2. Building UGC <-> Horror Corridor ---")
remove_obj("Horror_Wall_South")
create_box("Horror_Wall_South_L", -38.0, -24.0, -10.4, -10.0, 0.0, 4.2, "Mat_Arch_Wall_Main")
create_box("Horror_Wall_South_R", -20.0, -12.0, -10.4, -10.0, 0.0, 4.2, "Mat_Arch_Wall_Main")
create_box("Horror_Wall_South_Top", -24.0, -20.0, -10.4, -10.0, 3.2, 4.2, "Mat_Arch_Wall_Main")

# Replace intrusive UGC_Wall_North:
# Only keep west of -38.0, and east of -20.0 (if any). Remove the part clipping through Horror!
remove_obj("UGC_Wall_North")
create_box("UGC_Wall_North_W_Exterior", -48.0, -38.0, -8.0, -7.6, 0.0, 6.5, "Mat_Arch_Wall_Main")

# Build 6-meter long corridor connecting UGC (Y=-16.0) to Horror (Y=-10.0)
create_box("Corridor_UGC_Horror_Wall_W", -24.3, -23.9, -16.0, -10.0, 0.0, 3.6, "Mat_Arch_Wall_Main")
create_box("Corridor_UGC_Horror_Wall_E", -20.1, -19.7, -16.0, -10.0, 0.0, 3.6, "Mat_Arch_Wall_Main")
create_box("Corridor_UGC_Horror_Floor", -24.0, -20.0, -16.0, -10.0, -0.2, 0.0, "Mat_Arch_Floor_Dark")
create_box("Corridor_UGC_Horror_Ceiling", -24.0, -20.0, -16.0, -10.0, 3.6, 3.8, "Facility_Wall_Dark")

# UGC North alcove wall enclosure (closing UGC north at Y=-15.8 outside the corridor)
create_box("UGC_Wall_North_Alcove_Closure_W", -38.0, -24.0, -16.0, -15.6, 0.0, 4.0, "Mat_Arch_Wall_Main")
create_box("UGC_Wall_North_Alcove_Closure_E", -20.0, -16.0, -16.0, -15.6, 0.0, 4.0, "Mat_Arch_Wall_Main")
create_box("UGC_Wall_North_Corridor_Top", -24.0, -20.0, -16.0, -15.6, 3.2, 4.0, "Mat_Arch_Wall_Main")

# Corridor hazard trim
create_box("Portal_UGC_Horror_Threshold", -24.0, -20.0, -10.2, -10.0, 0.0, 0.02, "Mat_Sign_Horror_Red")
create_box("Portal_UGC_Horror_HeaderTrim", -24.0, -20.0, -10.2, -10.0, 3.15, 3.22, "Mat_Sign_Horror_Red")
create_box("Portal_UGC_Horror_SouthTrim", -24.0, -20.0, -15.9, -15.7, 0.0, 0.02, "Mat_Sign_UGC_Purple")

# ==============================================================================
# 3. DOORWAY: Props Workshop <-> Realistic Material Lab (X in [22.0, 26.0])
# ==============================================================================
print("--- 3. Cutting Props <-> Realistic Doorway ---")
remove_obj("Props_Wall_North_Main")
create_box("Props_Wall_North_L", 21.0, 22.0, -40.2, -39.8, 0.0, 5.0, "Mat_Arch_Wall_Main")
create_box("Props_Wall_North_R", 26.0, 42.0, -40.2, -39.8, 0.0, 5.0, "Mat_Arch_Wall_Main")
create_box("Props_Wall_North_Top", 22.0, 26.0, -40.2, -39.8, 3.5, 5.0, "Mat_Arch_Wall_Main")

remove_obj("Realistic_Wall_South_R")
create_box("Realistic_Wall_South_R_L", 21.0, 22.0, -38.4, -38.0, 0.0, 4.8, "Mat_Arch_Wall_Main")
create_box("Realistic_Wall_South_R_R", 26.0, 42.0, -38.4, -38.0, 0.0, 4.8, "Mat_Arch_Wall_Main")
create_box("Realistic_Wall_South_R_Top", 22.0, 26.0, -38.4, -38.0, 3.5, 4.8, "Mat_Arch_Wall_Main")

# Corridor connecting Props and Realistic
create_box("Corridor_Props_Realistic_Wall_W", 21.8, 22.2, -40.2, -38.0, 0.0, 3.5, "Mat_Arch_Wall_Main")
create_box("Corridor_Props_Realistic_Wall_E", 25.8, 26.2, -40.2, -38.0, 0.0, 3.5, "Mat_Arch_Wall_Main")
create_box("Corridor_Props_Realistic_Floor", 22.0, 26.0, -40.2, -38.0, -0.2, 0.0, "Mat_Arch_Floor_Dark")
create_box("Corridor_Props_Realistic_Ceiling", 22.0, 26.0, -40.2, -38.0, 3.5, 3.7, "Facility_Wall_Dark")
create_box("Portal_Props_Realistic_Threshold", 22.0, 26.0, -39.2, -39.0, 0.0, 0.02, "Mat_Sign_Props_Yellow")
create_box("Portal_Props_Realistic_HeaderTrim", 22.0, 26.0, -39.2, -39.0, 3.45, 3.52, "Mat_Sign_Tech_Blue")

# Nudge Props_StorageRack_1 and crates 3.5m west to clear doorway approach
rack_1 = bpy.data.objects.get("Props_StorageRack_1")
if rack_1:
    rack_1.location.x -= 3.5
    print("Nudged Props_StorageRack_1 west")
for i in range(1, 6):
    crate = bpy.data.objects.get(f"Props_CargoCrate_{i}")
    if crate:
        crate.location.x -= 3.5

# ==============================================================================
# 4. DOORWAY: Props Workshop <-> Environment Gallery (Y in [-58.0, -54.0])
# ==============================================================================
print("--- 4. Cutting Props <-> Environment Doorway ---")
remove_obj("Props_Wall_East_S")
create_box("Props_Wall_East_S_South", 46.0, 46.4, -72.0, -58.0, 0.0, 5.0, "Mat_Arch_Wall_Main")
create_box("Props_Wall_East_S_North", 46.0, 46.4, -54.0, -50.0, 0.0, 5.0, "Mat_Arch_Wall_Main")
create_box("Props_Wall_East_S_Top", 46.0, 46.4, -58.0, -54.0, 3.5, 5.0, "Mat_Arch_Wall_Main")

remove_obj("Env_Wall_West_S")
create_box("Env_Wall_West_S_South", 45.6, 46.0, -73.0, -58.0, 0.0, 9.0, "Mat_Arch_Wall_Main")
create_box("Env_Wall_West_S_Top", 45.6, 46.0, -58.0, -54.0, 3.5, 9.0, "Mat_Arch_Wall_Main")
# Also create wall section north of doorway up to Y=-42.0 to seal Environment gallery
create_box("Env_Wall_West_S_NorthSeal", 45.6, 46.0, -54.0, -42.0, 0.0, 5.0, "Mat_Arch_Wall_Main")

# Corridor / portal connecting Props and Environment
create_box("Corridor_Props_Env_Floor", 45.5, 47.5, -58.0, -54.0, -0.2, 0.0, "Mat_Arch_Floor_Dark")
create_box("Corridor_Props_Env_Ceiling", 45.5, 47.5, -58.0, -54.0, 3.5, 3.7, "Facility_Wall_Dark")
create_box("Portal_Props_Env_Threshold", 45.8, 46.2, -58.0, -54.0, 0.0, 0.02, "Mat_Sign_Env_Green")
create_box("Portal_Props_Env_HeaderTrim", 45.8, 46.2, -58.0, -54.0, 3.45, 3.52, "Mat_Sign_Props_Yellow")

# Save Blender Mainfile to lock in changes
bpy.ops.wm.save_mainfile()
print("=== ARCHITECTURAL REMEDIATION COMPLETE & SAVED ===")
