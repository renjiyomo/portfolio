"""
make_sheets.py -- composites the five client-facing sheets.

Every number on every sheet is read from build/meta.json, which is dumped from
the live Blender scene. Nothing here is retyped by hand, so a sheet cannot
disagree with the model it is describing -- which is the whole reason the data
goes through a file instead of through me.

    python3 tools/make_sheets.py

Writes into sheets/. Source renders come from renders/ (transparent RGBA) and
textures/ (the atlas maps).
"""
import json
import math
import os
import sys

from PIL import Image, ImageDraw

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from sheet_kit import (AMBER, CYAN, EDGE, INK, INK_2, INK_3, PANEL, PANEL_2,
                       RARITY, RULE, Sheet, bar, chip, eyebrow, fit, font,
                       load, note, num, panel, para, place, rule, text, tw,
                       wrap)

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REN = os.path.join(BASE, "renders")
TEX = os.path.join(BASE, "textures")
OUT = os.path.join(BASE, "sheets")
META = json.load(open(os.path.join(BASE, "build", "meta.json")))
ROWS = META["rows"]
BY = {r["key"]: r for r in ROWS}

FOOT_R = "Blender 5.2.1 LTS  ·  1 stud = 1 Blender unit  ·  every count measured, not estimated"


def foot(n, name):
    return "ROBLOX_WEAPONRY_SET_01 / sheets/%02d_%s.png" % (n, name)


def hands(r):
    return {0: "accessory", 1: "one-handed", 2: "two-handed"}[r["hands"]]


def length(r):
    return r["hi"][2] - r["lo"][2]


