/* ==========================================================================
   models.js — 3D modeling work
   --------------------------------------------------------------------------
   HOW TO ADD A MODEL

   1 · Drop your files in  public/assets/models/<slug>/
         card.webp          card thumbnail — keep it small, ~800px wide
         hero.webp          first gallery frame
         02.webp 03.webp    extra renders — wireframe, breakdowns, detail shots
         turntable.mp4      optional orbit clip (set  type: 'video')
         <slug>.glb         optional — enables the "View in 3D" tab

   2 · Copy the entry below, rename the key to your <slug>, and fill it in.

   3 · Add the same <slug> to MODEL_ORDER at the bottom. That list controls
       what shows on the page and in what order.

   Renders: export as WebP — it is a fraction of the size of PNG at the same
   quality. There is a converter at  blender/_tools/webp.py  that runs through
   Blender, so no extra tooling is needed:

     blender --background --factory-startup --python blender/_tools/webp.py \
       -- <sourceFolder> public/assets/models/<slug>

   GLB: keep it under about 5 MB. It is only fetched when a visitor actually
   opens the 3D tab, but it still has to travel. There is an exporter at
   blender/_tools/glb.py  that strips the studio lighting rig and camera, which
   model-viewer replaces with its own environment:

     blender <file>.blend --background --factory-startup \
       --python blender/_tools/glb.py -- public/assets/models/<slug>/<slug>.glb

   Every field except  title  and  items  is optional. Leave out what you do
   not know yet and the layout closes the gap — a model with no poly count
   still reads as finished. Set  MODEL_ORDER = []  to hide the section.
   ========================================================================== */

window.MODELS = (function () {
  'use strict';

  var V = 'assets/models/veloce-s4/';

  return {

    /* ── VELOCE S4 ─────────────────────────────────────────── */
    'veloce-s4': {
      title: 'VELOCE S4',
      year: '2026',
      lede: 'A game-ready mid-size sedan with clean quad topology and modular bumper clips.',
      body: [
        'A hard-surface mid-size sedan built to real-time standards with 28,972 triangles, 100% clean quads, and zero n-gons.',
        'Features modular front and rear clip architecture for rapid variant restyling, detailed wheel and brake assemblies, and PBR materials.'
      ],
      spec: {
        software: 'Blender 5.2',
        platform: 'Real-time / game engine',
        polys:    '28,972 tris — 42% under a 50k cap',
        objects:  '41 objects, 5 modules',
        dims:     '4,925 × 1,842 × 1,475 mm',
        textures: '25 PBR materials · 2K tyre maps',
        rigged:   'No — static exterior asset',
        format:   'GLB · FBX · OBJ on request'
      },
      glb: V + 'veloce-s4.glb',
      items: [
        { src: V + 'hero.webp', w: 1600, h: 900, alt: 'VELOCE S4 sedan, front three-quarter studio render', cap: 'Front three-quarter' },
        { src: V + '02.webp',   w: 1600, h: 900, alt: 'VELOCE S4 sedan, rear three-quarter studio render', cap: 'Rear three-quarter' },
        { src: V + '03.webp',   w: 1600, h: 900, alt: 'VELOCE S4 sedan, side profile render', cap: 'Side profile — the roofline held constant across trims' },
        { src: V + '06.webp',   w: 1600, h: 900, alt: 'Close detail render of the VELOCE S4 wheel, rim and brake rotor', cap: 'Wheel detail — 3,676 tris a corner, full barrel and vented rotor' },
        { src: V + '07.webp',   w: 1600, h: 900, alt: 'Wireframe viewport pass over the VELOCE S4 sedan showing quad topology', cap: 'Wireframe — 100% quads, zero n-gons' },
        { src: V + '08.webp',   w: 1600, h: 900, alt: 'Module breakdown of the VELOCE S4 with front clip, rear clip and body shell colour-coded', cap: 'Module breakdown — the clips are independent, the body never moves' },
        { src: V + '04.webp',   w: 1600, h: 900, alt: 'VELOCE S4 sedan, front elevation render', cap: 'Front elevation' },
        { src: V + '05.webp',   w: 1600, h: 900, alt: 'VELOCE S4 sedan, rear elevation render', cap: 'Rear elevation' }
      ]
    }

  };
})();

/* Order on the page and in the "All models" list. Set to [] to hide the
   section until you have work to show. */
window.MODEL_ORDER = ['veloce-s4'];

/* Labels for the spec sheet. Keys not listed here are skipped, so adding a
   new spec field means adding it in one place. */
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
