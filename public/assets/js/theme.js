/* ==========================================================================
   theme.js — light / dark controller
   --------------------------------------------------------------------------
   Dark is the default, unconditionally. The OS `prefers-color-scheme` hint is
   deliberately ignored: a first-time visitor always lands in dark, and light
   only ever appears as a stored, opted-into choice via `html.light`.

   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var btn = document.getElementById('theme');
  var KEY = 'theme';

  var CANVAS = { dark: '#0B0D0E', light: '#F4F2EC' };

  var DUR = 620;

  var fadeTimer = 0;


  function current() {
    return root.classList.contains('light') ? 'light' : 'dark';
  }

  function reduced() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function syncButton(mode) {
    if (!btn) return;
    var toLight = mode === 'dark';
    // role="switch": checked means "light theme is on".
    btn.setAttribute('aria-checked', String(mode === 'light'));
    btn.setAttribute('aria-label', 'Switch to ' + (toLight ? 'light' : 'dark') + ' theme');
    btn.title = toLight ? 'Switch to light theme' : 'Switch to dark theme';
  }

  function syncMeta(mode) {
    var metas = document.querySelectorAll('meta[name="theme-color"]');
    for (var i = 0; i < metas.length; i++) {
      metas[i].setAttribute('content', CANVAS[mode]);
      metas[i].removeAttribute('media');
    }
  }

  function paint(mode) {
    root.classList.toggle('light', mode === 'light');
    syncButton(mode);
    syncMeta(mode);
  }

  function setOrigin() {
    var w = root.clientWidth || window.innerWidth || 1;
    var h = root.clientHeight || window.innerHeight || 1;

    var x = w - 48;
    var y = 32;

    if (btn) {
      var box = btn.getBoundingClientRect();
      if (box.width || box.height) {
        x = box.left + box.width / 2;
        y = box.top + box.height / 2;
      }
    }

    x = Math.min(Math.max(x, 0), w);
    y = Math.min(Math.max(y, 0), h);

    var dx = Math.max(x, w - x);
    var dy = Math.max(y, h - y);
    var reach = Math.sqrt(dx * dx + dy * dy);

    var ref = Math.sqrt(w * w + h * h) / Math.SQRT2;
    var r = (reach / ref) * 100 + 1;

    root.style.setProperty('--tx', (x / w * 100).toFixed(3) + '%');
    root.style.setProperty('--ty', (y / h * 100).toFixed(3) + '%');
    root.style.setProperty('--tr', r.toFixed(3) + '%');
  }

  /* ── Fallback wavefront ─────────────────────────────────── */
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

    var dir = mode === 'light' ? 'in' : 'out';

    root.classList.remove('sweep-in', 'sweep-out');

    if (typeof document.startViewTransition === 'function') {
      var cls = dir === 'in' ? 'sweep-in' : 'sweep-out';
      root.classList.add(cls);

      var done = function () { root.classList.remove(cls); };
      var vt = document.startViewTransition(function () { paint(mode); });

      var hush = function () {};
      if (vt && vt.ready && vt.ready.then) vt.ready.then(hush, hush);
      if (vt && vt.updateCallbackDone && vt.updateCallbackDone.then) {
        vt.updateCallbackDone.then(hush, hush);
      }

      if (vt && vt.finished && typeof vt.finished.then === 'function') {
        vt.finished.then(done, done);
      } else {
        window.setTimeout(done, DUR + 120);
      }
      return;
    }

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

})();
