"""
armory_lib -- geometry, shading and QC helpers for ROBLOX_WEAPONRY_SET_01.

Design rules this library enforces, because they are what makes an asset
actually usable in a game rather than merely pretty in a render:

  1. QUADS ONLY. Every surface is a lofted band of quads or a Coons grid cap.
     There are no boolean operations, no bevel modifiers, no triangulate, no
     remesh. Section point counts are multiples of four so that caps close as
     a quad grid instead of a triangle fan.
  2. ONE MATERIAL, ONE TEXTURE SET. Shading is a UV lookup into a swatch atlas
     (see palette.py). Each face samples a point inside its swatch: the swatch
     picks the material, the height inside the swatch picks the light value.
     Cost in engine is one draw call per weapon regardless of how many
     "materials" a weapon appears to have.
  3. ORIGIN IS THE GRIP. Mesh coordinates are authored with the hand contact
     point at (0, 0, 0) and the weapon's length running up +Z. Objects carry a
     rack offset in their object transform for presentation only; exports zero
     it, so the pivot a Tool welds to is exact.
  4. NOTHING IS HAND-NUDGED. Every dimension comes from a station table, so a
     variant is a number change, not a remodel.
"""
import bmesh
import bpy
import math
import os
import sys
from collections import Counter
from mathutils import Vector

_HERE = os.path.dirname(os.path.abspath(__file__))
if _HERE not in sys.path:
    sys.path.insert(0, _HERE)
import palette as PAL  # noqa: E402

TAU = math.pi * 2.0

# Key light used to bake face shading into the UV lookup. The render rig points
# its key light down the same vector so baked and rendered light agree.
LIGHT = Vector((-0.42, -0.62, 0.66)).normalized()

SET_NAME = "WEAPONRY_SET_01"
MAT_NAME = "MT_Armory_Master"


# ============================================================================
# scene plumbing
# ============================================================================
def reset_scene():
    """Empty the file without leaving orphan datablocks behind."""
    for ob in list(bpy.data.objects):
        bpy.data.objects.remove(ob, do_unlink=True)
    for coll in list(bpy.data.collections):
        bpy.data.collections.remove(coll)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.images,
                bpy.data.node_groups, bpy.data.curves, bpy.data.lights,
                bpy.data.cameras, bpy.data.textures, bpy.data.worlds):
        for b in list(blk):
            try:
                blk.remove(b, do_unlink=True)
            except (ReferenceError, RuntimeError):
                pass
    sc = bpy.context.scene
    # 1 Blender unit == 1 Roblox stud. Unit display is left OFF deliberately so
    # nothing in the file implies metres.
    sc.unit_settings.system = "NONE"
    sc.unit_settings.scale_length = 1.0


def ensure_collection(name, parent=None):
    if name in bpy.data.collections:
        return bpy.data.collections[name]
    c = bpy.data.collections.new(name)
    (parent or bpy.context.scene.collection).children.link(c)
    return c