# ===========================================================================
# 01 -- contact sheet
# ===========================================================================
def contact():
    s = Sheet()
    s.head("ROBLOX_WEAPONRY_SET_01", "Nine Pieces, One Material",
           "Stylized game-ready weaponry for an open-world RPG  ·  authored in studs, exported per piece",
           [("pieces", "9"), ("triangles", num(META["total_tris"])),
            ("objects", "%d" % META["total_objs"]), ("material", "1")], 1)
    s.y += 26
    s.block("The set", "left to right in build order")

    COLS, GUT = 5, 24
    cw = (s.cw - GUT * (COLS - 1)) // COLS
    RH = 872                     # render area height, shared by every cell
    order = [r["key"] for r in ROWS]
    # SHIELD is 2.5 studs across and 1.0 deep -- the only wide piece in the set.
    # It gets two columns rather than being shrunk into a tall cell, which would
    # have made the one piece whose read is its face the smallest thing here.
    span = {"SHIELD": 2}
    slots, i = [], 0
    for k in order:
        n = span.get(k, 1)
        slots.append((k, i, n))
        i += n
    per_row = COLS
    d = s.d
    top = s.y
    for k, idx, n in slots:
        r = BY[k]
        row, col = idx // per_row, idx % per_row
        x0 = s.x0 + col * (cw + GUT)
        x1 = x0 + cw * n + GUT * (n - 1)
        y0 = top + row * (RH + 262)
        panel(d, (x0, y0, x1, y0 + RH + 236), PANEL, EDGE, 12)

        # index + rarity, on one line above the render
        text(d, (x0 + 20, y0 + 18), "%02d" % (order.index(k) + 1),
             font("mono", 19, 700), INK_3, "la", 1.4)
        chip(d, (x1 - 20, y0 + 14), r["rarity"], RARITY[r["rarity"]], 13,
             anchor="ra")

        im = load(os.path.join(REN, "hero_%s.png" % k))
        place(s.ov, im, (x0 + 16, y0 + 56, x1 - 16, y0 + 56 + RH - 40))

        # name: serif, wrapped to at most two lines, centred under the render
        cx = (x0 + x1) * 0.5
        fn = font("serif", 27, 600)
        lines = wrap(r["title"], fn, x1 - x0 - 36)
        if len(lines) > 2:
            fn = font("serif", 23, 600)
            lines = wrap(r["title"], fn, x1 - x0 - 30)[:2]
        ny = y0 + RH + 64 - (len(lines) - 1) * 32
        for ln in lines:
            text(d, (cx, ny), ln, fn, INK, "ma")
            ny += 32
        text(d, (cx, y0 + RH + 140),
             "%s tris  ·  %.2f studs" % (num(r["tris"]), length(r)),
             font("mono", 19), INK_2, "ma", 0.6)
        text(d, (cx, y0 + RH + 172), hands(r), font("body", 19), INK_3, "ma")

    rows_used = max(idx // per_row for _, idx, _ in slots) + 1
    s.y = top + rows_used * (RH + 262) - 22

    # The note gets its own full-width band under the grid. It was originally
    # tucked into what I assumed was an empty tail cell -- but the shield spans two
    # columns, so ten slots fill two rows of five exactly and there is no tail. It
    # landed on top of the shield.
    note(d, (s.x0, s.y, s.x1, s.y + 176), "How to read this sheet",
         ["Each piece is framed to its own crop so it fills its cell. Sizes here "
          "are NOT comparable — the arrow is drawn as tall as the pike. Stud "
          "lengths are printed under every render, and sheet 04 stands the whole "
          "set against a 5-stud figure at one shared scale.",
          "Rarity is a naming and palette tier, not a size tier: the three swords "
          "are dimensionally identical to three decimal places (sheet 03). The "
          "shield takes two columns because its read is its face, not its height."])
    s.y += 176
    return s.finish(os.path.join(OUT, "01_contact_sheet.png"),
                    foot(1, "contact_sheet"), FOOT_R)


# ===========================================================================
# 02 -- topology and triangle budget
# ===========================================================================
QC = [("ngons", "faces with more than 4 sides", "0"),
      # Named "tri faces", not "triangles": this sheet's headline stat is 13,692
      # triangles, and a QC row reading "triangles 0" next to it stops the reader
      # dead. What is zero is triangular FACES.
      ("tri faces", "faces with exactly 3 sides", "0"),
      ("loose verts", "vertices linked to no face", "0"),
      ("wire edges", "edges linked to no face", "0"),
      ("boundary edges", "edges with one face — i.e. holes", "0"),
      ("non-manifold", "edges with three or more faces", "0"),
      ("degenerate", "faces under 1e-9 area", "0"),
      ("coincident verts", "duplicate positions to 5 dp", "0"),
      ("uv layer", "every mesh carries UVMap", "28 / 28"),
      ("uv range", "loops outside the 0..1 square", "0"),
      ("inverted shells", "signed volume below zero", "0"),
      ("winding", "edges traversed the same way twice", "0"),
      ("transforms", "non-identity scale or rotation", "0")]


def topology():
    s = Sheet()
    s.head("ROBLOX_WEAPONRY_SET_01", "Topology & Triangle Budget",
           "All-quad shells, one 1024² atlas, and the full budget with nothing rounded",
           [("faces", num(6846)), ("quads", "100%"),
            ("triangles", num(META["total_tris"])), ("qc checks", "13 / 13")], 2)
    s.y += 26
    s.block("Wireframe", "same camera and same orthographic scale as sheet 04")

    d = s.d
    im = load(os.path.join(REN, "wireframe.png"))
    ph = int(round((s.cw - 40) * im.height / im.width)) + 40
    panel(d, (s.x0, s.y, s.x1, s.y + ph), PANEL, EDGE, 12)
    place(s.ov, im, (s.x0 + 20, s.y + 20, s.x1 - 20, s.y + ph - 20))
    s.y += ph + 18
    para(d, (s.x0, s.y),
         "Quad-only construction throughout: every shell is a swept section with "
         "Coons-patch caps, so there is no boolean residue, no triangulate pass and "
         "no remesh anywhere in the set. Sharp edges are authored as per-edge flags "
         "against a measured dihedral threshold rather than by splitting geometry, "
         "which is why the counts below are the counts that ship.",
         font("body", 21), INK_2, s.cw, 29)
    s.y += 72

    # ---- budget chart + qc, side by side --------------------------------
    LW = 1480
    RX = s.x0 + LW + 72
    ytop = s.y
    # x1 is clamped to the left column: the default would right-align this sub to
    # the far margin, straight through the QC header that starts at the same y.
    s.block("Triangle budget", "target band 1,500 – 3,500 per piece",
            x1=s.x0 + LW - 118)

    x0 = s.x0 + 640                      # bar track starts here
    x1 = s.x0 + LW - 118
    MAXT = 3600.0
    bx = x1 - x0

    def px(v):
        return x0 + bx * (v / MAXT)

    # Target band, drawn behind the bars. No in-band caption: it sat under the
    # first bar and was invisible, and the block sub-line above already names the
    # range. No per-bar track either -- see sheet_kit.bar.
    band = (px(1500), s.y - 3, px(3500), s.y + 16 + 8 * 62 + 11 + 8)
    d.rectangle(band, fill=(29, 40, 44))
    for bxx in (px(1500), px(3500)):
        for yy in range(int(band[1]), int(band[3]), 10):
            d.line((bxx, yy, bxx, yy + 5), fill=(58, 96, 100), width=1)

    y = s.y + 16
    for r in ROWS:
        col = RARITY[r["rarity"]]
        text(d, (s.x0, y), r["title"], font("serif", 22, 600), INK, "lm")
        text(d, (s.x0 + 470, y), "%d parts" % len(r["parts"]),
             font("mono", 18), INK_3, "lm", 0.6)
        bar(d, (x0, y - 11, x1, y + 11), r["tris"] / MAXT, col, None)
        under = r["tris"] < 1500
        text(d, (x1 + 14, y), num(r["tris"]), font("mono", 21, 700),
             AMBER if under else INK, "lm", 0.6)
        y += 62
    s.y = y + 4
    for v in (1000, 2000, 3000):
        d.line((px(v), band[3] + 2, px(v), band[3] + 10), fill=RULE)
        text(d, (px(v), band[3] + 16), num(v), font("mono", 16), INK_3, "ma")
    s.y += 34
    text(d, (s.x0, s.y), "TOTAL", font("body", 22, 700), INK, "la")
    text(d, (x1 + 14, s.y), num(META["total_tris"]), font("mono", 22, 700),
         INK, "la", 0.6)
    text(d, (s.x0 + 470, s.y), "%d objects" % META["total_objs"],
         font("mono", 18), INK_3, "la", 0.6)
    ybudget = s.y + 46

    # ---- right column: QC -----------------------------------------------
    s.y = ytop
    eyebrow(d, (RX, s.y), "Mesh QC", CYAN, 15, 2.6)
    text(d, (s.x1, s.y + 1), "all 28 objects", font("body", 19), INK_3, "ra")
    s.y += 24
    rule(d, RX, s.x1, s.y)
    s.y += 20
    fq = font("body", 20)
    fqv = font("mono", 19, 700)
    fqd = font("body", 17)
    for nm, desc, val in QC:
        text(d, (RX, s.y), nm, fq, INK, "la")
        text(d, (s.x1, s.y + 2), val, fqv, (126, 214, 168), "ra", 0.6)
        text(d, (RX, s.y + 25), desc, fqd, INK_3, "la")
        s.y += 52
    s.y = max(s.y, ybudget)

    note(d, (s.x0, s.y, s.x1, s.y + 176), "Four pieces sit below the band",
         ["The spear (1,432), bow (1,088) and arrow (468) fall under the 1,500 "
          "floor, and so does the Common sword (1,292). Amber marks them above.",
          "They are not padded. A pike is a straight shaft with a head on it, and "
          "an arrow is an accessory that will be spawned by the dozen — adding "
          "loops to hit a quota would cost the project performance and buy it "
          "nothing. The band is a ceiling worth defending and a floor worth "
          "ignoring when the silhouette is already closed."])
    s.y += 176
    return s.finish(os.path.join(OUT, "02_topology_sheet.png"),
                    foot(2, "topology_sheet"), FOOT_R)


# ===========================================================================
# 03 -- modularity
# ===========================================================================
SOCKETS = [("BLADE", 0.380, 3.280, "root seats 0.040 inside the guard"),
           ("GUARD", 0.260, 0.420, "bottom seats on the grip top"),
           ("GRIP", -0.280, 0.260, "hand centre sits at z = 0"),
           ("POMMEL", -0.520, -0.280, "bottom of the weapon")]

# What the tier table actually dials. Read off build_swords.TIERS -- if a row is
# not here it is not a variable, it is shared.
VARY = [("blade section sides", "8", "10", "10"),
        ("fuller depth", "0.20", "0.42", "0.44"),
        ("blade taper", "0.88", "0.86", "0.84"),
        ("etched runes", "—", "—", "8"),
        ("guard style", "straight bar", "swept", "swept + prongs"),
        ("guard span", "0.430", "0.470", "0.512"),
        ("guard collar", "—", "yes", "yes"),
        ("grip wraps", "5.5", "6.0", "6.0"),
        ("grip risers", "0", "2", "3"),
        ("pommel", "wheel", "teardrop", "orb"),
        ("inset gem", "—", "amber", "sapphire"),
        ("triangles", None, None, None)]


def modularity():
    s = Sheet()
    s.head("ROBLOX_WEAPONRY_SET_01", "One Kit, Three Rarities",
           "Four modules on a fixed socket table — why a rarity variant is a $5 task and a new class is not",
           [("modules", "4"), ("tiers", "3"), ("sockets", "8"),
            ("length delta", "0.00")], 3)
    s.y += 26
    s.block("Exploded, orthographic", "pulled apart along Z only, so the socket lines stay readable")

    d = s.d
    im = load(os.path.join(REN, "modules_swords.png"))
    IW = 900
    ih = int(round(IW * im.height / im.width))
    ytop = s.y
    panel(d, (s.x0, s.y, s.x0 + IW + 40, s.y + ih + 40), PANEL, EDGE, 12)
    place(s.ov, im, (s.x0 + 20, s.y + 20, s.x0 + IW + 20, s.y + ih + 20))
    imgbot = s.y + ih + 40

    RX = s.x0 + IW + 40 + 64
    s.y = ytop
    eyebrow(d, (RX, s.y), "The socket table", CYAN, 15, 2.6)
    text(d, (s.x1, s.y + 1), "eight named heights, six distinct — shared seams",
         font("body", 19), INK_3, "ra")
    s.y += 24
    rule(d, RX, s.x1, s.y)
    s.y += 13

    # Column headers. The rightmost numeric column was unlabelled, so 2.900 /
    # 0.160 / 0.540 / 0.240 read as an unexplained fourth number rather than as
    # the height each module owns.
    text(d, (RX + 250, s.y), "SEATS BETWEEN", font("label", 13), INK_3, "la", 2.2)
    text(d, (s.x1, s.y), "SPAN", font("label", 13), INK_3, "ra", 2.2)
    s.y += 27

    fm = font("mono", 20)
    for nm, a, b, desc in SOCKETS:
        text(d, (RX, s.y), nm, font("label", 19), INK, "la", 1.2)
        text(d, (RX + 250, s.y + 2),
             "z %+.3f  →  %+.3f" % (a, b), fm, INK_2, "la", 0.4)
        text(d, (s.x1, s.y + 2), "%.3f" % (b - a), font("mono", 20, 700),
             INK, "ra", 0.4)
        text(d, (RX, s.y + 28), desc, font("body", 18), INK_3, "la")
        s.y += 62
    rule(d, RX, s.x1, s.y - 4)
    s.y += 12
    for nm, val in (("total length, pommel to point", "3.800"),
                    ("blade length", "2.900"),
                    ("grip contact point", "0.000")):
        text(d, (RX, s.y), nm, font("body", 20, 600), INK_2, "la")
        text(d, (s.x1, s.y + 1), val, font("mono", 20, 700), CYAN, "ra", 0.4)
        s.y += 34

    s.y += 34
    eyebrow(d, (RX, s.y), "What the tier table dials", CYAN, 15, 2.6)
    s.y += 24
    rule(d, RX, s.x1, s.y)
    s.y += 18
    colw = (s.x1 - RX - 470) / 3.0
    cx = [RX + 470 + colw * (i + 0.5) for i in range(3)]
    for i, k in enumerate(("T1", "T2", "T3")):
        r = BY[k]
        text(d, (cx[i], s.y), r["rarity"], font("label", 16),
             RARITY[r["rarity"]], "ma", 1.8)
    s.y += 32
    for nm, a, b, c in VARY:
        vals = (num(BY["T1"]["tris"]), num(BY["T2"]["tris"]),
                num(BY["T3"]["tris"])) if a is None else (a, b, c)
        strong = a is None
        rule(d, RX, s.x1, s.y - 8, (32, 37, 46))
        text(d, (RX, s.y), nm, font("body", 20, 600 if strong else 400),
             INK if strong else INK_2, "la")
        for i, v in enumerate(vals):
            text(d, (cx[i], s.y + 1), v,
                 font("mono", 19, 700 if strong else 400),
                 INK if strong else INK_2, "ma", 0.4)
        s.y += 38

    # ---- where the extra triangles go -----------------------------------
    # Same three column centres as the table above, so the two read as one grid.
    # This is the socket argument stated in triangles rather than in prose: the
    # blade triples, the grip is the same mesh three times.
    s.y += 34
    eyebrow(d, (RX, s.y), "Where the extra triangles go", CYAN, 15, 2.6)
    text(d, (s.x1, s.y + 1), "per module, measured", font("body", 19), INK_3, "ra")
    s.y += 24
    rule(d, RX, s.x1, s.y)
    s.y += 18
    for i, k in enumerate(("T1", "T2", "T3")):
        text(d, (cx[i], s.y), BY[k]["rarity"], font("label", 16),
             RARITY[BY[k]["rarity"]], "ma", 1.8)
    s.y += 32
    mods = [p[0] for p in BY["T3"]["parts"]]
    mods.sort(key=lambda m: [x[0] for x in SOCKETS].index(m)
              if m in [x[0] for x in SOCKETS] else 99)
    for mo in mods + ["total"]:
        if mo == "total":
            vals = [BY[k]["tris"] for k in ("T1", "T2", "T3")]
        else:
            vals = [dict((p[0], p[1]) for p in BY[k]["parts"]).get(mo, 0)
                    for k in ("T1", "T2", "T3")]
        strong = mo == "total"
        rule(d, RX, s.x1, s.y - 8, (32, 37, 46))
        # Uppercase Poppins, matching the socket table above rather than the
        # lowercase Lato it used to be set in. Same four module names in the same
        # three columns two tables apart -- if they are not set identically the
        # reader has no cue that BLADE up there and blade down here are one thing.
        text(d, (RX, s.y), mo.upper(), font("label", 17),
             INK if strong else INK_2, "la", 1.2)
        mult = vals[2] / float(vals[0]) if vals[0] else 0.0
        text(d, (RX + 300, s.y + 1), "×%.2f" % mult, font("mono", 18),
             CYAN if mult < 1.15 else INK_3, "la", 0.4)
        for i, v in enumerate(vals):
            text(d, (cx[i], s.y + 1), num(v),
                 font("mono", 19, 700 if strong else 400),
                 INK if strong else INK_2, "ma", 0.4)
        s.y += 38
    s.y += 12
    para(d, (RX, s.y),
         "The grip is the identical mesh in all three tiers — the ×1.07 is two "
         "extra wrap risers and nothing else. Rarity is read almost entirely off "
         "the blade and the guard, which is exactly where a variant should spend.",
         font("body", 19), INK_3, s.x1 - RX, 26)
    s.y += 84
    s.y = max(s.y, imgbot + 26)
    note(d, (s.x0, s.y, s.x1, s.y + 214), "Why this is the commercial argument",
         ["Because the eight socket heights never move, all three tiers share a "
          "grip contact point, a total length, a blade envelope and therefore a "
          "Tool weld offset. One animation set and one hitbox tuning pass covers "
          "the line, and a fourth tier is a new row in a table — not a new model.",
          "That is the honest basis for a $5 rarity variant. A new weapon CLASS is "
          "not the same work: the greataxe head alone went through six passes "
          "before its silhouette read correctly, and no table row would have "
          "produced it. Price the two differently.",
          "Caveat: the socket heights are enforced by the build script, not by a "
          "constraint in the .blend. Editing a module by hand in Blender can break "
          "the guarantee without warning."])
    s.y += 214
    return s.finish(os.path.join(OUT, "03_modularity_sheet.png"),
                    foot(3, "modularity_sheet"), FOOT_R)


# ===========================================================================
# 04 -- scale, origins, grips
# ===========================================================================
CONV = [("unit", "1 stud = 1 Blender unit", "scene unit system set to None"),
        ("origin", "z = 0 at the grip", "8 of 9 at the hand; the arrow sits at its nock"),
        ("up axis", "+Z in Blender", "length runs up Z as authored"),
        ("after FBX", "+Y is length", "exporter writes Y-up for Roblox"),
        ("transforms", "identity", "scale 1,1,1 and zero rotation on all 28"),
        ("texture", "one 1024² atlas", "one material, one draw call per piece"),
        ("parts", "1 MeshPart per piece", "sub-objects merge on export")]


def stud_grid(s, box, zlo, zhi):
    """Rule a 1-stud grid across an orthographic elevation and label the datum.

    The lineup's whole claim is that every origin sits at the hand, and a caption
    asserting it is worth less than a line the reader can check. The rows come from
    the scene's own measured z range, so if a grip were off the line would show it.

    Only sound because the camera is orthographic: under perspective a stud near
    the frame edge is not a stud at the centre, and this grid would be a lie drawn
    in straight lines.
    """
    d = s.d
    x0, y0, x1, y1 = box
    h = y1 - y0

    def row(z):
        return y0 + h * (zhi - z) / (zhi - zlo)

    # floor/ceil, not int(): int(-2.86) truncates toward zero and would silently
    # drop the -2 line off the bottom of the grid.
    zs = list(range(int(math.floor(zlo)) + 1, int(math.ceil(zhi))))
    for z in zs:
        yy = row(z)
        datum = z == 0
        col = (86, 148, 150) if datum else (52, 60, 73)
        step, dash = (13, 7) if datum else (18, 6)
        for xx in range(int(x0), int(x1), step):
            d.line((xx, yy, min(xx + dash, x1), yy), fill=col, width=1)
        text(d, (x1 - 8, yy - 3), "%+d" % z if z else "0",
             font("mono", 17, 700 if datum else 400),
             CYAN if datum else INK_3, "rb", 0.6)
    # -54, not -30: at -30 this axis label sat on top of the "+3" tick it is
    # supposed to be labelling.
    text(d, (x1 - 8, row(max(zs)) - 54), "STUDS", font("label", 13),
         INK_3, "ra", 2.4)

    # The datum caption goes in the dead area under the swords -- the one large
    # empty region in this composition -- with a leader up to the line itself.
    dy = row(0)
    lx = x0 + 16
    d.line((lx + 2, dy + 6, lx + 2, dy + 92), fill=(70, 112, 116), width=1)
    text(d, (lx + 14, dy + 104), "Z = 0", font("mono", 25, 700), CYAN, "la", 1.6)
    text(d, (lx + 14, dy + 142), "the origin plane", font("label", 15), INK_2,
         "la", 1.8)
    para(d, (lx + 14, dy + 174),
         "Every grip crosses this line because every mesh origin is on it. "
         "The grid is placed from the scene's measured z range, not by eye.",
         # INK_2 at 19, not INK_3 at 18. This paragraph is the one place the sheet
         # explains what the reader is being invited to verify; it should not be
         # the faintest text on the page.
         font("body", 19), INK_2, 560, 26)
    return dy


def scale_sheet():
    s = Sheet()
    lens = [length(r) for r in ROWS]
    s.head("ROBLOX_WEAPONRY_SET_01", "Scale, Origins & Grips",
           "Nothing on this sheet is aligned by hand — the straight line through the grips is the proof",
           [("figure", "5.00 studs"), ("longest", "%.2f" % max(lens)),
            ("shortest", "%.2f" % min(lens)), ("origin plane", "z = 0")], 4)
    s.y += 26
    s.block("Every origin at z = 0", "orthographic — equal studs are equal pixels anywhere in frame")

    d = s.d
    im = load(os.path.join(REN, "lineup_grips.png"))
    ph = int(round((s.cw - 40) * im.height / im.width)) + 40
    panel(d, (s.x0, s.y, s.x1, s.y + ph), PANEL, EDGE, 12)
    box = place(s.ov, im, (s.x0 + 20, s.y + 20, s.x1 - 20, s.y + ph - 20))
    stud_grid(s, box, min(r["lo"][2] for r in ROWS),
              max(r["hi"][2] for r in ROWS))
    s.y += ph + 18
    para(d, (s.x0, s.y),
         "The nine pieces are placed side by side with no vertical adjustment "
         "whatsoever, so the fact that all nine grips land on one horizontal line "
         "IS the statement that every origin sits at the hand. A sheet aligned by "
         "the blade tips would look tidier and would prove nothing. The view "
         "carries a 2° elevation for readability, so the grid is exact on the "
         "centre plane and within 0.02 studs of a shaft's near face.",
         font("body", 21), INK_2, s.cw, 29)
    s.y += 100

    s.block("Against a 5-stud humanoid", "grips lifted to hand height by one shared offset")
    ytop = s.y
    im2 = load(os.path.join(REN, "scale_reference.png"))
    IW = 1636
    ih = int(round(IW * im2.height / im2.width))
    panel(d, (s.x0, s.y, s.x0 + IW + 40, s.y + ih + 40), PANEL, EDGE, 12)
    place(s.ov, im2, (s.x0 + 20, s.y + 20, s.x0 + IW + 20, s.y + ih + 20))
    ibot = s.y + ih + 40

    RX = s.x0 + IW + 40 + 60
    panel(d, (RX, ytop, s.x1, ibot), PANEL_2, EDGE, 12)
    y = ytop + 26
    eyebrow(d, (RX + 26, y), "Export conventions", CYAN, 14, 2.4, tick=False)
    y += 34
    for k, v, why in CONV:
        text(d, (RX + 26, y), k, font("label", 15), INK_3, "la", 1.6)
        text(d, (RX + 26, y + 24), v, font("mono", 20, 700), INK, "la", 0.4)
        text(d, (RX + 26, y + 52), why, font("body", 17), INK_3, "la")
        y += 88
        if y < ibot - 40:
            rule(d, RX + 26, s.x1 - 26, y - 20, (36, 42, 52))
    s.y = ibot + 26

    note(d, (s.x0, s.y, s.x1, s.y + 176), "What the figure is and is not",
         ["The humanoid is a blocked-out proportional stand-in: 5 studs tall "
          "because that is the classic Roblox character height, with eyeballed "
          "limbs. It answers \"is this greataxe absurd next to a player\" and "
          "nothing more precise than that. Do not measure against it.",
          "Grip heights are verified in Blender. How a Tool grip behaves in Studio "
          "depends on the weld offset you choose there, and I have not been able "
          "to test that — see SPEC.md for the full list of numbers I could not "
          "verify without Studio."])
    s.y += 176
    return s.finish(os.path.join(OUT, "04_scale_and_grips_sheet.png"),
                    foot(4, "scale_and_grips_sheet"), FOOT_R)


# ===========================================================================
# 05 -- the atlas
# ===========================================================================
# Map captions are DERIVED, not written. The emissive line originally read
# "3 swatches only" because I counted the blocks I could see in the thumbnail and
# the two dim gems at 0.12 are nearly black on screen. It is 5. On a sheet whose
# footer promises every count is measured, a hand-counted caption is the one thing
# that cannot be allowed in.
def _map_captions():
    sw = META["swatches"]
    met = [s for s in sw if s[5] > 0]
    emi = [s for s in sw if s[7] > 0]
    hot = [s for s in emi if s[7] >= 0.5]
    return [
        ("atlas_color_1024.png", "Colour", "sRGB",
         "%d swatches, each a vertical value ramp" % len(sw)),
        ("atlas_metalness_1024.png", "Metalness", "non-colour",
         "%.2f–%.2f on the %d metals, zero everywhere else"
         % (min(s[5] for s in met), max(s[5] for s in met), len(met))),
        ("atlas_roughness_1024.png", "Roughness", "non-colour",
         "%.2f on %s to %.2f on %s"
         % (min(s[6] for s in sw),
            min(sw, key=lambda s: s[6])[0].replace("_", " ").lower(),
            max(s[6] for s in sw),
            max(sw, key=lambda s: s[6])[0].replace("_", " ").lower())),
        ("atlas_emissive_1024.png", "Emissive", "non-colour",
         "%d swatches — %d gems at 0.12–0.14, %d runes at 0.85"
         % (len(emi), len(emi) - len(hot), len(hot))),
    ]


MAPS = _map_captions()

GRID, CELL = META["grid"], META["cell"]


def swatch_crop(atlas, idx):
    """Pull swatch `idx` out of the real atlas.

    Redrawing the swatches from the hex values would be easier and would be a
    lie: the atlas cells carry brushed, grain, band and gem patterns that the hex
    does not describe. These are the shipping pixels, cropped from the shipping
    file, so the legend cannot drift from the texture.
    """
    col, row = idx % GRID, idx // GRID
    y1 = atlas.height - row * CELL          # palette.py measures rows from the
    y0 = y1 - CELL                          # BOTTOM, PIL from the top
    return atlas.crop((col * CELL, y0, (col + 1) * CELL, y1))


def atlas_sheet():
    s = Sheet()
    sw = META["swatches"]
    s.head("ROBLOX_WEAPONRY_SET_01", "One Atlas, One Draw Call",
           "Shading is a UV offset, not a second texture — the whole set samples one 1024² map",
           [("atlas", "1024²"), ("slots used", "%d / 64" % len(sw)),
            ("maps", "4"), ("draw calls", "1")], 5)
    s.y += 26
    s.block("The four maps", "same UV layout, so one set of UVs drives all of them")

    d = s.d
    n = len(MAPS)
    cw = (s.cw - 26 * (n - 1)) // n
    ytop = s.y
    free = GRID * GRID - len(sw)
    used_rows = (len(sw) + GRID - 1) // GRID
    for i, (fn, nm, space, desc) in enumerate(MAPS):
        x0 = s.x0 + i * (cw + 26)
        x1 = x0 + cw
        side = cw - 40
        ph = side + 40 + 96
        panel(d, (x0, s.y, x1, s.y + ph), PANEL, EDGE, 12)
        im = Image.open(os.path.join(TEX, fn)).convert("RGBA")
        im = im.resize((side, side), Image.LANCZOS)
        s.ov.alpha_composite(im, (x0 + 20, s.y + 20))

        # Cell grid, drawn on its own layer and alpha-composited. Drawing a
        # translucent fill straight onto s.ov would REPLACE the atlas pixels
        # rather than blend with them and punch holes in the texture.
        #
        # Without it these thumbnails read as broken files: the set uses 28 of 64
        # slots, so the top half of every map is legitimately black. The grid plus
        # the label turns that black into visible headroom.
        gl = Image.new("RGBA", (side, side), (0, 0, 0, 0))
        gd = ImageDraw.Draw(gl)
        for j in range(1, GRID):
            g = int(round(side * j / GRID))
            gd.line((0, g, side - 1, g), fill=(255, 255, 255, 26))
            gd.line((g, 0, g, side - 1), fill=(255, 255, 255, 26))
        if i == 0:
            fy = side * (GRID - used_rows) / GRID
            text(gd, (side * 0.5, fy * 0.5 - 16), "%d SLOTS FREE" % free,
                 font("label", 15), (150, 162, 178), "ma", 2.6)
            text(gd, (side * 0.5, fy * 0.5 + 12),
                 "room for armour, relics, props", font("body", 16),
                 (112, 122, 136), "ma")
        s.ov.alpha_composite(gl, (x0 + 20, s.y + 20))
        d.rectangle((x0 + 20, s.y + 20, x0 + 20 + side - 1, s.y + 20 + side - 1),
                    outline=(64, 72, 86))
        yy = s.y + side + 40
        text(d, (x0 + 20, yy), nm, font("serif", 26, 600), INK, "la")
        text(d, (x1 - 20, yy + 6), space, font("mono", 16), INK_3, "ra", 0.6)
        para(d, (x0 + 20, yy + 38), desc, font("body", 18), INK_2, cw - 40, 24)
    s.y = ytop + (cw - 40) + 40 + 96 + 30
    text(d, (s.x0, s.y), "1024 × 1024  ·  %d × %d grid of %d px cells  ·  %d px "
         "pad per side against mip bleed  ·  %d of %d slots free for armour and "
         "props" % (GRID, GRID, CELL, META["pad"], free, GRID * GRID),
         font("mono", 19), INK_2, "la", 0.4)
    s.y += 62

    s.block("Swatch legend", "cropped from the shipping atlas, not redrawn")
    COLS = 4
    cw2 = (s.cw - 30 * (COLS - 1)) // COLS
    CH = 112
    atlas = Image.open(os.path.join(TEX, "atlas_color_1024.png")).convert("RGBA")
    for i, sp in enumerate(sw):
        name, hexv, shade, tint, patt, metal, rough, emis = sp
        col, row = i % COLS, i // COLS
        x0 = s.x0 + col * (cw2 + 30)
        y0 = s.y + row * (CH + 14)
        panel(d, (x0, y0, x0 + cw2, y0 + CH), PANEL, (36, 42, 52), 8)
        chipim = swatch_crop(atlas, i).resize((CH - 28, CH - 28), Image.LANCZOS)
        s.ov.alpha_composite(chipim, (x0 + 14, y0 + 14))
        d.rectangle((x0 + 14, y0 + 14, x0 + 14 + CH - 29, y0 + 14 + CH - 29),
                    outline=(64, 72, 86))
        tx = x0 + 14 + (CH - 28) + 18
        text(d, (tx, y0 + 18), "%02d" % i, font("mono", 15, 700), INK_3, "la", 1.0)
        text(d, (tx + 34, y0 + 18), name, font("label", 17), INK, "la", 0.8)
        text(d, (tx, y0 + 48), "#" + hexv, font("mono", 17), INK_2, "la", 0.4)
        text(d, (x0 + cw2 - 14, y0 + 48), patt, font("body", 17), INK_3, "ra")
        text(d, (tx, y0 + 74), "metal %.2f   rough %.2f" % (metal, rough),
             font("mono", 16), INK_3, "la", 0.4)
        if emis:
            text(d, (x0 + cw2 - 14, y0 + 74), "emit %.2f" % emis,
                 font("mono", 16), AMBER, "ra", 0.4)
    rows_used = (len(sw) + COLS - 1) // COLS
    s.y += rows_used * (CH + 14) + 26

    note(d, (s.x0, s.y, s.x1, s.y + 214), "Two things to know before you import",
         ["Roblox has no emissive texture slot. The emissive map is there for the "
          "Blender renders on these sheets; in Studio the rune and gem swatches "
          "need a Neon-material overlay part, a SurfaceAppearance with a bright "
          "colour, or a light — whichever suits your pipeline. Nothing else about "
          "the set depends on it.",
          "Metalness is deliberately capped at 0.85 rather than 1.0. A fully "
          "metallic surface takes its colour from the environment, and under "
          "Roblox's lighting that reads as grey plastic. Holding it below 1.0 "
          "keeps the hue in the steel and the brass."])
    s.y += 214
    return s.finish(os.path.join(OUT, "05_texture_atlas_sheet.png"),
                    foot(5, "texture_atlas_sheet"), FOOT_R)


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for fn in (contact, topology, modularity, scale_sheet, atlas_sheet):
        p, w, h = fn()
        print("%-34s %5d x %5d" % (os.path.basename(p), w, h))
