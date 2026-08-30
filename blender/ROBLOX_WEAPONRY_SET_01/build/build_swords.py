"""
build_swords.py -- the hero sword line: one modular kit, three rarity tiers.

THE ARGUMENT THIS FILE MAKES
----------------------------
All three tiers are built from the same four modules (BLADE, GUARD, GRIP,
POMMEL) seated on the same SOCKETS table. The socket heights never change
between tiers, so:

  * the grip contact point, and therefore a Tool's weld offset, is identical
    across all three -- one animation set, one attachment, three weapons;
  * total length and blade envelope are identical, so reach and hitbox tuning
    carry over;
  * a new tier is a new row in TIERS, not a new model. That is what makes a
    rarity variant a $5 task instead of a $30 one.

Region ids are shared with build_others.py via armory_lib-side paint specs.
"""
import math

import armory_lib as L
from armory_lib import Part, sec_blade, sec_poly, sec_rrect, stations

# ---------------------------------------------------------------------------
# region ids (shared vocabulary across the whole set)
# ---------------------------------------------------------------------------
R = dict(BLADE=1, EDGE=2, BEVEL=3, FULLER=4, RUNE=5, GUARD=6, GUARD_TRIM=7,
         GRIP=8, GRIP_TRIM=9, POMMEL=10, GEM=11, WOOD=12, WOOD_DARK=13,
         HEAD=14, HEAD_EDGE=15, STRING=16, STONE=17, BOSS=18, RIM=19,
         PLANK=20, RIVET=21, LEATHER=22, BONE=23, HAFT_TRIM=24)

# ---------------------------------------------------------------------------
# THE SOCKET TABLE -- identical for every tier. Heights in studs, hand at z=0.
# ---------------------------------------------------------------------------
SOCKETS = dict(
    POMMEL_BASE=-0.520,   # bottom of the weapon
    POMMEL_TOP=-0.280,    # pommel / grip seam
    GRIP_A=-0.280,        # grip bottom
    GRIP_B=0.260,         # grip top  (hand centre sits at z = 0)
    GUARD_A=0.260,        # guard bottom, seats on the grip
    GUARD_B=0.420,        # guard top
    BLADE_A=0.380,        # blade root, 40 thou inside the guard
    BLADE_TIP=3.280,      # point
)
BLADE_LEN = SOCKETS["BLADE_TIP"] - SOCKETS["BLADE_A"]
TOTAL_LEN = SOCKETS["BLADE_TIP"] - SOCKETS["POMMEL_BASE"]

# Where a runed fuller starts and stops, as a fraction of blade length. Kept
# out of the tier table because it is a style rule for the whole set, not a
# per-weapon dial.
RUNE_LO, RUNE_HI = 0.075, 0.700


def blade_face_groups(n_side):
    """Classify the section-perimeter face columns of a blade.

    Returns index sets keyed 'edge' (the sharpened land), 'bevel' (the flat
    behind it), 'fuller' (the groove floor) and everything else falls through
    to the blade body. Derived from the section, never hand-listed, so it stays
    correct if the section resolution changes.
    """
    us = L._BLADE_US[n_side]
    n = 2 * n_side
    uv = [us[i] if i <= n_side else us[2 * n_side - i] for i in range(n)]
    edge, bevel, fuller = set(), set(), set()
    for j in range(n):
        a, b = uv[j], uv[(j + 1) % n]
        hi, mean = max(abs(a), abs(b)), (abs(a) + abs(b)) * 0.5
        if hi >= 0.999:
            edge.add(j)
        elif max(abs(a), abs(b)) <= 0.235:
            fuller.add(j)
        elif mean >= 0.72:
            bevel.add(j)
    return dict(edge=edge, bevel=bevel, fuller=fuller)