def build_master_material(tex_dir):
    """One Principled node fed by the four atlas maps. Shared by every weapon."""
    mat = bpy.data.materials.get(MAT_NAME) or bpy.data.materials.new(MAT_NAME)
    mat.use_nodes = True
    nt = mat.node_tree
    nt.nodes.clear()

    out = nt.nodes.new("ShaderNodeOutputMaterial")
    out.location = (620, 0)
    bsdf = nt.nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (280, 0)
    nt.links.new(bsdf.outputs["BSDF"], out.inputs["Surface"])

    def tex(fname, colorspace, y, label):
        n = nt.nodes.new("ShaderNodeTexImage")
        n.location = (-380, y)
        n.label = label
        path = os.path.join(tex_dir, fname)
        img = bpy.data.images.load(path, check_existing=True)
        img.name = fname
        img.colorspace_settings.name = colorspace
        n.image = img
        n.interpolation = "Linear"
        n.extension = "EXTEND"
        return n

    t_col = tex("atlas_color_1024.png", "sRGB", 300, "COLOR")
    t_met = tex("atlas_metalness_1024.png", "Non-Color", 40, "METALNESS")
    t_rgh = tex("atlas_roughness_1024.png", "Non-Color", -220, "ROUGHNESS")
    t_emi = tex("atlas_emissive_1024.png", "Non-Color", -480, "EMISSIVE (render only)")

    def link(src, socket, dst_name):
        s = bsdf.inputs.get(dst_name)
        if s is not None:
            nt.links.new(src.outputs[socket], s)

    link(t_col, "Color", "Base Color")
    link(t_met, "Color", "Metallic")
    link(t_rgh, "Color", "Roughness")
    link(t_col, "Color", "Emission Color")

    mul = nt.nodes.new("ShaderNodeMath")
    mul.operation = "MULTIPLY"
    mul.location = (-90, -480)
    mul.inputs[1].default_value = 2.2
    nt.links.new(t_emi.outputs["Color"], mul.inputs[0])
    if bsdf.inputs.get("Emission Strength") is not None:
        nt.links.new(mul.outputs["Value"], bsdf.inputs["Emission Strength"])

    for nm, val in (("IOR", 1.45), ("Specular IOR Level", 0.5)):
        s = bsdf.inputs.get(nm)
        if s is not None:
            s.default_value = val
    return mat


# ============================================================================
# 2D sections -- closed loops in a local (a, b) plane, point count % 4 == 0
# ============================================================================
def sec_poly(n, r, rot=0.0):
    """Regular n-gon. n must be a multiple of 4."""
    return [(r * math.cos(rot + TAU * i / n), r * math.sin(rot + TAU * i / n))
            for i in range(n)]


def sec_rrect(w, d, n=16, corner=0.30):
    """Rounded rectangle of full width w and full depth d, as a superellipse."""
    p = max(2.05, 2.0 / max(corner, 0.02))
    pts = []
    for i in range(n):
        th = TAU * i / n
        c, s = math.cos(th), math.sin(th)
        x = (w * 0.5) * (1 if c >= 0 else -1) * abs(c) ** (2.0 / p)
        y = (d * 0.5) * (1 if s >= 0 else -1) * abs(s) ** (2.0 / p)
        pts.append((x, y))
    return pts


_BLADE_US = {
    8: [1.0, 0.86, 0.66, 0.42, 0.0, -0.42, -0.66, -0.86, -1.0],
    10: [1.0, 0.88, 0.70, 0.48, 0.22, 0.0, -0.22, -0.48, -0.70, -0.88, -1.0],
}


def sec_blade(w, th, fuller=0.0, n_side=8, min_th=0.12, fuller_w=0.20):
    """Double-edged blade section: width along a, thickness along b.

    fuller   -- depth of the central groove as a fraction of half-thickness.
                0 gives a plain lens; 0.42 gives a proper fullered blade with a
                ridge either side of the groove.
    fuller_w -- half-width of the groove as a fraction of half-blade-width.
    Returns 2 * n_side points, so caps close as a quad grid.
    """
    us = _BLADE_US[n_side]
    half = th * 0.5

    def f(u):
        base = (1.0 - min(abs(u), 1.0) ** 2.2) ** 0.55
        if fuller > 0.0:
            base -= fuller * math.exp(-(u / fuller_w) ** 2)
        return max(base, 0.0 if abs(u) >= 0.999 else min_th)

    top = [(u * w * 0.5, f(u) * half) for u in us]
    bot = [(u * w * 0.5, -f(u) * half) for u in reversed(us[1:-1])]
    return top + bot


def sec_teardrop(w, d, n=16, sharp=1.7):
    """Leaf / spearhead outline: widest below centre, drawn to a point at +b."""
    pts = []
    for i in range(n):
        th = TAU * i / n
        c, s = math.cos(th), math.sin(th)
        k = (1.0 - s) * 0.5                     # 0 at the tip, 1 at the butt
        pts.append(((w * 0.5) * c * (k ** 0.55 * 1.25 + 0.02),
                    (d * 0.5) * (1 if s >= 0 else -1) * abs(s) ** (1.0 / sharp)))
    return pts


