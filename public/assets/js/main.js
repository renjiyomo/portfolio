/* ==========================================================================
   main.js — motion, navigation and modals
   --------------------------------------------------------------------------
   01 · Helpers
   02 · Reveal on scroll
   03 · Scroll progress + sticky top bar
   04 · Active section
   05 · Smooth in-page scrolling
   06 · Modal shell (focus trap, Esc, scroll lock)
   07 · Project detail modal
   08 · Full stack modal
   09 · Project index modal
   10 · Triggers
   11 · GitHub contributions

   Every animated behaviour is gated behind prefers-reduced-motion. When motion
   is reduced, content is shown immediately rather than withheld.
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


  /* ══ 03 · Scroll progress + sticky top bar ════════════════ */

  (function progress() {
    var bar = $('.progress');
    var topbar = $('.topbar');

    var update = onFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var ratio = max > 0 ? clamp(window.scrollY / max, 0, 1) : 0;

      if (bar) bar.style.setProperty('--p', ratio.toFixed(4));
      if (topbar) topbar.dataset.stuck = String(window.scrollY > 12);
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  })();


  /* ══ 04 · Active section ══════════════════════════════════ */

  (function activeSection() {
    var sections = $$('main section[id]');
    if (!sections.length) return;

    var links = $$('.navlinks a[href^="#"]');

    var update = onFrame(function () {
      var line = window.innerHeight * 0.34;
      var active = sections[0].id;

      for (var i = 0; i < sections.length; i++) {
        if (sections[i].getBoundingClientRect().top <= line) active = sections[i].id;
      }

      if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2) {
        active = sections[sections.length - 1].id;
      }

      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + active) a.setAttribute('aria-current', 'true');
        else a.removeAttribute('aria-current');
      });
    });

    update();
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
  })();


  /* ══ 05 · Smooth in-page scrolling ════════════════════════ */

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


  /* ══ 06 · Modal shell ════════════════════════════════════ */
  /* One dialog element serves three views: project detail, full stack, and
     the project index. Whoever opens it supplies a title and a body node.   */

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


  /* ══ 07 · Project detail modal ═══════════════════════════ */
  /* Full case study: description, live/code actions, and a carousel of every
     capture for that project.                                              */

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
          media.preload = 'metadata';
          media.setAttribute('aria-label', item.alt || rec.title + ' walkthrough');
        } else {
          media = document.createElement('img');
          media.src = item.src;
          media.alt = item.alt || '';
          media.decoding = 'async';
        }
        slot.appendChild(media);

        capEl.textContent = item.cap || '';
        countEl.textContent = pad(idx + 1) + ' / ' + pad(rec.items.length);

        [idx + 1, idx - 1].forEach(function (i) {
          if (i < 0 || i >= rec.items.length) return;
          if (rec.items[i].type === 'video') return;
          var pre = new Image();
          pre.src = rec.items[i].src;
        });
      }

      function go(step) {
        if (rec.items.length < 2) return;
        idx = (idx + step + rec.items.length) % rec.items.length;
        paint();
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

      /* — Written detail —
         Tag, year and deployment state, then the prose. No stack chips: the
         technologies were pulled out of every project view (see the note at
         the head of projects.js) and are stated once, in the Stack section. */
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

      /* An empty action row would still render the footer bar, so hand back
         null when there is nothing to show. */
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


  /* ══ 08 · Full stack modal ═══════════════════════════════ */

  (function stackModal() {
    if (!Modal) return;

    /* Two triggers now open this: the "view all" in the section header row,
       and the "+ more" chip that closes the Tooling register line. $$ rather
       than $, or the second one would silently do nothing. */
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


  /* ══ 09 · Project index modal ════════════════════════════ */
  /* Every project in one list, each row opening its detail view. */

  (function indexModal() {
    if (!Modal || !Detail) return;

    /* Same pattern as the stack modal — the header action today, and any
       further entry point added later, without touching this block again. */
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

        /* Two explicit actions per row: the case study, and the live site.
           Kept as siblings because nesting a link inside a button is invalid
           markup and breaks keyboard and screen reader use. */
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


  /* ══ 10 · Triggers ═══════════════════════════════════════ */
  /* [data-proj] opens a project detail view. */

  (function triggers() {
    if (!Detail) return;

    $$('[data-proj]').forEach(function (node) {
      node.addEventListener('click', function () {
        Detail.show(node.dataset.proj, parseInt(node.dataset.i, 10) || 0, false);
      });
    });
  })();


  /* ══ 11 · GitHub contributions ════════════════════════════ */
  /* Draws the year graph in #github, and draws it live on every load. This
     panel is the page's one piece of evidence, and evidence that could just
     as easily be a committed screenshot is worth nothing — so nothing here
     is baked in. Open the page on any day and the graph is that day's.

     The numbers come from a public mirror of GitHub's own contribution
     calendar. GitHub's official GraphQL endpoint needs a token, and a token
     cannot live in a static page that anyone can read.

     Four decisions worth stating, because each had a simpler alternative
     that was wrong:

       1. Two passes, in this order. An empty 53-week grid is laid out from
          local dates the moment this runs, so the section reaches its final
          height before the request resolves — no skeleton, no shimmer, no
          reflow when the numbers arrive. A graph that resizes the page under
          the reader's thumb is worse than one that takes another 200ms. The
          fetch only ever writes into cells that already exist.

       2. The request asks for this calendar year and the previous one, not
          the mirror's own `y=last` window. `y=last` ends yesterday, so a
          day's commits would not surface until the day after — which defeats
          the point of reading the graph live. Two calendar years always
          cover the 53 weeks on screen, today included.

       3. Levels are computed here, not taken from the response. The mirror
          scales each year against that year's own distribution, so across a
          window that straddles two years the same count lands on different
          levels — a 12-commit day is level 4 in the quieter year and level 2
          in the busier one. One scale, quartiles of the active days in the
          window actually drawn, is the only way the colour means one thing
          from the left edge to the right.

       4. `cache: 'no-store'`, plus a copy of every good payload in
          localStorage. The first is what makes "today's graph" true rather
          than "whatever this browser cached last week". The second is the
          fallback when the mirror is down: the last known year with an
          honest date on it beats an empty rectangle.

     If there is nothing to fall back on either, the empty grid stays put and
     .gh__note offers the one thing still worth offering: the link. */

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

    /* Local field-by-field, never toISOString(): east of UTC that would
       shift every key back a day and paint the whole year off by one. */
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

    /* Columns are Sunday-to-Saturday weeks and the last one holds today,
       which is the alignment GitHub itself uses — the shape has to be
       familiar or the reader has to work out what they are looking at. */
    var start = new Date(today);
    start.setDate(start.getDate() - today.getDay() - (COLS - 1) * 7);

    /* The week count the stylesheet lays out against: the grid and the month
       strip are both repeat(var(--gh-cols), …), which is what lets the cells
       stretch to fill the panel instead of stopping short of its right edge.
       Declared in CSS as well, and written here so the two cannot drift. */
    root.style.setProperty('--gh-cols', String(COLS));

    var cells = {};   /* date key → cell node        */
    var order = [];   /* date keys, first day → today */

    for (var c = 0; c < COLS; c++) {
      for (var r = 0; r < 7; r++) {
        var d = new Date(start);
        d.setDate(start.getDate() + c * 7 + r);

        var cell = el('div', 'gh__c');
        cell.setAttribute('data-l', '0');

        /* Week index drives the column-by-column wipe in §18 */
        cell.style.setProperty('--w', String(c));

        /* Days that have not happened yet keep the final column square
           without posing as days on which nothing was committed. */
        if (d > today) {
          cell.setAttribute('data-void', '');
        } else {
          var k = key(d);
          cells[k] = cell;
          /* The loop runs column-major — week by week, day down each week —
             so pushing here is already chronological. */
          order.push(k);
        }

        grid.appendChild(cell);
      }
    }

    /* Month strip. Each label is placed on the column its month opens in and
       spanned across the columns it owns, so it sits over its own weeks
       instead of being nudged there by hand. A month holding fewer than
       three columns is dropped — that is what stops "Aug Sep" colliding at
       the two ends, where the year is cut mid-month. */
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

    /* The label the markup ships with says "loading", which stops being true
       the moment the request settles. Left alone, a screen reader would
       announce a graph as still loading forever, so the state is corrected
       in the one place that knows the request is over. */
    function fail() {
      root.dataset.state = 'error';
      grid.setAttribute('aria-label',
        'Contribution graph unavailable — see the link below');
    }

    /* Quartiles of the active days in the window. The thresholds are forced
       to climb: a distribution with heavy ties — half the active days at one
       commit, say — would otherwise land two levels on the same count and
       throw away a step of the scale. */
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

    /* days      [{ date, count }] — any order, any span. Only the dates that
                                     fall inside the drawn window are used.
       syncedOn  'YYYY-MM-DD'      — the day this payload was read
       fresh     boolean           — false when it came back from storage  */
    function paint(days, syncedOn, fresh) {
      var byDate = {};
      (days || []).forEach(function (day) {
        if (day && day.date != null) byDate[day.date] = +day.count || 0;
      });

      /* Aligned to `order` so the totals, the streak walk and the cells all
         read off one array. null means no data for that day, which is not
         the same fact as zero and must not be drawn as one. */
      var counts = order.map(function (k) {
        return Object.prototype.hasOwnProperty.call(byDate, k) ? byDate[k] : null;
      });

      var t = scale(counts);
      var sum = 0, drawn = 0, run = 0, longest = 0, best = null;

      order.forEach(function (k, i) {
        var n = counts[i];
        var cell = cells[k];

        if (n === null) { cell.setAttribute('data-void', ''); return; }

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

      /* Counted backwards from the most recent day. A zero on the FINAL day
         does not end the streak — the day is not over — but a zero on any
         earlier one does. */
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
      /* "45 on 5 Jun", not "45 5 Jun" — the figure and the date are two
         different numbers sitting next to each other, and the preposition is
         cheaper than making the reader work out which is which. */
      stat('best', best ? best.n : 0, best ? 'on ' + short(parse(best.on)) : null);

      var range = $('[data-gh="range"]', root);
      if (range) {
        range.textContent =
          MON[first.getMonth()] + ' ' + first.getFullYear() + ' — ' +
          MON[last.getMonth()] + ' ' + last.getFullYear();
      }

      /* States out loud what the panel is claiming: read live, on this date.
         A graph quietly going stale is the failure this whole section exists
         to avoid, so the day it was read is part of what it shows. */
      var sync = $('[data-gh="sync"]', root);
      if (sync) {
        sync.textContent =
          (fresh ? 'Synced ' : 'Last synced ') + full(parse(syncedOn));
      }

      /* The grid is role="img", so this label is the whole graph as far as a
         screen reader is concerned. It has to say what the picture says. */
      grid.setAttribute('aria-label',
        sum + ' contributions between ' + full(first) + ' and ' + full(last));

      root.dataset.state = fresh ? 'ready' : 'stale';

      if (finePointer) tooltip();

      if (fresh) keep(counts);
    }

    /* Kept as the window's own counts and the day it opens on — 366 integers
       rather than the two calendar years the request returns, because the
       window is all the fallback ever has to redraw. */
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

      /* Re-dated from the day it opens on, so a payload kept last week still
         lands on the right cells of this week's window — the days that have
         since rolled off the left edge simply find no cell waiting. */
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

    /* One node, moved and rewritten on hover. 365 title attributes would be
       365 sluggish native tooltips, and a node per cell is 365 nodes for a
       hover state — so this is delegated, and it is skipped entirely on
       touch, where there is no hover to serve. */
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

        /* Measured after the text is in, and clamped to the viewport so a
           cell in the first or last week cannot push it off screen. */
        var box = cell.getBoundingClientRect();
        var w = tip.offsetWidth;
        var h = tip.offsetHeight;

        tip.style.left = clamp(
          box.left + box.width / 2 - w / 2, 8, window.innerWidth - w - 8) + 'px';

        /* Above the cell by default; below it when the board is near the top
           of the viewport and there is no room up there. */
        var above = box.top - h - 8;
        tip.style.top = (above < 8 ? box.bottom + 8 : above) + 'px';
      });

      /* mouseleave, not mouseout: mouseout fires on every cell-to-cell move
         inside the grid, so the tooltip would be told to hide 365 times on
         the way across a year it never actually left. */
      grid.addEventListener('mouseleave', hide);

      /* position: fixed, so a page scroll would otherwise leave it hanging
         in mid-air over nothing. Captured rather than bubbling, so it hears a
         scroll from any container that may come to sit between the grid and
         the document, not just from the document itself. */
      window.addEventListener('scroll', hide, true);
    }

    /* This calendar year and the one before it: between them they always
       cover the 53 weeks on screen, whatever day of the year it is. */
    function url() {
      var y = today.getFullYear();
      return API + encodeURIComponent(user) + '?y=' + y + '&y=' + (y - 1);
    }

    function fallback() {
      var kept = recall();
      if (!kept) { fail(); return; }
      paint(kept.days, kept.on, false);
    }

    if (!window.fetch) { fallback(); return; }

    /* Two attempts, then the cache. This reads from a free community mirror of
       GitHub's API, and a mirror refuses requests: one unlucky response on load
       would otherwise leave a visitor looking at last week's squares for the
       whole visit, which is the single thing a graph claiming to be today's
       must not do. A second try 900ms later costs nothing when the first one
       works, and recovers the ordinary transient failure when it does not.

       Note where the catch sits: before the paint, not after it. An exception
       thrown while drawing is a bug in this file, not a stale network, and
       wrapping the paint in the same catch would file it as "Last synced" on
       data that had in fact arrived perfectly — the graph would look a week old
       and the console would stay silent. Left to reject, it surfaces. */
    function load(attempt) {
      fetch(url(), { cache: 'no-store' })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          return res.json();
        })
        .then(function (data) {
          var days = data && data.contributions;
          if (!days || !days.length) throw new Error('empty payload');
          return days;
        })
        .catch(function () {
          if (attempt < 2) window.setTimeout(function () { load(attempt + 1); }, 900);
          else fallback();
          return null;
        })
        .then(function (days) {
          if (days) paint(days, key(today), true);
        });
    }

    load(1);
  })();

})();


