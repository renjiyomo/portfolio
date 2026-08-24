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

     · Nothing to download. Eight sampled clicks is ~60 KB of network for
       decoration, on a site whose whole point is that it loads fast.
     · Nothing to license, and nothing that sounds like a stock UI pack —
       which is the fastest way to make a portfolio feel generic.
     · Pitch, filter and envelope are parameters, so the voices can be tuned
       as a family instead of re-exported one by one.

   The voices are one family on purpose. Every pitch is drawn from D major
   pentatonic (see NOTE below) and every envelope is a fast attack into an
   exponential decay under 260ms. That is what stops eight separate effects
   from sounding like eight separate websites: they share a key and they
   share a shape, so the ear files them as one instrument.

   Loudness is deliberately near the floor — master 0.5 against per-voice
   peaks of 0.03–0.16, so nothing ever approaches full scale. The intent is
   that you notice the sound when you stop hearing it, not when you start.

   Defaults and consent:
     Sound is OFF until asked for. It is stored per-browser, so the choice
     survives reloads, and the AudioContext is not even constructed until the
     visitor turns it on — a muted visit costs nothing, not even an idle
     audio thread. Autoplay policy is respected by construction: the context
     is created inside the click handler that enables it.
   ========================================================================== */

window.SFX = (function () {
  'use strict';

  /* ══ 01 · State & storage ═════════════════════════════════ */

  var KEY = 'sound';
  var SEEN = 'sound:seen';   /* has the toggle ever been noticed? */

  var on = false;            /* the visitor's choice        */
  var ctx = null;            /* AudioContext, once needed   */
  var bus = null;            /* master gain -> filter -> out */
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


  /* ══ 02 · Audio context ═══════════════════════════════════
     Built once, lazily, and only ever from inside a real user gesture. The
     master chain is deliberately dull at the top end: a 7.2kHz lowpass takes
     the glassy edge off synthesised transients, which is the difference
     between "a considered interface" and "a toy". */

  function boot() {
    if (ctx) return ctx;

    var Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;

    try { ctx = new Ctor(); } catch (e) { return null; }

    var master = ctx.createGain();
    master.gain.value = 0.5;

    var lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 7200;
    lp.Q.value = 0.4;

    /* Nothing below 90Hz survives. Laptop speakers turn sub-bass into a
       rattle, and there is no musical information down there anyway. */
    var hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 90;

    master.connect(lp);
    lp.connect(hp);
    hp.connect(ctx.destination);

    bus = master;

    /* 0.7s of white noise, shared by every noise-based voice. Allocating a
       buffer per tap would churn the GC on a fast click. */
    var frames = Math.floor(ctx.sampleRate * 0.7);
    noiseBuf = ctx.createBuffer(1, frames, ctx.sampleRate);
    var data = noiseBuf.getChannelData(0);
    for (var i = 0; i < frames; i++) data[i] = Math.random() * 2 - 1;

    return ctx;
  }

  /* Chrome and Safari park the context whenever they feel like it. */
  function wake() {
    if (ctx && ctx.state === 'suspended' && ctx.resume) return ctx.resume();
    return null;
  }

  /* A hidden tab should not be making noise. */
  document.addEventListener('visibilitychange', function () {
    if (!ctx) return;
    if (document.hidden && ctx.suspend) ctx.suspend();
    else wake();
  });


  /* ══ 03 · Synth primitives ════════════════════════════════ */

  /* D major pentatonic. One key for the whole interface, so a tap landing
     over a still-ringing modal chime is consonant instead of accidental. */
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

  /* Exponential ramps cannot reach zero, so silence is this instead. */
  var ZERO = 0.00012;

  /* Rate limits, per voice, in ms. Without these a fast mouse across a card
     grid becomes a machine gun. */
  var GAP = {
    hover: 110,
    tilt:  190,
    tick:   40,
    tap:    28
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

  /* Fast attack, exponential decay. `attack` is short by design — a slow
     attack on a 40ms sound just sounds like a mistake. */
  function shape(peak, at, attack, dur) {
    var g = ctx.createGain();
    g.gain.setValueAtTime(ZERO, at);
    g.gain.exponentialRampToValueAtTime(peak, at + attack);
    g.gain.exponentialRampToValueAtTime(ZERO, at + dur);
    return g;
  }

  /* A pitched body. `to` glides the frequency — a small downward glide is
     what makes a tap feel like it struck something. */
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

  /* Filtered noise. Every transient, whoosh and brush in here is this
     function with a different band sweep. */
  function air(opts) {
    var at = opts.at;

    var src = ctx.createBufferSource();
    src.buffer = noiseBuf;
    /* Start at a random offset so repeated taps are not bit-identical —
       identical transients are the tell that a sound is synthetic. */
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


  /* ══ 04 · Voices ══════════════════════════════════════════
     Each voice is a recipe, not a sample. Comments give the intent, because
     "sine 420 to 150 over 45ms" tells you nothing about how it should feel.
  */

  var VOICE = {

    /* Primary press. Noise transient for the contact, pitched body dropping
       an octave-ish underneath it for the weight. Reads as a firm key. */
    tap: function (t) {
      air({ at: t, from: 3200, to: 1500, dur: 0.026, q: 0.9, gain: 0.075 });
      tone({ at: t, type: 'sine', from: 430, to: 150, dur: 0.052, gain: 0.14, attack: 0.002 });
      tone({ at: t, type: 'triangle', from: NOTE.d6, to: NOTE.a5, dur: 0.038, gain: 0.030 });
    },

    /* Secondary press — same gesture, less mass. For chrome: close buttons,
       carousel arrows, in-row actions. */
    press: function (t) {
      air({ at: t, from: 2600, to: 1400, dur: 0.020, q: 1.0, gain: 0.050 });
      tone({ at: t, type: 'sine', from: 360, to: 155, dur: 0.040, gain: 0.085, attack: 0.002 });
    },

    /* A detent. Stepping a carousel, jumping to a section — small, dry,
       mechanical, no tail. */
    tick: function (t) {
      air({ at: t, from: 5200, to: 3600, dur: 0.012, q: 2.6, gain: 0.055 });
      tone({ at: t, type: 'triangle', from: NOTE.d6, dur: 0.026, gain: 0.038 });
    },

    /* Hover. The quietest thing in the set by a wide margin — at this level
       it registers as texture, and you would not describe it as a beep. */
    hover: function (t) {
      tone({ at: t, type: 'sine', from: NOTE.b5, dur: 0.028, gain: 0.026, attack: 0.006 });
    },

    /* Card tilt. A cloth brush, not a click: the band opens upward so it
       reads as a surface being caught by the light rather than pressed. */
    tilt: function (t) {
      air({ at: t, from: 850, to: 2700, dur: 0.130, q: 0.7, gain: 0.042, attack: 0.020 });
      tone({ at: t, type: 'sine', from: NOTE.fs5, to: NOTE.a5, dur: 0.100, gain: 0.022, attack: 0.018 });
    },

    /* Modal expansion. Air rising underneath a rising fifth — the interval
       is doing the work, the noise only gives it somewhere to live. */
    modalOpen: function (t) {
      air({ at: t, from: 380, to: 2300, dur: 0.240, q: 0.8, gain: 0.055, attack: 0.030 });
      tone({ at: t, type: 'triangle', from: NOTE.d5, dur: 0.200, gain: 0.070 });
      tone({ at: t + 0.055, type: 'triangle', from: NOTE.a5, dur: 0.230, gain: 0.055 });
    },

    /* Collapse. The same figure inverted and cut shorter — closing should
       feel quicker than opening, or the interface feels reluctant. */
    modalClose: function (t) {
      air({ at: t, from: 2100, to: 400, dur: 0.180, q: 0.8, gain: 0.045, attack: 0.010 });
      tone({ at: t, type: 'triangle', from: NOTE.a5, dur: 0.130, gain: 0.050 });
      tone({ at: t + 0.045, type: 'triangle', from: NOTE.d5, dur: 0.170, gain: 0.045 });
    },

    /* Swapping the modal's contents in place. Not an open, not a close —
       a page turn. */
    swap: function (t) {
      air({ at: t, from: 1500, to: 2600, dur: 0.090, q: 1.2, gain: 0.040, attack: 0.012 });
      tone({ at: t, type: 'triangle', from: NOTE.e5, to: NOTE.fs5, dur: 0.090, gain: 0.038 });
    },

    /* Ledger row opening / closing. A third of a modal, in every sense. */
    expand: function (t) {
      air({ at: t, from: 600, to: 1900, dur: 0.110, q: 0.9, gain: 0.032, attack: 0.016 });
      tone({ at: t, type: 'sine', from: NOTE.fs5, dur: 0.110, gain: 0.042 });
    },

    collapse: function (t) {
      air({ at: t, from: 1700, to: 550, dur: 0.095, q: 0.9, gain: 0.028, attack: 0.008 });
      tone({ at: t, type: 'sine', from: NOTE.d5, dur: 0.095, gain: 0.038 });
    },

    /* Theme sweep. Runs the length of the 620ms visual sweep so the ear and
       the eye finish together; the band travels in the same direction the
       light does. */
    themeToLight: function (t) {
      air({ at: t, from: 320, to: 3400, dur: 0.560, q: 0.55, gain: 0.040, attack: 0.090 });
      tone({ at: t + 0.040, type: 'sine', from: NOTE.a5, dur: 0.300, gain: 0.042 });
      tone({ at: t + 0.150, type: 'sine', from: NOTE.d6, dur: 0.320, gain: 0.032 });
    },

    themeToDark: function (t) {
      air({ at: t, from: 3200, to: 300, dur: 0.560, q: 0.55, gain: 0.036, attack: 0.060 });
      tone({ at: t + 0.040, type: 'sine', from: NOTE.d6, dur: 0.300, gain: 0.036 });
      tone({ at: t + 0.150, type: 'sine', from: NOTE.a4, dur: 0.340, gain: 0.038 });
    },

    /* Sound turning on. A rising triad — the one flourish in the file, and
       it earns the exception because it is the receipt for a deliberate
       choice the visitor just made. */
    on: function (t) {
      tone({ at: t,         type: 'triangle', from: NOTE.d5,  dur: 0.150, gain: 0.070 });
      tone({ at: t + 0.070, type: 'triangle', from: NOTE.fs5, dur: 0.150, gain: 0.065 });
      tone({ at: t + 0.140, type: 'triangle', from: NOTE.a5,  dur: 0.260, gain: 0.060 });
      air({  at: t + 0.140, from: 1800, to: 3600, dur: 0.200, q: 0.9, gain: 0.022, attack: 0.040 });
    },

    /* Sound turning off. Falling, darker, shorter — a lid closing. */
    off: function (t) {
      tone({ at: t,         type: 'sine', from: NOTE.a5, dur: 0.130, gain: 0.055 });
      tone({ at: t + 0.080, type: 'sine', from: NOTE.d5, dur: 0.220, gain: 0.048 });
    }
  };


  /* ══ 05 · Public API ══════════════════════════════════════ */

  function play(name) {
    var voice = VOICE[name];
    if (!voice || !on) return;
    if (!boot()) return;
    if (throttled(name)) return;

    /* A hair of lead time. Scheduling exactly at currentTime makes the very
       start of the envelope land in the past, which clicks. */
    if (ctx.state === 'running') {
      voice(ctx.currentTime + 0.005);
      return;
    }

    /* Parked — the visitor came back from another tab, or the browser took
       the context away on its own. resume() is asynchronous, so gating on
       `state === "running"` here would silently swallow the very interaction
       that woke us: the click that brings you back to the page would be the
       one click that makes no sound. Hand the voice to the promise instead,
       and re-check `on` when it settles in case the toggle moved meanwhile. */
    var resuming = wake();
    if (!resuming || !resuming.then) return;

    resuming.then(function () {
      /* Wrapped because this runs a tick later than the gesture: the context
         can be closed out from under us in between (device unplugged, tab
         teardown), and building a node on a closed context throws. A silent
         sound is fine; an unhandled rejection in the console is not. */
      try {
        if (on && ctx.state === 'running') voice(ctx.currentTime + 0.005);
      } catch (e) { /* graph gone */ }
    }, function () { /* device gone; nothing to do */ });
  }

  function enabled() { return on; }

  /* `announce` is false while restoring state at boot, so nothing plays on
     page load — only a real toggle is confirmed audibly. */
  function set(next, announce) {
    if (next === on) return;

    if (next) {
      on = true;
      remember('on');
      /* boot() must happen inside the gesture that turned it on. */
      if (announce) play('on');
    } else {
      /* Schedule the farewell BEFORE muting: nodes already on the graph
         finish playing, so `off` is audible even though `on` is now false. */
      if (announce) play('off');
      on = false;
      remember('off');
    }

    document.documentElement.dataset.sound = on ? 'on' : 'off';
    return on;
  }

  function toggle() { return set(!on, true); }

  document.documentElement.dataset.sound = on ? 'on' : 'off';


  /* ══ 06 · The top-bar toggle ══════════════════════════════
     Mirrors the theme switch exactly — two mono cells, the live state filled
     amber — because two controls sitting side by side in the same bar should
     not be two different kinds of control. */

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

    /* First visit, and only the first: two slow amber rings so the control
       is discoverable without a tooltip nobody hovers. Silent, obviously —
       announcing a sound feature with a sound would be circular. Skipped
       under reduced-motion, and skipped entirely for anyone who has already
       expressed a preference. */
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


  /* ══ 07 · Delegated wiring ════════════════════════════════
     One listener per event type on the document, rather than a listener per
     control. Cheaper, and it survives the modal building its contents at
     runtime — every button inside a case study is covered without anything
     having to opt in.

     Order matters in PRESS: first match wins, so the specific selectors sit
     above the catch-alls. */

  var PRESS = [
    ['#sound',                              null],       /* owns its own sound */
    ['#theme',                              null],       /* handled below      */
    ['.det__nav',                           null],       /* voiced in main.js  */
    ['.navlinks a, .totop, .skip, .sig',   'tick'],
    ['.modal__x, .modal__veil',            'press'],
    ['.iconbtn, .links a, .reg__more',     'press'],
    ['.btn, [data-proj], .head__act, .plist__go, .chan__t, [data-open-projects], [data-open-stack]', 'tap'],
    ['button, a[href]',                    'press']      /* anything left over */
  ];

  function voiceFor(node) {
    for (var i = 0; i < PRESS.length; i++) {
      if (node.closest(PRESS[i][0])) return PRESS[i][1];
    }
    return null;
  }

  /* pointerdown, not click: the sound should land with the finger, not after
     the browser has decided the gesture was a click. */
  document.addEventListener('pointerdown', function (e) {
    if (!on || e.button !== 0) return;

    var hit = e.target.closest && e.target.closest('button, a[href], summary');
    if (!hit) return;

    /* <summary> is voiced by the details `toggle` event instead, which knows
       whether the row is opening or closing. */
    if (hit.tagName === 'SUMMARY') return;

    var voice = voiceFor(hit);
    if (voice) play(voice);
  }, true);

  /* Keyboard activation gets the same feedback as a pointer — otherwise the
     interface is quietly worse for anyone not using a mouse. */
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

  /* Hover, mouse only. Touch has no hover state, and a trackpad flick across
     the nav should not sound like a xylophone — hence the 110ms floor in
     GAP and the very low peak in the voice itself. */
  if (finePointer) {
    document.addEventListener('pointerover', function (e) {
      if (!on || e.pointerType === 'touch') return;

      var hit = e.target.closest && e.target.closest('.navlinks a, .btn, .iconbtn, .chan__t, .head__act');
      if (!hit) return;

      /* Moving between children of the same control is not a new hover. */
      if (e.relatedTarget && hit.contains(e.relatedTarget)) return;

      play('hover');
    });
  }

  /* Experience ledger. The `toggle` event fires after the state flips, so
     `open` here is the state being moved INTO. */
  Array.prototype.forEach.call(document.querySelectorAll('details.led__row'), function (row) {
    row.addEventListener('toggle', function () {
      play(row.open ? 'expand' : 'collapse');
    });
  });

  /* Theme switch. This file loads before theme.js, so this listener runs
     first and still sees the OUTGOING theme — which is exactly what tells us
     which direction the sweep is about to travel. No coupling to theme.js. */
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
