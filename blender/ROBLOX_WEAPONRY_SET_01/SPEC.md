# ROBLOX_WEAPONRY_SET_01 — Specification

A nine-piece stylized weapon set for an open-world Roblox RPG. Built as a single focused
`.blend` so the weaponry category stays self-contained: one file, one material, one texture
atlas, nine exportable meshes.

| | |
|---|---|
| Pieces | 9 |
| Triangles, whole set | 13,692 |
| Faces | 6,846 — **100% quads**, zero triangles, zero n-gons |
| Vertices | 6,970 |
| Objects in the `.blend` | 28 (modular parts) |
| Objects per exported FBX | 1 (parts merged) |
| Materials | 1, for the entire set |
| Textures | 1 atlas set — 4 maps at 1024 × 1024 |
| Draw calls | 1 per piece |
| Authored in | Blender 5.2.1 LTS, EEVEE |
| Unit | 1 stud = 1 Blender unit (`unit_system = NONE`) |

Every number in this document was measured out of the scene or out of the exported files by
script. None of them were typed in by hand or estimated. Where I could not verify something
without Roblox Studio in front of me, it is in section 9 and flagged as unverified rather than
quietly asserted.

---

## 1. The set

| # | File stem | Name | Rarity | Hands | Parts | Tris | Verts | Faces |
|---|---|---|---|---|---|---|---|---|
| 1 | `WPN_01_Sword_T1_Common` | Wayfarer Longsword | Common | 1 | 4 | 1,292 | 656 | 646 |
| 2 | `WPN_02_Sword_T2_Rare` | Gilded Oathblade | Rare | 1 | 4 | 1,832 | 932 | 916 |
| 3 | `WPN_03_Sword_T3_Legendary` | Duskwarden, Crown of the First Watch | Legendary | 1 | 4 | 2,588 | 1,314 | 1,294 |
| 4 | `WPN_04_Greataxe_Ironjaw` | Ironjaw Greataxe | Rare | 2 | 3 | 1,700 | 866 | 850 |
| 5 | `WPN_05_Spear_Wardens_Pike` | Warden's Pike | Common | 2 | 2 | 1,432 | 724 | 716 |
| 6 | `WPN_06_Bow_Recurve_Hunters` | Hunter's Recurve | Rare | 2 | 2 | 1,088 | 548 | 544 |
| 7 | `WPN_06B_Arrow_Hunters` | Broadhead Arrow | Common | — | 3 | 468 | 244 | 234 |
| 8 | `WPN_07_Staff_Runewarden` | Runewarden Staff | Legendary | 2 | 3 | 1,600 | 814 | 800 |
| 9 | `WPN_08_Shield_Round_Bulwark` | Bulwark Round Shield | Common | 1 | 3 | 1,692 | 872 | 846 |
| | | | | **28** | **13,692** | **6,970** | **6,846** |

Items 1–3 are one weapon at three rarity tiers, not three weapons. See section 7 — that
distinction is the commercially important part of this set.

### Dimensions, in studs

| Piece | X | Y | Z | z range | Notes |
|---|---|---|---|---|---|
| Sword T1 | 0.860 | 0.152 | 3.800 | −0.520 → +3.280 | |
| Sword T2 | 0.940 | 0.297 | 3.800 | −0.520 → +3.280 | identical envelope to T1 |
| Sword T3 | 1.024 | 0.308 | 3.800 | −0.520 → +3.280 | identical envelope to T1 |
| Greataxe | 1.245 | 0.280 | 4.100 | −2.620 → +1.480 | head hangs to +X off the haft |
| Spear | 0.437 | 0.162 | 6.320 | −2.860 → +3.460 | longest piece in the set |
| Bow | 0.638 | 0.366 | 3.240 | −1.620 → +1.620 | at rest, string undrawn |
| Arrow | 0.130 | 0.252 | 2.730 | 0.000 → +2.730 | origin at the nock, not a hand |
| Staff | 0.466 | 0.449 | 3.960 | −2.100 → +1.860 | |
| Shield | 2.504 | 0.670 | 2.504 | −1.252 → +1.252 | Z is the disc diameter, not a length |

