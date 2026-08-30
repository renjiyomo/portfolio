"""
build_others.py -- the five non-sword classes: greataxe, spear, recurve bow,
runewarden staff, round shield.

WHAT THIS FILE SHARES WITH THE SWORDS
-------------------------------------
Region ids (R), the palette, the material, the atlas and the shading recipes all
come from the same place. That is the whole point of the set: eight weapons, one
1024 map, one material, one draw call each. Adding a ninth weapon costs a table,
not a texture.

HOLDING CONVENTIONS (see SPEC.md)
---------------------------------
  * length runs along +Z, edge/business end toward +Z;
  * the primary hand centre is the ORIGIN, so z = 0 is where the palm closes;
  * -X is "forward" (the direction the weapon faces in a T-pose);
  * the shield is the one exception and documents its own convention below.
"""
import math

import armory_lib as L
from armory_lib import Part, sec_blade, sec_poly, sec_rrect, stations
from build_swords import R, blade_face_groups

TAU = math.pi * 2.0


# ---------------------------------------------------------------------------
# shading recipes, keyed by region NAME so a weapon's palette reads as English
# ---------------------------------------------------------------------------
RECIPE = {
    "BLADE":      dict(mode="nl", lo=0.24, hi=0.92),
    "EDGE":       dict(mode="nl", lo=0.76, hi=1.00),
    "BEVEL":      dict(mode="nl", lo=0.16, hi=0.66),
    "FULLER":     dict(mode="nl", lo=0.10, hi=0.52),
    "RUNE":       dict(mode="const", hi=0.90),
    "HEAD":       dict(mode="nl", lo=0.20, hi=0.94),
    "HEAD_EDGE":  dict(mode="nl", lo=0.74, hi=1.00),
    "WOOD":       dict(mode="nl", lo=0.18, hi=0.88, stretch="z"),
    "WOOD_DARK":  dict(mode="nl", lo=0.14, hi=0.74, stretch="z"),
    "HAFT_TRIM":  dict(mode="nl", lo=0.24, hi=0.94),
    "LEATHER":    dict(mode="nl", lo=0.16, hi=0.84, stretch="z"),
    "GRIP":       dict(mode="nl", lo=0.16, hi=0.86, stretch="z"),
    "GRIP_TRIM":  dict(mode="nl", lo=0.28, hi=0.96),
    "GUARD":      dict(mode="nl", lo=0.20, hi=0.98, per="vert"),
    "GUARD_TRIM": dict(mode="nl", lo=0.22, hi=0.88),
    "POMMEL":     dict(mode="nl", lo=0.20, hi=0.98, per="vert"),
    "STRING":     dict(mode="nl", lo=0.44, hi=1.00),
    "STONE":      dict(mode="nl", lo=0.18, hi=0.86),
    "GEM":        dict(mode="nl", lo=0.30, hi=1.00, per="vert"),
    "BOSS":       dict(mode="nl", lo=0.22, hi=0.98, per="vert"),
    "RIM":        dict(mode="nl", lo=0.22, hi=0.94),
    "PLANK":      dict(mode="nl", lo=0.18, hi=0.88),
    "RIVET":      dict(mode="nl", lo=0.30, hi=1.00, per="vert"),
    "BONE":       dict(mode="nl", lo=0.22, hi=0.92),
}


def paint_spec(pal):
    """{'WOOD': 'WOOD_WALNUT', ...} -> {region id: full shading dict}.

    A weapon only lists the regions it actually uses, so an unpainted region is
    a typo rather than a silent fallback -- Part._paint prints the region ids it
    could not find.
    """
    return {R[name]: dict(RECIPE[name], pal=sw) for name, sw in pal.items()}


# ---------------------------------------------------------------------------
# shared sweep helpers
# ---------------------------------------------------------------------------
def shell(p, rows, sec_fn, axis="Z", off=(0.0, 0.0, 0.0), cap_a=True,
          cap_b=True, cap_reg=None):
    """One closed swept shell from `rows` (dicts as accepted by stations()).

    Each row carries 'reg', which tags the BAND STARTING AT THAT ROW and ending
    at the next one. The final row's 'reg' is never used.

    Being explicit about that beats inferring a band's region from its two end
    rings: the inference always has to guess at a boundary, and the guess is
    what makes a ferrule bleed a ring of metal into the leather either side.
    """
    regs = [r["reg"] for r in rows]
    p.tube(stations(rows, sec_fn, axis=axis, off=off),
           region=lambda i, j: regs[i], cap_a=cap_a, cap_b=cap_b,
           cap_region=regs[0] if cap_reg is None else cap_reg)
    return p


# Ten samples across the head, poll (0.0) to edge (1.0). TEN, not eleven, and the
# count is load-bearing. sec_axe mirrors this list to build the section, so an
# even count gives 20 points AND a symmetric outline; the previous 11 samples gave
# 20 points only by dropping u=0 and u=1 from the mirrored half, which closed the
# poll with a single diagonal wall slanting from the top face to the bottom face
# instead of a flat vertical one. 20 stays a multiple of 4, which Part.cap needs
# for its Coons grid.
_AXE_US = [0.0, 0.12, 0.26, 0.40, 0.53, 0.66, 0.78, 0.88, 0.95, 1.0]


