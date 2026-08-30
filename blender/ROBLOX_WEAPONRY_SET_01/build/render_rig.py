"""
render_rig.py -- the presentation rig for ROBLOX_WEAPONRY_SET_01.

Renders are shot on a TRANSPARENT film and composited into sheets afterwards
with Pillow. That split is deliberate:

  * Blender is good at light and geometry, bad at typography;
  * Pillow is good at typography and terrible at light;
  * and an RGBA hero render can be re-composited into a different sheet layout
    without re-rendering, which matters when a client asks for "the same set,
    but on a light background".

The key light points down armory_lib.LIGHT, the same vector the atlas UVs are
baked against, so the painted value ramp and the rendered light agree instead
of fighting each other.
"""
import math

import bpy
from mathutils import Vector

from armory_lib import LIGHT

RIG = "RIG"


# ---------------------------------------------------------------------------
# rig housekeeping
# ---------------------------------------------------------------------------
def rig_coll():
    c = bpy.data.collections.get(RIG)
    if c is None:
        c = bpy.data.collections.new(RIG)
        bpy.context.scene.collection.children.link(c)
    return c


def clear_rig():
    c = bpy.data.collections.get(RIG)
    if c:
        for ob in list(c.objects):
            bpy.data.objects.remove(ob, do_unlink=True)


def scene(samples=96, exposure=0.0, ambient=(0.075, 0.082, 0.098),
          ambient_str=1.0, transparent=True, res=(1600, 1600)):
    sc = bpy.context.scene
    sc.render.engine = 'BLENDER_EEVEE'
    # Resolution is set HERE, before any camera is fitted. camera() solves the
    # framing distance from the render aspect, so fitting a camera against a
    # stale resolution silently crops the subject.
    sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.film_transparent = transparent
    sc.render.image_settings.file_format = 'PNG'
    sc.render.image_settings.color_mode = 'RGBA' if transparent else 'RGB'
    sc.render.image_settings.color_depth = '8'
    sc.render.image_settings.compression = 15
    sc.view_settings.exposure = exposure
    try:
        sc.view_settings.view_transform = 'Standard'
    except TypeError:
        pass
    for attr, val in (("taa_render_samples", samples),
                      ("use_raytracing", True),
                      ("use_shadows", True)):
        try:
            setattr(sc.eevee, attr, val)
        except Exception:
            pass

    w = bpy.data.worlds.get("WRLD_studio") or bpy.data.worlds.new("WRLD_studio")
    sc.world = w
    w.use_nodes = True
    nt = w.node_tree
    nt.nodes.clear()
    out = nt.nodes.new("ShaderNodeOutputWorld")
    bg = nt.nodes.new("ShaderNodeBackground")
    bg.inputs[0].default_value = (ambient[0], ambient[1], ambient[2], 1.0)
    bg.inputs[1].default_value = ambient_str
    nt.links.new(bg.outputs[0], out.inputs[0])
    return sc


def _sun(name, vec, energy, color, angle_deg=6.0):
    """A sun whose light TRAVELS along -vec, i.e. arrives from direction vec."""
    d = bpy.data.lights.new("LT_" + name, 'SUN')
    d.energy = energy
    d.color = color
    d.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new("RIG_" + name, d)
    ob.rotation_mode = 'QUATERNION'
    ob.rotation_quaternion = Vector(vec).normalized().to_track_quat('Z', 'Y')
    rig_coll().objects.link(ob)
    return ob


def lights(key=2.6, fill=0.85, rim=1.7, kick=0.35):
    """Four-light studio set, energies tuned for Standard (no tone mapping).

    Standard view transform clips instead of rolling off, so the key sits low
    and the shape work is carried by the fill and the rim rather than by
    cranking the key until the metals blow out.
    """
    _sun("KEY", LIGHT, key, (1.00, 0.97, 0.92), 5.0)
    _sun("FILL", Vector((0.78, -0.34, 0.30)), fill, (0.76, 0.83, 1.00), 22.0)
    _sun("RIM", Vector((-0.25, 0.86, 0.34)), rim, (0.85, 0.90, 1.00), 8.0)
    _sun("KICK", Vector((0.10, 0.20, -0.95)), kick, (0.60, 0.66, 0.82), 30.0)


