/* ==========================================================================
   theme.js — light / dark controller
   --------------------------------------------------------------------------
   Dark is the default. Light is opted into via `html.light`.

   The initial class is already applied by the inline script in <head>, so this
   file never causes a flash of the wrong theme — it only handles switching.

   Switching strategy:
     1. View Transitions API when available → true crossfade of the whole page.
     2. Otherwise add `html.theming` for 450ms, which enables a global
        transition on colour properties (see style.css §01).
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('theme');
  var portrait = document.getElementById('portrait');
  var KEY = 'theme';

  // Portrait variants. Falls back silently if a file is missing.
  var PORTRAIT = {
    dark: 'assets/images/dark-profile.jpg',
    light: 'assets/images/light-profile.jpg'
  };

  // Browser UI colour, matched to --canvas in each theme.
  var CANVAS = { dark: '#0B0D0E', light: '#F4F2EC' };

  function current() {
    return root.classList.contains('light') ? 'light' : 'dark';
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

  /* ── Swap the portrait, preloading to avoid a blank frame ─ */
  function syncPortrait(mode) {
    if (!portrait) return;
    var next = PORTRAIT[mode];
    if (!next || portrait.getAttribute('src') === next) return;

    var pre = new Image();
    pre.onload = function () { portrait.src = next; };
    pre.onerror = function () { /* keep whatever is already showing */ };
    pre.src = next;
  }

  /* ── Paint one theme ──────────────────────────────────── */
  function paint(mode) {
    root.classList.toggle('light', mode === 'light');
    syncButton(mode);
    syncMeta(mode);
    syncPortrait(mode);
  }

  /* ── Smooth crossfade between themes ──────────────────── */
  function apply(mode) {
    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced && typeof document.startViewTransition === 'function') {
      document.startViewTransition(function () { paint(mode); });
      return;
    }

    if (reduced) {
      paint(mode);
      return;
    }

    // Fallback: transition custom properties for the duration of the swap.
    root.classList.add('theming');
    paint(mode);
    window.setTimeout(function () {
      root.classList.remove('theming');
    }, 480);
  }

  function set(mode) {
    apply(mode);
    try { localStorage.setItem(KEY, mode); } catch (e) { /* private mode */ }
  }

  /* ── Wire up ──────────────────────────────────────────── */
  // Sync the toggle to whatever the head script decided.
  syncButton(current());
  syncMeta(current());
  syncPortrait(current());

  if (btn) {
    btn.addEventListener('click', function () {
      set(current() === 'light' ? 'dark' : 'light');
    });
  }

  // Follow the OS only while the visitor has not made a choice.
  var mq = window.matchMedia('(prefers-color-scheme: light)');
  var onSystemChange = function (e) {
    var saved = null;
    try { saved = localStorage.getItem(KEY); } catch (err) { /* ignore */ }
    if (saved) return;
    apply(e.matches ? 'light' : 'dark');
  };

  if (typeof mq.addEventListener === 'function') {
    mq.addEventListener('change', onSystemChange);
  } else if (typeof mq.addListener === 'function') {
    mq.addListener(onSystemChange); // Safari < 14
  }
})();