# ---------------------------------------------------------------------------
# tier table -- the only thing that differs between the three swords
# ---------------------------------------------------------------------------
TIERS = {
    "T1": dict(
        obj="WPN_01_Sword_T1_Common",
        title="Wayfarer Longsword",
        rarity="Common",
        blade=dict(w=0.460, th=0.090, fuller=0.20, fw=0.24, n_side=8, taper=0.88),
        guard=dict(style="bar", span=0.430, h=0.160, th=0.124, arc=-0.012,
                   wing=0.0, prongs=False, collar=False),
        grip=dict(r=0.064, waist=0.93, wraps=5.5, cord=0.095, risers=0),
        pommel=dict(kind="wheel", r=0.124, gem=None),
        pal=dict(BLADE="STEEL_COLD", EDGE="STEEL_EDGE", BEVEL="STEEL_DARK",
                 FULLER="IRON_RAW", GUARD="STEEL_DARK", GUARD_TRIM="IRON_RAW",
                 GRIP="LEATHER_TAN", GRIP_TRIM="IRON_RAW", POMMEL="STEEL_DARK",
                 GEM="GEM_AMBER", RUNE="RUNE_CYAN"),
    ),
    "T2": dict(
        obj="WPN_02_Sword_T2_Rare",
        title="Gilded Oathblade",
        rarity="Rare",
        blade=dict(w=0.460, th=0.094, fuller=0.42, fw=0.19, n_side=10, taper=0.86),
        guard=dict(style="swept", span=0.470, h=0.174, th=0.124, arc=-0.008,
                   wing=0.072, prongs=False, collar=True),
        grip=dict(r=0.064, waist=0.91, wraps=6.0, cord=0.105, risers=2),
        pommel=dict(kind="teardrop", r=0.106, gem="GEM_AMBER"),
        pal=dict(BLADE="STEEL_COLD", EDGE="SILVER_BRIGHT", BEVEL="STEEL_DARK",
                 FULLER="STEEL_DARK", GUARD="BRASS", GUARD_TRIM="BRASS_DARK",
                 GRIP="CORD_LINEN", GRIP_TRIM="BRASS", POMMEL="BRASS",
                 GEM="GEM_AMBER", RUNE="RUNE_CYAN"),
    ),
    "T3": dict(
        obj="WPN_03_Sword_T3_Legendary",
        title="Duskwarden, Crown of the First Watch",
        rarity="Legendary",
        blade=dict(w=0.460, th=0.096, fuller=0.44, fw=0.155, n_side=10,
                   taper=0.84, runes=8),
        guard=dict(style="swept", span=0.512, h=0.182, th=0.128, arc=0.004,
                   wing=0.100, prongs=True, collar=True),
        grip=dict(r=0.064, waist=0.91, wraps=6.0, cord=0.105, risers=3),
        pommel=dict(kind="orb", r=0.110, gem="GEM_SAPPHIRE"),
        pal=dict(BLADE="BLUED_STEEL", EDGE="SILVER_BRIGHT", BEVEL="STEEL_DARK",
                 FULLER="STEEL_DARK", GUARD="GOLD_RICH", GUARD_TRIM="BRASS_DARK",
                 GRIP="LEATHER_OXB", GRIP_TRIM="GOLD_RICH", POMMEL="GOLD_RICH",
                 GEM="GEM_SAPPHIRE", RUNE="RUNE_CYAN"),
    ),
}