# ---------------------------------------------------------------------------
# camera
# ---------------------------------------------------------------------------
def world_points(objs):
    """Bounding-box corners of `objs` in world space.

    The view_layer update is load-bearing, not defensive. Assigning ob.location
    does NOT refresh ob.matrix_world -- that is a derived value the depsgraph
    recomputes later -- so every caller that moves something and then fits a
    camera to it measures the PREVIOUS layout. That silently mis-framed two
    sheets: the exploded sword shot was fitted to the un-exploded swords (3.80
    studs tall instead of 4.92, so the blades ran off the top) and the scale shot
    was fitted to weapons still sitting at the origin, un-lifted and un-shifted,
    which is what pushed the shield off the edge of the frame. The render itself
    evaluates the depsgraph, so the picture showed the NEW layout inside a frame
    solved for the OLD one -- which is exactly the kind of bug that looks like a
    bad artistic choice rather than a stale read.
    """
    bpy.context.view_layer.update()
    pts = []
    for ob in objs:
        mw = ob.matrix_world
        for c in ob.bound_box:
            pts.append(mw @ Vector(c))
    return pts


def _basis(view, roll=0.0):
    """Camera right/up/back for a look direction, plus the rotation itself."""
    d = Vector(view).normalized()
    q = (-d).to_track_quat('Z', 'Y')
    if roll:
        from mathutils import Quaternion
        q = q @ Quaternion((0.0, 0.0, 1.0), math.radians(roll))
    m = q.to_matrix()
    return d, q, m.col[0], m.col[1], m.col[2]


def _extents(pts, right, up, back):
    """Subject width, height, depth and centre along a camera basis."""
    ref = pts[0]
    ru = [(p - ref).dot(right) for p in pts]
    uu = [(p - ref).dot(up) for p in pts]
    bu = [(p - ref).dot(back) for p in pts]
    cen = (ref
           + right * ((min(ru) + max(ru)) * 0.5)
           + up * ((min(uu) + max(uu)) * 0.5)
           + back * ((min(bu) + max(bu)) * 0.5))
    return (max(ru) - min(ru), max(uu) - min(uu), max(bu) - min(bu)), cen


def fit_res(objs, view, long_edge=2400, roll=0.0, lo=0.42, hi=3.10, step=10):
    """Pick a render resolution whose aspect matches the SUBJECT's aspect.

    camera() fits the subject inside whatever frame it is given, so a frame with
    the wrong aspect can only be solved by adding background: the exploded sword
    sheet was 1.13:1 around a 0.59:1 subject and came out half empty, and the
    scale sheet was 1.69:1 around a subject three times as wide as it is tall.
    Both were me guessing at a number that is measurable.

    Clamped to `lo`..`hi` because the honest aspect of a nine-weapon row next to
    a figure is about 3:1, and past that a sheet stops being readable at any
    sensible print or Discord width -- some background is better than a subject
    2% of the frame tall. Rounded to a multiple of `step` to keep even numbers.
    """
    _, _, right, up, back = _basis(view, roll)
    (w, h, _), _ = _extents(world_points(objs), right, up, back)
    a = min(max((w / h) if h > 1e-9 else 1.0, lo), hi)

    def r(v):
        return max(step, int(round(v / step)) * step)
    return (long_edge, r(long_edge / a)) if a >= 1.0 else (r(long_edge * a), long_edge)


