/* ==========================================================================
   theme.js — light / dark controller
   --------------------------------------------------------------------------
   Dark is the default, unconditionally. The OS `prefers-color-scheme` hint is
   deliberately ignored: a first-time visitor always lands in dark, and light
   only ever appears as a stored, opted-into choice via `html.light`.

   The initial class is already applied by the inline script in <head>, so this
   file never causes a flash of the wrong theme — it only handles switching.

   Switching strategy — a circle centred on the toggle, with the direction
   carrying meaning (see the "Theme sweep" block in style.css §16):

     dark → light   the incoming theme GROWS out of the toggle
     light → dark   the outgoing theme RETREATS back into it

   so the button is always visibly the source of the change, and undoing your
   choice plays the motion in reverse.

     1. View Transitions API when available → real snapshots, so the sweep
        uncovers the new theme along one clean edge with no crossfade.
     2. Otherwise `html.theming` crossfades the colour properties while a
        soft wavefront travels out from (or back into) the toggle.
     3. prefers-reduced-motion → swap instantly, no animation at all.
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('theme');
  var KEY = 'theme';

  // Browser UI colour, matched to --canvas in each theme.
  var CANVAS = { dark: '#0B0D0E', light: '#F4F2EC' };

  // Keep in step with --sweep-dur in style.css §01.
  var DUR = 620;

  // Pending cleanup for the fallback crossfade, so a fast second tap does
  // not let the first swap's timer strip `theming` mid-way through it.
  var fadeTimer = 0;


  function current() {
    return root.classList.contains('light') ? 'light' : 'dark';
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  /* ── Reflect state on the toggle ───────────────────────── */
  function syncButton(mode) {
    if (!btn) return;
    var toLight = mode === 'dark';
    // role="switch": checked means "light theme is on".
    btn.setAttribute('aria-checked', String(mode === 'light'));
    btn.setAttribute('aria-label', 'Switch to ' + (toLight ? 'light' : 'dark') + ' theme');
    btn.title = toLight ? 'Switch to light theme' : 'Switch to dark theme';
  }

  /* ── Keep the address-bar colour in step ───────────────── */
  function syncMeta(mode) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', CANVAS[mode]);
      metas[i].removeAttribute('media');
    }
  }

  /* ── Paint one theme ──────────────────────────────────── */
  function paint(mode) {
    root.classList.toggle('light', mode === 'light');
    syncButton(mode);
    syncMeta(mode);
  }

  /* ── Where the sweep starts ───────────────────────────────
     The centre of the toggle, plus the distance from there to the furthest
     viewport corner. Using the real corner distance (rather than a blanket
     150vmax) means the circle finishes exactly as it clears the last pixel,
     so the easing is spent on screen instead of on empty overshoot. */
  function setOrigin() {
    var w = window.innerWidth;
    var h = window.innerHeight;
    // Sensible default if the button is missing: where it normally sits.
    var x = w - 48;
    var y = 32;

    if (btn) {
      var box = btn.getBoundingClientRect();
      if (box.width || box.height) {
        x = box.left + box.width / 2;
        y = box.top + box.height / 2;
      }
    }

    var dx = Math.max(x, w - x);
    var dy = Math.max(y, h - y);

    root.style.setProperty('--tx', x.toFixed(1) + 'px');
    root.style.setProperty('--ty', y.toFixed(1) + 'px');
    root.style.setProperty('--tr', Math.ceil(Math.sqrt(dx * dx + dy * dy)) + 'px');
  }

  /* ── Fallback wavefront ───────────────────────────────────
     Disposable overlay; it removes itself once the animation is done. */
  function wave(dir, tint) {
    var el = document.createElement('div');
    el.className = dir === 'out' ? 'sweep sweep--out' : 'sweep';
    el.setAttribute('aria-hidden', 'true');
    el.style.setProperty('--sweep-tint', tint);
    document.body.appendChild(el);

    window.setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, DUR + 60);
  }

  /* ── Swap themes ──────────────────────────────────────── */
  function apply(mode) {
    if (reduced()) {
      paint(mode);
      return;
    }

    setOrigin();

    // Light opens outwards; dark closes back in.
    var dir = mode === 'light' ? 'in' : 'out';

    // Clear any half-finished swap first, so double-taps cannot leave both
    // directions applied at once.
    root.classList.remove('sweep-in', 'sweep-out');

    if (typeof document.startViewTransition === 'function') {
      var cls = dir === 'in' ? 'sweep-in' : 'sweep-out';
      root.classList.add(cls);

      var done = function () { root.classList.remove(cls); };
      var vt = document.startViewTransition(function () { paint(mode); });

      if (vt && vt.finished && typeof vt.finished.then === 'function') {
        vt.finished.then(done, done);
      } else {
        window.setTimeout(done, DUR + 120);
      }
      return;
    }

    /* No snapshots here, so the colours crossfade instead — and the light
       canvas is the thing that travels, expanding as light arrives and
       contracting as light leaves. Same read, either direction. */
    root.classList.add('theming');
    paint(mode);
    wave(dir, CANVAS.light);

    window.clearTimeout(fadeTimer);
    fadeTimer = window.setTimeout(function () {
      root.classList.remove('theming');
    }, DUR);

  }

  function set(mode) {
    apply(mode);
    try { localStorage.setItem(KEY, mode); } catch (e) { /* private mode */ }
  }

  /* ── Wire up ──────────────────────────────────────────── */
  // Sync the toggle to whatever the head script decided.
  syncButton(current());
  syncMeta(current());

  if (btn) {
    btn.addEventListener('click', function () {
      set(current() === 'light' ? 'dark' : 'light');
    });
  }

  /* No `prefers-color-scheme` listener on purpose. Following the OS would let
     the page flip to light under a visitor who never asked for it — including
     mid-visit, if their system is on a sunrise schedule. Dark stays put until
     the toggle is pressed; from then on the stored choice is the only input. */
})();
