"""
sheets.py -- every render that goes into the client-facing sheets.

All renders are shot on transparent film at generous resolution and composited
into sheets afterwards by tools/make_sheets.py (Pillow). See render_rig.py for
why the two halves are split.

Every pass in here is a function of the scene as built, so re-running after a
geometry change regenerates the whole presentation with no manual re-framing.
"""
import os

import bmesh
import bpy

import build_all as BA
import render_rig as RR

# Per-weapon camera. A single generic 3/4 angle is wrong for this set: a shield
# shot at 3/4 is an ellipse, a bow shot at 3/4 loses the recurve entirely, and
# the axe's whole read is a notch that only opens up near profile. `view` is the
# direction the camera LOOKS.
VIEWS = {
    "T1":     dict(view=(-0.55, -1.00, -0.12), lens=105.0),
    "T2":     dict(view=(-0.55, -1.00, -0.12), lens=105.0),
    "T3":     dict(view=(-0.55, -1.00, -0.12), lens=105.0),
    "AXE":    dict(view=(0.45, 1.00, 0.08), lens=105.0),
    "SPEAR":  dict(view=(0.30, 1.00, 0.00), lens=110.0),
    "BOW":    dict(view=(0.14, 1.00, 0.00), lens=105.0),
    "ARROW":  dict(view=(0.30, 1.00, 0.00), lens=110.0),
    "STAFF":  dict(view=(0.35, 1.00, 0.05), lens=105.0),
    "SHIELD": dict(view=(0.28, 1.00, -0.16), lens=95.0),
}


def _parts(objname):
    return sorted((o for o in bpy.data.objects
                   if o.type == 'MESH' and o.name.startswith(objname + "__")),
                  key=lambda o: o.name)


def heroes(out_dir, long_edge=1500):
    """One render per weapon, framed on that weapon alone.

    Each hero gets its OWN frame aspect from fit_res rather than a shared one.
    A spear and a shield do not want the same crop, and an RGBA render is going
    to be pasted into a layout cell anyway -- so a frame that hugs the weapon
    spends its pixels on the weapon instead of on transparent margin.
    """
    os.makedirs(out_dir, exist_ok=True)
    done = []
    for r in BA.manifest():
        objs = _parts(r["obj"])
        cfg = VIEWS[r["key"]]
        res = RR.fit_res(objs, cfg["view"], long_edge, lo=0.34)
        RR.clear_rig()
        RR.scene(samples=110, res=res)
        RR.lights()
        RR.camera(objs, margin=1.10, **cfg)
        p = os.path.join(out_dir, "hero_%s.png" % r["key"])
        RR.shoot(p, show_only=objs)
        done.append("%s %dx%d" % (r["key"], res[0], res[1]))
    return done


LINEUP_VIEW = (0.22, 1.0, -0.04)

# The four sheets below are DIAGRAMS, and diagrams are shot orthographic while
# the hero renders stay in perspective. This is not a stylistic preference.
# A perspective camera makes a weapon nearer the lens render larger, and all four
# of these sheets exist to let the reader compare sizes: identical socket heights
# across three tiers, nine grips on one line, weapon length against a 5-stud
# figure. Perspective put the Common sword closest to the camera and drew it
# visibly longer than the Legendary one it is dimensionally identical to -- the
# sheet was contradicting its own caption. Under ortho, equal studs are equal
# pixels anywhere in the frame, so the reader can measure off the image.
# The heroes keep perspective: nothing there is being compared, and a little
# convergence makes a single weapon sit in space instead of floating flat.
ORTHO = True