def camera(objs=None, view=(-0.62, -1.0, -0.20), margin=1.12, lens=95.0,
           ortho=False, pts=None, shift=(0.0, 0.0), roll=0.0):
    """Frame `objs` (or explicit world-space `pts`) from direction `view`.

    `view` is the direction the camera LOOKS, not where it sits.

    The aim point is the centre of the subject's bounding box IN CAMERA SPACE,
    not the mean of its bounding-box corners. That distinction is not academic:
    the mean is a vertex-density weighted average, so a subject made of one long
    object and several small ones gets aimed at the small ones. It framed the
    exploded sword sheet 0.84 studs low -- blades clipped off the top, dead space
    along the bottom -- and it pushed the shield off the edge of the scale sheet.
    Taking min/max per camera axis centres the subject exactly and makes hw/hh
    the true half-extents, so `margin` finally means what it says.
    """
    pts = pts if pts is not None else world_points(objs)
    d, q, right, up, back = _basis(view, roll)

    cd = bpy.data.cameras.new("CAM_shot")
    cd.sensor_fit = 'HORIZONTAL'
    cd.sensor_width = 36.0
    cd.lens = lens
    cam = bpy.data.objects.new("RIG_CAM", cd)
    rig_coll().objects.link(cam)
    cam.rotation_mode = 'QUATERNION'
    cam.rotation_quaternion = q

    (w, h, dp), cen = _extents(pts, right, up, back)
    hw, hh, depth = w * 0.5 * margin, h * 0.5 * margin, dp * 0.5

    sc = bpy.context.scene
    aspect = sc.render.resolution_x / sc.render.resolution_y
    if ortho:
        cd.type = 'ORTHO'
        cd.ortho_scale = 2.0 * max(hw, hh * aspect)
        dist = depth + max(hw, hh) * 4.0 + 1.0
    else:
        th = math.atan((cd.sensor_width * 0.5) / cd.lens)
        tv = math.atan((cd.sensor_width * 0.5 / aspect) / cd.lens)
        dist = depth + max(hw / math.tan(th), hh / math.tan(tv))
    cam.location = cen - d * dist
    cd.shift_x, cd.shift_y = shift
    sc.camera = cam
    return cam


# ---------------------------------------------------------------------------
# wireframe overlay
# ---------------------------------------------------------------------------
def wire_material(color=(0.06, 0.07, 0.09), emit=0.0):
    m = bpy.data.materials.get("MT_WIRE")
    if m is None:
        m = bpy.data.materials.new("MT_WIRE")
        m.use_nodes = True
        n = m.node_tree.nodes.get("Principled BSDF")
        n.inputs["Base Color"].default_value = (*color, 1.0)
        n.inputs["Roughness"].default_value = 0.85
        n.inputs["Metallic"].default_value = 0.0
        n.inputs["Emission Color"].default_value = (*color, 1.0)
        n.inputs["Emission Strength"].default_value = emit
    return m


def shell_material(color=(0.86, 0.88, 0.92)):
    m = bpy.data.materials.get("MT_SHELL")
    if m is None:
        m = bpy.data.materials.new("MT_SHELL")
        m.use_nodes = True
        n = m.node_tree.nodes.get("Principled BSDF")
        n.inputs["Base Color"].default_value = (*color, 1.0)
        n.inputs["Roughness"].default_value = 0.62
        n.inputs["Metallic"].default_value = 0.0
    return m


def make_wire_copies(objs, thickness=0.0055):
    """Duplicate `objs` as pale shells with a black wireframe cage on top."""
    out = []
    coll = rig_coll()
    shell, wire = shell_material(), wire_material()
    for ob in objs:
        for tag, mat, mod in (("shell", shell, False), ("wire", wire, True)):
            cp = ob.copy()
            cp.data = ob.data.copy()
            cp.name = "RIG_%s_%s" % (ob.name, tag)
            cp.data.materials.clear()
            cp.data.materials.append(mat)
            coll.objects.link(cp)
            if mod:
                w = cp.modifiers.new("wire", 'WIREFRAME')
                w.thickness = thickness
                w.use_even_offset = True
                w.use_replace = True
                w.offset = 0.0
            out.append(cp)
    return out


# ---------------------------------------------------------------------------
# output
# ---------------------------------------------------------------------------
def shoot(path, res=None, hide=(), show_only=None):
    sc = bpy.context.scene
    if res is not None:
        sc.render.resolution_x, sc.render.resolution_y = res
    sc.render.resolution_percentage = 100
    sc.render.filepath = path
    restore = []
    if show_only is not None:
        keep = set(o.name for o in show_only)
        for ob in bpy.data.objects:
            if ob.type == 'MESH':
                restore.append((ob, ob.hide_render))
                ob.hide_render = ob.name not in keep
    for ob in hide:
        restore.append((ob, ob.hide_render))
        ob.hide_render = True
    bpy.ops.render.render(write_still=True)
    for ob, v in restore:
        ob.hide_render = v
    return path
