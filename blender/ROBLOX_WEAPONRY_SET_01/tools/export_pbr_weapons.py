"""
export_pbr_weapons.py
Create accurate glTF 2.0 PBR materials with proper emission masking,
metallic-roughness channels, and export pristine GLBs matching Blender renders.
"""
import os
import bpy

BLEND_PATH = r"c:\xampp\htdocs\portfolio\blender\ROBLOX_WEAPONRY_SET_01\ROBLOX_WEAPONRY_SET_01.blend"
TEX_DIR = r"c:\xampp\htdocs\portfolio\blender\ROBLOX_WEAPONRY_SET_01\textures"
MODELS_BASE = r"c:\xampp\htdocs\portfolio\public\assets\models"

WEAPONS = [
    {
        "slug": "wayfarer-longsword",
        "collections": ["WPN_01_Sword_T1_Common"],
        "shift_x": 0.00,
        "has_emission": False
    },
    {
        "slug": "gilded-oathblade",
        "collections": ["WPN_02_Sword_T2_Rare"],
        "shift_x": 1.10,
        "has_emission": False
    },
    {
        "slug": "duskwarden",
        "collections": ["WPN_03_Sword_T3_Legendary"],
        "shift_x": 2.25,
        "has_emission": True
    },
    {
        "slug": "ironjaw-greataxe",
        "collections": ["WPN_04_Greataxe_Ironjaw"],
        "shift_x": 3.85,
        "has_emission": False
    },
    {
        "slug": "wardens-pike",
        "collections": ["WPN_05_Spear_Wardens_Pike"],
        "shift_x": 5.55,
        "has_emission": False
    },
    {
        "slug": "hunters-recurve-bow",
        "collections": ["WPN_06_Bow_Recurve_Hunters", "WPN_06B_Arrow_Hunters"],
        "shift_x": 6.55,
        "has_emission": False
    },
    {
        "slug": "runewarden-staff",
        "collections": ["WPN_07_Staff_Runewarden"],
        "shift_x": 8.35,
        "has_emission": True
    },
    {
        "slug": "bulwark-shield",
        "collections": ["WPN_08_Shield_Round_Bulwark"],
        "shift_x": 10.30,
        "has_emission": False
    },
]

# Generate true colored emission map using Blender image operations or Pillow if needed
# Let's create an emissive texture map where non-emissive areas are strictly BLACK (0,0,0)
# and emissive areas have the cyan/blue glow!
def create_baked_emissive_texture():
    emissive_path = os.path.join(TEX_DIR, "atlas_emissive_1024.png")
    color_path = os.path.join(TEX_DIR, "atlas_color_1024.png")
    out_emissive_path = os.path.join(TEX_DIR, "atlas_emissive_baked_1024.png")
    
    img_col = bpy.data.images.load(color_path)
    img_emi = bpy.data.images.load(emissive_path)
    
    w, h = img_col.size[0], img_col.size[1]
    pix_col = list(img_col.pixels)
    pix_emi = list(img_emi.pixels)
    
    baked_pixels = [0.0] * (w * h * 4)
    for i in range(0, len(pix_col), 4):
        # Multiply base color by emissive mask
        mask = (pix_emi[i] + pix_emi[i+1] + pix_emi[i+2]) / 3.0
        if mask > 0.01:
            baked_pixels[i]   = pix_col[i] * 1.5
            baked_pixels[i+1] = pix_col[i+1] * 1.5
            baked_pixels[i+2] = pix_col[i+2] * 1.5
            baked_pixels[i+3] = 1.0
        else:
            baked_pixels[i]   = 0.0
            baked_pixels[i+1] = 0.0
            baked_pixels[i+2] = 0.0
            baked_pixels[i+3] = 1.0

    baked_img = bpy.data.images.new("atlas_emissive_baked", width=w, height=h, alpha=True)
    baked_img.pixels = baked_pixels
    baked_img.filepath_raw = out_emissive_path
    baked_img.file_format = 'PNG'
    baked_img.save()
    print("Created baked emissive texture at:", out_emissive_path)
    return out_emissive_path

baked_emissive_path = create_baked_emissive_texture()

def setup_gltf_materials(mat, has_emission=False):
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()
    
    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (400, 0)
    
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])
    
    def load_tex(fname, colorspace):
        path = os.path.join(TEX_DIR, fname)
        img = bpy.data.images.load(path, check_existing=True)
        img.colorspace_settings.name = colorspace
        n = nt.nodes.new("ShaderNodeTexImage")
        n.image = img
        n.interpolation = "Linear"
        return n
    
    t_col = load_tex("atlas_color_1024.png", "sRGB")
    t_col.location = (-400, 200)
    nt.links.new(t_col.outputs["Color"], bsdf.inputs["Base Color"])
    
    t_met = load_tex("atlas_metalness_1024.png", "Non-Color")
    t_met.location = (-400, -50)
    nt.links.new(t_met.outputs["Color"], bsdf.inputs["Metallic"])
    
    t_rgh = load_tex("atlas_roughness_1024.png", "Non-Color")
    t_rgh.location = (-400, -300)
    nt.links.new(t_rgh.outputs["Color"], bsdf.inputs["Roughness"])
    
    if has_emission:
        t_emi = load_tex("atlas_emissive_baked_1024.png", "sRGB")
        t_emi.location = (-400, -550)
        nt.links.new(t_emi.outputs["Color"], bsdf.inputs["Emission Color"])
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 1.0
    else:
        if "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = (0.0, 0.0, 0.0, 1.0)
        if "Emission Strength" in bsdf.inputs:
            bsdf.inputs["Emission Strength"].default_value = 0.0

    if "IOR" in bsdf.inputs:
        bsdf.inputs["IOR"].default_value = 1.45
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.5

for w in WEAPONS:
    slug = w["slug"]
    dest_dir = os.path.join(MODELS_BASE, slug)
    os.makedirs(dest_dir, exist_ok=True)
    
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    
    # Configure master material for standard glTF PBR
    mat = bpy.data.materials.get("MT_Armory_Master")
    if mat:
        setup_gltf_materials(mat, has_emission=w["has_emission"])
    
    objs_to_export = []
    for cname in w["collections"]:
        col = bpy.data.collections.get(cname)
        if col:
            for obj in col.objects:
                if obj.type == 'MESH':
                    objs_to_export.append(obj)

    if not objs_to_export:
        print(f"WARN: no objects found for {slug}")
        continue

    shift_x = w["shift_x"]
    
    bpy.ops.object.select_all(action='DESELECT')
    for o in objs_to_export:
        o.select_set(True)
    
    bpy.context.view_layer.objects.active = objs_to_export[0]
    bpy.ops.object.duplicate()
    dup_objs = [o for o in bpy.context.selected_objects]
    
    for o in dup_objs:
        o.location.x -= shift_x
        o.select_set(True)

    glb_out = os.path.join(dest_dir, f"{slug}.glb")
    
    bpy.ops.export_scene.gltf(
        filepath=glb_out,
        export_format="GLB",
        use_selection=True,
        export_apply=True,
        export_yup=True,
        export_cameras=False,
        export_lights=False,
        export_materials="EXPORT",
        export_image_format="AUTO",
        export_normals=True,
        export_tangents=False,
        export_texcoords=True,
        export_extras=False,
        export_animations=False,
    )
    print(f"PBR GLB successfully exported: {glb_out} ({os.path.getsize(glb_out)} bytes)")

print("ALL WEAPONS GLB RE-EXPORTED WITH ACCURATE PBR METALLIC-ROUGHNESS AND SELECTIVE EMISSION!")