def paint_spec(pal):
    """Region -> swatch + shading recipe, for one tier's palette.

    lo/hi are the ends of the value ramp each region samples inside its swatch.
    They are pushed apart deliberately: a blade whose body, bevel and edge all
    land mid-ramp reads as one flat slab no matter how good the section is.
    """
    return {
        R["BLADE"]: dict(pal=pal["BLADE"], mode="nl", lo=0.24, hi=0.92),
        R["EDGE"]: dict(pal=pal["EDGE"], mode="nl", lo=0.76, hi=1.00),
        R["BEVEL"]: dict(pal=pal["BEVEL"], mode="nl", lo=0.16, hi=0.66),
        R["FULLER"]: dict(pal=pal["FULLER"], mode="nl", lo=0.10, hi=0.52),
        R["RUNE"]: dict(pal=pal["RUNE"], mode="const", hi=0.90),
        R["GUARD"]: dict(pal=pal["GUARD"], mode="nl", lo=0.20, hi=0.98,
                         per="vert"),
        R["GUARD_TRIM"]: dict(pal=pal["GUARD_TRIM"], mode="nl", lo=0.22, hi=0.88),
        R["GRIP"]: dict(pal=pal["GRIP"], mode="nl", lo=0.16, hi=0.86,
                        stretch="z"),
        R["GRIP_TRIM"]: dict(pal=pal["GRIP_TRIM"], mode="nl", lo=0.28, hi=0.96),
        R["POMMEL"]: dict(pal=pal["POMMEL"], mode="nl", lo=0.20, hi=0.98,
                          per="vert"),
        # The gem swatch ramp is not a linear value ramp -- it has a deep core
        # low down and a narrow facet catch near the top. Driving it by height
        # ('h') parks every face mid-ramp, because the stone occupies a sliver of
        # the pommel's z range, and the stone renders as a dark blob. Driving it
        # by the light instead puts the facet catch on the facets that actually
        # face the key.
        R["GEM"]: dict(pal=pal["GEM"], mode="nl", lo=0.30, hi=1.00, per="vert"),
    }


# ---------------------------------------------------------------------------
# modules
# ---------------------------------------------------------------------------
def mod_blade(name, cfg):
    """BLADE module: seats on socket BLADE_A, tip at BLADE_TIP."""
    p = Part(name)
    b, S = cfg["blade"], SOCKETS
    g = blade_face_groups(b["n_side"])
    z0, z1 = S["BLADE_A"], S["BLADE_TIP"]
    span = z1 - z0
    # station table as fractions of blade length: a narrow ricasso shoulder at
    # the root, a long straight run, then the taper into the point. Width and
    # thickness taper on separate curves so the blade thins before it narrows --
    # that is what stops it reading as a spike.
    prof = [(0.000, 0.840, 0.955), (0.017, 0.910, 1.000), (0.045, 1.000, 1.000),
            (0.350, 0.985, 0.950), (0.620, 0.950, 0.890), (0.780, 0.900, 0.830),
            (0.855, 0.610, 0.700), (0.915, 0.380, 0.560), (0.960, 0.205, 0.410),
            (0.985, 0.108, 0.280), (1.000, 0.050, 0.150)]

    def at(f):
        """Piecewise-linear lookup into prof, so extra stations can be inserted
        for the rune dashes without hand-editing the profile."""
        for k in range(len(prof) - 1):
            f0, w0, t0 = prof[k]
            f1, w1, t1 = prof[k + 1]
            if f0 <= f <= f1:
                r = 0.0 if f1 == f0 else (f - f0) / (f1 - f0)
                return w0 + (w1 - w0) * r, t0 + (t1 - t0) * r
        return prof[-1][1], prof[-1][2]

    fs = [f for f, _, _ in prof]
    if b.get("runes"):
        # RUNE_LO..RUNE_HI is cut into 2*RUNE_N bands; alternate ones glow. The
        # dashes are region ids on existing faces, so the only cost is the extra
        # ring loops -- no second material, no second UV set, no decals.
        step = (RUNE_HI - RUNE_LO) / (2.0 * b["runes"])
        fs += [RUNE_LO + i * step for i in range(2 * b["runes"] + 1)]
    fs = sorted(set(round(f, 5) for f in fs))

    tp = b["taper"]
    table = []
    for f in fs:
        wf, tf = at(f)
        table.append(dict(t=z0 + f * span, sx=(1.0 - (1.0 - tp) * f) * wf, sy=tf))

    def sec(row):
        return sec_blade(b["w"], b["th"], fuller=b["fuller"],
                         n_side=b["n_side"], fuller_w=b["fw"])

    def reg(i, j):
        if j in g["edge"]:
            return R["EDGE"]
        if j in g["fuller"]:
            if b.get("runes"):
                mid = (fs[i] + fs[i + 1]) * 0.5
                if RUNE_LO <= mid <= RUNE_HI:
                    k = int((mid - RUNE_LO) / step)
                    if k % 2 == 1:
                        return R["RUNE"]
            return R["FULLER"]
        if j in g["bevel"]:
            return R["BEVEL"]
        return R["BLADE"]

    p.tube(stations(table, sec), region=reg, cap_a=True, cap_b=True,
           cap_region=R["BLADE"])
    return p