def sec_axe(row):
    """HORIZONTAL section of an axe head: blunt poll at `lo`, sharp edge at `hi`.

    Swept along Z, this is the only construction that gives a CURVED edge: the
    edge line is x_hi(z), so it is free to arc, and the beard and poll are
    x_lo(z), free to arc separately. Sweeping outward from the eye instead
    (sections in YZ, t = x) forces the edge to be one straight vertical segment
    -- which is exactly why the first version of this axe read as a pizza slice.

    `th` is FULL thickness; the returned y values are half of it.

    The outline is MIRRORED, so the poll and the edge each close with a flat
    vertical wall. Both walls matter: the poll wall is the blunt back of the axe
    and wants to be a visible facet, and the edge wall is the land -- a
    mathematically zero edge gives degenerate faces and a razor that vanishes at
    Roblox's shading resolution anyway.

    The taper past the `sh` shoulder is a WEDGE, and getting that wrong is what
    made three renders of this axe look like a computer mouse. It used to be
    (1 - v*v) ** 0.55, which sounds like a taper and is actually an ellipse: still
    86% of full thickness at the halfway point, then collapsing to the land over
    the last 3% of the span. On a 0.47-stud-thick head that put the entire bevel
    inside about 0.025 studs -- far too narrow to catch the key light, so there
    was no bright edge, no shading break, and nothing to tell the eye it was
    looking at a blade instead of a lump of polished steel.

    (1 - v) ** 1.15 with an explicit land is a real wedge: ~47% thickness at the
    halfway point, ~31% at 2/3, and a thin land at the edge. The bevel is now
    wide enough to be a surface, which is what axe_face_groups() needs in order
    to have somewhere to put the bright edge swatch.

    Returns 2 * 10 points, so caps still close as a Coons quad grid.
    """
    lo, hi, th = row["lo"], row["hi"], row["th"]
    sh = row.get("sh", 0.30)
    span = hi - lo
    land = 0.035        # edge thickness as a fraction of `th`; see below

    def g(u):
        if u <= sh:
            # Cheek: near-full thickness, swelling slightly from poll to shoulder.
            return th * (0.72 + 0.28 * (u / sh) ** 0.75)
        # Bevel: straight-ish wedge down to a land.
        v = (u - sh) / (1.0 - sh)
        return th * (land + (1.0 - land) * (1.0 - v) ** 1.15)

    us = _AXE_US
    top = [(lo + u * span, g(u) * 0.5) for u in us]
    bot = [(lo + u * span, -g(u) * 0.5) for u in reversed(us)]
    return top + bot


def axe_face_groups():
    """Which section-perimeter columns of sec_axe are edge / body / poll.

    Three bands, not two, and the split points are chosen to read as forging
    rather than to match the geometry: the u <= 0.38 band takes the DARK swatch,
    so the mass around the eye and the poll goes forge-black while the ground
    cheek stays bright steel and the outer band goes to polished edge. A real axe
    is dark at the back and bright at the front because only the bevel gets
    ground, and the alternative here -- one swatch over the whole head -- is
    what made a 1.1-stud cheek read as an undifferentiated dome.

    The edge band starts at u = 0.72. It has moved twice, and both moves were
    forced by the taper underneath it. At 0.915 it was tuned against the old
    elliptical taper, where anything below 0.9 was still full thickness and
    painting it bright would have put a highlight on the cheek. The wedge taper
    moved the shoulder out to u ~ 0.56, so the ground bevel is now the whole outer
    44% of the section and 0.84 lit only the outer third of it -- a bright stripe
    floating in the middle of a large unlit bevel, which reads as a specular
    artefact rather than as ground steel. 0.72 lights most of the bevel and leaves
    a band of plain cheek steel between it and the forge-black eye, so the head
    reads back-to-front as forged / ground / polished.

    This costs nothing: it is the same mesh, the same material and the same UV
    atlas. Only which swatch each face samples changes.
    """
    us = _AXE_US
    k = len(us)
    n = 2 * k
    uv = [us[j] if j < k else us[n - 1 - j] for j in range(n)]
    edge, body, poll = set(), set(), set()
    for j in range(n):
        a, b = uv[j], uv[(j + 1) % n]
        if min(a, b) >= 0.720:
            edge.add(j)
        elif min(a, b) >= 0.380:
            body.add(j)
        else:
            poll.add(j)
    return dict(edge=edge, body=body, poll=poll)


def cord(z0, z1, wraps, amp, reg, base=1.0, ease=0.08):
    """Rows for a bound grip: radius modulated by a sine, 4 samples per turn.

    Same reasoning as build_swords.mod_grip -- the wrap is GEOMETRY. At
    1 stud = 1 Blender unit a painted-on wrap is roughly two texels wide and
    disappears; a real ridge survives being viewed from across a field.
    """
    n = max(4, int(round(wraps * 4.0)))
    out = []
    for i in range(n + 1):
        f = i / n
        fade = min(1.0, f / ease) * min(1.0, (1.0 - f) / ease)
        s = base * (1.0 + amp * fade
                    * math.sin(TAU * wraps * f - math.pi * 0.5))
        out.append(dict(t=z0 + (z1 - z0) * f, sx=s, sy=s, reg=reg))
    return out


def lerp_table(tbl, x):
    """Piecewise-linear lookup over [(x, v0, v1, ...), ...]. Clamps at the ends."""
    if x <= tbl[0][0]:
        return tbl[0][1:]
    if x >= tbl[-1][0]:
        return tbl[-1][1:]
    for k in range(len(tbl) - 1):
        a, b = tbl[k], tbl[k + 1]
        if a[0] <= x <= b[0]:
            r = 0.0 if b[0] == a[0] else (x - a[0]) / (b[0] - a[0])
            return tuple(av + (bv - av) * r for av, bv in zip(a[1:], b[1:]))
    return tbl[-1][1:]