def lineup(out_dir, name="lineup_grips.png", long_edge=2600):
    """The whole set with every origin still at z=0.

    This doubles as the proof of the grip convention: nothing here is aligned by
    hand, so the fact that all nine grips sit on one horizontal line IS the
    statement that every origin is at the hand. An aligned-by-the-toes contact
    sheet would look tidier and prove nothing.
    """
    objs = [o for o in bpy.data.objects
            if o.type == 'MESH' and o.name.startswith("WPN_")]
    RR.clear_rig()
    RR.scene(samples=90, res=RR.fit_res(objs, LINEUP_VIEW, long_edge))
    RR.lights()
    RR.camera(objs, view=LINEUP_VIEW, lens=105.0, margin=1.04, ortho=ORTHO)
    return RR.shoot(os.path.join(out_dir, name), show_only=objs)


def wireframe(out_dir, name="wireframe.png", long_edge=2600):
    """Pale shells with a black cage, same framing as the lineup.

    Deliberately the same view and the same fitted resolution as lineup(), so the
    two images can be stacked in the sheet and read as the same picture twice --
    once textured, once as topology. Any difference in framing would invite the
    reader to hunt for a difference in the model.
    """
    objs = [o for o in bpy.data.objects
            if o.type == 'MESH' and o.name.startswith("WPN_")]
    RR.clear_rig()
    RR.scene(samples=64, res=RR.fit_res(objs, LINEUP_VIEW, long_edge))
    RR.lights(key=1.9, fill=1.5, rim=0.7, kick=0.5)
    copies = RR.make_wire_copies(objs, thickness=0.006)
    RR.camera(objs, view=LINEUP_VIEW, lens=105.0, margin=1.04, ortho=ORTHO)
    return RR.shoot(os.path.join(out_dir, name), show_only=copies)



# ---------------------------------------------------------------------------
# modularity: the three tiers with their four modules pulled apart
# ---------------------------------------------------------------------------
# Gaps between modules, in studs, along Z. Small on purpose. A big explode
# reads as a parts diagram of four unrelated objects; a small one reads as one
# weapon taken apart, which is the actual claim. These values open ~0.35 studs
# of air at each of the three joints -- enough to see the socket, not enough to
# lose the sword. They also keep the subject's aspect near the frame's, so the
# sheet is not mostly background.
#
# BLADE gets more clearance than the even spacing wants (0.62, not 0.50) because
# the Legendary guard's swept prongs rise well ABOVE its socket top, so the gap
# that matters is not socket-to-socket. At 0.50 the prong tips grazed the blade
# ricasso, and near-contact on the one sheet whose whole job is to demonstrate
# precise socket alignment reads as a modelling mistake.
EXPLODE = dict(POMMEL=-0.62, GRIP=-0.26, GUARD=0.12, BLADE=0.62)


MODULES_VIEW = (0.30, 1.0, -0.05)


def modules(out_dir, name="modules_swords.png", long_edge=1700):
    """Exploded view of the sword kit.

    Pulled apart along Z only, never sideways: the point of the picture is that
    the four socket heights are IDENTICAL across the three tiers, and a sideways
    explode would break the horizontal lines that make that visible.

    Shot from +Y like the lineup, so the tiers read T1 -> T3 left to right. The
    first version looked from -Y, which mirrors X on screen and put Legendary on
    the left -- the opposite order to every other sheet in the pack. Two sheets
    that disagree about which way rarity runs make the reader distrust both.
    """
    RR.clear_rig()
    coll = RR.rig_coll()
    made = []
    for r in BA.manifest():
        if r["key"] not in ("T1", "T2", "T3"):
            continue
        for ob in _parts(r["obj"]):
            mod = ob.name.rsplit("__", 1)[1]
            cp = ob.copy()
            cp.data = ob.data
            cp.name = "RIG_EX_" + ob.name
            cp.location = (ob.location.x, 0.0, EXPLODE.get(mod, 0.0))
            coll.objects.link(cp)
            made.append(cp)
    # Copies first, THEN the resolution: the subject of this shot is the exploded
    # arrangement, not the assembled swords, so fit_res has to measure the copies.
    RR.scene(samples=90, res=RR.fit_res(made, MODULES_VIEW, long_edge))
    RR.lights()
    RR.camera(made, view=MODULES_VIEW, lens=100.0, margin=1.07, ortho=ORTHO)
    return RR.shoot(os.path.join(out_dir, name), show_only=made)


