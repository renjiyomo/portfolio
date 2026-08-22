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

  /* Chip list used for stacks in cards and modals. */
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
    var targets = $$('.rv, .wipe, .head, .mast, .tl__item');
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
  /* Full case study: description, stack, live/code actions, and a carousel
     of every capture for that project.                                     */

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

      /* — Written detail — */
      var copy = el('div', 'det__copy');

      /* A record with no stack is not a build, so it skips deployment
         status entirely. */
      var isProject = !!(rec.stack && rec.stack.length);

      var meta = el('div', 'det__meta');
      if (rec.tag) meta.appendChild(el('span', 'det__tag', rec.tag));
      if (rec.year) meta.appendChild(el('span', 'det__yr', rec.year));
      if (isProject) {
        meta.appendChild(el('span', 'det__yr', rec.live ? 'Deployed' : 'Not deployed'));
      }
      if (meta.childNodes.length) copy.appendChild(meta);

      (rec.body && rec.body.length ? rec.body : [rec.lede]).forEach(function (para) {
        copy.appendChild(el('p', null, para));
      });

      if (rec.stack && rec.stack.length) {
        var sh = el('p', 'det__sub', 'Built with');
        copy.appendChild(sh);
        copy.appendChild(chips(rec.stack, 'chips'));
      }

      wrap.appendChild(copy);

      /* — Footer actions — */
      var actions = el('div', 'det__act');

      if (rec.live) {
        actions.appendChild(extLink(rec.live, 'Visit live site', true));
      } else if (isProject) {
        actions.appendChild(el('span', 'det__none', 'No public deployment'));
      }

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

    var trigger = $('[data-open-stack]');
    if (!trigger || !TECH.length) return;

    trigger.addEventListener('click', function () {
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
    });
  })();


  /* ══ 09 · Project index modal ════════════════════════════ */
  /* Every project in one list, each row opening its detail view. */

  (function indexModal() {
    if (!Modal || !Detail) return;

    var trigger = $('[data-open-projects]');
    if (!trigger) return;

    trigger.addEventListener('click', function () {
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
        row.appendChild(chips(rec.stack.slice(0, 6), 'chips chips--sm'));

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

})();