# ===========================================================================
# WPN_04 -- greataxe
# ===========================================================================
def build_axe(obj):
    """Two-hander, 4.10 studs. Haft -2.62..1.26, head 0.18..1.48, edge at +1.01 X.

    Deliberately LONGER than the 3.80-stud hero sword: on a rack, a two-hander
    that is shorter than the one-hander next to it reads as a prop rather than
    as the heavy end of the set.
    """
    out = []
    W, WD, T = R["WOOD"], R["WOOD_DARK"], R["HAFT_TRIM"]
    LE, HD, HE, BV = R["LEATHER"], R["HEAD"], R["HEAD_EDGE"], R["BEVEL"]
    RV = R["RIVET"]
    HR = 0.088                      # haft radius

    # ---- haft ------------------------------------------------------------
    # TWO corded grips: the primary hand closes on the origin, the off hand sits
    # down by the butt. A two-hander with one wrap looks like a one-hander that
    # happens to be long -- the second wrap is what states the grip is split,
    # and it is also where ~290 of this weapon's triangles honestly go.
    p = Part("%s__HAFT" % obj)
    rows = [dict(t=-2.620, sx=0.80, sy=0.80, reg=T),
            dict(t=-2.575, sx=1.18, sy=1.18, reg=T),
            dict(t=-2.500, sx=1.13, sy=1.13, reg=WD),
            dict(t=-2.400, sx=1.06, sy=1.06, reg=W)]
    rows += cord(-2.320, -1.560, 4.0, 0.080, LE, base=1.05)
    rows += [dict(t=-1.500, sx=1.08, sy=1.08, reg=T),
             dict(t=-1.440, sx=1.00, sy=1.00, reg=W),
             dict(t=-0.760, sx=1.00, sy=1.00, reg=W),
             dict(t=-0.700, sx=1.10, sy=1.10, reg=T)]
    rows += cord(-0.640, 0.300, 5.0, 0.085, LE, base=1.05)
    rows += [dict(t=0.360, sx=1.10, sy=1.10, reg=T),
             dict(t=0.420, sx=1.00, sy=1.00, reg=W),
             dict(t=0.900, sx=0.99, sy=0.99, reg=W),
             # The haft DIES INSIDE THE EYE at 1.260. The eye only closes over
             # z 0.96..1.30 (that is where head lo(z) is behind the haft), so a
             # haft running past 1.30 would surface through the horn as a sliver.
             dict(t=1.260, sx=0.96, sy=0.96, reg=W)]
    shell(p, rows, lambda r: sec_poly(8, HR), cap_reg=T)
    out.append(("HAFT", p, 34.0))

    # ---- head ------------------------------------------------------------
    p = Part("%s__HEAD" % obj)
    # ONE solid slab swept UP Z, sections horizontal (see sec_axe). hi(z) is the
    # cutting edge; lo(z) is the beard, the eye and the poll.
    #
    # FOURTH rewrite, and the first three all failed the same way, so the reason
    # is worth writing down. They failed because the head's MASS was centred on
    # the eye -- the haft ran up through the middle of the slab. Centre the mass
    # and no amount of shaping lo(z) helps: the silhouette is a symmetric fan,
    # and a symmetric fan on a stick is a sledgehammer.
    #
    # A bearded axe is not a fan. The eye sits in the TOP THIRD (here z
    # 1.06..1.30 of a head spanning 0.24..1.48) and the blade HANGS below and
    # forward of it. That is what gives the notch somewhere to be: lo(z) leaves
    # the haft at z 0.98 and bows forward to +0.372 by z 0.74 and +0.690 at the
    # beard's tip, so the air behind the beard opens from nothing to 0.60 studs
    # across a 0.74-stud notch, and the haft is visible through the whole of it.
    # The gap under the beard is the whole read -- not the edge.
    #
    # FIFTH pass changed the numbers, not the idea. Three things were wrong:
    # the bit reached only 0.906 on a 4.10-stud two-hander, so the head looked
    # under-scaled for the haft it sat on; the stock was 0.285 FULL thickness,
    # which with the old elliptical taper meant a 0.57-stud slab that stayed fat
    # to the edge; and the beard stopped at z 0.34, which kept the notch short.
    #
    # SIXTH pass is about CORNERS, and it is the one that finally stopped the head
    # reading as a hood. Every previous version made hi(z) a single smooth arc
    # with its widest point somewhere in the middle, which is a leaf, not an axe:
    # the profile swelled out and pulled back in with no interruption anywhere, so
    # there was nothing for the eye to read as a cutting edge rather than as the
    # side of a lump. Real axes are recognised by their toe and their heel -- the
    # two corners where the edge stops and the top and bottom faces begin.
    #
    # So the edge is now nearly STRAIGHT and it is bounded by exactly two creases.
    # Between the heel (z 0.290) and the toe (z 1.456) hi runs 0.922 -> 1.030 ->
    # 0.908, a belly of 0.108 studs over 1.166 studs of edge, and -- this is the
    # part that had to be checked numerically rather than by eye -- every change of
    # slope along that run is under 10 deg, i.e. under the crease threshold. An
    # earlier version of this same table had a 11.6 deg turn just above the heel,
    # which would have shaded as a KINK in the one line whose whole job is to look
    # like a single clean edge. The heel turns 28 deg and the toe 45, so both read
    # as hard corners.
    #
    # The top is FLAT, not pointed. The previous rows converged lo and hi toward
    # each other and finished in a narrow ridge, which is just the hood silhouette
    # again rotated 90 deg. Here the last full row (1.456) still spans 1.08 studs
    # and a single 0.024-tall chamfer runs into a flat top cap 0.956 x 0.150 -- the
    # forged top of the stock, which is what an axe actually has, and which gives
    # the rim a bright highlight instead of a vanishing point.
    #
    # The eye rows still enclose the haft (lo is behind -HR from z 1.06 to 1.30,
    # and the cheek is 0.098 half-thick at x=0 there against a haft radius of
    # 0.088) and the beard still leaves the haft at z 0.98, so the notch, the
    # langet seating and the rivet placement are all unchanged in kind.
    head = [dict(t=0.240, lo=0.690, hi=0.860, th=0.062, sh=0.353),
            dict(t=0.290, lo=0.628, hi=0.922, th=0.094, sh=0.320),
            dict(t=0.400, lo=0.545, hi=0.968, th=0.128, sh=0.362),
            dict(t=0.560, lo=0.452, hi=1.005, th=0.166, sh=0.385),
            dict(t=0.740, lo=0.352, hi=1.025, th=0.198, sh=0.420),
            dict(t=0.880, lo=0.222, hi=1.030, th=0.216, sh=0.455),
            dict(t=0.980, lo=0.086, hi=1.022, th=0.228, sh=0.487),
            dict(t=1.060, lo=-0.140, hi=1.008, th=0.235, sh=0.547),
            dict(t=1.180, lo=-0.215, hi=0.988, th=0.235, sh=0.568),
            dict(t=1.300, lo=-0.210, hi=0.962, th=0.232, sh=0.565),
            dict(t=1.400, lo=-0.190, hi=0.932, th=0.226, sh=0.563),
            dict(t=1.456, lo=-0.172, hi=0.908, th=0.216, sh=0.560),
            dict(t=1.480, lo=-0.108, hi=0.848, th=0.150, sh=0.571)]
    g = axe_face_groups()

    def hreg(i, j):
        if j in g["edge"]:
            return HE
        if j in g["body"]:
            return HD
        return BV                   # eye + poll: forge-black

    p.tube(stations(head, sec_axe), region=hreg, cap_region=BV)
    # Langets: two straps riveted down the haft, ending at z 0.98 -- exactly
    # where the head's underside arrives. They answer the question the notch
    # raises (with air behind the beard, what holds the head on?) without
    # FILLING the notch, which would throw away the silhouette they support.
    #
    # Slimmer and shorter than the first pass (0.040 deep over 0.62 studs), which
    # stood proud enough to read as a steel splint bolted to the haft rather than
    # as a strap lying on it. The notch is deeper now, so more of the langet is
    # against open background and its thickness is more visible, not less.
    for sgn in (-1.0, 1.0):
        lg = [dict(t=0.480, sx=0.74, sy=0.90, reg=T),
              dict(t=0.630, sx=0.90, sy=0.98, reg=T),
              dict(t=0.830, sx=0.99, sy=1.00, reg=T),
              dict(t=0.980, sx=1.00, sy=1.00, reg=T)]
        shell(p, lg, lambda r: sec_rrect(0.100, 0.026, 8, 0.5),
              off=(0.0, sgn * (HR + 0.009), 0.0), cap_reg=T)
    # 11.0, not 17.0, and this was the OTHER half of the blob problem. The wedge
    # taper gave the head a real bevel and it STILL shaded soft, because 17 deg is
    # above both angles that matter here. The cheek-to-bevel shoulder turns through
    # about 14.5 deg and the cutting edge itself through about 15.6, so at 17 both
    # were left smooth: the mesh had a ground bevel and a sharp edge, and the
    # shading averaged straight across them -- a very effective way to model a blade
    # and then render a bar of soap. At 11 both crease, while the cheek columns
    # (~3 deg apart) and the bands along the sweep (~9 deg at the worst, near the
    # beard tip) stay smooth, so nothing goes faceted. The new toe and heel corners
    # turn through 44 and 32 deg, so they were never at risk either way.
    out.append(("HEAD", p, 11.0))

    # ---- rivets ----------------------------------------------------------
    # Both inside the eye. The cheek there is ~0.095 HALF-thick now (it was
    # ~0.110 on the thicker stock), so the base sinks to 0.062 and the dome tops
    # out at 0.140 -- about 0.045 proud, the same silhouette as before against a
    # thinner part. The widest ring sits outside the surface on purpose: that is
    # what makes it read as a domed rivet head rather than a disc.
    p = Part("%s__RIVETS" % obj)
    for cz in (1.070, 1.230):
        for sgn in (-1.0, 1.0):
            rv = [dict(t=sgn * 0.062, sx=0.60, sy=0.60, reg=RV),
                  dict(t=sgn * 0.112, sx=1.00, sy=1.00, reg=RV),
                  dict(t=sgn * 0.140, sx=0.74, sy=0.74, reg=RV)]
            if sgn < 0.0:
                rv = list(reversed(rv))
            shell(p, rv, lambda r: sec_poly(8, 0.052), axis="Y",
                  off=(0.0, 0.0, cz), cap_reg=RV)
    out.append(("RIVETS", p, 34.0))
    return out


