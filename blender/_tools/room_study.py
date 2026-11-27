"""Build the portfolio's workshop cutaway with Blender in background mode.

Run from the repository with blender --background --python blender/_tools/room_study.py.
"""

import math
import random
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / "public" / "assets"
DESTINATION = ASSETS / "room"
DESTINATION.mkdir(exist_ok=True)

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene


def linear_channel(channel):
    return channel / 12.92 if channel < 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def material(name, hex_color, roughness=0.65, emission=0):
    color = tuple(linear_channel(int(hex_color[i:i + 2], 16) / 255) for i in (0, 2, 4))
    mat = bpy.data.materials.new(name)
    mat.diffuse_color = (*color, 1)
    mat.use_nodes = True
    shader = next(node for node in mat.node_tree.nodes if node.type == "BSDF_PRINCIPLED")
    shader.inputs["Base Color"].default_value = (*color, 1)
    shader.inputs["Roughness"].default_value = roughness
    shader.inputs["Emission Color"].default_value = (*color, 1)
    shader.inputs["Emission Strength"].default_value = emission
    return mat


stone = material("Graphite • base", "243138")
floor = material("Ash • light", "9b7d67")
floor_dark = material("Ash • mid", "876b58")
floor_light = material("Ash • pale", "ae8c74")
subfloor = material("Unfinished subfloor", "52615c")
wall = material("Green-gray plaster", "657978")
frame = material("Cedar framing", "ba9070")
metal = material("Powder-coated steel", "303b42", 0.38)
mint = material("Celadon glass", "a3e6d0", 0.28, 0.55)
mint_ink = material("Plan • mint ink", "a4c6ae", 0.7, 0.12)
ink = material("Plan • deep green", "244750")
paper = material("Tracing paper", "dfd7b8")
coral = material("Vermilion enamel", "bd593d", 0.4)
violet = material("Test swatch • lilac", "9183a1")
lamp = material("Task lamp diffuser", "ffd6a7", 0.4, 2.8)
screen = material("Monitor glass", "263c41", 0.27, 0.22)


def finish(obj, name, mat, radius=0):
    obj.name = name
    obj.data.materials.append(mat)
    if radius:
        bevel = obj.modifiers.new("Soft machined edges", "BEVEL")
        bevel.width = radius
        bevel.segments = 2
        obj.modifiers.new("Weighted corner normals", "WEIGHTED_NORMAL")
    return obj


def box(name, size, position, mat, radius=0.015):
    bpy.ops.mesh.primitive_cube_add(size=1, location=position)
    obj = bpy.context.object
    obj.dimensions = size
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    return finish(obj, name, mat, radius)


def cylinder(name, radius, height, position, mat, bevel=0.012, vertices=32):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=height, location=position)
    return finish(bpy.context.object, name, mat, bevel)


def rod(name, start, end, radius, mat):
    direction = Vector(end) - Vector(start)
    obj = cylinder(name, radius, direction.length, Vector(start) + direction / 2, mat, 0, 8)
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()
    return obj


def note(name, text, size, position, mat, rotation=(math.pi / 2, 0, 0)):
    curve = bpy.data.curves.new(name, "FONT")
    curve.body = text
    curve.size = size
    curve.materials.append(mat)
    obj = bpy.data.objects.new(name, curve)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = rotation
    return obj


# The exposed cut edges read as a scale model, with a plinth and staggered boards.
box("Recessed plinth", (7.48, 5.34, 0.27), (0, 0, -0.42), metal, 0.07)
box("Graphite slab", (7.7, 5.55, 0.31), (0, 0, -0.22), stone, 0.06)
box("Plywood subfloor", (7.52, 5.38, 0.09), (0, 0, -0.063), subfloor, 0.012)
rng = random.Random(38)
for row in range(15):
    y = -2.52 + row * 0.36
    points = [-3.73, -2.15 + (row % 3) * 0.5, 0.38 + (row % 3) * 0.5, 2.23, 3.73]
    for index, (left, right) in enumerate(zip(points, points[1:])):
        if index == 0 and row < 5:
            rod("Floor layout mark", (left + 0.1, y, -0.016), (right - 0.1, y, -0.016), 0.009, mint_ink)
            continue
        box("Ash floorboard", (right - left - 0.011, 0.348, 0.048), ((left + right) / 2, y, -0.009),
            rng.choice((floor, floor, floor_dark, floor_light)), 0.004)