def sec_lerp(a, b, t):
    return [(p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t)
            for p, q in zip(a, b)]


def place(sec, t, axis="Z", sx=1.0, sy=1.0, ox=0.0, oy=0.0, roll=0.0,
          off=(0.0, 0.0, 0.0)):
    """Lift a 2D section onto a 3D ring at parameter `t` along `axis`.

    sx/sy/ox/oy/roll act in the section's own 2D frame; `off` is added
    afterwards in world space, which is what you want for positioning a
    cross-guard or a wheel pommel that sweeps along X or Y.
    """
    cr, sr = math.cos(roll), math.sin(roll)
    ofs = Vector(off)
    out = []
    for a, b in sec:
        a2, b2 = a * sx + ox, b * sy + oy
        a3, b3 = a2 * cr - b2 * sr, a2 * sr + b2 * cr
        if axis == "Z":
            v = Vector((a3, b3, t))
        elif axis == "X":
            v = Vector((t, a3, b3))
        else:  # 'Y'
            v = Vector((b3, t, a3))
        out.append(v + ofs)
    return out


def stations(table, sec_fn, axis="Z", off=(0.0, 0.0, 0.0)):
    """Turn a table of dicts into a list of rings.

    Each row: {'t':, 'sx':, 'sy':, 'ox':, 'oy':, 'roll':, 'off':, plus anything
    sec_fn wants}. sec_fn(row) returns the 2D section for that station. A row's
    own 'off' is added to the table-wide `off`.
    """
    base = Vector(off)
    rings = []
    for row in table:
        rings.append(place(sec_fn(row), row["t"], axis=axis,
                           sx=row.get("sx", 1.0), sy=row.get("sy", 1.0),
                           ox=row.get("ox", 0.0), oy=row.get("oy", 0.0),
                           roll=row.get("roll", 0.0),
                           off=base + Vector(row.get("off", (0.0, 0.0, 0.0)))))
    return rings