# ===========================================================================
# WPN_05 -- spear
# ===========================================================================
def build_spear(obj):
    """Winged war spear. Haft -2.60..2.12, head to 3.46, butt spike to -2.86."""
    out = []
    W, T, LE = R["WOOD"], R["HAFT_TRIM"], R["LEATHER"]
    BL, ED, BV, FU = R["BLADE"], R["EDGE"], R["BEVEL"], R["FULLER"]
    HR = 0.070
    g = blade_face_groups(10)

    # ---- haft ------------------------------------------------------------
    p = Part("%s__HAFT" % obj)
    rows = [dict(t=-2.860, sx=0.10, sy=0.10, reg=T),   # butt spike point
            dict(t=-2.760, sx=0.52, sy=0.52, reg=T),
            dict(t=-2.640, sx=0.92, sy=0.92, reg=T),
            dict(t=-2.600, sx=1.14, sy=1.14, reg=T),
            dict(t=-2.540, sx=1.04, sy=1.04, reg=W),
            dict(t=-0.560, sx=1.00, sy=1.00, reg=W),
            dict(t=-0.500, sx=1.10, sy=1.10, reg=T)]
    rows += cord(-0.440, 0.420, 5.0, 0.090, LE, base=1.06)
    rows += [dict(t=0.480, sx=1.10, sy=1.10, reg=T),
             dict(t=0.540, sx=1.00, sy=1.00, reg=W),
             dict(t=1.880, sx=0.98, sy=0.98, reg=W),
             dict(t=1.940, sx=1.12, sy=1.12, reg=T),   # socket collar
             dict(t=2.120, sx=1.06, sy=1.06, reg=T)]
    # A 12-column haft, not 8. This is the one place in the set where the column
    # count is worth paying for: 8 columns on an 0.070 radius gives 45-degree
    # facets, and a spear is the weapon a first-person camera holds closest to
    # the lens, so those facets are the first thing a player sees. 12 gives 30
    # degrees and costs ~190 triangles.
    shell(p, rows, lambda r: sec_poly(12, HR), cap_reg=T)
    out.append(("HAFT", p, 34.0))

    # ---- head ------------------------------------------------------------
    p = Part("%s__HEAD" % obj)
    prof = [(1.980, 0.26, 0.66), (2.070, 0.56, 0.92), (2.180, 0.86, 1.00),
            (2.330, 1.000, 1.00), (2.520, 0.98, 0.97), (2.760, 0.88, 0.90),
            (3.000, 0.68, 0.78), (3.200, 0.44, 0.60), (3.340, 0.24, 0.40),
            (3.420, 0.11, 0.24), (3.460, 0.04, 0.12)]
    table = [dict(t=z, sx=sx, sy=sy) for z, sx, sy in prof]

    def reg(i, j):
        if j in g["edge"]:
            return ED
        if j in g["fuller"]:
            return FU
        if j in g["bevel"]:
            return BV
        return BL

    p.tube(stations(table, lambda r: sec_blade(0.330, 0.086, fuller=0.38,
                                               n_side=10, fuller_w=0.26)),
           region=reg, cap_region=BL)
    # Wings. A plain socketed head reads as a kitchen knife on a stick; the lugs
    # are what say "war spear" at silhouette level, and they cost 4 rings each.
    for sgn in (-1.0, 1.0):
        wg = [dict(t=1.996, sx=1.00, sy=1.00, reg=T),
              dict(t=2.060, sx=0.96, sy=1.06, reg=T),
              dict(t=2.150, sx=0.72, sy=0.96, reg=T),
              dict(t=2.210, sx=0.30, sy=0.62, reg=T)]
        for r_ in wg:
            f = (r_["t"] - 1.996) / 0.214
            r_["off"] = (sgn * (0.052 + 0.150 * f), 0.0, 0.0)
        shell(p, wg, lambda r: sec_rrect(0.110, 0.062, 8, 0.55), cap_reg=T)
    out.append(("HEAD", p, 15.0))
    return out