The three swords are dimensionally identical: same total length, same z range, same blade
envelope. Only the cross-section widens with rarity. This is deliberate and section 7 explains
why it is worth money.

---

## 2. Scale, orientation and origins

**1 stud = 1 Blender unit.** The scene has `unit_system = NONE` and `scale_length = 1.0`, so
there is no unit conversion anywhere in the pipeline and no scale factor to remember on import.
A 3.800 in this document is 3.800 studs in Studio.

**Every mesh origin is at (0, 0, 0), and z = 0 is the point the hand closes on.** Not the base
of the weapon, not the centre of its bounding box — the grip. This is the whole reason the set
is worth its file size: one Tool weld offset works for all nine pieces, and swapping a sword for
an axe does not require re-tuning where it sits in the hand.

That claim is checkable, and I checked it. The held part of each piece — `GRIP` on the swords
and shield, `HAFT` on the axe, spear and staff, the grip band of the `LIMB` on the bow, `SHAFT`
on the arrow — is centred on the Z axis in every exported file:

| Piece | Held part | x centre after export |
|---|---|---|
| Sword T1 / T2 / T3 | `GRIP` | +0.0000 |
| Greataxe | `HAFT` | −0.0000 |
| Spear | `HAFT` | −0.0005 |
| Bow | `LIMB` at z = 0 | +0.0000 |
| Arrow | `SHAFT` | +0.0000 |
| Staff | `HAFT` | −0.0002 |
| Shield | `GRIP` | −0.0000 |

Worst deviation across the set is 0.0005 studs. Sheet 04 draws a one-stud grid over an
orthographic elevation of all nine pieces so you can see the datum pass through every grip
rather than take my word for it.

**Asymmetry is intentional where it exists.** The exported axe spans x −0.215 → +1.030 and the
bow spans x −0.300 → +0.338. Neither is a centring error. The axe haft is on the axis with the
head hanging out to +X, which is what an axe does; centring the *bounding box* would have put
the haft off-axis and broken the grip convention. The bow's grip is exactly on the axis at
z = 0, and the limb bbox is asymmetric because a recurve is asymmetric — the belly bows back to
x = −0.279 at z = ±1.0, the tips curve forward to x = +0.190 at z = ±1.55, and the string sits
ahead of the grip at x = +0.306.

**The one exception, stated plainly:** the arrow's origin is at its nock (z range starts at
0.000), because an arrow is held at the nock when drawn and at no point by a grip. Eight of nine
pieces put z = 0 at the hand; the arrow puts it at the string.

**Axis handedness.** The `.blend` is Z-up. The FBX export converts to Y-up
(`axis_up='Y'`, `axis_forward='-Z'`), which is the convention Roblox expects. In the `.blend`,
"up the weapon" is +Z; in the FBX and in Studio it is +Y. Section 6 covers what survives that
conversion.

**Layout inside the `.blend`.** The nine pieces are laid out side by side along X so the lineup,
wireframe and scale sheets can be rendered without moving anything. Only piece 1 happens to sit
at x = 0; the rest are offset up to x = +11.552. The exporter removes each piece's own grip
offset on the way out, so this layout is a convenience for rendering and never reaches the FBX.
Do not read the `.blend`'s X positions as part of the spec.

---

## 3. Triangle budget

Target band was 1,500–3,500 triangles per piece. Where the set sits:

| Piece | Tris | |
|---|---|---|
| Sword T3 Legendary | 2,588 | in band |
| Sword T2 Rare | 1,832 | in band |
| Greataxe | 1,700 | in band |
| Shield | 1,692 | in band |
| Staff | 1,600 | in band |
| Spear | 1,432 | **under** |
| Sword T1 Common | 1,292 | **under** |
| Bow | 1,088 | **under** |
| Arrow | 468 | **under** |

