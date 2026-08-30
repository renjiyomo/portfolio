"""
build_all.py -- one entry point that builds the whole set into the open scene.

Kept separate from the two builder modules so the Blender-side call is a single
import and the rack layout lives in exactly one place. RACK is the x offset of
each weapon in the presentation lineup; it has no effect on the exported
meshes, which are all authored around their own origin.
"""
import os

import armory_lib as L
import build_others as BO
import build_swords as BS

# x offsets for the lineup, chosen so nothing overlaps: the axe edge reaches
# +1.00 and the shield is 2.50 wide, so those two get more room than the rest.
# The arrow gets its own slot because it is its own MeshPart -- parked at the
# bow's origin it crossed the limb and dropped its fletchings on the riser.
RACK = (("T1", 0.00), ("T2", 1.10), ("T3", 2.25),
        ("AXE", 3.85), ("SPEAR", 5.55), ("BOW", 6.55),
        ("ARROW", 7.45), ("STAFF", 8.35), ("SHIELD", 10.30))

# display order, title and rarity for every piece, sourced from the builders so
# SPEC.md and the contact sheet can never disagree with the model.
def manifest():
    rows = []
    for key, x in RACK:
        if key in BS.TIERS:
            c = BS.TIERS[key]
            rows.append(dict(key=key, x=x, obj=c["obj"], title=c["title"],
                             rarity=c["rarity"], hands=1))
        else:
            c = BO.WEAPONS[key]
            rows.append(dict(key=key, x=x, obj=c["obj"], title=c["title"],
                             rarity=c["rarity"], hands=c["hands"],
                             accessory=c.get("accessory")))
    return rows


def build(tex_dir):
    L.reset_scene()
    mat = L.build_master_material(tex_dir)
    root = L.ensure_collection("WEAPONS", None)
    per_obj, per_weapon, allo = {}, {}, []
    for key, x in RACK:
        if key in BS.TIERS:
            coll, objs = BS.build_tier(key, root, mat, rack_x=x)
        else:
            coll, objs = BO.build_weapon(key, root, mat, rack_x=x)
        per_weapon[coll.name] = 0
        for ob in objs:
            n = len(ob.data.polygons) * 2
            per_obj[ob.name] = n
            per_weapon[coll.name] += n
        allo += objs
    return dict(mat=mat, root=root, objs=allo, per_obj=per_obj,
                per_weapon=per_weapon)


def report(res):
    rows, bad = L.qc_report(res["objs"])
    lines = []
    for name, n in res["per_weapon"].items():
        lines.append("%-34s %5d tris" % (name, n))
    lines.append("%-34s %5d tris  (%d objects)"
                 % ("TOTAL", sum(res["per_weapon"].values()), len(res["objs"])))
    lines.append("QC: %s" % ("; ".join(bad) if bad else "clean"))
    return "\n".join(lines), bad
