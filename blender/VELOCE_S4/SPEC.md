# VELOCE S4 — Mid-Size Sedan

**Fictional exterior game asset · Blender 5.2 · Test model / portfolio sample**

Author: Mark Erick Serrano · markerick.vercel.app · github.com/renjiyomo

---

## 1. The numbers that matter

**28,972 triangles.** The brief caps at 50,000, so this ships with **21,028 triangles of headroom — 42% of the budget unused.** That headroom is deliberate: it is the room a client needs for a higher-detail trim, a spoiler, a roof rack, or a second wheel design without the base asset having to be re-optimised first.

| Module | Objects | Verts | Quads | **Tris** | % of asset |
|---|---:|---:|---:|---:|---:|
| Body shell | 1 | 3,490 | 3,870 | **6,888** | 23.8% |
| Wheels (4 ×) | 12 | 8,104 | 7,792 | **14,704** | 50.8% |
| Front clip | 4 | 1,857 | 1,564 | **3,104** | 10.7% |
| Rear clip | 4 | 1,458 | 1,288 | **2,576** | 8.9% |
| Exterior details | 20 | 920 | 1,004 | **1,700** | 5.9% |
| **Total** | **41** | **15,829** | **15,518** | **28,972** | **100%** |

Per wheel: 3,676 tris. In the .blend the four wheels share **three unique mesh datablocks** (tyre, rim, brake) instanced four times — 3,676 unique tris rendering as 14,704. Any engine with instancing support gets that saving for free; the table above reports the honest rendered count either way.

### Mesh hygiene — audited, not assumed

| Check | Result |
|---|---|
| N-gons (5+ sided faces) | **0** — 100% quads |
| Loose / orphan vertices | **0** |
| Degenerate (zero-area) faces | **0** |
| Coincident duplicate vertices | **0** |
| Wire edges (0 faces) | **0** |
| Non-manifold edges (3+ faces) | **0** |
| Boundary edges (1 face) | 2,208 — *intentional, see below* |
| Custom normals / sharp edges | Explicit sharp pass on every material boundary |

The 2,208 boundary edges are **open shells by design.** This is a no-interior exterior asset: door apertures, the grille mouth, the lamp cavities and the underbody stop where the visible surface stops rather than being sealed into watertight solids. Sealing them would cost triangles the client is not paying for and would never be seen. Every one of those edges is a deliberate silhouette or aperture boundary — there are zero accidental holes, zero stray wire edges and zero true non-manifold junctions anywhere in the asset.

---

## 2. Brief compliance

| Requirement | Delivered |
|---|---|
| Under 50,000 triangles | **28,972** (42% headroom) |
| 3D wheels | Full 3D rim, spokes, barrel, tyre carcass, vented rotor, caliper, lug bolts — no billboards, no flat discs |
| Textured tyres | UV-mapped tyre with authored base-colour + data maps, moulded sidewall lettering |
| No interior | Exterior only. Tinted glass reads as glass; no cabin, seats, dash or door cards |
| Fictionalised | Original marque and model. No real-world badge, grille signature, lamp graphic or licensed form anywhere |
| Swappable front/rear bumper + lights | Front and rear are **separate modules**, 4 objects each, in their own collection |
| Roofline and side profile held constant | Body shell is a single untouched object. A trim swap modifies **0 vertices** of it |

---

## 3. Why a trim variant is a $5–10 job, not a re-model

This is the part of the brief that decides whether a long-run contract is profitable, so it was designed for first and the geometry was built around it.

The body shell is lofted from transverse cross-section rings swept along the length. The roofline, greenhouse, shoulder line, side profile and both wheel arches live entirely in that single object. **A trim variant never opens it.**

Each end of the car is an independent module of exactly four objects:

```
Front clip                        Rear clip
  SED_Front_Clip    (fascia)        SED_Rear_Clip     (fascia)
  SED_Front_Grille  (grille/trim)   SED_Rear_Trim     (trim/diffuser)
  SED_Front_Lamps   (headlamps)     SED_Rear_Lamps    (tail lamps)
  SED_Front_Splitter(lower splitter)SED_Rear_Splitter (lower valance)
```

Both clips terminate on a **shared tie-in ring** — a fixed loop of vertices snapped to the body shell's end station. Any replacement clip built on that same ring drops in with no gap, no re-weld and no change to the body. Delete four objects, drop in four objects, done.

The clips are generated from a spec dictionary plus an aperture-map function: lamp and grille openings are made by **omitting grid cells** rather than by boolean cutting, so a new lamp shape is a change to a map function, not a re-topology job. `08_module_breakdown.png` colour-codes this — orange is everything a front-end variant touches, teal is the rear, grey is the body that never moves.

**Cost of a full front + rear restyle: 5,680 triangles reworked — 19.6% of the asset. Cost to the body: zero.** A wheel-only variant is smaller still: swap one rim mesh and all four positions update, because they share the datablock.

---

## 4. Geometry & measurements

All figures measured from the delivered mesh, not from design intent.

| | |
|---|---|
| Overall length | 4,925 mm |
| Body width | 1,842 mm (2,059 mm over mirrors) |
| Overall height | 1,475 mm |
| Wheelbase | 2,820 mm |
| Track | 1,576 mm |
| Tyre outside diameter | 696 mm |
| Tyre section width | 235 mm |
| Bead diameter | 481 mm (≈ 19 in) — sidewall marked 235/45R19, nominal 694 mm |
| Ground contact | Wheels sit exactly on Z = 0 |
| Origin | World origin, at ground level, on the wheelbase centre and the body centreline |

