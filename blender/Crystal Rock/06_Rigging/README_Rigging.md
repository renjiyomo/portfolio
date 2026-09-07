# Blocky Creature - Rigging & Animation Documentation

## Overview
This directory contains the production-ready rigged version of the Blocky Crystal Creature.
The rig consists of a 25-bone quadruped skeleton with rigid low-poly skin weighting across all 154 segmented blocks.

---

## Directory Contents

| File | Format | Purpose |
| :--- | :---: | :--- |
| **`Blocky_Creature_Rigged.blend`** | Blender 5.x | Master rigged Blender scene with Armature and skin weights |
| **`Blocky_Creature_Rigged.fbx`** | FBX 2020 | Production FBX for Roblox Studio Animation Editor, Unity, Unreal |
| **`Blocky_Creature_Rigged.glb`** | glTF 2.0 | Universal web/engine skinned binary format |
| **`Previews/skeleton_rest_pose.png`** | Image | Anatomical rest pose showing skeleton layout |
| **`Previews/skeleton_action_pose.png`** | Image | Test pose showing jaw articulation, tail curve, and leg stride |

---

## Skeleton Hierarchy (25 Bones)

```text
Root (Ground plane origin)
└── Hips (Pelvis & rear torso)
    ├── Spine_01 (Mid abdomen & flank crystals)
    │   └── Chest (Upper torso & front dorsal crystals)
    │       ├── Neck
    │       │   └── Head (Upper skull, eyes, horns, cheek crystals)
    │       │       ├── Jaw (Lower jaw & lower teeth)
    │       │       └── Tongue (Internal tongue block)
    │       ├── Leg_Front_Upper_L -> Leg_Front_Lower_L -> Paw_Front_L
    │       └── Leg_Front_Upper_R -> Leg_Front_Lower_R -> Paw_Front_R
    ├── Tail_01 -> Tail_02 -> Tail_03 -> Tail_04 -> Tail_05_Club
    ├── Leg_Rear_Upper_L -> Leg_Rear_Lower_L -> Paw_Rear_L
    └── Leg_Rear_Upper_R -> Leg_Rear_Lower_R -> Paw_Rear_R
```

---

## Skinning Strategy (Rigid Voxel Weighting)

* **Weight Distribution:** Every block has 100% rigid weight (`1.0`) assigned to its anatomically parented bone.
* **Aesthetic Advantage:** Prevents vertex bending/rubber-stretching on flat cube faces, preserving the iconic voxel/blocky geometry during any extreme pose or animation.

---

## Roblox Studio Import Guide

1. Open **Roblox Studio**.
2. Go to the **Avatar** or **Home** tab and click **3D Importer**.
3. Select `Blocky_Creature_Rigged.fbx`.
4. In the 3D Importer options:
   * Ensure **Rig** is checked.
   * Under **File Geometry**, verify **Import as Model** with separate MeshParts.
5. Click **Import**.
6. Open **Animation Editor** (under the Avatar tab), select the imported creature model, and create your walk, idle, attack, and roar animations using the 25 bones!