# ===========================================================================
# WPN_06 -- recurve bow (+ its arrow, a separate MeshPart)
# ===========================================================================
# limb centre-line and section, tabulated for z >= 0 and mirrored.
#   z, x (forward is -X), thickness along X, width along Y
# Widths went up ~40% over the first pass: at 0.044 x 0.074 the tips were
# technically a recurve and visually a coat hanger. A Roblox bow is read at
# arm's length over a shoulder, so the limb has to hold its own silhouette
# against a 2-stud-wide torso.
_LIMB = [(0.000,  0.000, 0.205, 0.330),
         (0.300, -0.096, 0.180, 0.310),
         (0.560, -0.208, 0.148, 0.282),
         (0.860, -0.238, 0.124, 0.248),
         (1.140, -0.178, 0.104, 0.208),
         (1.360, -0.028, 0.090, 0.168),
         (1.530,  0.180, 0.076, 0.128),
         (1.620,  0.306, 0.064, 0.104)]
X_TIP = _LIMB[-1][1]


def build_bow(obj):
    """Recurve, braced. Limbs -1.62..1.62, string chord at x = X_TIP.

    -X is the target side, so the riser bellies forward and the string sits on
    the archer's side. The limb is ONE continuous shell from tip to tip: split
    into three objects it would need three welds and three sets of nocks.
    """
    out = []
    WD, W, T = R["WOOD_DARK"], R["WOOD"], R["HAFT_TRIM"]
    LE, ST, BN = R["LEATHER"], R["STRING"], R["BONE"]

    p = Part("%s__LIMB" % obj)
    # Station density is biased toward the tips (the ** 0.92) because that is
    # where the recurve turns hardest and a straight chord shows.
    zs = [1.620 * (abs(k) / 18.0) ** 0.92 * (1 if k >= 0 else -1)
          for k in range(-18, 19)]
    # The riser is a SMOOTH swell, not a corded grip. Cord bumps here put a hard
    # step exactly where the leather ends, and in the render it read as a snapped
    # limb -- a bow riser is a wrapped handle, and the wrap is a colour change
    # plus a gentle swell, nothing more.
    SWELL, SW_Z = 0.11, 0.520
    zs += [-0.320, -0.300, 0.300, 0.320, -SW_Z, SW_Z]
    zs = sorted(set(round(z, 4) for z in zs))

    rows = []
    for z in zs:
        x, th, wd = lerp_table(_LIMB, abs(z))
        s = 1.0
        if abs(z) < SW_Z:
            s += SWELL * math.cos(math.pi * z / (2.0 * SW_Z))
        if abs(z) <= 0.300:
            reg = LE
        elif abs(z) <= 0.320:
            reg = T                             # the wrap's whipping ring
        elif abs(z) >= 1.500:
            reg = BN                            # horn nock overlays at the tips
        else:
            reg = WD if (abs(z) < 0.700) else W
        rows.append(dict(t=z, ox=x, th=th * s, wd=wd * s, reg=reg))
    shell(p, rows, lambda r: sec_rrect(r["th"], r["wd"], 12, 0.42), cap_reg=BN)
    out.append(("LIMB", p, 40.0))

    # ---- string ----------------------------------------------------------
    # A 4-sided section at 0.015 studs. Roblox will not resolve a rounder one,
    # and a plane would be a boundary edge -- i.e. a hole in a closed shell.
    # Deliberately thin: at 0.020 with a pale swatch the string was the
    # brightest object in the render and pulled the eye off the limb.
    p = Part("%s__STRING" % obj)
    srv = 0.230                                  # centre serving, thicker
    rows = [dict(t=-1.606, sx=1.00, sy=1.00, reg=ST),
            dict(t=-srv, sx=1.00, sy=1.00, reg=ST),
            dict(t=-srv + 0.001, sx=1.85, sy=1.85, reg=BN),
            dict(t=srv - 0.001, sx=1.85, sy=1.85, reg=ST),
            dict(t=srv, sx=1.00, sy=1.00, reg=ST),
            dict(t=1.606, sx=1.00, sy=1.00, reg=ST)]
    shell(p, rows, lambda r: sec_poly(4, 0.015, rot=math.pi * 0.25),
          off=(X_TIP, 0.0, 0.0), cap_reg=ST)
    out.append(("STRING", p, 60.0))
    return out