# Rear wall with clerestory, and an unfinished side with its joinery exposed.
box("Rear plaster below window", (7.36, 0.22, 1.86), (0, 2.56, 0.94), wall)
box("Rear plaster upper left", (3.04, 0.22, 1.6), (-2.16, 2.56, 2.67), wall)
box("Rear plaster beside window", (0.36, 0.22, 1.6), (3.51, 2.56, 2.67), wall)
box("Rear top plate", (7.46, 0.27, 0.14), (0, 2.56, 3.52), frame)
box("Window reveal", (3.96, 0.27, 1.62), (1.344, 2.56, 2.67), metal)
for row in range(2):
    for col in range(3):
        box("Frosted pane", (1.25, 0.035, 0.72), (0.06 + col * 1.29, 2.407, 2.29 + row * 0.76), mint, 0.018)
box("Window sill", (4.18, 0.38, 0.09), (1.34, 2.39, 1.88), frame)
box("Left sole plate", (0.19, 5.01, 0.13), (-3.59, 0.05, 0.075), frame)
box("Left upper plate", (0.19, 4.7, 0.14), (-3.59, 0.21, 3.51), frame)
for i in range(7):
    y = -1.97 + i * 0.71
    box("Exposed timber stud", (0.15, 0.125, 3.34), (-3.59, y, 1.79), frame)
    if i < 6:
        box("Timber blocking", (0.13, 0.585, 0.09), (-3.59, y + 0.355, 1.62 + i % 2 * 0.14), frame)
box("Partly fitted side panel", (0.075, 2.15, 1.36), (-3.49, 1.4, 0.76), wall)
box("Rear skirting", (7.25, 0.075, 0.14), (0, 2.39, 0.08), metal)

# Workbench with a little topology study on the screen.
box("Workbench top", (2.75, 1.06, 0.12), (-1.87, 1.51, 1.07), frame, 0.035)
for x in (-3.07, -0.68):
    for y in (1.09, 1.91):
        box("Workbench leg", (0.105, 0.105, 1.005), (x, y, 0.525), metal)
box("Workbench stretcher", (2.43, 0.085, 0.11), (-1.87, 1.86, 0.33), metal)
box("Bench drawer", (0.61, 0.84, 0.23), (-2.78, 1.49, 0.91), wall)
box("Drawer pull", (0.2, 0.065, 0.045), (-2.78, 1.038, 0.91), metal)
box("Monitor foot", (0.43, 0.34, 0.035), (-1.86, 1.64, 1.149), metal)
box("Monitor post", (0.105, 0.08, 0.3), (-1.86, 1.72, 1.318), metal)
box("Monitor housing", (1.19, 0.105, 0.74), (-1.86, 1.66, 1.72), metal, 0.035)
box("Monitor display", (1.08, 0.018, 0.625), (-1.86, 1.598, 1.73), screen)
for z in (1.52, 1.63, 1.74, 1.85, 1.96):
    rod("Viewport horizontal grid", (-2.36, 1.585, z), (-1.36, 1.585, z), 0.004, wall)
for i in range(10):
    x = -2.33 + i * 0.106
    rod("Viewport vertical grid", (x, 1.585, 1.46), (x, 1.585, 2.005), 0.004, wall)
corners = [(-2.24, 1.66), (-2.17, 1.79), (-2.04, 1.83), (-1.99, 1.95),
           (-1.88, 1.85), (-1.54, 1.87), (-1.47, 1.65), (-1.61, 1.69),
           (-1.7, 1.58), (-1.82, 1.61), (-1.86, 1.74), (-2.07, 1.6)]
for a, b in zip(corners, corners[1:] + corners[:1]):
    rod("Viewport mesh edge", (a[0], 1.578, a[1]), (b[0], 1.578, b[1]), 0.009, mint_ink)
for a in corners:
    rod("Viewport triangulation", (a[0], 1.578, a[1]), (-1.85, 1.578, 1.77), 0.006, mint_ink)

