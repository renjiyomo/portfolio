# Blocky Panther Boss - Roblox Studio Import & Coloring Guide

This folder contains the **static, fully modular 3D assembly** for the **Blocky Panther Boss**, ready for direct import into Roblox Studio.

## Asset Information
- **Total MeshParts**: 91 individual separated parts
- **Total Triangles**: 5,240 tris (optimally budgeted for high performance)
- **Scale**: Normalized 1.0 (Bake space transform applied, centered)
- **Vertex Color Lock**: None (Clean standard materials, fully colorable in Studio)

---

## File Formats Included
1. **`BlockyPanther_Studio.fbx`**: Recommended for Roblox Studio 3D Importer. Preserves all 91 distinct `MeshPart` nodes with individual origins and semantic names.
2. **`BlockyPanther_Studio.glb`**: glTF 2.0 binary container with embedded materials.
3. **`BlockyPanther_Studio.obj` & `BlockyPanther_Studio.mtl`**: Universal wavefront geometry export.

---

## How to Import & Color in Roblox Studio

### 1. Importing into Roblox Studio
1. Open your Roblox Studio experience.
2. Under the **Home** tab or **Avatar** tab, click **3D Importer**.
3. Select `BlockyPanther_Studio.fbx`.
4. In the preview window:
   - Ensure **Import as Single Model** is selected.
   - Click **Import**.
5. You will receive a `Model` named `BlockyPanther_Studio` containing 91 separate `MeshPart` children.

### 2. Coloring Separately in Roblox Studio
Every single segmented cube and claw is an independent `MeshPart`:
- To change the fur color: Select any `Spine_*`, `UpperLeg_*`, or `Head_*` part and change `Color` or `BrickColor` in the **Properties** window.
- To customize the eyes: Select `Eye_Iris_L` / `Eye_Iris_R` (purple) or `Eye_Pupil_L` / `Eye_Pupil_R` (white) and adjust color or set `Material = Neon`.
- To change teeth and claws: Select `Tooth_*` or `Claw_*` parts and apply ivory, bone, or gold materials.
- Because vertex colors are unlocked, Roblox Studio property overrides apply directly and immediately.