# ---------------------------------------------------------------------------
# scale: the set stood next to a 5-stud figure, all grips at hand height
# ---------------------------------------------------------------------------
HAND_Z = 2.40           # hand height on the reference figure, in studs
WPN_X = 3.20            # sideways offset of the whole rack from the figure
# Limb lengths are deliberately NOT flush with the torso. Arms and legs that end
# exactly on the torso's own faces (z=4.00 and z=2.00) give coplanar geometry,
# and coplanar faces z-fight: the shoulders and hips flickered between two
# surfaces in the first render. Overlapping them by 0.10 costs nothing and the
# joint reads as a joint.
FIGURE = [
    # name,      size (x, y, z),        centre (x, y, z)
    ("leg_l",   (0.90, 0.90, 1.95), (-0.50, 0.0, 0.975)),
    ("leg_r",   (0.90, 0.90, 1.95), (0.50, 0.0, 0.975)),
    ("torso",   (2.00, 1.00, 2.00), (0.00, 0.0, 3.00)),
    ("arm_l",   (0.90, 0.90, 1.90), (-1.45, 0.0, 2.95)),
    ("arm_r",   (0.90, 0.90, 1.90), (1.45, 0.0, 2.95)),
    ("head",    (1.40, 1.40, 1.00), (0.00, 0.0, 4.45)),
]


def _figure(mat):
    """A blocked-out 5-stud humanoid.

    PROPORTIONAL STAND-IN, not a rig. It is 5 studs tall because that is the
    classic Roblox humanoid height, but the limb sizes are eyeballed. It exists
    to answer "is this greataxe absurd next to a character" -- not to be measured
    against. SPEC.md flags this.
    """
    coll = RR.rig_coll()
    out = []
    for nm, size, cen in FIGURE:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=1.0)
        bmesh.ops.scale(bm, verts=bm.verts, vec=size)
        bmesh.ops.translate(bm, verts=bm.verts, vec=cen)
        me = bpy.data.meshes.new("RIG_FIG_" + nm)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new("RIG_FIG_" + nm, me)
        coll.objects.link(ob)
        out.append(ob)
    return out


SCALE_VIEW = (0.16, 1.0, -0.02)


def scale_ref(out_dir, name="scale_reference.png", long_edge=2600):
    """The whole set stood beside the figure, every grip at hand height.

    The rack is pushed WPN_X clear of the figure rather than overlapping it. The
    first version used 1.60 studs and the one-handed sword crossed the figure's
    arm, which turns a scale diagram into a pose -- and a bad one, since the
    weapon was not in the hand, just in front of it.
    """
    objs = [o for o in bpy.data.objects
            if o.type == 'MESH' and o.name.startswith("WPN_")]
    RR.clear_rig()
    fig = _figure(RR.shell_material(color=(0.55, 0.58, 0.63)))
    # Lift every weapon so its ORIGIN -- i.e. its grip -- sits at hand height.
    # Nothing is nudged per weapon; the shared offset is the whole point.
    saved = [(o, o.location.copy()) for o in objs]
    for o in objs:
        o.location.z += HAND_Z
        o.location.x += WPN_X
    try:
        RR.scene(samples=90, res=RR.fit_res(objs + fig, SCALE_VIEW, long_edge))
        RR.lights()
        RR.camera(objs + fig, view=SCALE_VIEW, lens=105.0, margin=1.05,
                  ortho=ORTHO)
        p = RR.shoot(os.path.join(out_dir, name), show_only=objs + fig)
    finally:
        for o, loc in saved:
            o.location = loc
    return p


def all_passes(out_dir):
    os.makedirs(out_dir, exist_ok=True)
    log = ["heroes: " + ", ".join(heroes(out_dir))]
    for fn in (lineup, wireframe, modules, scale_ref):
        log.append(os.path.basename(fn(out_dir)))
    RR.clear_rig()
    return "\n".join(log)