box("Keyboard body", (0.67, 0.27, 0.03), (-1.86, 1.21, 1.143), metal)
for row in range(4):
    for col in range(10):
        box("Keyboard key", (0.054, 0.042, 0.014), (-2.14 + col * 0.062, 1.13 + row * 0.052, 1.165), paper, 0.005)
box("Sketchbook", (0.37, 0.27, 0.027), (-2.61, 1.16, 1.148), paper).rotation_euler.z = 0.22
rod("Pencil", (-2.72, 1.087, 1.173), (-2.46, 1.153, 1.173), 0.018, coral)
cylinder("Enamel cup", 0.079, 0.14, (-1.03, 1.37, 1.201), coral)
cylinder("Coffee", 0.065, 0.006, (-1.03, 1.37, 1.273), stone, 0)

arm_points = [(-2.99, 1.7, 1.16), (-2.99, 1.63, 1.78), (-2.75, 1.46, 2.03)]
lamp_x, lamp_y, lamp_z = arm_points[-1]
cylinder("Task lamp base", 0.17, 0.04, arm_points[0], metal)
for start, end in zip(arm_points, arm_points[1:]):
    rod("Task lamp arm", start, end, 0.033, metal)
cylinder("Task lamp shade", 0.15, 0.12, arm_points[-1], coral)
cylinder("Task lamp light", 0.117, 0.025, (lamp_x, lamp_y, lamp_z - 0.07), lamp)

for angle in (30, 150, 270):
    dx, dy = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    rod("Stool leg", (-1.69 + dx * 0.3, 0.37 + dy * 0.3, 0.04),
        (-1.69 + dx * 0.17, 0.37 + dy * 0.17, 0.65), 0.035, metal)
cylinder("Vermilion stool", 0.33, 0.105, (-1.69, 0.37, 0.69), coral, 0.025)

# A paper plan on the wall and a few material samples waiting to be fitted.
box("Pinned plan", (1.65, 0.025, 0.97), (-2.07, 2.422, 2.69), paper, 0.013)
note("Plan heading", "ROOM LAYOUT", 0.106, (-2.82, 2.404, 3.02), ink)
for x1, z1, x2, z2 in [
    (-2.78, 2.32, -1.38, 2.32), (-2.78, 2.32, -2.78, 2.92),
    (-2.78, 2.92, -1.38, 2.92), (-1.38, 2.92, -1.38, 2.32),
    (-2.66, 2.65, -2.12, 2.65), (-2.12, 2.65, -2.12, 2.8),
    (-2.12, 2.8, -2.66, 2.8), (-2.66, 2.8, -2.66, 2.65),
]:
    rod("Plan linework", (x1, 2.4, z1), (x2, 2.4, z2), 0.01, ink)
pin = cylinder("Plan tack", 0.026, 0.045, (-2.07, 2.395, 3.126), coral, 0)
pin.rotation_euler.x = math.pi / 2
box("Sample ledge", (1.54, 0.32, 0.11), (2.58, 2.28, 1.12), frame)
for i, mat in enumerate((wall, paper, coral, violet, ink)):
    sample = box("Material sample", (0.227, 0.079, 0.3), (1.99 + i * 0.25, 2.275, 1.32), mat)
    sample.rotation_euler.x = -0.21
for i in range(3):
    box("Spare floorboard", (1.12 - i * 0.045, 0.18, 0.048), (-2.85, -2.1 + i * 0.14, 0.01 + i * 0.043),
        (floor_light, floor, frame)[i]).rotation_euler.z = -0.22 + i * 0.05
cylinder("Paint tin", 0.16, 0.23, (-2.92, -0.8, 0.12), ink)
cylinder("Paint tin lid", 0.175, 0.024, (-2.92, -0.8, 0.245), metal)
rod("Brush grip", (-3.22, -0.49, 0.035), (-2.95, -0.55, 0.035), 0.028, coral)
box("Brush bristles", (0.14, 0.09, 0.045), (-2.88, -0.57, 0.034), frame)