Four pieces are under the floor, and I did not pad them. A spear is a stick with a point on it;
a broadhead arrow at 2.7 studs is a few hundred triangles' worth of shape and no more. Adding
geometry to hit a number would cost you frame time and buy nothing you could see. If you would
rather have them heavier — more haft segments, a bound-grip detail on the spear, a fluted
arrowhead — say so and I will spend the triangles somewhere they show.

### Per part

| Piece | Part | Tris | Part | Tris | Part | Tris | Part | Tris |
|---|---|---|---|---|---|---|---|---|
| Sword T1 | BLADE | 384 | GUARD | 288 | GRIP | 464 | POMMEL | 156 |
| Sword T2 | BLADE | 500 | GUARD | 496 | GRIP | 496 | POMMEL | 340 |
| Sword T3 | BLADE | 1,180 | GUARD | 624 | GRIP | 496 | POMMEL | 288 |
| Greataxe | HEAD | 708 | HAFT | 800 | RIVETS | 192 | | |
| Spear | HEAD | 628 | HAFT | 804 | | | | |
| Bow | LIMB | 1,044 | STRING | 44 | | | | |
| Arrow | HEAD | 180 | SHAFT | 96 | FLETCHING | 192 | | |
| Staff | CLAW | 480 | HAFT | 960 | STONE | 160 | | |
| Shield | DISC | 720 | FITTINGS | 540 | GRIP | 432 | | |

---

## 4. Topology and shading

**All quads.** 6,846 faces, 6,846 of them quadrilateral. No triangles, no n-gons, anywhere in
the set. Nothing here was built with booleans, remesh, a bevel modifier or a triangulate pass —
every shell is lofted quad bands closed with grid caps, which is why it stays editable.

An independent corroboration of that, since it is easy to state and hard to fake: the set has
**13,692 edges and 13,692 triangles**. For a closed all-quad manifold, edges = 2 × faces and
triangles = 2 × faces, so the two counts must be equal. They are.

**Full QC, run on the saved `.blend` after a cold reopen — every one of these is zero:**

| Check | Result |
|---|---|
| n-gons (faces with > 4 sides) | 0 |
| triangular faces | 0 |
| loose vertices (linked to no face) | 0 |
| wire edges (linked to no face) | 0 |
| boundary edges — i.e. holes | 0 |
| non-manifold edges (3+ faces) | 0 |
| degenerate faces (area < 1e−9) | 0 |
| coincident vertices (to 5 dp) | 0 |
| inverted shells (signed volume < 0) | 0 |
| inconsistent winding | 0 |
| UV loops outside the 0–1 square | 0 |
| non-identity scale or rotation | 0 |
| meshes missing a UV layer | 0 of 28 |

Every shell is watertight and manifold with consistent outward winding — minimum signed volume
across the set is +0.001653, so nothing is inside-out. All 28 objects carry a `UVMap` layer and
all UVs land inside the atlas: u 0.0117 → 0.9810, v 0.0268 → 0.4868.

**Shading is per-edge sharp flags, not a smoothing angle.** 4,926 of 13,692 edges (36.0%) are
flagged sharp. The thresholds were set per part by measuring actual dihedral angles rather than
by picking a number that looked right — on the axe head, for example, a 17° threshold left both
the cheek-to-bevel shoulder (14.5°) and the cutting edge (15.6°) smooth-shaded, which turned a
correct wedge into a bar of soap. It ships at 11°. There are no flat-shaded faces and no object
with zero sharp edges; the whole set relies on this mechanism.

---

## 5. Materials and texturing

**One material, `MT_Armory_Master`, on all 28 objects.** One 1024 × 1024 atlas set. Every piece
is therefore a single draw call and a single MeshPart, and merging a weapon's parts into one mesh
on export is lossless.