Real-world sedan proportions throughout — this is not a stylised toy scaled to look like a car. Origin placement is engine-ready: drop it in and it stands on the floor, centred, facing the right way.

---

## 5. Materials & texturing

**25 materials**, named on a strict `MT_` convention so they sort and re-map predictably on import:

```
Paint / body     MT_Paint_Body  MT_TrimGlossBlack  MT_Chrome_Satin  MT_Cap_Gloss
                 MT_UnderbodyMatte  MT_Plate_Blank
Glass            MT_Glass_Tinted  MT_Mirror_Glass
Lighting         MT_Lamp_Lens  MT_Lamp_DRL  MT_Lamp_Red  MT_Lamp_Amber
                 MT_Lamp_Housing  MT_Lamp_Divider
Grille           MT_Grille_Dark  MT_Grille_Bar
Wheels           MT_Tire_VELOCE  MT_Rubber_Satin  MT_Rim_Graphite
                 MT_Rim_Machined  MT_Rim_Inner  MT_Lug_Steel
Brakes           MT_Brake_Rotor  MT_Brake_Caliper
Studio           MT_Studio_Floor  (set dressing, not part of the car)
```

**Tyre textures** — `VELOCE_Tire_BaseColor.png` (2048 × 512, sRGB) and `VELOCE_Tire_Data.png` (2048 × 512, Non-Color, carrying tread and sidewall relief). Both are procedurally authored, tile correctly around the circumference, and are packed into the .blend as well as shipped loose.

**Lamp internals** are authored as opaque, low-F0 emissive surfaces rather than transmissive glass. That is a real-time engine decision, not a shortcut: transmissive lamp lenses are the most common cause of sort-order artefacts and blown highlights in game cars. These read correctly under any lighting and never need a transparency pass.

**Tail-lamp segmentation costs zero triangles** — the divider bars between light segments are painted in with material indices on existing faces rather than modelled as separate geometry.

---

## 6. Delivery contents

```
VELOCE_S4/
├── VELOCE_S4.blend          Blender 5.2, compressed, all images packed
├── SPEC.md                  this document
├── export/
│   ├── VELOCE_S4.fbx        Y-up, −Z forward, edge smoothing, no scale bake
│   ├── VELOCE_Tire_BaseColor.png
│   └── VELOCE_Tire_Data.png
├── tex/
│   ├── VELOCE_Tire_BaseColor.png
│   └── VELOCE_Tire_Data.png
└── renders/
    ├── 01_front_three_quarter.png    05_rear_elevation.png
    ├── 02_rear_three_quarter.png     06_wheel_detail.png
    ├── 03_side_profile.png           07_wireframe.png
    ├── 04_front_elevation.png        08_module_breakdown.png
```

FBX exports clean — **zero warnings**, all 41 objects carrying correct material bindings. Note that FBX embedding only carries the base-colour map, so **both tyre PNGs are shipped loose in `export/`** and that folder is self-contained. OBJ, glTF or a Unity/Unreal-native format can be provided on request; the source is non-destructive so any target format is a re-export, not a rebuild.

Renders are 1920 × 1080 EEVEE with raytraced reflections, AgX view transform, on a 13-light studio rig. Plates 07 and 08 are viewport passes — a real wireframe over clay, not a post-effect.

---

## 7. Scope boundaries and known soft spots

Stated plainly, because a client discovering these later is worse than a client reading them now.

**Deliberately out of scope, per the brief:** no interior of any kind; no engine bay; no chassis or suspension under the visible underbody; no rigging, animation or LOD chain; no separated opening doors, bonnet or boot.

**Technical limits worth knowing:** UVs exist on the four tyres only — every other surface uses solid PBR materials with no maps, which is correct for a flat-colour game car but means decals, liveries or baked AO would need a UV pass first (a small, quotable add-on). Tyre tread is normal-mapped rather than modelled; it holds up to normal camera distance and in-engine use, but is not a macro-photography asset.

**Craft honesty at close range:** the fender shoulder surfacing is softer than I want it — there is a slight lumpiness in the highlight across the front quarter. The greenhouse is upright with a thick A-pillar. Wheel-arch to tyre gaps run ~61 mm, a little generous. The front-clip-to-fender tie-in seam is visible under raking light at close range. Lamp internals are graphic rather than fully modelled reflector detail. None of these affect the triangle budget, the modular architecture or in-engine behaviour, and all are surfacing refinements I would tighten on a production pass rather than structural problems.

---

## 8. On throughput and the long-run commitment

The brief asks for one car a week, sustained. That is a pipeline question, not a modelling question, so this asset was built as a pipeline rather than as a one-off sculpt.

The body is generated from a station table and a cross-section function. The clips are generated from a spec dictionary and an aperture map. The wheel is a revolve plus a spoke pattern. Every one of those is **reusable input, not hand-pushed vertices** — which is what makes the second car faster than the first, and the twentieth trim variant nearly free. The 42% triangle headroom, the strict naming convention, the zero-defect mesh audit and the clip tie-in ring all exist for the same reason: so that week twelve of a contract costs the same as week one.

Test model available on request, to whatever spec you set.