# Exhibition prototype using Mark's existing Panther model.
cylinder("Turntable base", 0.93, 0.105, (1.4, -0.44, 0.095), metal, 0.024, 64)
cylinder("Turntable drum", 0.83, 0.48, (1.4, -0.44, 0.36), ink, 0.02, 64)
cylinder("Turntable top", 0.88, 0.085, (1.4, -0.44, 0.635), paper, 0.021, 64)
for i in range(32):
    angle = i * math.tau / 32
    x, y = (1.4 + math.cos(angle) * 0.837, -0.44 + math.sin(angle) * 0.837)
    tick = box("Turntable index mark", (0.038, 0.014, 0.006), (x, y, 0.68), ink, 0)
    tick.rotation_euler.z = angle

before_import = set(bpy.data.objects)
bpy.ops.import_scene.gltf(filepath=str(ASSETS / "models" / "panther" / "panther.glb"))
imported = set(bpy.data.objects) - before_import
mesh_points = [obj.matrix_world @ Vector(corner) for obj in imported if obj.type == "MESH" for corner in obj.bound_box]
minimum = Vector(tuple(min(point[i] for point in mesh_points) for i in range(3)))
maximum = Vector(tuple(max(point[i] for point in mesh_points) for i in range(3)))
foot = (minimum + maximum) / 2
foot.z = minimum.z
scale = 1.69 / max(maximum - minimum)
display = bpy.data.objects.new("Panther display", None)
scene.collection.objects.link(display)
display.scale = (scale,) * 3
for obj in imported:
    if obj.parent is None:
        obj.parent = display
display.rotation_euler.z = math.radians(-102)
display.location = Vector((1.4, -0.44, 0.685)) - display.rotation_euler.to_matrix() @ (foot * scale)

bpy.ops.export_scene.gltf(
    filepath=str(DESTINATION / "workshop.glb"),
    export_format="GLB",
    export_apply=True,
    export_animations=False,
    export_cameras=False,
    export_lights=False,
)


def area(name, position, aim, power, color, size):
    data = bpy.data.lights.new(name, "AREA")
    data.energy = power
    data.color = color
    data.shape = "DISK"
    data.size = size
    obj = bpy.data.objects.new(name, data)
    scene.collection.objects.link(obj)
    obj.location = position
    obj.rotation_euler = (Vector(aim) - obj.location).to_track_quat("-Z", "Y").to_euler()


bpy.ops.mesh.primitive_plane_add(size=200, location=(0, 0, -0.57))
bpy.context.object.is_shadow_catcher = True
area("Morning key", (-3, -5.5, 8), (0, 0, 0.6), 1500, (1, 0.87, 0.72), 5)
area("Window bounce", (2.3, 2.24, 3.0), (0, -0.7, 0.6), 280, (0.62, 1, 0.88), 2.3)
area("Soft fill", (8, -1.5, 6), (0, 0, 1), 970, (0.71, 0.84, 1), 5.2)
area("Workbench light", (lamp_x, lamp_y, lamp_z - 0.09), (-2.64, 1.29, 1.14), 18, (1, 0.74, 0.49), 0.26)
area("Display bounce", (2.6, -2.3, 3.5), (1.4, -0.44, 1), 135, (0.8, 0.9, 1), 2)

bpy.ops.object.camera_add(location=(8.9, -12.6, 8.7))
camera = bpy.context.object
camera.rotation_euler = (Vector((0, 0, 1.25)) - camera.location).to_track_quat("-Z", "Y").to_euler()
camera.data.type = "ORTHO"
camera.data.ortho_scale = 11.45
scene.camera = camera

scene.world = bpy.data.worlds.new("Overcast studio")
scene.world.use_nodes = True
background = next(node for node in scene.world.node_tree.nodes if node.type == "BACKGROUND")
background.inputs["Color"].default_value = (0.48, 0.55, 0.63, 1)
background.inputs["Strength"].default_value = 0.34
scene.render.engine = "CYCLES"
scene.cycles.samples = 20
scene.cycles.use_denoising = True
scene.render.film_transparent = True
scene.render.resolution_x = 1440
scene.render.resolution_y = 1130
scene.render.resolution_percentage = 100
scene.render.image_settings.file_format = "WEBP"
scene.render.image_settings.color_mode = "RGBA"
scene.render.image_settings.quality = 90
scene.render.filepath = str(DESTINATION / "workshop.webp")
bpy.ops.render.render(write_still=True)