The atlas is an 8 × 8 grid of 128 px cells with 12 px of padding per side against mip bleed.
Each cell is a named material swatch drawn as a **vertical value ramp** rather than a flat
colour: a face's UV picks the swatch horizontally and picks its light value vertically. That is
where the shading gradients come from. 28 of 64 slots are used; the remaining 36 are free, which
is deliberate headroom for armour, relics and props on the same atlas and therefore the same
draw call.

| Map | File | Colour space | Content |
|---|---|---|---|
| Colour | `atlas_color_1024.png` | sRGB | 28 swatches, each a vertical value ramp |
| Metalness | `atlas_metalness_1024.png` | non-colour | 0.55–0.85 on the 10 metals, zero everywhere else |
| Roughness | `atlas_roughness_1024.png` | non-colour | 0.08 on gem sapphire → 0.85 on cloth crimson |
| Emissive | `atlas_emissive_1024.png` | non-colour | 5 swatches — 3 gems at 0.12–0.14, 2 runes at 0.85 |

Metalness never reaches 1.0 and roughness never reaches 0.0; fully specular metal reads as a
grey mirror at Roblox's usual camera distance and loses the silhouette.

**How emissive is wired, and why it is not in the FBX.** The emissive atlas is a scalar mask. It
feeds `Emission Strength` through a ×2.2 multiplier, while `Emission Color` is taken from the
*colour* atlas — so a rune glows in its own swatch colour without needing a second coloured map.
This is a Blender/EEVEE arrangement. Because the mask drives a strength socket rather than a
texture slot the FBX exporter recognises, `atlas_emissive_1024.png` is **not** copied into the
`.fbm` sidecar folders. It ships in `textures/` and is packed into the `.blend`, and it is what
produces the rune glow in the renders. See section 9 for what to do about glow in Studio.

`textures/atlas_key.png` is a standalone legend naming all 28 swatches with their hex, metalness,
roughness and emission values. All four atlases are packed into the `.blend`, so the file opens
with no missing-texture errors regardless of where you put it.

---

## 6. Export settings, and what survives the round trip

Exported with Blender's FBX exporter, binary FBX version 7400 (FBX 2014/2015 — the most widely
supported flavour). The settings that matter, and why:

| Setting | Value | Why |
|---|---|---|
| `global_scale` | 1.0 | with a unitless scene, one Blender unit is one stud, end of story |
| `apply_unit_scale` | True | |
| `apply_scale_options` | `FBX_SCALE_NONE` | no scale baked into the node or the mesh |
| `axis_up` / `axis_forward` | `Y` / `-Z` | Roblox is Y-up; the exporter does the conversion |
| `bake_space_transform` | False | leaves the conversion in the node transform rather than rewriting vertices |
| `object_types` | `{'MESH'}` | no lights, no cameras, no rig figure |
| `mesh_smooth_type` | `EDGE` | writes per-edge sharp flags. `FACE` would discard the entire smooth/sharp split |
| `use_triangles` | False | quads are preserved so you can edit them |
| `path_mode` | `COPY` | textures land in a `.fbm` folder next to the file |
| `embed_textures` | False | keeps the FBX small and the textures inspectable |
| `add_leaf_bones` | False | nothing is rigged |

**I re-imported all nine FBX files with default import settings and measured them.** Not a spot
check — all nine, and against the source scene:

| | Source `.blend` | Round-tripped FBX |
|---|---|---|
| Triangles, all 9 | 13,692 | **13,692** |
| Faces that are not quads | 0 | **0** |
| Edges flagged sharp | 4,926 | **4,926** |
| Objects per piece | 2–4 parts | **1 merged mesh** |
| Mesh origin | (0, 0, 0) | **(0, 0, 0)** |
| z ranges | as section 1 | **identical** |
| Bounding box agreement | — | **within 1 × 10⁻⁶ studs** |