def mod_guard(name, cfg):
    """GUARD module: spans socket GUARD_A..GUARD_B, symmetrical about x=0."""
    p = Part(name)
    gd, S = cfg["guard"], SOCKETS
    mid = (S["GUARD_A"] + S["GUARD_B"]) * 0.5
    span, h, th, arc, wing = gd["span"], gd["h"], gd["th"], gd["arc"], gd["wing"]
    # x fraction, y-thickness scale, z-height scale, z lift
    if gd.get("style") == "bar":
        # Type I straight cross: a square bar with chamfered ends. A Common
        # weapon should look plainly made, not badly made -- a drooping lens
        # profile at this size reads as a moustache, so the tips stay square.
        prof = [(-1.000, 0.78, 0.70, arc), (-0.952, 0.96, 0.93, arc * 0.75),
                (-0.700, 1.00, 1.00, arc * 0.45), (0.000, 1.00, 1.00, 0.0),
                (0.700, 1.00, 1.00, arc * 0.45), (0.952, 0.96, 0.93, arc * 0.75),
                (1.000, 0.78, 0.70, arc)]
    else:
        prof = [(-1.000, 0.48, 0.42, arc + wing), (-0.900, 0.60, 0.62, arc + wing * 0.72),
                (-0.660, 0.78, 0.82, arc + wing * 0.34), (-0.380, 0.94, 0.95, arc + wing * 0.08),
                (0.000, 1.00, 1.00, 0.0),
                (0.380, 0.94, 0.95, arc + wing * 0.08), (0.660, 0.78, 0.82, arc + wing * 0.34),
                (0.900, 0.60, 0.62, arc + wing * 0.72), (1.000, 0.48, 0.42, arc + wing)]
    table = [dict(t=fx * span, sx=fy, sy=fz, off=(0.0, 0.0, mid + lift))
             for fx, fy, fz, lift in prof]
    p.tube(stations(table, lambda r: sec_rrect(th, h, 12, 0.42), axis="X"),
           region=R["GUARD"])
    # centre block (the ecusson): a raised plate on both faces of the guard that
    # the blade root passes through. It terminates exactly at GUARD_B -- if it
    # over-runs the guard it reads as a peg sticking out of the crossguard.
    p.tube(stations([dict(t=S["GUARD_A"] - 0.020, sx=0.84, sy=0.84),
                     dict(t=S["GUARD_A"] + 0.024),
                     dict(t=S["GUARD_B"] - 0.034),
                     dict(t=S["GUARD_B"], sx=0.86, sy=0.90)],
                    lambda r: sec_rrect(0.200, 0.152, 12, 0.5)),
           region=R["GUARD_TRIM"])
    if gd["collar"]:
        # blade collar: a band that WRAPS the blade root, sized off the blade's
        # own envelope. Earlier this was a pair of side langets; at this scale
        # two thin plates on the flats read as a stray fin rather than a fitting.
        bw, bth = cfg["blade"]["w"], cfg["blade"]["th"]
        cw, cd = bw * 0.955 + 0.030, bth * 1.16 + 0.020
        p.tube(stations([dict(t=S["GUARD_B"] - 0.030, sx=0.94, sy=0.94),
                         dict(t=S["GUARD_B"] + 0.006),
                         dict(t=S["GUARD_B"] + 0.088),
                         dict(t=S["GUARD_B"] + 0.124, sx=0.90, sy=0.86)],
                        lambda r: sec_rrect(cw, cd, 16, 0.34)),
               region=R["GUARD_TRIM"])
    if gd["prongs"]:
        # Horns growing out of the guard's wing tips, not spikes parked on top
        # of it. The base ring starts INSIDE the guard body so there is no seam.
        base_x = span * 0.72
        pr = [(0.000, 1.00, 0.000), (0.300, 0.94, 0.020),
              (0.660, 0.72, 0.062), (1.000, 0.22, 0.100)]
        for sgn in (-1.0, 1.0):
            p.tube(stations([dict(t=S["GUARD_B"] - 0.100 + f * 0.470,
                                  sx=s, sy=s, off=(sgn * dx, 0.0, 0.0))
                             for f, s, dx in pr],
                            lambda r: sec_rrect(0.070, 0.064, 8, 0.6),
                            off=(sgn * base_x, 0.0, 0.0)),
                   region=R["GUARD_TRIM"])
    return p