# ============================================================================
# Part -- one bmesh with a per-face region tag
# ============================================================================
class Part:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.rl = self.bm.faces.layers.int.new("region")
        self.shells = 0

    # -- low level ---------------------------------------------------------
    def _mkverts(self, pts):
        return [self.bm.verts.new(p) for p in pts]

    def _face(self, vs, region):
        try:
            f = self.bm.faces.new(vs)
        except ValueError:
            return None
        f[self.rl] = region
        return f

    @staticmethod
    def _reg(region, i, j):
        return region(i, j) if callable(region) else region

    def band(self, ra, rb, region, close=True):
        """Quad band between two equal-length rings of BMVerts."""
        n = len(ra)
        rng = range(n) if close else range(n - 1)
        for j in rng:
            k = (j + 1) % n
            self._face([ra[j], ra[k], rb[k], rb[j]], self._reg(region, 0, j))

    def cap(self, ring, region, flip=False):
        """Coons quad-grid cap on a ring whose length is a multiple of 4."""
        n = len(ring)
        assert n % 4 == 0, "%s: cap ring of %d is not a multiple of 4" % (self.name, n)
        k = n // 4
        if k == 1:                      # 4 verts -> a single quad
            vs = list(ring)
            self._face(vs[::-1] if flip else vs, self._reg(region, 0, 0))
            return

        def R(i):
            return ring[i % n]

        p00, p10, p11, p01 = R(0), R(k), R(2 * k), R(3 * k)
        cb = [R(i) for i in range(k + 1)]
        cr = [R(k + j) for j in range(k + 1)]
        ct = [R(3 * k - i) for i in range(k + 1)]
        cl = [R((4 * k - j) % n) for j in range(k + 1)]

        grid = [[None] * (k + 1) for _ in range(k + 1)]
        for i in range(k + 1):
            for j in range(k + 1):
                if j == 0:
                    grid[i][j] = cb[i]
                elif j == k:
                    grid[i][j] = ct[i]
                elif i == 0:
                    grid[i][j] = cl[j]
                elif i == k:
                    grid[i][j] = cr[j]
                else:
                    u, v = i / k, j / k
                    co = ((1 - v) * cb[i].co + v * ct[i].co
                          + (1 - u) * cl[j].co + u * cr[j].co
                          - ((1 - u) * (1 - v) * p00.co + u * (1 - v) * p10.co
                             + (1 - u) * v * p01.co + u * v * p11.co))
                    grid[i][j] = self.bm.verts.new(co)
        for i in range(k):
            for j in range(k):
                q = [grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]]
                self._face(q[::-1] if flip else q, self._reg(region, 0, 0))

    # -- high level --------------------------------------------------------
    def tube(self, rings, region, cap_a=True, cap_b=True, cap_region=None):
        """Loft a list of rings (as point lists) into a closed quad shell."""
        vr = [self._mkverts(r) for r in rings]
        for i in range(len(vr) - 1):
            n = len(vr[i])
            for j in range(n):
                k = (j + 1) % n
                self._face([vr[i][j], vr[i][k], vr[i + 1][k], vr[i + 1][j]],
                           self._reg(region, i, j))
        cr = cap_region if cap_region is not None else region
        if cap_a:
            self.cap(vr[0], cr, flip=True)
        if cap_b:
            self.cap(vr[-1], cr, flip=False)
        self.shells += 1
        return vr

    def box(self, cx, cy, cz, w, d, h, region, n=16, corner=0.22, taper=1.0,
            roll=0.0, steps=1):
        """Rounded box centred on (cx,cy,cz), optionally tapering toward +Z."""
        table = []
        for s in range(steps + 1):
            f = s / steps
            table.append(dict(t=cz - h * 0.5 + h * f, ox=cx, oy=cy, roll=roll,
                              sx=1.0 + (taper - 1.0) * f,
                              sy=1.0 + (taper - 1.0) * f))
        return self.tube(stations(table, lambda r: sec_rrect(w, d, n, corner)),
                         region)

    def ring_torus(self, cz, r_major, r_minor, region, n_major=12, n_minor=8,
                   squash=1.0, cx=0.0, cy=0.0, axis="Z"):
        """A collar / rivet ring. Closed shell, all quads, no poles."""
        rings = []
        for i in range(n_major):
            a = TAU * i / n_major
            ca, sa = math.cos(a), math.sin(a)
            sec = sec_poly(n_minor, r_minor)
            ring = []
            for p in sec:
                r = r_major + p[0]
                h = p[1] * squash
                if axis == "Z":
                    ring.append(Vector((cx + r * ca, cy + r * sa, cz + h)))
                elif axis == "Y":
                    ring.append(Vector((cx + r * ca, cy + h, cz + r * sa)))
                else:  # 'X'
                    ring.append(Vector((cx + h, cy + r * ca, cz + r * sa)))
            rings.append(ring)
        vr = [self._mkverts(r) for r in rings]
        for i in range(n_major):
            a, b = vr[i], vr[(i + 1) % n_major]
            for j in range(n_minor):
                k = (j + 1) % n_minor
                self._face([a[j], a[k], b[k], b[j]], self._reg(region, i, j))
        self.shells += 1

    # -- finish ------------------------------------------------------------
    def finalize(self, coll, mat, paint_spec, sharp_deg=33.0, loc=(0, 0, 0),
                 merge=1e-5):
        bm = self.bm
        bmesh.ops.remove_doubles(bm, verts=bm.verts[:], dist=merge)
        bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
        bm.normal_update()
        self._paint(paint_spec)
        for f in bm.faces:
            f.smooth = True
        for e in bm.edges:
            if len(e.link_faces) == 2:
                a = e.link_faces[0].normal.angle(e.link_faces[1].normal)
                e.smooth = math.degrees(a) <= sharp_deg
            else:
                e.smooth = False

        me = bpy.data.meshes.new(self.name)
        bm.to_mesh(me)
        bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(self.name, me)
        ob.location = loc
        coll.objects.link(ob)
        return ob

    # -- shading -----------------------------------------------------------
    def _paint(self, spec):
        bm = self.bm
        uv = bm.loops.layers.uv.get("UVMap") or bm.loops.layers.uv.new("UVMap")
        rl = self.rl
        xs = [v.co.x for v in bm.verts]
        ys = [v.co.y for v in bm.verts]
        zs = [v.co.z for v in bm.verts]
        z0, z1 = min(zs), max(zs)
        ax_max = max(max(abs(x) for x in xs), 1e-6)
        ay_max = max(max(abs(y) for y in ys), 1e-6)
        rad_max = max((Vector((v.co.x, v.co.y)).length for v in bm.verts), default=1.0)
        span_z = max(z1 - z0, 1e-6)

        missing = set()
        for f in bm.faces:
            reg = f[rl]
            s = spec.get(reg)
            if s is None:
                missing.add(reg)
                s = spec.get(0) or dict(pal="PAINT_BLACK", mode="nl")
            pal = PAL.P[s["pal"]]
            lo, hi = s.get("lo", 0.16), s.get("hi", 0.97)
            mode = s.get("mode", "nl")
            per = s.get("per", "face")
            stretch = s.get("stretch")
            s_fix = s.get("s", 0.5)
            cen = f.calc_center_median()

            def tval(nrm, co):
                if mode == "nl":
                    x = 0.5 + 0.5 * max(-1.0, min(1.0, nrm.dot(LIGHT)))
                elif mode == "nz":
                    x = 0.5 + 0.5 * nrm.z
                elif mode == "h":
                    x = (co.z - z0) / span_z
                elif mode == "ax":
                    x = abs(co.x) / ax_max
                elif mode == "ay":
                    x = abs(co.y) / ay_max
                elif mode == "rad":
                    x = Vector((co.x, co.y)).length / max(rad_max, 1e-6)
                elif mode == "const":
                    x = 1.0
                else:
                    x = 0.5
                if s.get("invert"):
                    x = 1.0 - x
                return lo + (hi - lo) * max(0.0, min(1.0, x))

            t_face = tval(f.normal, cen)
            if stretch == "ang":
                base = math.atan2(cen.y, cen.x) / TAU + 0.5
            for lp in f.loops:
                co = lp.vert.co
                t = t_face if per == "face" else tval(lp.vert.normal, co)
                if stretch == "z":
                    sv = (co.z - z0) / span_z
                elif stretch == "x":
                    sv = 0.5 + 0.5 * co.x / ax_max
                elif stretch == "ang":
                    a = math.atan2(co.y, co.x) / TAU + 0.5
                    if a - base > 0.5:
                        a -= 1.0
                    elif a - base < -0.5:
                        a += 1.0
                    sv = a
                else:
                    sv = s_fix
                lp[uv].uv = PAL.cell_uv(pal, t, sv)
        if missing:
            print("  ! %s: unpainted regions %s" % (self.name, sorted(missing)))