So scale, origin, orientation, quad topology and the sharp-edge flags all survive into the file.
The only discrepancy is float32 rounding in the sixth decimal place. The one thing this does
*not* prove is how Roblox's own importer interprets those sharp flags — see section 9.

Both shapes are provided: nine individual FBX files for import as separate MeshParts, and
`ROBLOX_WEAPONRY_SET_01_ALL.fbx` with the whole set in one file if you would rather bring it in
once and split it in Studio.

Each FBX has its own `.fbm` folder holding the colour, metalness and roughness atlases. **Those
nine copies are byte-identical to the files in `textures/`** — point every SurfaceAppearance at
one uploaded set of three images rather than uploading nine copies.

---

## 7. The socket system, and what a task costs

This is the part I would most like you to look at, because it changes what a rarity variant is
worth.

The sword is not modelled as a sword. It is modelled as four modules that seat on fixed heights:

| Module | Seats between | Span |
|---|---|---|
| `BLADE` | z +0.380 → +3.280 | 2.900 |
| `GUARD` | z +0.260 → +0.420 | 0.160 |
| `GRIP` | z −0.280 → +0.260 | 0.540 |
| `POMMEL` | z −0.520 → −0.280 | 0.240 |

Eight named heights, six of them distinct, because the guard overlaps the grip top and the blade
root seats 0.040 inside the guard. **Those heights are the same in all three tiers.** The
consequence is that Common, Rare and Legendary share an identical grip contact point, an
identical Tool weld offset, an identical total length of 3.800 and an identical blade envelope.
One animation set covers the line. One hitbox tuning pass covers the line. A fourth tier is a new
row in a parameter table.

Where the triangles actually go when rarity increases:

| Module | Common | Rare | Legendary | T1 → T3 |
|---|---|---|---|---|
| `BLADE` | 384 | 500 | 1,180 | ×3.07 |
| `GUARD` | 288 | 496 | 624 | ×2.17 |
| `GRIP` | 464 | 496 | 496 | **×1.07** |
| `POMMEL` | 156 | 340 | 288 | ×1.85 |
| **Total** | **1,292** | **1,832** | **2,588** | **×2.00** |

The grip is the same mesh in all three tiers — the ×1.07 is two extra wrap risers and nothing
else. Rarity is read almost entirely off the blade and the guard, which is exactly where a
variant should spend. `renders/modules_swords.png` shows the kit pulled apart along Z.

### Rate proposal

Your post sets a $5 floor and says tasks scale with the amount requested. Here is what I think
maps honestly onto that, based on what these nine pieces actually took:

| Task | Rate | Reasoning |
|---|---|---|
| Rarity or skin variant of an existing class | **$5** | a new row in the parameter table. This is the genuine $5 task |
| New weapon inside an existing class | $10–15 | new silhouette, existing socket table and atlas |
| New weapon class, new silhouette | $25–35 | see below |
| Complete 3-tier line for a new class | $30–40 | the class, then two variants at the variant rate |
| Props at this fidelity, in batches | $5–8 each | trees, books, crates — sharing this atlas |

I want to be straight about the third row rather than quote you a flat $5 and deliver something
worse. **The greataxe head went through six passes before its silhouette read correctly.** Early
versions had the mass centred on the eye, which reads as a sledgehammer, and an edge that was a
single smooth arc, which reads as a leaf. No parameter table would have produced the fix. A new
class with a new silhouette is genuinely more work than a variant, and pricing the two the same
means either the variant is overpriced or the class is underpriced.

The set is also arranged so bulk work gets cheaper honestly rather than by cutting corners: 36
free atlas slots and one shared material mean armour and props can join this set without adding
a draw call or a texture upload.

---

## 8. Known weaknesses and deliberate choices

Things I would tell you across a desk. None of these are blocking; several are choices you might
want made differently.

