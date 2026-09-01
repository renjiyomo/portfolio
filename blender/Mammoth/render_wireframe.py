"""
=============================================================================
MAMMOTH 3D - CLAY WIREFRAME TOPOLOGY RENDER PIPELINE
Style: Neutral Studio Clay with Quad Wireframe Grid Topology
=============================================================================
"""

import bpy
import os
import math

def setup_and_render_wireframe(output_dir=None):
    if output_dir is None:
        output_dir = bpy.path.abspath("//Renders")
    os.makedirs(output_dir, exist_ok=True)
    
    # 1. Configure Theme Gradients & Wire Color
    theme = bpy.context.preferences.themes[0]
    v3d = theme.view_3d
    v3d.space.gradients.background_type = 'RADIAL'
    v3d.space.gradients.high_gradient = (0.58, 0.58, 0.60)
    v3d.space.gradients.gradient = (0.82, 0.83, 0.85)
    v3d.wire = (0.01, 0.01, 0.01)
    
    # 2. Add Proportional Subdivision Grid to all meshes for uniform quad grid lines
    for obj in bpy.data.objects:
        if obj.type == 'MESH':
            sub = obj.modifiers.get("Wireframe_Grid_Subsurf")
            if not sub:
                sub = obj.modifiers.new(name="Wireframe_Grid_Subsurf", type='SUBSURF')
            
            sub.subdivision_type = 'SIMPLE'
            sub.show_only_control_edges = False
            
            dim = max(obj.dimensions.x, obj.dimensions.y, obj.dimensions.z)
            if dim >= 1.4:
                sub.levels = 3
                sub.render_levels = 3
            elif dim >= 0.4:
                sub.levels = 2
                sub.render_levels = 2
            else:
                sub.levels = 1
                sub.render_levels = 1

    # 3. Configure 3D Viewport Shading & Overlays
    for window in bpy.context.window_manager.windows:
        for area in window.screen.areas:
            if area.type == 'VIEW_3D':
                for space in area.spaces:
                    if space.type == 'VIEW_3D':
                        space.region_3d.view_perspective = 'CAMERA'
                        space.shading.type = 'SOLID'
                        space.shading.light = 'STUDIO'
                        space.shading.studio_light = 'Default'
                        space.shading.color_type = 'SINGLE'
                        space.shading.single_color = (0.47, 0.48, 0.50)
                        space.shading.background_type = 'THEME'
                        
                        space.shading.show_cavity = True
                        space.shading.cavity_type = 'BOTH'
                        space.shading.cavity_ridge_factor = 1.3
                        space.shading.cavity_valley_factor = 1.3
                        space.shading.curvature_ridge_factor = 1.1
                        space.shading.curvature_valley_factor = 1.1
                        space.shading.show_shadows = True
                        space.shading.shadow_intensity = 0.4
                        space.shading.studiolight_rotate_z = math.radians(25)
                        
                        space.overlay.show_wireframes = True
                        space.overlay.wireframe_threshold = 1.0
                        space.overlay.show_floor = False
                        space.overlay.show_axis_x = False
                        space.overlay.show_axis_y = False
                        space.overlay.show_cursor = False
                        space.overlay.show_extras = False
                        space.overlay.show_relationship_lines = False
                        space.overlay.show_outline_selected = False
                        space.overlay.show_bones = False
                        space.overlay.show_motion_paths = False
                        space.overlay.show_object_origins = False
                        space.overlay.show_annotation = False
                        space.overlay.show_text = False
                        space.overlay.show_stats = False

    bpy.ops.object.select_all(action='DESELECT')
    
    # 4. Configure Resolution & Render
    scene = bpy.context.scene
    scene.render.resolution_x = 1920
    scene.render.resolution_y = 1080
    scene.render.resolution_percentage = 100
    
    out_file = os.path.join(output_dir, "Mammoth_Wireframe_Topology.png")
    scene.render.filepath = out_file
    bpy.ops.render.opengl(write_still=True)
    print(f"[SUCCESS] Wireframe render saved: {out_file}")
    return out_file

if __name__ == "__main__":
    setup_and_render_wireframe()