# ===========================================================================
# WPN_06B -- arrow (ships with the bow)
# ===========================================================================
def build_arrow(obj):
    """Nock at the ORIGIN, head at +Z 2.64. Its own mesh, on purpose.

    The first version built the arrow inside the bow's collection at the same
    origin, so the fletchings landed on top of the riser and the shaft crossed
    the limb -- in a render it read as a stray stick, and in Roblox it would
    have been one MeshPart the engine could never nock, draw or fire separately.
    """
    out = []
    W, T, BN = R["WOOD"], R["HAFT_TRIM"], R["BONE"]
    HD, HE, FL = R["HEAD"], R["HEAD_EDGE"], R["RUNE"]

    p = Part("%s__SHAFT" % obj)
    ah = [dict(t=0.000, sx=0.62, sy=0.62, reg=BN),     # nock
          dict(t=0.045, sx=1.00, sy=1.00, reg=BN),
          dict(t=0.090, sx=0.90, sy=0.90, reg=W),
          dict(t=2.060, sx=0.90, sy=0.90, reg=W),
          dict(t=2.110, sx=1.06, sy=1.06, reg=T),      # socket ferrule
          dict(t=2.170, sx=0.86, sy=0.86, reg=T)]
    shell(p, ah, lambda r: sec_poly(8, 0.032), cap_reg=BN)
    out.append(("SHAFT", p, 26.0))

    p = Part("%s__HEAD" % obj)
    # A broadhead is FLAT. Built rotationally symmetric (the first version) it is
    # a cone, and a cone on a stick is a dart, not an arrow -- the barbed
    # triangle is the whole reason an arrowhead is recognisable in silhouette.
    bh = [dict(t=2.120, th=0.058, wd=0.072, reg=HD),
          dict(t=2.200, th=0.052, wd=0.130, reg=HD),
          dict(t=2.255, th=0.046, wd=0.246, reg=HD),   # barb shoulders
          dict(t=2.310, th=0.042, wd=0.252, reg=HD),
          dict(t=2.470, th=0.034, wd=0.186, reg=HD),
          dict(t=2.620, th=0.024, wd=0.104, reg=HE),
          dict(t=2.730, th=0.011, wd=0.028, reg=HE)]
    shell(p, bh, lambda r: sec_rrect(r["th"], r["wd"], 12, 0.44), cap_reg=HD)
    out.append(("HEAD", p, 15.0))

    p = Part("%s__FLETCHING" % obj)
    # Vanes are 0.130 deep off an 0.030 offset, so they reach ~3x the shaft
    # radius. The first pass ran 0.230 off 0.050 -- at that depth three vanes
    # merge into one red lozenge and stop reading as feathers at all.
    for k in range(3):
        a = TAU * k / 3.0 + math.pi * 0.5
        fl = [dict(t=0.135, sx=0.10, sy=0.20, reg=FL),
              dict(t=0.235, sx=1.00, sy=0.86, reg=FL),
              dict(t=0.640, sx=1.00, sy=1.00, reg=FL),
              dict(t=0.740, sx=0.38, sy=0.26, reg=FL)]
        for r_ in fl:
            r_["roll"] = a
            r_["off"] = (0.030 * math.cos(a), 0.030 * math.sin(a), 0.0)
        shell(p, fl, lambda r: sec_rrect(0.020, 0.130, 8, 0.5), cap_reg=FL)
    out.append(("FLETCHING", p, 30.0))
    return out


# ===========================================================================
# WPN_07 -- runewarden staff
# ===========================================================================
def build_staff(obj):
    """Haft -2.10..1.28, claw setting 1.16..1.79, stone seated in the claw."""
    out = []
    W, WD, T = R["WOOD"], R["WOOD_DARK"], R["HAFT_TRIM"]
    LE, RU, GE = R["LEATHER"], R["RUNE"], R["GEM"]
    HR = 0.092                     # was 0.076: next to a 0.088 axe haft and an
                                   # 0.070 spear haft the staff read as a cane.

    p = Part("%s__HAFT" % obj)
    # Regions are assigned by a function of z AFTER the station list is sorted,
    # not baked in as the rows are appended. A hand-inserted glowing band gets
    # silently cut in half the moment another row lands inside it; deciding the
    # region from the final z is the only version of this that stays correct.
    bands = (-1.240, 0.760)
    # A rune band is a CHAMFERED RING, not a scale step. The flat 1.075 bump of
    # the first pass rendered as violet tape wrapped round a dowel -- no shoulder
    # to catch the key light, so nothing said "inlaid metal".
    BAND_H = 0.090
    BAND_PROF = ((0.000, 1.00), (0.018, 1.12), (0.030, 1.18),
                 (0.060, 1.18), (0.072, 1.12), (0.090, 1.00))

    def reg_of(z):
        for zb in bands:
            # Only the FLAT TOP of the ring glows. The chamfers stay trim metal,
            # so the band reads as a gold ferrule with a rune line inlaid in it.
            # Glowing the whole band -- chamfers included -- gives a uniform
            # violet ring with no metal to catch the key light, and that is what
            # made the first version look like tape wrapped round a dowel.
            if zb + 0.030 - 1e-6 <= z < zb + 0.060 - 1e-6:
                return RU
            if zb <= z < zb + BAND_H - 1e-6:
                return T
        return LE if -0.520 <= z <= 0.400 else WD

    def band_mult(z):
        for zb in bands:
            if zb - 1e-6 <= z <= zb + BAND_H + 1e-6:
                return lerp_table(BAND_PROF, z - zb)[0]
        return 1.0

    zs = [-1.990 + (0.700 + 1.990) * k / 22.0 for k in range(1, 22)]
    zs += [1.020]
    for zb in bands:
        zs += [zb + d for d, _ in BAND_PROF]
    grip = cord(-0.480, 0.360, 5.0, 0.070, LE)
    bumps = {round(r["t"], 4): r["sx"] for r in grip}
    zs = sorted(set([round(z, 4) for z in zs] + list(bumps)))

    rows = [dict(t=-2.100, sx=0.74, sy=0.74, reg=T),
            dict(t=-2.060, sx=1.12, sy=1.12, reg=T),
            dict(t=-1.990, sx=1.06, sy=1.06, reg=WD)]
    for z in zs:
        # A carved staff is not a dowel. Radius wanders a few percent on a slow
        # sine so the silhouette has some life; costs exactly nothing.
        s = 1.02 + 0.045 * math.sin(2.3 * z + 0.6) + 0.020 * math.sin(5.1 * z)
        s *= bumps.get(round(z, 4), 1.0) * band_mult(z)
        rows.append(dict(t=z, sx=s, sy=s, reg=reg_of(z)))
    rows += [dict(t=1.140, sx=1.16, sy=1.16, reg=T),
             dict(t=1.280, sx=1.10, sy=1.10, reg=T)]
    shell(p, rows, lambda r: sec_poly(8, HR), cap_reg=T)
    out.append(("HAFT", p, 40.0))

    # ---- claw setting ----------------------------------------------------
    p = Part("%s__CLAW" % obj)
    # Five talons that bulge out around the stone's equator and curl back in
    # over its crown. The stone is SEATED, not floating: an unattached crystal is
    # a Roblox weld waiting to go wrong, and it reads as a bug rather than magic.
    #
    # The half-step in the angle matters: with a talon on the front centre line
    # the setting's own gold hides the gem it exists to show off. Offset by half a
    # step and the camera looks straight into the GAP between two talons.
    claw = [(0.000, 1.00, 0.098), (0.200, 0.96, 0.152), (0.420, 0.82, 0.205),
            (0.640, 0.62, 0.196), (0.830, 0.42, 0.140), (1.000, 0.18, 0.072)]
    for k in range(5):
        a = TAU * (k + 0.5) / 5.0 - math.pi * 0.5
        ca, sa = math.cos(a), math.sin(a)
        rows = [dict(t=1.160 + f * 0.630, sx=s, sy=s, roll=a,
                     off=(dx * ca, dx * sa, 0.0), reg=T)
                for f, s, dx in claw]
        shell(p, rows, lambda r: sec_rrect(0.092, 0.072, 8, 0.5), cap_reg=T)
    out.append(("CLAW", p, 34.0))

    p = Part("%s__STONE" % obj)
    # Faceted bicone: 8 sides, a hard equator, and no smooth shading across the
    # facet breaks. That is what separates "cut crystal" from "blue ball".
    st = [(0.000, 0.09), (0.105, 0.44), (0.215, 0.74), (0.320, 0.92),
          (0.415, 1.00), (0.545, 1.00), (0.665, 0.90), (0.790, 0.70),
          (0.905, 0.42), (1.000, 0.08)]
    rows = [dict(t=1.180 + f * 0.680, sx=s, sy=s, reg=GE) for f, s in st]
    shell(p, rows, lambda r: sec_poly(8, 0.190), cap_reg=GE)
    out.append(("STONE", p, 12.0))
    return out


