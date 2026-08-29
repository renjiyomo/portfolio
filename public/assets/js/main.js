/* ==========================================================================
   main.js — motion, navigation and modals
   --------------------------------------------------------------------------
   01 · Helpers
   02 · Reveal on scroll
   03 · Scroll state: progress, sticky bar, active section
   04 · Smooth in-page scrolling
   05 · Modal shell (focus trap, Esc, scroll lock)
   06 · Project detail modal
   07 · Full stack modal
   08 · Project index modal
   09 · Triggers
   10 · GitHub contributions
   11 · Pointer tilt

   ========================================================================== */

(function () {
  'use strict';

  /* ══ 01 · Helpers ═════════════════════════════════════════ */

  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;

  var DATA  = window.PROJECTS || {};
  var ORDER = window.PROJECT_ORDER || Object.keys(DATA);
  var TECH  = window.TECH || [];

  var MDATA  = window.MODELS || {};
  var MORDER = window.MODEL_ORDER || Object.keys(MDATA);
  var MSPECKEYS = window.MODEL_SPEC_KEYS || [];

  function sfx(name) {
    if (window.SFX) window.SFX.play(name);
  }

  function onFrame(fn) {
    var queued = false;
    return function () {
      if (queued) return;
      queued = true;
      window.requestAnimationFrame(function () {
        queued = false;
        fn();
      });
    };
  }

  function clamp(n, min, max) { return n < min ? min : n > max ? max : n; }
  function pad(n) { return (n < 10 ? '0' : '') + n; }

  function el(tag, cls, text) {
    var node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function chips(list, cls) {
    var ul = el('ul', cls || 'chips');
    (list || []).forEach(function (name) {
      ul.appendChild(el('li', null, name));
    });
    return ul;
  }

  /* External link with the arrow glyph. Never returns null-ish markup. */
  function extLink(href, label, primary) {
    var a = el('a', 'btn' + (primary ? ' btn--primary' : ''));
    a.href = href;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.appendChild(el('span', null, label));
    return a;
  }


  /* ══ 02 · Reveal on scroll ════════════════════════════════ */

  (function reveals() {
    var targets = $$('.rv, .wipe, .head, .mast');
    if (!targets.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      targets.forEach(function (node) { node.classList.add('in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    targets.forEach(function (node) { io.observe(node); });

    var mast = $('.mast');
    if (mast) {
      window.requestAnimationFrame(function () {
        mast.classList.add('in');
        $$('.rv', mast).forEach(function (node) { node.classList.add('in'); });
      });
    }
  })();


  /* ══ 03 · Scroll state: progress, sticky bar, active section ══ */

  (function scrollState() {
    var bar = $('.progress');
    var topbar = $('.topbar');
    var sections = $$('main section[id]');
    var links = $$('.navlinks a[href^="#"]');

    var maxScroll = 0;

    function measure() {
      maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    }

    /* — Active section — */

    var spying = false;
    var atBottom = false;
    var current = sections.length ? sections[0].id : null;

    function mark() {
      if (!spying) return;
      var id = atBottom ? sections[sections.length - 1].id : current;

      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + id) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    }

    if (sections.length && links.length && 'IntersectionObserver' in window) {
      spying = true;

      var inBand = [];

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inBand[sections.indexOf(entry.target)] = entry.isIntersecting;
        });

        for (var i = sections.length - 1; i >= 0; i--) {
          if (inBand[i]) { current = sections[i].id; break; }
        }
        mark();
      }, { rootMargin: '-33% 0px -66% 0px', threshold: 0 });

      sections.forEach(function (node) { spy.observe(node); });
    }

    /* — Progress bar and sticky state — */

    var update = onFrame(function () {
      var y = window.scrollY;
      var ratio = maxScroll > 0 ? clamp(y / maxScroll, 0, 1) : 0;

      if (bar) bar.style.setProperty('--p', ratio.toFixed(4));
      if (topbar) topbar.dataset.stuck = String(y > 12);

      var bottom = maxScroll > 0 && y >= maxScroll - 2;
      if (bottom !== atBottom) {
        atBottom = bottom;
        mark();
      }
    });

    measure();
    mark();
    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', function () { measure(); update(); });

    if ('ResizeObserver' in window) {
      new ResizeObserver(function () { measure(); update(); }).observe(document.body);
    }
  })();


  /* ══ 04 · Smooth in-page scrolling ════════════════════════ */

  (function anchors() {
    $$('a[href^="#"]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var id = a.getAttribute('href').slice(1);
        if (!id) return;

        var target = document.getElementById(id);
        if (!target) return;

        e.preventDefault();
        target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

        var had = target.getAttribute('tabindex');
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
        if (had === null) target.removeAttribute('tabindex');

        if (history.replaceState) history.replaceState(null, '', '#' + id);
      });
    });
  })();


  /* ══ 05 · Modal shell ════════════════════════════════════ */

  var Modal = (function () {
    var box = $('#modal');
    if (!box) return null;

    var title = $('#modal-title', box);
    var slot  = $('.modal__slot', box);
    var foot  = $('.modal__ft', box);

    var opener = null;
    var timer = null;
    var onKeyExtra = null;

    function open(headline, bodyNode, footNode, keyHandler) {
      opener = document.activeElement;
      onKeyExtra = keyHandler || null;

      title.textContent = headline;

      slot.textContent = '';
      slot.appendChild(bodyNode);
      slot.scrollTop = 0;

      foot.textContent = '';
      if (footNode) {
        foot.appendChild(footNode);
        foot.hidden = false;
      } else {
        foot.hidden = true;
      }

      box.dataset.open = 'true';
      document.body.dataset.locked = 'true';

      sfx('modalOpen');

      window.clearTimeout(timer);
      timer = window.setTimeout(function () {
        box.dataset.shown = 'true';
      }, reduced ? 0 : 20);

      var first = $('.modal__x', box);
      if (first) first.focus();
    }

    function close() {
      if (box.dataset.open !== 'true') return;

      box.dataset.shown = 'false';
      onKeyExtra = null;
      window.clearTimeout(timer);

      sfx('modalClose');

      var finish = function () {
        box.dataset.open = 'false';
        document.body.removeAttribute('data-locked');
        slot.textContent = ''; // also stops any playing video
        foot.textContent = '';
        if (opener && typeof opener.focus === 'function') {
          opener.focus({ preventScroll: true });
        }
        opener = null;
      };

      if (reduced) finish();
      else timer = window.setTimeout(finish, 240);
    }

    function isOpen() { return box.dataset.open === 'true'; }

    function swap(headline, bodyNode, footNode, keyHandler) {
      onKeyExtra = keyHandler || null;
      title.textContent = headline;

      sfx('swap');

      slot.textContent = '';
      slot.appendChild(bodyNode);
      slot.scrollTop = 0;

      foot.textContent = '';
      if (footNode) {
        foot.appendChild(footNode);
        foot.hidden = false;
      } else {
        foot.hidden = true;
      }
    }

    $$('[data-close]', box).forEach(function (node) {
      node.addEventListener('click', close);
    });

    document.addEventListener('keydown', function (e) {
      if (!isOpen()) return;

      if (e.key === 'Escape') { e.preventDefault(); close(); return; }

      if (onKeyExtra && onKeyExtra(e)) return;

      if (e.key !== 'Tab') return;

      var focusables = $$('button, [href], video[controls], model-viewer', box).filter(function (node) {
        return !node.hidden && node.offsetParent !== null;
      });
      if (!focusables.length) return;

      var first = focusables[0];
      var last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });

    return { open: open, close: close, swap: swap, isOpen: isOpen, box: box };
  })();


  /* ══ 06 · Carousel (shared) ═══════════════════════════════ */

  /* Builds the image/video stage used by the project detail and model views.
     Returns { node, keys } — node is the .det__stage element, keys is the
     arrow-key handler for the modal. Both views emit the same markup so the
     existing .det__* CSS applies to each. */
  function carousel(items, title, startAt) {
    var wrap = el('div', 'det__stage');

    if (!items.length) return { node: wrap, keys: null };

    var idx = clamp(startAt || 0, 0, Math.max(0, items.length - 1));
    var capEl = null;
    var countEl = null;

    function paint() {
      var item = items[idx];
      var slot = $('.det__slot', wrap);
      slot.textContent = '';

      var media;
      if (item.type === 'video') {
        media = document.createElement('video');
        media.src = item.src;
        media.controls = true;
        media.playsInline = true;
        if (item.poster) media.poster = item.poster;
        media.preload = 'none';
        media.setAttribute('aria-label', item.alt || title + ' walkthrough');
      } else {
        media = document.createElement('img');
        media.src = item.src;
        media.alt = item.alt || '';
        media.decoding = 'async';
      }

      if (item.w && item.h) {
        media.width = item.w;
        media.height = item.h;
      }
      slot.appendChild(media);

      capEl.textContent = item.cap || '';
      countEl.textContent = pad(idx + 1) + ' / ' + pad(items.length);

      var next = items[idx + 1];
      if (next && next.type !== 'video') {
        var warm = function () {
          var pre = new Image();
          pre.src = next.src;
        };
        if (media.tagName === 'IMG' && !media.complete) {
          media.addEventListener('load', warm, { once: true });
          media.addEventListener('error', warm, { once: true });
        } else {
          warm();
        }
      }
    }

    function go(step) {
      if (items.length < 2) return;
      idx = (idx + step + items.length) % items.length;
      paint();
      sfx('tick');
    }

    var slot = el('div', 'det__slot');
    wrap.appendChild(slot);

    var prev = el('button', 'det__nav');
    prev.type = 'button';
    prev.dataset.dir = 'prev';
    prev.setAttribute('aria-label', 'Previous image');
    prev.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m15 6-6 6 6 6"/></svg>';

    var next = el('button', 'det__nav');
    next.type = 'button';
    next.dataset.dir = 'next';
    next.setAttribute('aria-label', 'Next image');
    next.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m9 6 6 6-6 6"/></svg>';

    prev.addEventListener('click', function () { go(-1); });
    next.addEventListener('click', function () { go(1); });

    var single = items.length < 2;
    prev.hidden = single;
    next.hidden = single;

    wrap.appendChild(prev);
    wrap.appendChild(next);

    var strip = el('div', 'det__strip');
    capEl = el('span', 'det__cap');
    countEl = el('span', 'det__count');
    strip.appendChild(capEl);
    if (!single) {
      var keys = el('span', 'det__keys');
      keys.setAttribute('aria-hidden', 'true');
      keys.innerHTML = '<kbd>&larr;</kbd><kbd>&rarr;</kbd>';
      strip.appendChild(keys);
    }
    strip.appendChild(countEl);
    wrap.appendChild(strip);

    paint();

    /* Swipe */
    var x0 = null, y0 = null;
    wrap.addEventListener('touchstart', function (e) {
      var t = e.changedTouches[0];
      x0 = t.clientX; y0 = t.clientY;
    }, { passive: true });

    wrap.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var t = e.changedTouches[0];
      var dx = t.clientX - x0;
      var dy = t.clientY - y0;
      x0 = y0 = null;
      if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
    }, { passive: true });

    var keyHandler = function (e) {
      if (items.length < 2) return false;
      if (e.key === 'ArrowRight') { e.preventDefault(); go(1); return true; }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); return true; }
      return false;
    };

    return { node: wrap, keys: keyHandler };
  }


  /* ══ 06a · Project detail modal ═══════════════════════════ */

  var Detail = (function () {
    if (!Modal) return null;

    function build(rec, startAt) {
      var wrap = el('div', 'det');

      /* — Carousel — */
      var stage = carousel(rec.items || [], rec.title, startAt);
      if (stage.node && (rec.items || []).length) wrap.appendChild(stage.node);

      /* — Written detail — */
      var copy = el('div', 'det__copy');

      var meta = el('div', 'det__meta');
      if (rec.tag) meta.appendChild(el('span', 'det__tag', rec.tag));
      if (rec.year) meta.appendChild(el('span', 'det__yr', rec.year));
      meta.appendChild(el('span', 'det__yr', rec.live ? 'Deployed' : 'Not deployed'));
      copy.appendChild(meta);

      (rec.body && rec.body.length ? rec.body : [rec.lede]).forEach(function (para) {
        copy.appendChild(el('p', null, para));
      });

      wrap.appendChild(copy);

      /* — Footer actions — */
      var actions = el('div', 'det__act');

      if (rec.live) actions.appendChild(extLink(rec.live, 'Visit live site', true));
      else actions.appendChild(el('span', 'det__none', 'No public deployment'));

      if (rec.code) actions.appendChild(extLink(rec.code, 'View code'));

      return {
        node: wrap,
        foot: actions.childNodes.length ? actions : null,
        keys: stage.keys
      };
    }

    function show(key, startAt, viaSwap) {
      var rec = DATA[key];
      if (!rec) return;

      var built = build(rec, startAt);
      var headline = rec.title + (rec.year ? ' — ' + rec.year : '');

      if (viaSwap && Modal.isOpen()) Modal.swap(headline, built.node, built.foot, built.keys);
      else Modal.open(headline, built.node, built.foot, built.keys);
    }

    return { show: show };
  })();


  /* ══ 06b · Model detail modal ═════════════════════════════ */

  /* The 3D viewer is a third-party module of real size, so it is never part of
     the initial page load — it is imported the first time someone actually
     opens a 3D tab, and the promise is kept so later opens are instant. */
  var viewerKit = (function () {
    var pending = null;

    var SRC = 'https://cdn.jsdelivr.net/npm/@google/model-viewer@4.0.0/dist/model-viewer.min.js';

    function load() {
      if (pending) return pending;

      /* Already registered by something else on the page. */
      if (window.customElements && window.customElements.get('model-viewer')) {
        pending = Promise.resolve();
        return pending;
      }

      pending = new Promise(function (resolve, reject) {
        var tag = document.createElement('script');
        tag.type = 'module';
        tag.src = SRC;
        tag.crossOrigin = 'anonymous';
        tag.onload = function () { resolve(); };
        tag.onerror = function () {
          /* Let a later attempt retry rather than caching the failure. */
          pending = null;
          tag.remove();
          reject(new Error('model-viewer failed to load'));
        };
        document.head.appendChild(tag);
      });

      return pending;
    }

    return { load: load };
  })();

  var Model = (function () {
    if (!Modal) return null;

    /* Spec sheet — only the fields actually filled in are rendered, so a model
       with a poly count but no rig note still reads as complete. */
    function specSheet(spec) {
      if (!spec) return null;

      var rows = MSPECKEYS.filter(function (pair) {
        return spec[pair[0]];
      });
      if (!rows.length) return null;

      var dl = el('dl', 'mdl__spec');
      rows.forEach(function (pair) {
        var cell = el('div');
        cell.appendChild(el('dt', null, pair[1]));
        cell.appendChild(el('dd', null, spec[pair[0]]));
        dl.appendChild(cell);
      });
      return dl;
    }

    /* The interactive viewer, with its own loading and failure states. A model
       that will not load falls back to the download link rather than an empty
       black box. */
    function viewer(rec) {
      var host = el('div', 'mdl__viewer');
      var note = el('p', 'mdl__load', 'Loading 3D viewer…');
      host.appendChild(note);

      function fail(msg) {
        host.textContent = '';
        var box = el('div', 'mdl__fail');
        box.appendChild(el('p', null, msg));
        box.appendChild(el('p', 'mdl__fail__hint',
          'The renders in the gallery show the same model.'));
        host.appendChild(box);
      }

      viewerKit.load().then(function () {
        var mv = document.createElement('model-viewer');
        mv.setAttribute('src', rec.glb);
        mv.setAttribute('alt', rec.title + ' — interactive 3D model');
        mv.setAttribute('camera-controls', '');
        mv.setAttribute('auto-rotate', '');
        mv.setAttribute('shadow-intensity', '1');
        mv.setAttribute('environment-image', 'neutral');
        mv.setAttribute('loading', 'eager');
        mv.setAttribute('tabindex', '0');
        mv.style.touchAction = 'none';

        mv.addEventListener('error', function () {
          fail('This model could not be loaded.');
        });

        host.textContent = '';
        host.appendChild(mv);
      }).catch(function () {
        fail('The 3D viewer could not be loaded.');
      });

      return host;
    }

    function build(rec, startAt) {
      var wrap = el('div', 'det mdl');

      var items = rec.items || [];
      var stage = carousel(items, rec.title, startAt);
      var has3d = !!rec.glb;
      var on3d = false;

      /* — Left column: gallery, plus a 3D tab where there is a model — */
      var left = el('div', 'mdl__stagewrap');

      if (has3d) {
        var tabs = el('div', 'mdl__tabs');
        tabs.setAttribute('role', 'tablist');
        tabs.setAttribute('aria-label', 'How to view this model');

        var pane = el('div', 'mdl__pane');

        var tabGallery = el('button', 'mdl__tab', 'Gallery');
        var tab3d = el('button', 'mdl__tab', 'View in 3D');

        [tabGallery, tab3d].forEach(function (t) {
          t.type = 'button';
          t.setAttribute('role', 'tab');
        });

        // Stage pane (Gallery) - kept persistent in DOM
        var stagePane = el('div', 'mdl__viewpane mdl__viewpane--gallery');
        if (items.length) {
          stagePane.appendChild(stage.node);
        }

        // 3D viewer pane - kept persistent in DOM so WebGL context is never destroyed
        var viewerPane = el('div', 'mdl__viewpane mdl__viewpane--3d');
        var viewerHost = viewer(rec);
        viewerPane.appendChild(viewerHost);

        pane.appendChild(stagePane);
        pane.appendChild(viewerPane);

        function select(which) {
          var wants3d = which === '3d';
          on3d = wants3d;

          tabGallery.setAttribute('aria-selected', String(!wants3d));
          tab3d.setAttribute('aria-selected', String(wants3d));

          if (wants3d) {
            stagePane.style.display = 'none';
            viewerPane.style.display = 'flex';
            var mv = viewerPane.querySelector('model-viewer');
            if (mv) {
              // Ensure renderer refreshes canvas dimensions when becoming visible
              if (typeof mv.requestUpdate === 'function') mv.requestUpdate();
            }
          } else {
            viewerPane.style.display = 'none';
            stagePane.style.display = 'flex';
          }
        }

        tabGallery.addEventListener('click', function () { select('gallery'); sfx('tick'); });
        tab3d.addEventListener('click', function () { select('3d'); sfx('tick'); });

        tabs.appendChild(tabGallery);
        tabs.appendChild(tab3d);

        left.appendChild(tabs);
        left.appendChild(pane);

        /* A model with no renders yet opens straight into 3D. */
        select(items.length ? 'gallery' : '3d');
      } else if (items.length) {
        left.appendChild(stage.node);
      }

      if (left.childNodes.length) wrap.appendChild(left);

      /* — Right column: the written detail and the spec sheet — */
      var copy = el('div', 'det__copy mdl__copy');

      var meta = el('div', 'det__meta');
      if (rec.tag) meta.appendChild(el('span', 'det__tag', rec.tag));
      if (rec.year) meta.appendChild(el('span', 'det__yr', rec.year));
      if (has3d) meta.appendChild(el('span', 'det__yr', 'Interactive'));
      copy.appendChild(meta);

      (rec.body && rec.body.length ? rec.body : [rec.lede]).forEach(function (para) {
        if (para) copy.appendChild(el('p', null, para));
      });

      var sheet = specSheet(rec.spec);
      if (sheet) copy.appendChild(sheet);

      wrap.appendChild(copy);

      /* — Footer actions — */
      var actions = el('div', 'det__act');

      return {
        node: wrap,
        foot: actions.childNodes.length ? actions : null,
        /* While the 3D tab is up the arrow keys belong to the viewer, which
           orbits with them — stepping the hidden gallery instead would both
           swallow the orbit and leave the gallery on a different frame. */
        keys: function (e) {
          if (on3d || !stage.keys) return false;
          return stage.keys(e);
        }
      };
    }

    function show(key, startAt, viaSwap) {
      var rec = MDATA[key];
      if (!rec) return;

      var built = build(rec, startAt);
      var headline = rec.title + (rec.year ? ' — ' + rec.year : '');

      if (viaSwap && Modal.isOpen()) Modal.swap(headline, built.node, built.foot, built.keys);
      else Modal.open(headline, built.node, built.foot, built.keys);
    }

    return { show: show };
  })();

  window.Model = Model;


  /* ══ 07 · Full stack modal ═══════════════════════════════ */

  (function stackModal() {
    if (!Modal) return;

    var triggers = $$('[data-open-stack]');
    if (!triggers.length || !TECH.length) return;

    function open() {
      var wrap = el('div', 'techlist');

      TECH.forEach(function (group) {
        var block = el('section', 'techlist__g');
        var hd = el('div', 'techlist__hd');
        hd.appendChild(el('h3', null, group.group));
        hd.appendChild(el('span', 'mono', pad(group.items.length)));
        block.appendChild(hd);
        block.appendChild(chips(group.items, 'chips'));
        wrap.appendChild(block);
      });

      Modal.open('Full technology stack', wrap, null, null);
    }

    triggers.forEach(function (node) {
      node.addEventListener('click', open);
    });
  })();


  /* ══ 08 · Project index modal ════════════════════════════ */

  (function indexModal() {
    if (!Modal || !Detail) return;

    var triggers = $$('[data-open-projects]');
    if (!triggers.length) return;

    function open() {
      var wrap = el('div', 'plist');

      ORDER.forEach(function (key) {
        var rec = DATA[key];
        if (!rec) return;

        var row = el('div', 'plist__row');

        var head = el('div', 'plist__hd');
        head.appendChild(el('b', null, rec.title));
        if (rec.tag) head.appendChild(el('span', 'plist__tag', rec.tag));
        head.appendChild(el('span', 'plist__yr', rec.year || ''));
        row.appendChild(head);

        row.appendChild(el('p', 'plist__lede', rec.lede));

        var foot = el('div', 'plist__ft');

        foot.appendChild(el('span', 'mono', rec.items.length
          ? pad(rec.items.length) + ' captures'
          : 'No captures'));

        var act = el('div', 'plist__act');

        var study = el('button', 'plist__go', 'Case study');
        study.type = 'button';
        study.addEventListener('click', function () {
          Detail.show(key, 0, true);
        });
        act.appendChild(study);

        if (rec.live) {
          var visit = el('a', 'plist__go plist__go--live', 'Visit site');
          visit.href = rec.live;
          visit.target = '_blank';
          visit.rel = 'noopener noreferrer';
          visit.setAttribute('aria-label', 'Visit ' + rec.title + ' — opens in a new tab');
          act.appendChild(visit);
        } else {
          act.appendChild(el('span', 'plist__off', 'Not deployed'));
        }

        foot.appendChild(act);
        row.appendChild(foot);

        wrap.appendChild(row);

      });

      Modal.open('All projects — ' + pad(ORDER.length), wrap, null, null);
    }

    triggers.forEach(function (node) {
      node.addEventListener('click', open);
    });
  })();


  /* ══ 08b · Model index modal ═════════════════════════════ */

  (function modelIndexModal() {
    if (!Modal || !Model) return;

    var triggers = $$('[data-open-models]');
    if (!triggers.length) return;

    function open() {
      var wrap = el('div', 'plist');

      MORDER.forEach(function (key) {
        var rec = MDATA[key];
        if (!rec) return;

        var row = el('div', 'plist__row');

        var head = el('div', 'plist__hd');
        head.appendChild(el('b', null, rec.title));
        if (rec.tag) head.appendChild(el('span', 'plist__tag', rec.tag));
        head.appendChild(el('span', 'plist__yr', rec.year || ''));
        row.appendChild(head);

        row.appendChild(el('p', 'plist__lede', rec.lede || ''));

        var foot = el('div', 'plist__ft');

        var count = (rec.items || []).length;
        foot.appendChild(el('span', 'mono', count
          ? pad(count) + (count === 1 ? ' render' : ' renders')
          : 'No renders'));

        var act = el('div', 'plist__act');

        var open3d = el('button', 'plist__go', 'Breakdown');
        open3d.type = 'button';
        open3d.addEventListener('click', function () {
          Model.show(key, 0, true);
        });
        act.appendChild(open3d);

        if (rec.glb) act.appendChild(el('span', 'plist__tag', 'Interactive 3D'));

        foot.appendChild(act);
        row.appendChild(foot);

        wrap.appendChild(row);
      });

      Modal.open('All 3D models — ' + pad(MORDER.length), wrap, null, null);
    }

    triggers.forEach(function (node) {
      node.addEventListener('click', open);
    });
  })();


  /* ══ 09 · Triggers ═══════════════════════════════════════ */

  (function triggers() {
    if (Detail) {
      $$('[data-proj]').forEach(function (node) {
        node.addEventListener('click', function () {
          Detail.show(node.dataset.proj, parseInt(node.dataset.i, 10) || 0, false);
        });
      });
    }

    if (Model) {
      $$('[data-model]').forEach(function (node) {
        node.addEventListener('click', function () {
          Model.show(node.dataset.model, parseInt(node.dataset.i, 10) || 0, false);
        });
      });
    }
  })();


  /* ══ 10 · GitHub contributions ════════════════════════════ */

  (function ghGraph() {
    var root = $('.gh');
    if (!root) return;

    var user     = root.dataset.user;
    var grid     = $('.gh__grid', root);
    var months   = $('.gh__months', root);
    if (!user || !grid) return;

    var COLS      = 53;
    var ENDPOINTS = [
      'https://gh-calendar.rschristian.dev/user/',
      'https://github-contributions.vercel.app/api/v1/'
    ];
    var STORE     = 'gh:' + user;

    var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
               'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var DAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    function key(d) {
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
    }

    /* Same reason in reverse — new Date('2026-03-14') parses as UTC
       midnight, which is the 13th in half the world. */
    function parse(s) {
      var p = String(s).split('-');
      return new Date(+p[0], +p[1] - 1, +p[2]);
    }

    function short(d) { return d.getDate() + ' ' + MON[d.getMonth()]; }
    function full(d)  { return short(d) + ' ' + d.getFullYear(); }

    function stat(name, value, unit) {
      var dd = $('[data-gh="' + name + '"]', root);
      if (!dd) return;
      dd.textContent = String(value);
      if (unit) dd.appendChild(el('small', null, unit));
    }

    /* -- Pass 1: the empty year ------------------------------------- */

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (COLS - 1) * 7);

    root.style.setProperty('--gh-cols', String(COLS));

    var cells = {};   /* date key → cell node        */
    var order = [];   /* date keys, first day → today */

    for (var c = 0; c < COLS; c++) {
      for (var r = 0; r < 7; r++) {
        var d = new Date(start);
        d.setDate(start.getDate() + c * 7 + r);

        var cell = el('div', 'gh__c');
        cell.setAttribute('data-l', '0');

        cell.style.setProperty('--w', String(c));

        if (d > today) {
          cell.setAttribute('data-void', '');
        } else {
          var k = key(d);
          cells[k] = cell;
          order.push(k);
        }

        grid.appendChild(cell);
      }
    }

    if (months) {
      var marks = [];

      for (var mc = 0; mc < COLS; mc++) {
        var md = new Date(start);
        md.setDate(start.getDate() + mc * 7);

        if (!marks.length || marks[marks.length - 1].m !== md.getMonth()) {
          marks.push({ c: mc, m: md.getMonth() });
        }
      }

      marks.forEach(function (mark, i) {
        var span = (marks[i + 1] ? marks[i + 1].c : COLS) - mark.c;
        if (span < 3) return;

        var label = el('span', null, MON[mark.m]);
        label.style.gridColumn = (mark.c + 1) + ' / span ' + span;
        months.appendChild(label);
      });
    }

    /* -- Pass 2: the data ------------------------------------------- */

    function fail() {
      root.dataset.state = 'error';
      grid.setAttribute('aria-label',
        'Contribution graph unavailable — see the link below');
    }

    function scale(counts) {
      var live = [];
      counts.forEach(function (n) { if (n > 0) live.push(n); });
      if (!live.length) return [1, 2, 3];

      live.sort(function (a, b) { return a - b; });

      function at(p) {
        return live[Math.min(live.length - 1, Math.floor(live.length * p))];
      }

      var t1 = at(0.25);
      var t2 = Math.max(at(0.5), t1 + 1);
      var t3 = Math.max(at(0.75), t2 + 1);
      return [t1, t2, t3];
    }

    function level(n, t) {
      if (n <= 0) return 0;
      if (n <= t[0]) return 1;
      if (n <= t[1]) return 2;
      if (n <= t[2]) return 3;
      return 4;
    }

    var tipReady = false;
    var paints = 0;

    function paint(days, syncedOn, fresh, cached) {
      var byDate = {};
      (days || []).forEach(function (day) {
        if (day && day.date != null) byDate[day.date] = +day.count || 0;
      });

      var counts = order.map(function (k) {
        return Object.prototype.hasOwnProperty.call(byDate, k) ? byDate[k] : null;
      });

      var t = scale(counts);
      var sum = 0, drawn = 0, run = 0, longest = 0, best = null;

      order.forEach(function (k, i) {
        var n = counts[i];
        var cell = cells[k];

        if (n === null) { cell.setAttribute('data-void', ''); return; }

        cell.removeAttribute('data-void');

        drawn++;
        sum += n;
        if (!best || n > best.n) best = { n: n, on: k };

        if (n > 0) {
          run++;
          if (run > longest) longest = run;
        } else {
          run = 0;
        }

        cell.setAttribute('data-l', String(level(n, t)));
        cell.dataset.n = String(n);
        cell.dataset.d = k;
      });

      if (!drawn) { fail(); return; }

      var cur = 0;
      for (var i = counts.length - 1; i >= 0; i--) {
        if (counts[i] === null) break;
        if (counts[i] > 0) cur++;
        else if (i !== counts.length - 1) break;
      }

      var first = parse(order[0]);
      var last  = parse(order[order.length - 1]);

      stat('total', sum, null);
      stat('current', cur, cur === 1 ? 'day' : 'days');
      stat('longest', longest, longest === 1 ? 'day' : 'days');
      stat('best', best ? best.n : 0, best ? 'on ' + short(parse(best.on)) : null);

      var range = $('[data-gh="range"]', root);
      if (range) {
        range.textContent =
          MON[first.getMonth()] + ' ' + first.getFullYear() + ' — ' +
          MON[last.getMonth()] + ' ' + last.getFullYear();
      }

      var sync = $('[data-gh="sync"]', root);
      if (sync) {
        sync.textContent =
          (fresh ? 'Synced ' : 'Last synced ') + full(parse(syncedOn));
      }

      grid.setAttribute('aria-label',
        sum + ' contributions between ' + full(first) + ' and ' + full(last));

      root.dataset.state = fresh ? 'ready' : (cached ? 'cached' : 'stale');

      /* Second and later paints skip the reveal stagger — see style.css. */
      if (paints++) root.setAttribute('data-repaint', '');

      if (finePointer && !tipReady) { tipReady = true; tooltip(); }

      if (fresh) keep(counts);
    }

    function keep(counts) {
      try {
        window.localStorage.setItem(STORE, JSON.stringify({
          on: key(today),
          from: order[0],
          counts: counts
        }));
      } catch (e) {}
    }

    function recall() {
      var box;
      try {
        box = JSON.parse(window.localStorage.getItem(STORE));
      } catch (e) { return null; }

      if (!box || !box.from || !box.counts || !box.counts.length) return null;

      var from = parse(box.from);
      var days = [];

      box.counts.forEach(function (n, i) {
        if (n === null) return;
        var d = new Date(from);
        d.setDate(from.getDate() + i);
        days.push({ date: key(d), count: n });
      });

      return days.length ? { days: days, on: box.on || box.from } : null;
    }

    function tooltip() {
      var tip = el('div', 'gh__tip');
      document.body.appendChild(tip);

      function hide() { tip.removeAttribute('data-on'); }

      grid.addEventListener('mouseover', function (e) {
        var cell = e.target;
        if (!cell || !cell.dataset || cell.dataset.n == null) return;

        var n = parseInt(cell.dataset.n, 10);
        var d = parse(cell.dataset.d);

        tip.textContent =
          n + (n === 1 ? ' contribution · ' : ' contributions · ') +
          DAY[d.getDay()] + ', ' + short(d);
        tip.setAttribute('data-on', '');

        var box = cell.getBoundingClientRect();
        var w = tip.offsetWidth;
        var h = tip.offsetHeight;

        tip.style.left = clamp(
          box.left + box.width / 2 - w / 2, 8, window.innerWidth - w - 8) + 'px';

        var above = box.top - h - 8;
        tip.style.top = (above < 8 ? box.bottom + 8 : above) + 'px';
      });

      grid.addEventListener('mouseleave', hide);

      /* Capture phase so any scrolling ancestor dismisses the tip, passive so
         it can never hold up a scroll frame. */
      window.addEventListener('scroll', hide, { capture: true, passive: true });
    }

    /* -- Pass 3: cache first, then revalidate ----------------------- */

    var painted = false;

    var kept = recall();
    if (kept) {
      paint(kept.days, kept.on, false, true);
      painted = true;
    }

    if (!window.fetch) {
      if (!painted) fail();
      return;
    }

    function accept(data) {
      if (!data) throw new Error('empty payload');
      var days = data.contributions;
      if (!days || !days.length) throw new Error('empty payload');
      if (Array.isArray(days[0])) {
        days = days.reduce(function (acc, week) { return acc.concat(week); }, []);
      }
      return days;
    }

    function fetchWithTimeout(endpointUrl, timeoutMs) {
      var ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
      var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, timeoutMs || 5000) : null;
      return fetch(endpointUrl, { signal: ctrl ? ctrl.signal : undefined })
        .then(function (res) {
          if (timer) clearTimeout(timer);
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .catch(function (err) {
          if (timer) clearTimeout(timer);
          throw err;
        });
    }

    function fetchEndpoint(idx) {
      if (idx >= ENDPOINTS.length) {
        return Promise.reject(new Error('All contribution endpoints failed'));
      }
      var targetUrl = ENDPOINTS[idx] + encodeURIComponent(user);
      var pending = (idx === 0 && window.__ghEarly)
        ? window.__ghEarly
        : fetchWithTimeout(targetUrl, 5000);

      return pending
        .then(accept)
        .catch(function () {
          return fetchEndpoint(idx + 1);
        });
    }

    function load() {
      fetchEndpoint(0)
        .then(function (days) {
          paint(days, key(today), true, false);
        })
        .catch(function () {
          if (painted) root.dataset.state = 'stale';
          else fail();
        });
    }

    load();
  })();


  /* ══ 11 · Pointer tilt ════════════════════════════════════ */

  (function tilt() {
    var cards = $$('.card');
    if (!cards.length) return;

    if (!finePointer || reduced) return;

    var MAX = 4.5;

    cards.forEach(function (card) {
      var frame = null;
      var next = null;

      function write() {
        frame = null;
        if (!next) return;

        card.style.setProperty('--tilt-x',  next.rx + 'deg');
        card.style.setProperty('--tilt-y',  next.ry + 'deg');
        card.style.setProperty('--tilt-gx', next.gx + '%');
        card.style.setProperty('--tilt-gy', next.gy + '%');

        next = null;
      }

      function move(e) {
        if (e.pointerType === 'touch') return;

        var box = card.getBoundingClientRect();
        if (!box.width || !box.height) return;

        var px = clamp((e.clientX - box.left) / box.width,  0, 1);
        var py = clamp((e.clientY - box.top)  / box.height, 0, 1);

        next = {

          ry:  ((px - 0.5) * 2 * MAX).toFixed(2),
          rx: (-(py - 0.5) * 2 * MAX).toFixed(2),

          gx: (px * 100).toFixed(1),
          gy: (py * 100).toFixed(1)
        };

        if (frame === null) frame = window.requestAnimationFrame(write);
      }

      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;

        if (!card.classList.contains('in')) return;

        /* A modal is open: the grid behind it is inert. */
        if (document.body.dataset.locked) return;

        card.dataset.tilt = 'on';
        card.addEventListener('pointermove', move);

        move(e);

        sfx('tilt');
      });

      card.addEventListener('pointerleave', function () {
        card.removeEventListener('pointermove', move);

        if (frame !== null) {
          window.cancelAnimationFrame(frame);
          frame = null;
        }
        next = null;

        card.dataset.tilt = 'off';
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  })();

})();
