/* ==========================================================================
   sound.js — micro-interaction sound
   --------------------------------------------------------------------------
   01 · State & storage
   02 · Audio context
   03 · Synth primitives
   04 · Voices
   05 · Public API
   06 · The top-bar toggle
   07 · Delegated wiring

   --------------------------------------------------------------------------
   Every sound here is SYNTHESISED at runtime. There is not one audio file in
   the repo, and that is a design decision rather than a shortcut:

   ========================================================================== */

window.SFX = (function () {
  'use strict';

  /* ══ 01 · State & storage ═════════════════════════════════ */

  var KEY = 'sound';
  var SEEN = 'sound:seen';   /* has the toggle ever been noticed? */

  var on = false;            /* the visitor's choice        */
  var ctx = null;            /* AudioContext, once needed   */
  var bus = null;            /* master gain -> filters -> soft clip -> out */
  var noiseBuf = null;       /* one buffer, reused forever  */

  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function stored() {
    try { return window.localStorage.getItem(KEY); } catch (e) { return null; }
  }

  function remember(value) {
    try { window.localStorage.setItem(KEY, value); } catch (e) { /* private mode */ }
  }

  on = stored() === 'on';


  /* ══ 02 · Audio context ═══════════════════════════════════ */

  function softClip(ctx) {
    var K = 1.5;
    var n = 1024;
    var curve = new Float32Array(n);

    for (var i = 0; i < n; i++) {
      var x = (i / (n - 1)) * 2 - 1;      /* -1 .. 1 */
      curve[i] = Math.tanh(K * x) / K;
    }

    var node = ctx.createWaveShaper();
    node.curve = curve;

    node.oversample = '2x';
    return node;
  }

  function boot() {
    if (ctx) return ctx;

    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;

    try { ctx = new Ctor(); } catch (e) { return null; }

    var master = ctx.createGain();
    master.gain.value = 0.9;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7200;
    lp.Q.value = 0.4;

    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;

    var limit = softClip(ctx);

    master.connect(lp);
    lp.connect(hp);
    hp.connect(limit);
    limit.connect(ctx.destination);

    bus = master;

    var frames = Math.floor(ctx.sampleRate * 0.7);
    noiseBuf = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    return ctx;
  }

  function wake() {
    if (ctx && ctx.state === 'suspended' && ctx.resume) return ctx.resume();
    return null;
  }

  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden && ctx.suspend) ctx.suspend();
    else wake();
  });


  /* ══ 03 · Synth primitives ════════════════════════════════ */

  var NOTE = {
    d4:  293.66,
    a4:  440.00,
    d5:  587.33,
    e5:  659.25,
    fs5: 739.99,
    a5:  880.00,
    b5:  987.77,
    d6: 1174.66
  };

  var ZERO = 0.00012;

  var GAP = {
    hover: 160,
    tilt:  240,
    tick:   40,
    tap:    40
  };
  var last = {};

  function throttled(name) {
    var gap = GAP[name];
    if (!gap) return false;

    var now = (ctx ? ctx.currentTime * 1000 : 0);
    if (last[name] && now - last[name] < gap) return true;

    last[name] = now;
    return false;
  }

  function shape(peak, at, attack, dur) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(ZERO, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(ZERO, at + dur);
    return g;
  }

  function tone(opts) {
    var at = opts.at;
    var osc = ctx.createOscillator();
    osc.type = opts.type || 'sine';

    osc.frequency.setValueAtTime(opts.from, at);
    if (opts.to && opts.to !== opts.from) {
      osc.frequency.exponentialRampToValueAtTime(opts.to, at + opts.dur);
    }

    var g = shape(opts.gain, at, opts.attack || 0.004, opts.dur);

    osc.connect(g);
    g.connect(bus);
    osc.start(at);
    osc.stop(at + opts.dur + 0.02);
  }

  function air(opts) {
    var at = opts.at;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    var skip = Math.random() * 0.4;

    var bp = ctx.createBiquadFilter();
    bp.type = opts.type || 'bandpass';
    bp.Q.value = opts.q == null ? 1.1 : opts.q;
    bp.frequency.setValueAtTime(opts.from, at);
    if (opts.to && opts.to !== opts.from) {
      bp.frequency.exponentialRampToValueAtTime(opts.to, at + opts.dur);
    }

    var g = shape(opts.gain, at, opts.attack || 0.003, opts.dur);

    src.connect(bp);
    bp.connect(g);
    g.connect(bus);
    src.start(at, skip, opts.dur + 0.05);
  }


  /* ══ 04 · Voices ══════════════════════════════════════════ */

  var VOICE = {
    tap: function (t) {
      air({ at: t, from: 3200, to: 1500, dur: 0.026, q: 0.9, gain: 0.125 });
      tone({ at: t, type: 'sine', from: 430, to: 150, dur: 0.052, gain: 0.234, attack: 0.002 });
      tone({ at: t, type: 'triangle', from: NOTE.d6, to: NOTE.a5, dur: 0.038, gain: 0.050 });
    },

    press: function (t) {
      air({ at: t, from: 2600, to: 1400, dur: 0.020, q: 1.0, gain: 0.098 });
      tone({ at: t, type: 'sine', from: 360, to: 155, dur: 0.040, gain: 0.165, attack: 0.002 });
    },

    tick: function (t) {
      air({ at: t, from: 5200, to: 3600, dur: 0.012, q: 2.6, gain: 0.136 });
      tone({ at: t, type: 'triangle', from: NOTE.d6, dur: 0.026, gain: 0.094 });
    },

    hover: function (t) {
      tone({ at: t, type: 'sine', from: NOTE.b5, dur: 0.028, gain: 0.085, attack: 0.006 });
    },

    tilt: function (t) {
      air({ at: t, from: 850, to: 2700, dur: 0.130, q: 0.7, gain: 0.085, attack: 0.020 });
      tone({ at: t, type: 'sine', from: NOTE.fs5, to: NOTE.a5, dur: 0.100, gain: 0.044, attack: 0.018 });
    },
    modalOpen: function (t) {
      air({ at: t, from: 380, to: 2300, dur: 0.240, q: 0.8, gain: 0.126, attack: 0.030 });
      tone({ at: t, type: 'triangle', from: NOTE.d5, dur: 0.200, gain: 0.160 });
      tone({ at: t + 0.055, type: 'triangle', from: NOTE.a5, dur: 0.230, gain: 0.126 });
    },
    
    modalClose: function (t) {
      air({ at: t, from: 2100, to: 400, dur: 0.180, q: 0.8, gain: 0.103, attack: 0.010 });
      tone({ at: t, type: 'triangle', from: NOTE.a5, dur: 0.130, gain: 0.114 });
      tone({ at: t + 0.045, type: 'triangle', from: NOTE.d5, dur: 0.170, gain: 0.103 });
    },

    swap: function (t) {
      air({ at: t, from: 1500, to: 2600, dur: 0.090, q: 1.2, gain: 0.116, attack: 0.012 });
      tone({ at: t, type: 'triangle', from: NOTE.e5, to: NOTE.fs5, dur: 0.090, gain: 0.110 });
    },

    expand: function (t) {
      air({ at: t, from: 600, to: 1900, dur: 0.110, q: 0.9, gain: 0.093, attack: 0.016 });
      tone({ at: t, type: 'sine', from: NOTE.fs5, dur: 0.110, gain: 0.122 });
    },

    collapse: function (t) {
      air({ at: t, from: 1700, to: 550, dur: 0.095, q: 0.9, gain: 0.081, attack: 0.008 });
      tone({ at: t, type: 'sine', from: NOTE.d5, dur: 0.095, gain: 0.110 });
    },

    themeToLight: function (t) {
      air({ at: t, from: 320, to: 3400, dur: 0.560, q: 0.55, gain: 0.116, attack: 0.090 });
      tone({ at: t + 0.040, type: 'sine', from: NOTE.a5, dur: 0.300, gain: 0.122 });
      tone({ at: t + 0.150, type: 'sine', from: NOTE.d6, dur: 0.320, gain: 0.093 });
    },

    themeToDark: function (t) {
      air({ at: t, from: 3200, to: 300, dur: 0.560, q: 0.55, gain: 0.104, attack: 0.060 });
      tone({ at: t + 0.040, type: 'sine', from: NOTE.d6, dur: 0.300, gain: 0.104 });
      tone({ at: t + 0.150, type: 'sine', from: NOTE.a4, dur: 0.340, gain: 0.110 });
    },

    on: function (t) {
      tone({ at: t,         type: 'triangle', from: NOTE.d5,  dur: 0.150, gain: 0.325 });
      tone({ at: t + 0.070, type: 'triangle', from: NOTE.fs5, dur: 0.150, gain: 0.301 });
      tone({ at: t + 0.140, type: 'triangle', from: NOTE.a5,  dur: 0.320, gain: 0.279 });
      air({  at: t + 0.140, from: 1800, to: 3600, dur: 0.240, q: 0.9, gain: 0.103, attack: 0.040 });
    },

    off: function (t) {
      tone({ at: t,         type: 'sine', from: NOTE.a5, dur: 0.130, gain: 0.221 });
      tone({ at: t + 0.080, type: 'sine', from: NOTE.d5, dur: 0.220, gain: 0.192 });
    }
  };


  /* ══ 05 · Public API ══════════════════════════════════════ */

  function play(name) {
    var voice = VOICE[name];
    if (!voice || !on) return;
    if (!boot()) return;
    if (throttled(name)) return;

    if (ctx.state === 'running') {
      voice(ctx.currentTime + 0.005);
      return;
    }

    var resuming = wake();
    if (!resuming || !resuming.then) return;

    resuming.then(function () {
      try {
        if (on && ctx.state === 'running') voice(ctx.currentTime + 0.005);
      } catch (e) { /* graph gone */ }
    }, function () { /* device gone; nothing to do */ });
  }

  function enabled() { return on; }

  function set(next, announce) {
    if (next === on) return;

    if (next) {
      on = true;
      remember('on');
      if (announce) play('on');
    } else {
      if (announce) play('off');
      on = false;
      remember('off');
    }

    document.documentElement.dataset.sound = on ? 'on' : 'off';
    return on;
  }

  function toggle() { return set(!on, true); }

  document.documentElement.dataset.sound = on ? 'on' : 'off';


  /* ══ 06 · The top-bar toggle ══════════════════════════════ */

  (function control() {
    var btn = document.getElementById('sound');
    if (!btn) return;

    function sync() {
      btn.setAttribute('aria-checked', String(on));
      btn.setAttribute('aria-label', on
        ? 'Turn interaction sound off'
        : 'Turn interaction sound on');
      btn.title = on ? 'Sound on' : 'Sound off';
    }

    sync();

    btn.addEventListener('click', function () {
      toggle();
      sync();

      /* The hint has done its job the moment the button is used. */
      btn.removeAttribute('data-hint');
      try { window.localStorage.setItem(SEEN, '1'); } catch (e) {}
    });

    var seen;
    try { seen = window.localStorage.getItem(SEEN); } catch (e) { seen = '1'; }

    if (!seen && !reduced && stored() === null) {
      window.setTimeout(function () {
        btn.setAttribute('data-hint', '');
      }, 2200);

      window.setTimeout(function () {
        btn.removeAttribute('data-hint');
        try { window.localStorage.setItem(SEEN, '1'); } catch (e) {}
      }, 8000);
    }
  })();


  /* ══ 07 · Delegated wiring ════════════════════════════════ */

  var PRESS = [
    ['#sound',                              null],
    ['#theme',                              null],
    ['.det__nav',                           null],
    ['.navlinks a, .totop, .skip, .sig',   'tick'],
    ['.modal__x, .modal__veil',            'press'],
    ['.iconbtn, .links a, .reg__more',     'press'],
    ['.btn, [data-proj], .head__act, .plist__go, .chan__t, [data-open-projects], [data-open-stack]', 'tap'],
    ['button, a[href]',                    'press']
  ];

  function voiceFor(node) {
    for (var i = 0; i < PRESS.length; i++) {
      if (node.closest(PRESS[i][0])) return PRESS[i][1];
    }
    return null;
  }

  document.addEventListener('pointerdown', function (e) {
    if (!on || e.button !== 0) return;

    var hit = e.target.closest && e.target.closest('button, a[href], summary');
    if (!hit) return;

    if (hit.tagName === 'SUMMARY') return;

    var voice = voiceFor(hit);
    if (voice) play(voice);
  }, true);

  document.addEventListener('keydown', function (e) {
    if (!on) return;
    if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
    if (e.repeat) return;

    var hit = document.activeElement;
    if (!hit || !hit.closest) return;
    if (hit.tagName === 'SUMMARY') return;
    if (hit.id === 'sound' || hit.id === 'theme') return;

    var voice = voiceFor(hit);
    if (voice) play(voice);
  });

  if (finePointer) {
    document.addEventListener('pointerover', function (e) {
      if (!on || e.pointerType === 'touch') return;

      var hit = e.target.closest && e.target.closest('.navlinks a, .btn, .iconbtn, .chan__t, .head__act');
      if (!hit) return;

      if (e.relatedTarget && hit.contains(e.relatedTarget)) return;

      play('hover');
    });
  }

  Array.prototype.forEach.call(document.querySelectorAll('details.led__row'), function (row) {
    row.addEventListener('toggle', function () {
      play(row.open ? 'expand' : 'collapse');
    });
  });

  (function themeVoice() {
    var btn = document.getElementById('theme');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var goingLight = !document.documentElement.classList.contains('light');
      play(goingLight ? 'themeToLight' : 'themeToDark');
    });
  })();


  return {
    play: play,
    toggle: toggle,
    set: function (next) { return set(!!next, true); },
    enabled: enabled
  };
})();