# ===========================================================================
# WPN_08 -- round shield
# ===========================================================================
# The shield is the one piece that does not run along +Z.
#   * the face is a disc in the XZ plane, convex toward -Y (-Y = forward);
#   * the origin is the GRIP BAR centre, i.e. the fist, not the disc centre,
#     so the shield rotates about the hand the way a held shield does.
SHIELD_DY = -0.205          # pushes the disc forward of the grip bar
_N_SH = 24                  # perimeter columns; 6 gores of 4
_GORES = 6


def build_shield(obj):
    out = []
    PL, WD, RM = R["PLANK"], R["WOOD_DARK"], R["RIM"]
    BO, RV, LE, T = R["BOSS"], R["RIVET"], R["LEATHER"], R["HAFT_TRIM"]

    # ---- disc: front face, rim roll and back face as ONE closed shell ----
    p = Part("%s__DISC" % obj)
    disc = [(-0.200, 0.050), (-0.192, 0.300), (-0.168, 0.620), (-0.126, 0.900),
            (-0.062, 1.128), (-0.008, 1.216),          # front, then the lip
            (0.062, 1.252), (0.132, 1.238),            # rim roll
            (0.150, 1.150), (0.132, 0.900), (0.112, 0.560), (0.100, 0.180),
            (0.098, 0.045)]                            # back face
    n_front = 6                                        # rows 0..5 are the face
    n_rim = 8                                          # rows 6..7 are the rim
    rows = [dict(t=y, sx=r, sy=r, reg=0) for y, r in disc]

    def reg(i, j):
        if i >= n_rim:
            return WD
        if i >= n_front:
            return RM
        # radial gores: 24 columns / 6 gores = 4 columns each, alternating.
        # Cost: nothing. A painted quartered shield is one of the most
        # recognisable objects in the genre and this is the whole of it.
        return PL if ((j * _GORES) // _N_SH) % 2 else WD

    p.tube(stations(rows, lambda r: sec_poly(_N_SH, 1.0), axis="Y",
                    off=(0.0, SHIELD_DY, 0.0)),
           region=reg, cap_region=WD)
    out.append(("DISC", p, 30.0))

    # ---- boss, rivets ----------------------------------------------------
    p = Part("%s__FITTINGS" % obj)
    boss = [(0.000, 1.00), (0.180, 0.96), (0.420, 0.80), (0.680, 0.56),
            (0.870, 0.30), (1.000, 0.08)]
    rows = [dict(t=-0.170 - f * 0.230, sx=s, sy=s, reg=BO) for f, s in boss]
    rows = list(reversed(rows))                  # keep t ascending
    shell(p, rows, lambda r: sec_poly(12, 0.245), axis="Y",
          off=(0.0, SHIELD_DY, 0.0), cap_reg=BO)
    for k in range(8):
        a = TAU * k / 8.0 + math.pi / 8.0
        cx, cz = 1.035 * math.cos(a), 1.035 * math.sin(a)
        # base ring sits behind the face (the disc surface is at y ~ -0.088 out
        # here), so ~0.05 of stud shows and it reads as a rivet, not a spike
        rv = [dict(t=-0.140, sx=0.72, sy=0.72, reg=RV),
              dict(t=-0.112, sx=1.00, sy=1.00, reg=RV),
              dict(t=-0.062, sx=0.92, sy=0.92, reg=RV)]
        shell(p, rv, lambda r: sec_poly(8, 0.050), axis="Y",
              off=(cx, SHIELD_DY, cz), cap_reg=RV)
    out.append(("FITTINGS", p, 34.0))

    # ---- grip bar + brackets --------------------------------------------
    p = Part("%s__GRIP" % obj)
    # The bar spans x, centred on the origin, so the fist closes at (0,0,0).
    bar = [dict(t=-0.470, sx=0.30, sy=0.30, reg=T),
           dict(t=-0.400, sx=1.00, sy=1.00, reg=T),
           dict(t=-0.230, sx=1.00, sy=1.00, reg=LE)]
    bar += [dict(t=r["t"], sx=r["sx"], sy=r["sy"], reg=LE)
            for r in cord(-0.220, 0.220, 3.0, 0.085, LE)]
    bar += [dict(t=0.230, sx=1.00, sy=1.00, reg=T),
            dict(t=0.400, sx=1.00, sy=1.00, reg=T),
            dict(t=0.470, sx=0.30, sy=0.30, reg=T)]
    shell(p, bar, lambda r: sec_rrect(0.120, 0.096, 8, 0.5), axis="X",
          cap_reg=T)
    for sgn in (-1.0, 1.0):
        br = [dict(t=SHIELD_DY + 0.098, sx=0.94, sy=1.00, reg=T),
              dict(t=SHIELD_DY + 0.060, sx=1.00, sy=1.00, reg=T),
              dict(t=-0.030, sx=1.00, sy=1.00, reg=T),
              dict(t=0.010, sx=0.80, sy=0.88, reg=T)]
        shell(p, br, lambda r: sec_rrect(0.150, 0.086, 8, 0.5), axis="Y",
              off=(sgn * 0.400, 0.0, 0.0), cap_reg=T)
    out.append(("GRIP", p, 34.0))
    return out


# ===========================================================================
# the table the rest of the pipeline reads
# ===========================================================================
WEAPONS = {
    # A grip swatch has to clear the haft swatch it sits on by a wide margin in
    # LUMINANCE, not just in hue -- the atlas bakes a light ramp into every
    # swatch, so two browns 10% apart end up overlapping once the ramp is
    # applied and the wrap reads as a bumpy haft instead of as a wrap. The three
    # pairs below were all too close on the first pass and were re-picked:
    #   axe    walnut 82 + cord_linen 182   (was leather_dark 57, 25 apart)
    #   spear  ash   138 + leather_dark 57  (was leather_tan  107, 31 apart)
    #   staff  ebon   47 + leather_tan 107  (was leather_oxb   64, 18 apart)
    # Numbers are Rec.601 luma of the base hex, 0-255.
    "AXE": dict(
        obj="WPN_04_Greataxe_Ironjaw", title="Ironjaw Greataxe",
        rarity="Rare", hands=2, build=build_axe,
        pal=dict(WOOD="WOOD_WALNUT", WOOD_DARK="WOOD_EBON",
                 HAFT_TRIM="IRON_RAW", LEATHER="CORD_LINEN",
                 HEAD="STEEL_COLD", HEAD_EDGE="STEEL_EDGE",
                 BEVEL="STEEL_DARK", RIVET="BRASS_DARK")),
    "SPEAR": dict(
        obj="WPN_05_Spear_Wardens_Pike", title="Warden's Pike",
        rarity="Common", hands=2, build=build_spear,
        pal=dict(WOOD="WOOD_ASH", HAFT_TRIM="IRON_RAW",
                 LEATHER="LEATHER_DARK", BLADE="STEEL_COLD",
                 EDGE="STEEL_EDGE", BEVEL="STEEL_DARK", FULLER="IRON_RAW")),
    "BOW": dict(
        obj="WPN_06_Bow_Recurve_Hunters", title="Hunter's Recurve",
        rarity="Rare", hands=2, build=build_bow,
        pal=dict(WOOD="WOOD_ASH", WOOD_DARK="WOOD_WALNUT",
                 HAFT_TRIM="BONE_IVORY", LEATHER="LEATHER_DARK",
                 STRING="STRING_PALE", BONE="BONE_IVORY")),
    "ARROW": dict(
        obj="WPN_06B_Arrow_Hunters", title="Broadhead Arrow",
        rarity="Common", hands=0, build=build_arrow, accessory="BOW",
        pal=dict(WOOD="WOOD_ASH", HAFT_TRIM="COPPER_PATINA",
                 BONE="BONE_IVORY", HEAD="STEEL_COLD",
                 HEAD_EDGE="STEEL_EDGE", RUNE="CLOTH_CRIMSON")),
    "STAFF": dict(
        obj="WPN_07_Staff_Runewarden", title="Runewarden Staff",
        rarity="Legendary", hands=2, build=build_staff,
        pal=dict(WOOD="WOOD_EBON", WOOD_DARK="WOOD_EBON",
                 HAFT_TRIM="GOLD_RICH", LEATHER="LEATHER_TAN",
                 RUNE="RUNE_VIOLET", GEM="GEM_SAPPHIRE")),
    "SHIELD": dict(
        obj="WPN_08_Shield_Round_Bulwark", title="Bulwark Round Shield",
        rarity="Common", hands=1, build=build_shield,
        pal=dict(PLANK="CLOTH_CRIMSON", WOOD_DARK="WOOD_ASH",
                 RIM="IRON_RAW", BOSS="STEEL_COLD", RIVET="IRON_RAW",
                 LEATHER="LEATHER_DARK", HAFT_TRIM="WOOD_WALNUT")),
}
ORDER = ("AXE", "SPEAR", "BOW", "ARROW", "STAFF", "SHIELD")


def build_weapon(key, root, mat, rack_x=0.0):
    cfg = WEAPONS[key]
    coll = L.ensure_collection(cfg["obj"], root)
    spec = paint_spec(cfg["pal"])
    objs = []
    for tag, part, sharp in cfg["build"](cfg["obj"]):
        objs.append(part.finalize(coll, mat, spec, sharp_deg=sharp,
                                  loc=(rack_x, 0.0, 0.0)))
    return coll, objs
