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

  /* Micro-interaction sound, if sound.js loaded and the visitor turned it on.
     Optional by design: every call goes through here, so this file has no
     hard dependency on the audio layer and works unchanged without it. */
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

  /* Chip list. Only the Stack section's full-inventory modal renders these
     now — project views state no technologies of their own. */
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


  /* ══ 03 · Scroll state: progress, sticky bar, active section ══

     One module, because all three answer the same question — where is the
     page — and because the two things that used to answer it separately both
     forced a synchronous layout on every scroll frame: a `scrollHeight` read
     here, and a `getBoundingClientRect()` loop over every section there. The
     height is now cached and invalidated on resize, and the active section
     comes from an IntersectionObserver, so a scroll frame reads no geometry
     at all. */

  (function scrollState() {
    var bar = $('.progress');
    var topbar = $('.topbar');
    var sections = $$('main section[id]');
    var links = $$('.navlinks a[href^="#"]');

    /* — Cached page height — */

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

      /* A thin band whose lower edge sits 34% down the viewport — the same
         threshold the old rect loop compared against, expressed as a region
         instead of a per-frame measurement.

         Two details make this exactly equivalent rather than merely close. The
         band has height (1%) because a zero-height line intersects a section
         with zero area, which is the degenerate case observer implementations
         disagree about. And it sits *above* the line rather than below it, so
         a section becomes current as its top reaches the line — precisely what
         the old loop tested. Checked against the old rule at every scroll
         offset on the page: no disagreement. */
      var inBand = [];

      var spy = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          inBand[sections.indexOf(entry.target)] = entry.isIntersecting;
        });

        /* Take the last section in document order, not the last one in the
           batch: a band has height, so two sections can straddle it, and the
           order entries arrive in is not specified. */
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

      /* The final section is usually shorter than the distance from the band
         to the foot of the page, so it can never satisfy the crossing on its
         own. At the very bottom it is unambiguously the one being read. */
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

    /* Modals, the contributions grid and lazy images all change the page
       height after load. Without this the progress bar would stay calibrated
       to whatever the document measured on the first frame. */
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

    /* Replace the body without the open/close animation — used when the
       project index hands off to a project detail view. */
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

      var focusables = $$('button, [href], video[controls]', box).filter(function (node) {
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


  /* ══ 06 · Project detail modal ═══════════════════════════ */

  var Detail = (function () {
    if (!Modal) return null;

    function build(rec, startAt) {
      var wrap = el('div', 'det');
      var idx = clamp(startAt || 0, 0, Math.max(0, rec.items.length - 1));

      /* — Carousel — */
      var stage = null;
      var slot = null;
      var capEl = null;
      var countEl = null;

      function paint() {
        var item = rec.items[idx];
        slot.textContent = '';

        var media;
        if (item.type === 'video') {
          media = document.createElement('video');
          media.src = item.src;
          media.controls = true;
          media.playsInline = true;
          /* A poster frame plus preload="none" means the modal opens on a real
             image immediately and the multi-megabyte file only moves if the
             visitor presses play. "metadata" used to pull a chunk of it every
             time the panel was opened, whether or not anyone watched. */
          if (item.poster) media.poster = item.poster;
          media.preload = 'none';
          media.setAttribute('aria-label', item.alt || rec.title + ' walkthrough');
        } else {
          media = document.createElement('img');
          media.src = item.src;
          media.alt = item.alt || '';
          media.decoding = 'async';
        }
        /* The record carries each capture's real pixel size, so the browser can
           reserve the right box before the file arrives. Without it the slot is
           `height: auto` around nothing, and every step through the carousel
           collapses the frame and springs it back — worst in CartCraft, which
           mixes portrait, 16:9 and letterboxed shots. */
        if (item.w && item.h) {
          media.width = item.w;
          media.height = item.h;
        }
        slot.appendChild(media);

        capEl.textContent = item.cap || '';
        countEl.textContent = pad(idx + 1) + ' / ' + pad(rec.items.length);

        /* Warm the next frame only, and only once the current one has landed.
           Preloading both neighbours up front put two full-resolution captures
           in flight against the one actually on screen. */
        var next = rec.items[idx + 1];
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
        if (rec.items.length < 2) return;
        idx = (idx + step + rec.items.length) % rec.items.length;
        paint();
        /* Voiced here rather than on the arrow buttons, because this is the
           one place that knows a step actually happened — keyboard arrows and
           swipes get the same detent as a click. */
        sfx('tick');
      }

      if (rec.items.length) {
        stage = el('div', 'det__stage');
        slot = el('div', 'det__slot');

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

        var single = rec.items.length < 2;
        prev.hidden = single;
        next.hidden = single;

        stage.appendChild(prev);
        stage.appendChild(slot);
        stage.appendChild(next);

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
        stage.appendChild(strip);
        wrap.appendChild(stage);

        paint();

        /* Swipe */
        var x0 = null, y0 = null;
        stage.addEventListener('touchstart', function (e) {
          var t = e.changedTouches[0];
          x0 = t.clientX; y0 = t.clientY;
        }, { passive: true });

        stage.addEventListener('touchend', function (e) {
          if (x0 === null) return;
          var t = e.changedTouches[0];
          var dx = t.clientX - x0;
          var dy = t.clientY - y0;
          x0 = y0 = null;
          if (Math.abs(dx) > 52 && Math.abs(dx) > Math.abs(dy) * 1.5) go(dx < 0 ? 1 : -1);
        }, { passive: true });
      }

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

      var keyHandler = function (e) {
        if (!rec.items.length || rec.items.length < 2) return false;
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); return true; }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); return true; }
        return false;
      };

      return {
        node: wrap,
        foot: actions.childNodes.length ? actions : null,
        keys: keyHandler
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


  /* ══ 09 · Triggers ═══════════════════════════════════════ */

  (function triggers() {
    if (!Detail) return;

    $$('[data-proj]').forEach(function (node) {
      node.addEventListener('click', function () {
        Detail.show(node.dataset.proj, parseInt(node.dataset.i, 10) || 0, false);
      });
    });
  })();


  /* ══ 10 · GitHub contributions ════════════════════════════ */

  (function ghGraph() {
    var root = $('.gh');
    if (!root) return;

    var user     = root.dataset.user;
    var grid     = $('.gh__grid', root);
    var months   = $('.gh__months', root);
    if (!user || !grid) return;

    var COLS  = 53;
    var API   = 'https://github-contributions-api.jogruber.de/v4/';
    var STORE = 'gh:' + user;

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

    /* `fresh` is a live response, `cached` a first paint from localStorage.
       The distinction matters: a cached paint is a normal fast start, whereas
       falling back to storage after the network failed is a degraded one, and
       only the latter should say so in the interface.

       Guarded because paint() now runs twice on a warm visit — cache first,
       then the live data — and the tooltip must only be wired once. */
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

        /* Cleared explicitly: a cached paint can cover fewer days than the
           live response, and those cells must stop reading as absent when the
           real data arrives behind them. */
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

    function url() {
      var y = today.getFullYear();
      return API + encodeURIComponent(user) + '?y=' + y + '&y=' + (y - 1);
    }

    /* -- Pass 3: cache first, then revalidate ----------------------- */

    /* The graph is third-party data from another continent, measured at
       roughly two seconds. Two things follow from that.

       First: a returning visitor should never look at an empty grid waiting
       for it. Storage is now the first paint, not the failure path it used to
       be, and the live response quietly repaints over it.

       Second: the request should already be in flight by the time this file
       runs. index.html starts it during head parsing and leaves it on
       window.__ghEarly, so it overlaps the stylesheet, the fonts and the
       portrait rather than queueing behind all four scripts. */

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
      var days = data && data.contributions;
      if (!days || !days.length) throw new Error('empty payload');
      return days;
    }

    function load(attempt) {
      /* Adopt the head-started request on the first attempt; retries have to
         issue their own. No `cache: 'no-store'` any more — it was defeating
         HTTP caching outright for data that changes at most once a day. */
      var pending = attempt === 1 && window.__ghEarly
        ? window.__ghEarly
        : fetch(url()).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
          });

      pending
        .then(accept)
        .then(function (days) {
          paint(days, key(today), true, false);
        })
        .catch(function () {
          if (attempt < 3) {
            window.setTimeout(function () { load(attempt + 1); }, attempt * 350);
            return;
          }
          /* Out of attempts. An empty grid has nothing to show; a cached one
             keeps its cells but is now genuinely stale rather than merely
             ahead of the network, so it drops to the state that says so. */
          if (painted) root.dataset.state = 'stale';
          else fail();
        });
    }

    load(1);
  })();


  /* ══ 11 · Pointer tilt ════════════════════════════════════
     The work cards follow the cursor on two axes. The restraint is the whole
     point: 4.5° maximum, which is enough for the surface to read as a plane
     catching light and not enough to keystone the type. Most tilt effects on
     the web are set to 15–20°, which is why they look like a demo.

     All the visual state lives in CSS custom properties (§19 of style.css) —
     this file writes four numbers and never touches `transform` itself. That
     keeps the transition curves, the reduced-motion escape and the print
     escape declarative, where they belong.

     Writes are batched into one rAF per frame. `pointermove` can fire faster
     than the display refreshes, and setting four properties per event would
     mean laying out the same frame three times for nothing. */

  (function tilt() {
    var cards = $$('.card');
    if (!cards.length) return;

    /* Mouse only. Touch has no cursor to follow, and under reduced-motion the
       stylesheet neutralises the transform anyway — so don't pay for the
       listeners at all. */
    if (!finePointer || reduced) return;

    var MAX = 4.5;   /* degrees, per axis, from centre */

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
          /* Cursor right ⇒ the right edge recedes. Cursor low ⇒ the bottom
             edge recedes. Invert either one and the card leans *into* the
             pointer, which the eye reads as a bug rather than as a surface. */
          ry:  ((px - 0.5) * 2 * MAX).toFixed(2),
          rx: (-(py - 0.5) * 2 * MAX).toFixed(2),

          /* Specular highlight tracks the cursor exactly. */
          gx: (px * 100).toFixed(1),
          gy: (py * 100).toFixed(1)
        };

        if (frame === null) frame = window.requestAnimationFrame(write);
      }

      card.addEventListener('pointerenter', function (e) {
        if (e.pointerType === 'touch') return;

        /* Leave a card alone while it is still sliding in from §02 — the
           reveal owns the transform until it lands. */
        if (!card.classList.contains('in')) return;

        /* A modal is open: the grid behind it is inert. */
        if (document.body.dataset.locked) return;

        card.dataset.tilt = 'on';
        card.addEventListener('pointermove', move);

        /* Seed from the entry point, so the card is already oriented on the
           first frame instead of springing from flat. */
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

        /* "off" keeps the perspective wrapper in play so the return is a
           transition rather than a snap — it only changes the curve. */
        card.dataset.tilt = 'off';
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  })();

})();