def mod_grip(name, cfg):
    """GRIP module: socket GRIP_A..GRIP_B. ONE swept shell, no bolt-on rings.

    Two ideas are doing the work here.

    1. The cord wrap is GEOMETRY, not a texture trick. The section radius is
       modulated by a sine of `wraps` cycles up the grip, sampled four times per
       cycle so every ridge gets its own quad band and its own facet normal. At
       1 stud = 1 unit a painted-on wrap disappears; a real ridge does not.
    2. The ferrules and risers are RINGS IN THE SAME TABLE, not separate torus
       shells. They are radius bumps whose bands get tagged GRIP_TRIM by the
       region callable. Built as tori they cost ~190 triangles each and put more
       geometry in the collars than in the whole blade. This way they are free.
    """
    p = Part(name)
    gr, S = cfg["grip"], SOCKETS
    z0, z1 = S["GRIP_A"], S["GRIP_B"]
    span = z1 - z0
    wraps = gr["wraps"]
    TRIM, BODY = R["GRIP_TRIM"], R["GRIP"]

    risers = [(k + 1) / (gr["risers"] + 1) for k in range(gr["risers"])]
    rows = []                     # (f, radius scale, region of this ring)

    def env(f):
        """Waist envelope: fat at both ferrules, narrow in the palm."""
        return 1.0 + (gr["waist"] - 1.0) * math.sin(math.pi * f) ** 0.80

    # --- bottom ferrule -----------------------------------------------------
    for f, s in ((0.000, 1.00), (0.026, 1.13), (0.058, 1.11)):
        rows.append((f, s, TRIM))
    # --- corded body --------------------------------------------------------
    n = int(round(wraps * 4.0))
    f_lo, f_hi = 0.072, 0.928
    for i in range(n + 1):
        f = f_lo + (f_hi - f_lo) * i / n
        fade = min(1.0, (f - f_lo) / 0.06) * min(1.0, (f_hi - f) / 0.06)
        s = env(f) * (1.0 + gr["cord"] * fade
                      * math.sin(2.0 * math.pi * wraps * f - 1.5708))
        reg = BODY
        for rf in risers:                    # a riser overrides the cord here
            if abs(f - rf) < 0.030:
                s, reg = env(f) * 1.10, TRIM
        rows.append((f, s, reg))
    # --- top ferrule --------------------------------------------------------
    for f, s in ((0.942, 1.11), (0.974, 1.13), (1.000, 1.00)):
        rows.append((f, s, TRIM))

    rows.sort(key=lambda r: r[0])
    table = [dict(t=z0 + f * span, sx=s, sy=s) for f, s, _ in rows]

    def reg(i, j):
        a, b = rows[i][2], rows[min(i + 1, len(rows) - 1)][2]
        return TRIM if TRIM in (a, b) else BODY

    p.tube(stations(table, lambda r: sec_poly(8, gr["r"])), region=reg,
           cap_region=TRIM)
    return p