**The greataxe is the weakest piece.** Its head is 1.245 wide by 1.240 tall — very nearly square,
where a bearded axe usually reads wider than it is tall. The bevel occupies more of the section
than a real axe's does, which makes the cheek carry a broad soft specular sweep that reads
slightly glossy rather than forged. The two rivets can read faintly as eyes at small sizes. And
no single hero angle shows both the beard notch (visible from −X) and the wedge cross-section
(visible from +X); I chose the notch. It reads correctly as a bearded greataxe in the lineup and
contact sheets, so I stopped, but it is the piece I would rebuild first.

**Four pieces are under the triangle floor** — spear 1,432, Common sword 1,292, bow 1,088, arrow
468. Deliberate, explained in section 3, and easy to reverse if you want them heavier.

**No normal maps.** All surface reading comes from the sharp-edge flags plus the value ramp baked
into each swatch. This holds up at Roblox's typical camera distance and goes flat in a close-up
inspection view. If the game has a weapon-inspect camera, tell me and I will author them.

**No LODs and no authored collision meshes.** Roblox generates both. At these triangle counts LOD
almost certainly does not matter. Collision is worth a thought: an automatic hull around a thin
blade becomes a fat box, so if you need tight hit detection on the swords or the spear, that is a
separate small task.

**The bow is modelled at rest** with a straight string and no draw pose, no flex, and no separate
string bone. A drawn bow is a different mesh or a rig, not a pose of this one.

**Nothing is rigged, and no attachment points are exported.** The grip convention is z = 0, but
that is a convention documented here, not an `Attachment` object in the file. If you would rather
have explicit weld/attachment empties exported, that is a quick change.

**Single UV set.** No second channel for lightmaps, which Roblox does not need.

**Two caveats about the presentation sheets themselves,** so you do not read something off them
that is not there. On sheet 01, the hero cells are *not* size-comparable — each piece was framed
individually, so the arrow is drawn as tall as the pike. Every cell prints its real stud length
and the sheet says so in an amber note. On sheet 04, the lineup camera carries a 2.24° elevation
for readability, so the stud grid is exact on the centre plane and within about 0.02 studs of a
shaft's near face.

**The humanoid on sheet 04 is a proportional stand-in at 5 studs, not a measured R6 or R15 rig.**
It is there for gross proportion only. See section 9.

---

## 9. Not verified in Roblox Studio

I built and measured this in Blender. I did not have Studio in front of me. Everything below is
either a value I am confident about but did not confirm, or a question only Studio can answer.
Please check these before scaling the set up.

**The MeshPart triangle limit.** Roblox enforces a per-MeshPart triangle cap. I have not
confirmed the current figure, so I am not going to quote one. What I can say is that the largest
piece here is 2,588 triangles and the whole nine-piece set is 13,692, which is far below any cap
I am aware of — so this set is not at risk. Confirm the current limit before you commission
anything substantially heavier.

**Whether Roblox honours per-edge sharp flags.** Verified: the FBX files *contain* them, and they
survive a full round trip through Blender (4,926 of them, exactly). Not verified: whether
Roblox's importer reconstructs them or silently smooths everything. If the meshes arrive looking
soft and rounded in Studio, that is the cause, and the fix is a pre-export edge split on the
flagged edges. That raises vertex counts but not triangle counts, and I can produce a split
variant of the whole set on request.

**Emissive.** To the best of my knowledge Roblox's `SurfaceAppearance` exposes ColorMap,
MetalnessMap, RoughnessMap and NormalMap, with no emissive slot — please confirm against the
current API. If that is right, the rune glow you see in the renders cannot come across as a
texture. The practical routes are a `Neon`-material sub-part for the rune band, a small
`PointLight` at the staff's stone, or a transparent additive decal. The mask is authored and
shipped either way, so whichever route you choose, the glowing regions are already defined.

**The 1024 × 1024 texture size** is within limits as far as I know, but worth confirming against
the current upload rules.

**The 5-stud humanoid reference** is a proportional stand-in. I did not verify it against R6 or
R15 measurements. If weapon-to-character proportion matters — and for a spear at 6.320 studs it
does — give me your actual character height and I will re-check every piece against it. That is a
scaling pass, not a remodel, because everything is parametric.

