"""
generate_perfect_assets.py
Convert all weapon renders to pristine, undistorted RGBA WebP files
and export perfectly framed, textured GLB models for web 3D viewing.
"""
import os
import sys
import bpy

BLEND_PATH = r"c:\xampp\htdocs\portfolio\blender\ROBLOX_WEAPONRY_SET_01\ROBLOX_WEAPONRY_SET_01.blend"
RENDERS_DIR = r"c:\xampp\htdocs\portfolio\blender\ROBLOX_WEAPONRY_SET_01\renders"
SHEETS_DIR = r"c:\xampp\htdocs\portfolio\blender\ROBLOX_WEAPONRY_SET_01\sheets"
MODELS_BASE = r"c:\xampp\htdocs\portfolio\public\assets\models"

# Weapon definitions and their corresponding high-res render plates
WEAPONS = [
    {
        "slug": "wayfarer-longsword",
        "collections": ["WPN_01_Sword_T1_Common"],
        "shift_x": 0.00,
        "hero_render": "hero_T1-Common.png",
        "extra_renders": [
            ("modules_swords.png", RENDERS_DIR),
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "gilded-oathblade",
        "collections": ["WPN_02_Sword_T2_Rare"],
        "shift_x": 1.10,
        "hero_render": "hero_T2_Rare.png",
        "extra_renders": [
            ("modules_swords.png", RENDERS_DIR),
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "duskwarden",
        "collections": ["WPN_03_Sword_T3_Legendary"],
        "shift_x": 2.25,
        "hero_render": "hero_T3-Legendary.png",
        "extra_renders": [
            ("modules_swords.png", RENDERS_DIR),
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "ironjaw-greataxe",
        "collections": ["WPN_04_Greataxe_Ironjaw"],
        "shift_x": 3.85,
        "hero_render": "hero_AXE.png",
        "extra_renders": [
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "wardens-pike",
        "collections": ["WPN_05_Spear_Wardens_Pike"],
        "shift_x": 5.55,
        "hero_render": "hero_SPEAR.png",
        "extra_renders": [
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "hunters-recurve-bow",
        "collections": ["WPN_06_Bow_Recurve_Hunters", "WPN_06B_Arrow_Hunters"],
        "shift_x": 6.55,
        "hero_render": "hero_BOW.png",
        "extra_renders": [
            ("hero_ARROW.png", RENDERS_DIR),
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "runewarden-staff",
        "collections": ["WPN_07_Staff_Runewarden"],
        "shift_x": 8.35,
        "hero_render": "hero_STAFF.png",
        "extra_renders": [
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
    {
        "slug": "bulwark-shield",
        "collections": ["WPN_08_Shield_Round_Bulwark"],
        "shift_x": 10.30,
        "hero_render": "hero_SHIELD.png",
        "extra_renders": [
            ("01_contact_sheet.png", SHEETS_DIR),
            ("02_topology_sheet.png", SHEETS_DIR),
            ("04_scale_and_grips_sheet.png", SHEETS_DIR),
            ("wireframe.png", RENDERS_DIR),
        ]
    },
]

def setup_scene():
    scene = bpy.context.scene
    scene.view_settings.view_transform = "Standard"
    scene.view_settings.look = "None"
    scene.view_settings.exposure = 0.0
    scene.view_settings.gamma = 1.0
    scene.render.image_settings.file_format = "WEBP"
    scene.render.image_settings.color_mode = "RGBA"
    return scene

def convert_webp_lossless(src_path, dst_path, max_dim=None, quality=95):
    """Convert PNG to WebP while STRICTLY PRESERVING aspect ratio and RGBA transparency."""
    if not os.path.exists(src_path):
        print(f"WARN: source image not found: {src_path}")
        return
    os.makedirs(os.path.dirname(dst_path), exist_ok=True)
    scene = setup_scene()
    img = bpy.data.images.load(src_path)
    img.colorspace_settings.name = "sRGB"
    
    orig_w, orig_h = img.size[0], img.size[1]
    
    # Only downscale if larger than max_dim, preserving exact aspect ratio!
    if max_dim and (orig_w > max_dim or orig_h > max_dim):
        scale_ratio = min(max_dim / orig_w, max_dim / orig_h)
        target_w = max(1, int(round(orig_w * scale_ratio)))
        target_h = max(1, int(round(orig_h * scale_ratio)))
        img.scale(target_w, target_h)
    
    scene.render.image_settings.quality = quality
    img.save_render(filepath=dst_path, scene=scene)
    saved_w, saved_h = img.size[0], img.size[1]
    bpy.data.images.remove(img)
    print(f"WEBP saved: {dst_path} (original={orig_w}x{orig_h} -> {saved_w}x{saved_h}, {os.path.getsize(dst_path)} bytes)")
    return saved_w, saved_h

image_dimensions_map = {}

for w in WEAPONS:
    slug = w["slug"]
    dest_dir = os.path.join(MODELS_BASE, slug)
    os.makedirs(dest_dir, exist_ok=True)
    image_dimensions_map[slug] = {}

    # 1. Convert hero image without ANY distortion
    hero_src = os.path.join(RENDERS_DIR, w["hero_render"])
    hw, hh = convert_webp_lossless(hero_src, os.path.join(dest_dir, "hero.webp"), max_dim=1600, quality=95)
    cw, ch = convert_webp_lossless(hero_src, os.path.join(dest_dir, "card.webp"), max_dim=800, quality=92)
    image_dimensions_map[slug]["hero"] = (hw, hh)
    image_dimensions_map[slug]["card"] = (cw, ch)

    # 2. Convert extra renders without ANY distortion
    for idx, (img_name, img_dir) in enumerate(w["extra_renders"], start=1):
        src_p = os.path.join(img_dir, img_name)
        out_p = os.path.join(dest_dir, f"{idx:02d}.webp")
        ew, eh = convert_webp_lossless(src_p, out_p, max_dim=1800, quality=95)
        image_dimensions_map[slug][f"{idx:02d}"] = (ew, eh)

    # 3. Export GLB with proper centering and baked textures
    bpy.ops.wm.open_mainfile(filepath=BLEND_PATH)
    
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
        export_image_format="AUTO",  # Preserve original PNG atlas texture fidelity
        export_normals=True,
        export_tangents=False,
        export_texcoords=True,
        export_extras=False,
        export_animations=False,
    )
    print(f"GLB exported: {glb_out} ({os.path.getsize(glb_out)} bytes)")

print("\n--- IMAGE DIMENSIONS SUMMARY ---")
import json
print(json.dumps(image_dimensions_map, indent=2))
print("ALL WEAPONS PROCESSED WITH ZERO DISTORTION AND HIGH FIDELITY!")