def mod_pommel(name, cfg):
    """POMMEL module: socket POMMEL_BASE..POMMEL_TOP."""
    p = Part(name)
    pm, S = cfg["pommel"], SOCKETS
    z0, z1 = S["POMMEL_BASE"], S["POMMEL_TOP"]
    cz = (z0 + z1) * 0.5
    r = pm["r"]
    if pm["kind"] == "wheel":
        # disc whose axis lies along Y, so it sits flat in the blade's plane.
        # The end caps are the small central hubs, not the faces -- painting
        # them GUARD_TRIM gives the wheel a darker rivet boss for free.
        prof = [(-1.00, 0.46), (-0.72, 0.80), (-0.30, 0.97), (0.30, 0.97),
                (0.72, 0.80), (1.00, 0.46)]
        half = 0.052
        p.tube(stations([dict(t=f * half, sx=s, sy=s, off=(0.0, 0.0, cz))
                         for f, s in prof],
                        lambda q: sec_poly(12, r), axis="Y"),
               region=R["POMMEL"], cap_region=R["GUARD_TRIM"])
    elif pm["kind"] == "teardrop":
        prof = [(0.000, 0.30), (0.120, 0.68), (0.300, 0.94), (0.480, 1.00),
                (0.680, 0.88), (0.860, 0.62), (1.000, 0.34)]
        p.tube(stations([dict(t=z0 + f * (z1 - z0), sx=s, sy=s * 0.82)
                         for f, s in prof], lambda q: sec_poly(12, r)),
               region=R["POMMEL"])
    else:  # orb
        # 8-sided with a squared-off equator, so it reads as a CUT stone in a
        # setting. T2's pommel is a smooth 12-sided teardrop; if this one is also
        # a smooth solid of revolution the two tiers share a silhouette, and
        # silhouette is the only thing that survives being 40 studs away.
        prof = [(0.000, 0.28), (0.170, 0.64), (0.330, 0.90), (0.455, 1.00),
                (0.565, 1.00), (0.700, 0.88), (0.865, 0.60), (1.000, 0.32)]
        p.tube(stations([dict(t=z0 + f * (z1 - z0), sx=s, sy=s)
                         for f, s in prof], lambda q: sec_poly(8, r)),
               region=R["POMMEL"])
    if pm["gem"]:
        # Cabochon, one on each flat of the pommel.
        #
        # The base ring starts WELL inside the body, the widest ring sits just
        # under the surface, and the profile converges outward from there -- so
        # what emerges is a dome with a bezel line where it breaks the surface.
        # Getting this wrong is easy and was wrong until now: the dome ran from
        # r*0.40 to r*1.02, which buried ~80% of it and left a coloured dot.
        #
        # Both stones are swept in ASCENDING t. Sweeping the -Y one from the
        # inside outward would run t downhill and hand back inverted normals,
        # which no quad/ngon check would catch -- it only shows up as a stone
        # that renders black.
        gr = r * 0.62
        prof = [(0.00, 0.86), (0.30, 1.00), (0.62, 0.90), (0.85, 0.62),
                (1.00, 0.26)]
        y0, y1 = r * 0.62, r * 1.40
        for sgn in (-1.0, 1.0):
            rows = [(y0 + f * (y1 - y0), s) for f, s in prof]
            if sgn < 0.0:
                rows = [(-t, s) for t, s in reversed(rows)]
            p.tube(stations([dict(t=t, sx=s, sy=s, off=(0.0, 0.0, cz))
                             for t, s in rows],
                            lambda q: sec_poly(8, gr), axis="Y"),
                   region=R["GEM"])
    return p


MODULES = (("BLADE", mod_blade), ("GUARD", mod_guard),
           ("GRIP", mod_grip), ("POMMEL", mod_pommel))


def build_tier(key, root, mat, rack_x):
    cfg = TIERS[key]
    coll = L.ensure_collection(cfg["obj"], root)
    spec = paint_spec(cfg["pal"])
    objs = []
    for tag, fn in MODULES:
        part = fn("%s__%s" % (cfg["obj"], tag), cfg)
        sharp = 15.0 if tag == "BLADE" else 34.0
        objs.append(part.finalize(coll, mat, spec, sharp_deg=sharp,
                                  loc=(rack_x, 0.0, 0.0)))
    return coll, objs