**Whether these lengths suit your combat design.** The spear is 6.320 studs, which is long. It
was chosen to read as a polearm at a distance, not tuned to a reach stat.

---

## 10. File manifest

```
ROBLOX_WEAPONRY_SET_01.blend        the deliverable. All 4 atlases packed.
ROBLOX_WEAPONRY_SET_01.blend1       Blender's automatic backup of the previous save.

fbx/
  WPN_01_Sword_T1_Common.fbx        9 individual exports, 1 merged mesh each
  ... through WPN_08_Shield_Round_Bulwark.fbx
  ROBLOX_WEAPONRY_SET_01_ALL.fbx    whole set in one file
  *.fbm/                            sidecar textures per FBX; byte-identical
                                    to textures/, so upload one set, not nine

textures/
  atlas_color_1024.png              sRGB
  atlas_metalness_1024.png          non-colour
  atlas_roughness_1024.png          non-colour
  atlas_emissive_1024.png           non-colour; not referenced by the FBX (see §5)
  atlas_key.png                     legend: all 28 swatches, named, with values

renders/
  hero_T1 T2 T3 AXE SPEAR BOW ARROW STAFF SHIELD .png    per-piece beauty shots
  lineup_grips.png                  all 9 on the shared origin plane, orthographic
  modules_swords.png                the socket kit pulled apart along Z
  scale_reference.png               against the 5-stud stand-in figure
  wireframe.png                     all 9, wire over shell

sheets/
  01_contact_sheet.png              the set, per-piece counts and dimensions
  02_topology_sheet.png             wireframes, triangle budget, full QC table
  03_modularity_sheet.png           socket table, tier parameters, cost per module
  04_scale_and_grips_sheet.png      stud grid, origin proof, export conventions
  05_texture_atlas_sheet.png        all 4 maps, swatch legend, atlas headroom

build/                              the Blender-side generator scripts
  palette.py        the 28-swatch table and atlas geometry
  make_atlas.py     writes the 4 PNGs  (runs outside Blender — no PIL in Blender)
  armory_lib.py     mesh primitives, lofts, grid caps, and the QC harness
  build_swords.py   the socket table and the 3 tiers
  build_others.py   the other 6 classes
  build_all.py      orchestrates a full rebuild
  render_rig.py     lighting, cameras, and the render passes
  sheets.py         the diagram passes
  export_fbx.py     the merge, the grip re-centring, and the export settings
  meta.json         every measured number, dumped from the live scene

tools/                              the sheet compositor (plain CPython + Pillow)
  sheet_kit.py      typography, palette and layout primitives
  make_sheets.py    the five sheets, all values read from meta.json
```

`__pycache__` folders are generated and can be deleted.

### Rebuilding

The set is fully scripted; nothing was modelled by hand, so any change is a parameter change and
a rerun.

Inside Blender, `build/build_all.py` regenerates all 28 objects from scratch, then
`build/export_fbx.py` writes the FBX set and `build/render_rig.py` and `build/sheets.py` shoot
the renders. Outside Blender, `build/make_atlas.py` writes the four atlas PNGs and
`tools/make_sheets.py` composites the five sheets. The split is not arbitrary: Blender ships no
PIL, so everything that draws a letterform or an atlas happens in plain CPython, and Blender only
ever loads the finished PNGs. A layout change therefore costs about a minute of compositing
instead of a re-render.

No sheet number is typed by hand. `build/meta.json` is dumped from the live scene and the
compositor reads every count, dimension and swatch value out of it — including the map captions
on sheet 05, which are computed from the swatch table rather than written, specifically so a
hand-counted figure cannot slip onto a sheet whose footer promises measured values.

---

*Blender 5.2.1 LTS · 1 stud = 1 Blender unit · every count in this document measured, not
estimated.*
