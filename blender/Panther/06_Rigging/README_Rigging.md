# Blocky Panther Boss - Professional Rigging & Animation Guide

This directory contains the **31-bone quadruped armature and skinned mesh package** for the **Blocky Panther Boss**, optimized for direct use in the **Roblox Studio Animation Editor** and Blender.

---

## 1. Rig Specifications & Structure

- **Armature Name**: `Panther_Boss_Rig`
- **Total Bones**: 31 bones
- **Total Skinned MeshParts**: 91 modular pieces
- **Triangle Count**: 5,240 tris
- **Skinning Architecture**: 100% Rigid Voxel Weighting (Weight = 1.0 per block)
  - Every individual segment/block is bound completely to its corresponding parent bone.
  - This prevents rubbery face bending or geometric stretching, preserving the sharp blocky aesthetic in every animated pose.

---

## 2. Complete Bone Hierarchy Tree

```text
Root
└── Hips
    ├── Spine_01
    │   └── Spine_02
    │       ├── Neck
    │       │   └── Head
    │       │       ├── Jaw (Controls lower jaw, teeth, tongue opening)
    │       │       ├── Ear_L
    │       │       └── Ear_R
    │       ├── UpperLeg_FL
    │       │   └── LowerLeg_FL
    │       │       └── Foot_FL
    │       │           └── Paw_FL (Controls paw base + 3 claws)
    │       └── UpperLeg_FR
    │           └── LowerLeg_FR
    │               └── Foot_FR
    │                   └── Paw_FR (Controls paw base + 3 claws)
    ├── Tail_01
    │   └── Tail_02
    │       └── Tail_03
    │           └── Tail_04
    │               └── Tail_05
    │                   └── Tail_06 (Full 6-segment articulated tail)
    ├── UpperLeg_BL
    │   └── LowerLeg_BL
    │       └── Foot_BL
    │           └── Paw_BL (Controls back left paw base + 3 claws)
    └── UpperLeg_BR
        └── LowerLeg_BR
            └── Foot_BR
                └── Paw_BR (Controls back right paw base + 3 claws)
```

---

## 3. Directory Contents

| File | Format | Purpose |
| :--- | :--- | :--- |
| **`BlockyPanther_Rigged.blend`** | Blender 5.x Scene | Master rigging source with `Panther_Boss_Rig` in Rest Pose, 4 studio lights, 6 cameras, and material shaders. |
| **`BlockyPanther_Rigged.fbx`** | FBX 2020 / Binary | Production export configured with `armature_nodetype='NULL'` and skinned mesh modifiers for Roblox Studio. |
| **`BlockyPanther_Rigged.glb`** | glTF 2.0 Binary | Skinned standard glTF model with embedded node hierarchy and rest skin transforms. |
| **`Previews/skeleton_rest_pose.png`** | PNG (1280x720) | Showcase render in default Rest Pose. |
| **`Previews/skeleton_action_pose.png`** | PNG (1280x720) | Dynamic action pose demonstrating jaw opening, tail arching, and limb articulation. |

---

## 4. How to Import & Animate in Roblox Studio

### Method A: Using the Avatar Setup / Custom Rig Importer
1. Open Roblox Studio.
2. In the **Avatar** tab, select **Rig Builder** or **Custom Rig** / **3D Importer**.
3. Select `BlockyPanther_Rigged.fbx`.
4. Under the import settings:
   - Verify that **Import as Skinned Mesh** or **Rig** is enabled.
   - Confirm the bone hierarchy displays `Root` -> `Hips` -> `Spine_01` etc.
5. Click **Import**.

### Method B: Opening with the Animation Editor
1. In Roblox Studio, open **Plugins** -> **Animation Editor**.
2. Click on the imported Panther model.
3. You will see all 31 bones available on the animation timeline (`Jaw`, `Tail_01` through `Tail_06`, `UpperLeg_*`, etc.).
4. Rotate any bone (e.g. `Jaw` around X to roar, `Tail_*` to whip, `Head` to snarl) to keyframe custom combat, idle, or walking animations.
