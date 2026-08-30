/* ==========================================================================
   models.js — 3D modeling work
   ========================================================================== */

window.MODELS = (function () {
  'use strict';

  var SEDAN = 'assets/models/veloce-s4/';
  var T1    = 'assets/models/wayfarer-longsword/';
  var T2    = 'assets/models/gilded-oathblade/';
  var T3    = 'assets/models/duskwarden/';
  var AXE   = 'assets/models/ironjaw-greataxe/';
  var SPEAR = 'assets/models/wardens-pike/';
  var BOW   = 'assets/models/hunters-recurve-bow/';
  var STAFF = 'assets/models/runewarden-staff/';
  var SHIELD= 'assets/models/bulwark-shield/';

  return {

    /* ── Sedan ─────────────────────────────────────────────── */
    'veloce-s4': {
      title: 'Sedan',
      lede: 'A game-ready mid-size sedan with clean quad topology and modular bumper clips.',
      body: [
        'A hard-surface mid-size sedan built to real-time standards with 28,972 triangles, 100% clean quads, and zero n-gons.',
        'Features modular front and rear clip architecture for rapid variant restyling, detailed wheel and brake assemblies, and PBR materials.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Real-time / game engine',
        polys:    '28,972 tris',
        objects:  '41 objects, 5 modules',
        dims:     '4,925 × 1,842 × 1,475 mm',
        textures: '25 PBR materials · 2K tyre maps',
        rigged:   'No — static exterior asset',
        format:   'GLB · FBX · OBJ on request'
      },
      glb: SEDAN + 'veloce-s4.glb',
      items: [
        { src: SEDAN + 'hero.webp', w: 1600, h: 900, alt: 'Sedan, front three-quarter studio render', cap: 'Front three-quarter' },
        { src: SEDAN + '02.webp',   w: 1600, h: 900, alt: 'Sedan, rear three-quarter studio render', cap: 'Rear three-quarter' },
        { src: SEDAN + '03.webp',   w: 1600, h: 900, alt: 'Sedan, side profile render', cap: 'Side profile — the roofline held constant across trims' },
        { src: SEDAN + '06.webp',   w: 1600, h: 900, alt: 'Close detail render of the Sedan wheel, rim and brake rotor', cap: 'Wheel detail — 3,676 tris a corner, full barrel and vented rotor' },
        { src: SEDAN + '07.webp',   w: 1600, h: 900, alt: 'Wireframe viewport pass over the Sedan showing quad topology', cap: 'Wireframe — 100% quads, zero n-gons' },
        { src: SEDAN + '08.webp',   w: 1600, h: 900, alt: 'Module breakdown of the Sedan with front clip, rear clip and body shell colour-coded', cap: 'Module breakdown — the clips are independent, the body never moves' },
        { src: SEDAN + '04.webp',   w: 1600, h: 900, alt: 'Sedan, front elevation render', cap: 'Front elevation' },
        { src: SEDAN + '05.webp',   w: 1600, h: 900, alt: 'Sedan, rear elevation render', cap: 'Rear elevation' }
      ]
    },

    /* ── Wayfarer Longsword ────────────────────────────────── */
    'wayfarer-longsword': {
      title: 'Wayfarer Longsword',
      tag: 'Roblox · Common',
      lede: 'A one-handed steel longsword crafted for Roblox RPG combat with modular 4-part assembly.',
      body: [
        'A stylized low-poly weapon built with 1,292 triangles and 100% clean quads across 4 modular components: Blade, Guard, Grip, and Pommel.',
        'Shares a unified 1024×1024 PBR texture atlas with the entire weapon set for a single draw call per piece. Engineered with custom origin centered precisely at the hand grip datum for zero-offset Roblox Tool welds.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,292 tris (646 quads)',
        objects:  '4 modular parts (Merged)',
        dims:     '0.86 × 0.15 × 3.80 studs',
        textures: '1024×1024 PBR Atlas (1 Draw Call)',
        rigged:   'Z=0 Grip datum origin',
        format:   'GLB · FBX'
      },
      glb: T1 + 'wayfarer-longsword.glb',
      items: [
        { src: T1 + 'hero.webp', w: 510,  h: 1500, alt: 'Wayfarer Longsword studio render', cap: 'Wayfarer Longsword — Tier 1 Common sword' },
        { src: T1 + '01.webp',   w: 1040, h: 1700, alt: 'Sword tier modularity breakdown', cap: 'Sword modularity — Blade, Guard, Grip, and Pommel variants' },
        { src: T1 + '05.webp',   w: 1800, h: 962,  alt: 'Wireframe pass showing clean quad loops', cap: 'Wireframe pass — optimized quad distribution' }
      ]
    },

    /* ── Gilded Oathblade ──────────────────────────────────── */
    'gilded-oathblade': {
      title: 'Gilded Oathblade',
      tag: 'Roblox · Rare',
      lede: 'A refined rare-tier one-handed longsword with gilded quillons and faceted pommel.',
      body: [
        'Built with 1,832 triangles and 100% clean quads. Designed to maintain the exact reach and boundary envelope as the Tier 1 sword for drop-in animation compatibility.',
        'Constructed with 4 modular parts sharing the master palette texture atlas, optimized for seamless Roblox Tool integration.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,832 tris (916 quads)',
        objects:  '4 modular parts (Merged)',
        dims:     '0.94 × 0.30 × 3.80 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Grip datum origin',
        format:   'GLB · FBX'
      },
      glb: T2 + 'gilded-oathblade.glb',
      items: [
        { src: T2 + 'hero.webp', w: 510,  h: 1500, alt: 'Gilded Oathblade studio render', cap: 'Gilded Oathblade — Tier 2 Rare sword' },
        { src: T2 + '01.webp',   w: 1040, h: 1700, alt: 'Sword tier modularity breakdown', cap: 'Modularity breakdown — identical envelope across all 3 tiers' },
        { src: T2 + '05.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Duskwarden ────────────────────────────────────────── */
    'duskwarden': {
      title: 'Duskwarden, Crown of the First Watch',
      tag: 'Roblox · Legendary',
      lede: 'A legendary broadsword with fluted fuller, winged crossguard, and crown pommel.',
      body: [
        'A high-tier hero asset with 2,588 triangles and 100% clean quads. Delivers high visual impact and silhouette complexity while strictly conforming to the standardized reach and grip box.',
        'Merged into a single clean MeshPart on export with baked sharp normals and zero welding drift.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '2,588 tris (1,294 quads)',
        objects:  '4 modular parts (Merged)',
        dims:     '1.02 × 0.31 × 3.80 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Grip datum origin',
        format:   'GLB · FBX'
      },
      glb: T3 + 'duskwarden.glb',
      items: [
        { src: T3 + 'hero.webp', w: 510,  h: 1500, alt: 'Duskwarden studio render', cap: 'Duskwarden — Tier 3 Legendary broadsword' },
        { src: T3 + '01.webp',   w: 1040, h: 1700, alt: 'Sword tier modularity breakdown', cap: 'Modularity breakdown — Common, Rare, and Legendary tiers' },
        { src: T3 + '05.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Ironjaw Greataxe ──────────────────────────────────── */
    'ironjaw-greataxe': {
      title: 'Ironjaw Greataxe',
      tag: 'Roblox · Rare',
      lede: 'A heavy two-handed battle axe with bearded cutting edge and reinforced cheek plates.',
      body: [
        '1,700 triangles of 100% quad geometry. Designed with haft centered precisely on the Z axis and intentional asymmetric head offset for natural avatar swinging animations.',
        'Features segmented leather grip wrapping and forged steel texturing from the shared palette.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,700 tris (850 quads)',
        objects:  '3 parts (Head, Haft, Rivets)',
        dims:     '1.25 × 0.28 × 4.10 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Haft origin',
        format:   'GLB · FBX'
      },
      glb: AXE + 'ironjaw-greataxe.glb',
      items: [
        { src: AXE + 'hero.webp', w: 510,  h: 1500, alt: 'Ironjaw Greataxe studio render', cap: 'Ironjaw Greataxe — 2-Handed Rare Battle Axe' },
        { src: AXE + '04.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Warden's Pike ─────────────────────────────────────── */
    'wardens-pike': {
      title: "Warden's Pike",
      tag: 'Roblox · Common',
      lede: 'A long reach two-handed thrusting spear with leaf blade and steel socket collar.',
      body: [
        'At 6.32 studs in length, this 1,432-triangle (100% quads) spear is the longest weapon in the set, engineered for front-line reach.',
        'Origin placed at the primary hand grip for immediate two-handed stance balancing.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,432 tris (716 quads)',
        objects:  '2 parts (Head & Ferrule, Haft)',
        dims:     '0.44 × 0.16 × 6.32 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Primary grip origin',
        format:   'GLB · FBX'
      },
      glb: SPEAR + 'wardens-pike.glb',
      items: [
        { src: SPEAR + 'hero.webp', w: 510,  h: 1500, alt: "Warden's Pike studio render", cap: "Warden's Pike — 2-Handed Reach Weapon" },
        { src: SPEAR + '04.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Hunter's Recurve Bow & Arrow ──────────────────────── */
    'hunters-recurve-bow': {
      title: "Hunter's Recurve Bow & Arrow",
      tag: 'Roblox · Rare / Common',
      lede: 'A stylized recurve bow with authentic limb reflex, paired with a broadhead hunting arrow.',
      body: [
        'Combined ranged weapon asset with 1,556 total triangles (Bow: 1,088 tris · Arrow: 468 tris) and 100% clean quads.',
        'The bow features grip datum centered on the riser with forward-reaching limb tips. The arrow features a nock-aligned origin for natural string nocking and projectile spawning.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,556 tris (Bow: 1,088 · Arrow: 468)',
        objects:  '5 parts modular (Merged)',
        dims:     'Bow: 3.24 studs · Arrow: 2.73 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Grip & Nock datums',
        format:   'GLB · FBX'
      },
      glb: BOW + 'hunters-recurve-bow.glb',
      items: [
        { src: BOW + 'hero.webp', w: 510,  h: 1500, alt: "Hunter's Recurve Bow render", cap: "Hunter's Recurve Bow — 3.24-stud recurve bow" },
        { src: BOW + '01.webp',   w: 510,  h: 1500, alt: 'Broadhead Arrow render', cap: 'Broadhead Arrow — 3-fletched hunting projectile' },
        { src: BOW + '05.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Runewarden Staff ──────────────────────────────────── */
    'runewarden-staff': {
      title: 'Runewarden Staff',
      tag: 'Roblox · Legendary',
      lede: 'An arcane focal staff crowned with a four-prong dragon claw clutching an enchanted core stone.',
      body: [
        '1,600 triangles with 100% clean quads. Crafted with curved claw prongs, an emissive floating core gemstone, and banded wooden shaft.',
        'Designed for caster animations with origin set at the balanced central haft datum.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,600 tris (800 quads)',
        objects:  '3 parts (Claw, Stone, Haft)',
        dims:     '0.47 × 0.45 × 3.96 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Central grip origin',
        format:   'GLB · FBX'
      },
      glb: STAFF + 'runewarden-staff.glb',
      items: [
        { src: STAFF + 'hero.webp', w: 510,  h: 1500, alt: 'Runewarden Staff studio render', cap: 'Runewarden Staff — Legendary Focal Staff' },
        { src: STAFF + '04.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    },

    /* ── Bulwark Round Shield ──────────────────────────────── */
    'bulwark-shield': {
      title: 'Bulwark Round Shield',
      tag: 'Roblox · Common',
      lede: 'A reinforced wooden round shield with forged iron boss, rim banding, and leather forearm straps.',
      body: [
        '1,692 triangles with 100% quads and a 2.50-stud diameter. Includes complete interior grip bar and forearm enarmes.',
        'Authored with rear face grip origin for immediate avatar arm welding without surface clipping.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Roblox / Game engine',
        polys:    '1,692 tris (846 quads)',
        objects:  '3 parts (Disc, Fittings, Grip)',
        dims:     '2.50 × 0.67 × 2.50 studs',
        textures: '1024×1024 PBR Atlas',
        rigged:   'Z=0 Grip bar origin',
        format:   'GLB · FBX'
      },
      glb: SHIELD + 'bulwark-shield.glb',
      items: [
        { src: SHIELD + 'hero.webp', w: 1430, h: 1500, alt: 'Bulwark Round Shield studio render', cap: 'Bulwark Round Shield — 2.50-stud defensive shield' },
        { src: SHIELD + '04.webp',   w: 1800, h: 962,  alt: 'Wireframe pass', cap: 'Wireframe view' }
      ]
    }

  };
})();

/* Order on the page and in the "All models" list. */
window.MODEL_ORDER = [
  'veloce-s4',
  'wayfarer-longsword',
  'gilded-oathblade',
  'duskwarden',
  'ironjaw-greataxe',
  'wardens-pike',
  'hunters-recurve-bow',
  'runewarden-staff',
  'bulwark-shield'
];

/* Labels for the spec sheet. Keys not listed here are skipped. */
window.MODEL_SPEC_KEYS = [
  ['software', 'Software'],
  ['platform', 'Target'],
  ['polys',    'Poly count'],
  ['objects',  'Objects'],
  ['dims',     'Dimensions'],
  ['textures', 'Textures'],
  ['rigged',   'Rigged'],
  ['format',   'Delivered as']
];