# ============================================================================
# QC
# ============================================================================
def qc(ob):
    me = ob.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.normal_update()
    quads = tris = ngons = 0
    tri_total = 0
    degenerate = 0
    for f in bm.faces:
        n = len(f.verts)
        tri_total += n - 2
        if n == 4:
            quads += 1
        elif n == 3:
            tris += 1
        else:
            ngons += 1
        if f.calc_area() < 1e-9:
            degenerate += 1
    loose = sum(1 for v in bm.verts if not v.link_faces)
    wire = sum(1 for e in bm.edges if not e.link_faces)
    boundary = sum(1 for e in bm.edges if len(e.link_faces) == 1)
    over = sum(1 for e in bm.edges if len(e.link_faces) > 2)
    # --- normal orientation -------------------------------------------------
    # Neither the manifold test nor the ngon test catches an INVERTED shell, and
    # that is the bug that actually shipped once already: sweep a mirrored part
    # with descending t and every face comes back wound the wrong way. The mesh
    # stays watertight, all-quad and clean by every other measure, and the only
    # symptom is a face that renders black. Two independent checks:
    #   flipped  -- signed volume < 0, i.e. the WHOLE shell is inside-out
    #   noncontig -- two faces share an edge but traverse it the same way, i.e.
    #                the winding is inconsistent PART-way through the mesh
    # A part built by mirroring is exactly the case where one is clean and the
    # other is not, so both are needed.
    try:
        vol = bm.calc_volume(signed=True)
    except TypeError:
        vol = 0.0
    flipped = 1 if vol < 0.0 else 0
    noncontig = sum(1 for e in bm.edges
                    if len(e.link_faces) == 2 and not e.is_contiguous)
    seen = {}
    dupes = 0
    for v in bm.verts:
        key = (round(v.co.x, 5), round(v.co.y, 5), round(v.co.z, 5))
        if key in seen:
            dupes += 1
        seen[key] = 1
    uv_ok = "UVMap" in [l.name for l in bm.loops.layers.uv]
    bad_uv = 0
    if uv_ok:
        lay = bm.loops.layers.uv["UVMap"]
        for f in bm.faces:
            for lp in f.loops:
                u, v = lp[lay].uv
                if not (0.0 <= u <= 1.0 and 0.0 <= v <= 1.0):
                    bad_uv += 1
    bb = [Vector(c) for c in ob.bound_box]
    lo = Vector((min(p.x for p in bb), min(p.y for p in bb), min(p.z for p in bb)))
    hi = Vector((max(p.x for p in bb), max(p.y for p in bb), max(p.z for p in bb)))
    # Unapplied scale or rotation is the classic way a mesh that looks right in
    # Blender arrives in Roblox at the wrong size or lying on its side, because
    # what survives an FBX round-trip depends on the exporter's axis settings.
    # Every object here must carry IDENTITY scale and rotation; the only thing
    # allowed in the transform is the rack offset in `location`.
    xform = 0
    if tuple(round(v, 6) for v in ob.scale) != (1.0, 1.0, 1.0):
        xform += 1
    if max(abs(a) for a in ob.rotation_euler) > 1e-6:
        xform += 1
    bm.free()
    return dict(name=ob.name, verts=len(me.vertices), faces=len(me.polygons),
                tris=tri_total, quads=quads, tri_faces=tris, ngons=ngons,
                loose=loose, wire=wire, boundary=boundary, over=over,
                degenerate=degenerate, dupes=dupes, uv=uv_ok, bad_uv=bad_uv,
                flipped=flipped, noncontig=noncontig, volume=round(vol, 6),
                xform=xform,
                bbox_lo=tuple(round(v, 4) for v in lo),
                bbox_hi=tuple(round(v, 4) for v in hi),
                dim=tuple(round(v, 4) for v in (hi - lo)),
                mats=[m.name for m in me.materials])


def qc_report(objs):
    rows = [qc(o) for o in objs]
    bad = []
    for r in rows:
        for k in ("ngons", "loose", "wire", "boundary", "over", "degenerate",
                  "dupes", "bad_uv", "flipped", "noncontig", "xform"):
            if r[k]:
                bad.append("%s: %s=%d" % (r["name"], k, r[k]))
        if not r["uv"]:
            bad.append("%s: no UVMap" % r["name"])
    return rows, bad


def counter_of_regions(ob):
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    rl = bm.faces.layers.int.get("region")
    c = Counter(f[rl] for f in bm.faces) if rl else Counter()
    bm.free()
    return c
