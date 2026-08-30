"""
sheet_kit.py -- typography and layout primitives for the client-facing sheets.

Runs in plain CPython with Pillow, NOT inside Blender (Blender ships no PIL).
The split is described in build/render_rig.py: Blender shoots every pass on a
transparent film, and everything with a letterform in it happens here. That way
a layout change costs a second of compositing instead of a re-render, and the
renders themselves stay reusable if a client asks for the same set on a light
background.

TYPE SYSTEM
-----------
Four families, each with exactly one job, so the reader can tell at a glance
which kind of information they are looking at:

  Lora (variable serif)  -- the fiction: sheet titles and weapon names.
  Poppins Medium         -- micro-labels only, uppercase and letterspaced.
  Lato                   -- running text, captions, notes.
  DejaVu Sans Mono       -- every number, filename and measured value.

The division is the point. Mono means "this is a measured fact"; serif means
"this is a name someone made up". A reader skimming for tri counts can find
them without reading a word.
"""
import numpy as np
from PIL import Image, ImageDraw, ImageFont

# ---------------------------------------------------------------------------
# palette
# ---------------------------------------------------------------------------
# Accents are lifted from the asset's OWN swatch table (build/palette.py) rather
# than picked fresh: CYAN is RUNE_CYAN, AMBER is GEM_AMBER opened up for legibility
# on a dark ground, and the three rarity colours are STEEL_COLD / a blue in the
# CLOTH_BLUE family / GOLD_RICH. A sheet trimmed in colours the model does not
# contain looks like it was made for a different product.
BG_TOP = (20, 24, 31)
BG_BOT = (13, 16, 21)
PANEL = (26, 30, 38)
PANEL_2 = (31, 36, 45)
EDGE = (44, 51, 63)
RULE = (38, 44, 55)
INK = (232, 236, 242)
INK_2 = (154, 164, 178)
INK_3 = (104, 114, 128)
CYAN = (100, 231, 227)
AMBER = (232, 163, 61)
RARITY = {"Common": (155, 167, 181),
          "Rare": (91, 147, 224),
          "Legendary": (231, 194, 91)}

GF = "/usr/share/fonts/truetype/google-fonts/"
LATO = "/usr/share/fonts/truetype/lato/"
MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono"

_CACHE = {}


def font(kind, size, weight=None):
    """Cached font loader. `kind` is one of the four families above.

    Lora ships only as a variable font here, so weight is applied through the
    Weight axis (400..700) instead of by picking a static file.
    """
    key = (kind, size, weight)
    if key in _CACHE:
        return _CACHE[key]
    if kind == "serif":
        f = ImageFont.truetype(GF + "Lora-Variable.ttf", size)
        f.set_variation_by_axes([float(weight or 400)])
    elif kind == "label":
        f = ImageFont.truetype(GF + "Poppins-Medium.ttf", size)
    elif kind == "body":
        nm = {None: "Regular", 400: "Regular", 600: "Semibold",
              700: "Bold", 900: "Black", 300: "Light"}[weight]
        f = ImageFont.truetype(LATO + "Lato-%s.ttf" % nm, size)
    elif kind == "mono":
        f = ImageFont.truetype(MONO + ("-Bold.ttf" if weight and weight >= 600
                                       else ".ttf"), size)
    else:
        raise ValueError(kind)
    _CACHE[key] = f
    return f


# ---------------------------------------------------------------------------
# text
# ---------------------------------------------------------------------------
def tw(s, f, track=0.0):
    """Width of `s` in `f` including letterspacing."""
    if not s:
        return 0.0
    return f.getlength(s) + track * (len(s) - 1)


def text(d, xy, s, f, fill, anchor="la", track=0.0):
    """Draw `s`, optionally letterspaced.

    Pillow has no tracking, so a tracked string is drawn one glyph at a time and
    the anchor is resolved by hand. Worth the trouble: the uppercase micro-labels
    that carry this layout are unreadable set solid at 15px.
    """
    x, y = xy
    if not track:
        d.text((x, y), s, font=f, fill=fill, anchor=anchor)
        return tw(s, f)
    w = tw(s, f, track)
    if anchor[0] == "m":
        x -= w * 0.5
    elif anchor[0] == "r":
        x -= w
    for ch in s:
        d.text((x, y), ch, font=f, fill=fill, anchor="l" + anchor[1])
        x += f.getlength(ch) + track
    return w


def wrap(s, f, max_w, track=0.0):
    """Greedy word wrap. Returns a list of lines."""
    out, cur = [], ""
    for word in s.split():
        cand = (cur + " " + word).strip()
        if tw(cand, f, track) <= max_w or not cur:
            cur = cand
        else:
            out.append(cur)
            cur = word
    if cur:
        out.append(cur)
    return out


def para(d, xy, s, f, fill, max_w, lh, track=0.0, anchor="la"):
    """Wrapped paragraph. Returns the y below the last line."""
    x, y = xy
    for ln in wrap(s, f, max_w, track):
        text(d, (x, y), ln, f, fill, anchor, track)
        y += lh
    return y


# ---------------------------------------------------------------------------
# boxes and rules
# ---------------------------------------------------------------------------
def panel(d, box, fill=PANEL, edge=EDGE, r=10, w=1):
    d.rounded_rectangle(box, radius=r, fill=fill, outline=edge, width=w)


def rule(d, x0, x1, y, fill=RULE, w=1):
    d.rectangle((x0, y, x1, y + w - 1), fill=fill)


def eyebrow(d, xy, s, fill=CYAN, size=15, track=2.6, tick=True):
    """A small letterspaced uppercase label with an optional leading tick.

    This is the only thing in the system allowed to shout, and it shouts quietly.
    """
    x, y = xy
    if tick:
        d.rectangle((x, y + 3, x + 3, y + 15), fill=fill)
        x += 14
    return text(d, (x, y), s.upper(), font("label", size), fill, "la", track)


def chip(d, xy, s, fill, size=15, pad=(11, 6), anchor="la"):
    """A rarity pill: hairline outline, tinted text, no solid fill.

    Solid pills at this size turn into three coloured blobs that fight the
    renders for attention; an outline reads as a tag.
    """
    f = font("label", size)
    t = 1.9
    w = tw(s.upper(), f, t) + pad[0] * 2
    h = size + pad[1] * 2
    x, y = xy
    if anchor[0] == "r":
        x -= w
    elif anchor[0] == "m":
        x -= w * 0.5
    d.rounded_rectangle((x, y, x + w, y + h), radius=h * 0.5,
                        outline=fill, width=1)
    text(d, (x + pad[0], y + h * 0.5), s.upper(), f, fill, "lm", t)
    return w, h


def note(d, box, title, bodies, accent=AMBER):
    """A callout: accent bar down the left, label, then one or more paragraphs.

    Used for every caveat on every sheet. A spec sheet that hides its own
    limitations in the same grey as the rest of the copy is not being honest,
    it is being quiet -- so the caveats get the loudest colour on the page.
    """
    x0, y0, x1, y1 = box
    d.rounded_rectangle(box, radius=8, fill=(30, 27, 22), outline=(72, 58, 36))
    d.rectangle((x0, y0 + 8, x0 + 3, y1 - 8), fill=accent)
    y = y0 + 17
    eyebrow(d, (x0 + 20, y), title, accent, 14, 2.4, tick=False)
    y += 30
    fb = font("body", 20)
    for b in bodies:
        y = para(d, (x0 + 20, y), b, fb, (198, 190, 176), x1 - x0 - 42, 27)
        y += 9
    return y


def bar(d, box, frac, fill, bg=(38, 44, 55), r=4):
    """A value bar. `bg=None` skips the track.

    The track is only worth drawing when the bar sits on flat ground. Over a
    shaded target band it becomes a second background fighting the first, and the
    band -- which is the thing carrying the meaning -- turns muddy.
    """
    x0, y0, x1, y1 = box
    if bg is not None:
        d.rounded_rectangle(box, radius=r, fill=bg)
    w = (x1 - x0) * max(0.0, min(1.0, frac))
    if w > 2:
        d.rounded_rectangle((x0, y0, x0 + w, y1), radius=r, fill=fill)


def num(v):
    return "{:,}".format(int(v))


# ---------------------------------------------------------------------------
# images
# ---------------------------------------------------------------------------
def load(path, trim=True):
    """Open an RGBA render and optionally crop to its alpha bounding box.

    Trimming matters more than it sounds. Every hero was framed by fit_res with
    a 4-10% margin, so an untrimmed paste centres the *frame* rather than the
    weapon and the pieces sit at visibly different sizes in identical cells.
    """
    im = Image.open(path).convert("RGBA")
    if trim:
        bb = im.getbbox()
        if bb:
            im = im.crop(bb)
    return im


def fit(im, box, align="mm"):
    """Scale `im` to fit inside `box` without cropping. Returns (im, x, y)."""
    x0, y0, x1, y1 = box
    bw, bh = x1 - x0, y1 - y0
    s = min(bw / im.width, bh / im.height)
    w, h = max(1, int(round(im.width * s))), max(1, int(round(im.height * s)))
    im = im.resize((w, h), Image.LANCZOS)
    x = x0 + (bw - w) * (0.5 if align[0] == "m" else (1.0 if align[0] == "r" else 0.0))
    y = y0 + (bh - h) * (0.5 if align[1] == "m" else (1.0 if align[1] == "b" else 0.0))
    return im, int(round(x)), int(round(y))


def place(canvas, im, box, align="mm"):
    sub, x, y = fit(im, box, align)
    canvas.alpha_composite(sub, (x, y))
    return (x, y, x + sub.width, y + sub.height)


# ---------------------------------------------------------------------------
# canvas
# ---------------------------------------------------------------------------
def background(w, h):
    """Vertical gradient, a soft lift behind the masthead, and a corner vignette.

    The grain at the end is not decoration. A 2600px gradient across 7 levels of
    blue bands visibly on any 8-bit display; a little uniform noise dithers it
    away for free.
    """
    g = np.linspace(0.0, 1.0, h)[:, None] * np.ones((1, w))
    xx = np.linspace(0.0, 1.0, w)[None, :] * np.ones((h, 1))
    top = np.array(BG_TOP, dtype=np.float64) / 255.0
    bot = np.array(BG_BOT, dtype=np.float64) / 255.0
    img = top * (1.0 - g)[..., None] + bot * g[..., None]

    r = np.sqrt((xx - 0.5) ** 2 + ((g - 0.20) * 1.45) ** 2)
    lift = np.clip(1.0 - r / 0.92, 0.0, 1.0) ** 2 * 0.055
    img += lift[..., None] * np.array([0.90, 0.97, 1.10])

    rv = np.sqrt((xx - 0.5) ** 2 + (g - 0.5) ** 2)
    img *= (1.0 - np.clip((rv - 0.40) / 0.80, 0.0, 1.0) ** 1.6 * 0.30)[..., None]

    img += (np.random.default_rng(7).random((h, w, 1)) - 0.5) * (1.6 / 255.0)
    return Image.fromarray(np.clip(img * 255.0, 0, 255).astype(np.uint8), "RGB")


class Sheet:
    """A sheet drawn onto a transparent overlay, then cropped to what was used.

    Height is not declared up front. Every sheet here is a stack of blocks whose
    height depends on how much text wrapped, and guessing a canvas height means
    either a band of dead space at the bottom or a clipped footer. So content is
    drawn on a tall overlay with a y cursor, the overlay is cropped to the
    high-water mark, and only then is the background generated at the final size
    and the footer struck at the true bottom.
    """

    def __init__(self, w=2600, marg=84, maxh=7000):
        self.w, self.marg, self.maxh = w, marg, maxh
        self.ov = Image.new("RGBA", (w, maxh), (0, 0, 0, 0))
        self.d = ImageDraw.Draw(self.ov)
        self.y = marg
        self.x0 = marg
        self.x1 = w - marg
        self.cw = self.x1 - self.x0

    # -- masthead ----------------------------------------------------------
    def head(self, kicker, title, sub, stats, n, of=5):
        """Common masthead: kicker, serif title, sub-line, and a stat cluster."""
        d = self.d
        y = self.y
        rule(d, self.x0, self.x1, y, CYAN, 2)
        y += 26
        eyebrow(d, (self.x0, y), kicker, CYAN, 16, 3.0, tick=False)
        text(d, (self.x1, y + 1), "SHEET %d / %d" % (n, of),
             font("mono", 16), INK_3, "ra", 2.0)
        y += 36
        text(d, (self.x0, y), title, font("serif", 58, 700), INK, "la")
        y += 76
        text(d, (self.x0, y), sub, font("body", 25), INK_2, "la")

        # stat cluster, right-aligned, laid out right to left so it always ends
        # flush with the content edge no matter how many pairs are passed in.
        fx = font("mono", 30, 700)
        fl = font("label", 13)
        gap = 46
        widths = [max(tw(v, fx), tw(k.upper(), fl, 2.2)) for k, v in stats]
        total = sum(widths) + gap * (len(stats) - 1)
        x = self.x1 - total
        for (k, v), wd in zip(stats, widths):
            text(d, (x + wd, y - 44), v, fx, INK, "ra")
            text(d, (x + wd, y + 2), k.upper(), fl, INK_3, "ra", 2.2)
            x += wd + gap
        self.y = y + 44
        return self.y

    def block(self, title, sub=None, gap=20, x0=None, x1=None):
        """A section header inside the sheet body.

        `x0`/`x1` narrow it to one column. Without them a block that only owns the
        left half still right-aligns its sub-line to the far margin, where it
        collides with whatever header the right column drew at the same y.
        """
        a = self.x0 if x0 is None else x0
        b = self.x1 if x1 is None else x1
        eyebrow(self.d, (a, self.y), title, CYAN, 15, 2.6)
        if sub:
            text(self.d, (b, self.y + 1), sub, font("body", 19), INK_3, "ra")
        self.y += 24
        rule(self.d, a, b, self.y)
        self.y += gap
        return self.y

    # -- output ------------------------------------------------------------
    def finish(self, path, left, right):
        bb = self.ov.getbbox()
        used = bb[3] if bb else self.y
        h = used + 34 + 26 + self.marg
        bg = background(self.w, h).convert("RGBA")
        bg.alpha_composite(self.ov.crop((0, 0, self.w, h)))
        d = ImageDraw.Draw(bg)

        fy = used + 34
        rule(d, self.x0, self.x1, fy)
        fy += 17
        text(d, (self.x0, fy), left, font("mono", 17), INK_3, "la", 1.0)
        text(d, (self.x1, fy), right, font("body", 19), INK_3, "ra")

        # Crop marks. A technical drawing convention, and here it also stops the
        # eye from treating the vignette as the edge of the artwork.
        m, L = self.marg - 26, 22
        for cx, cy, sx, sy in ((m, m, 1, 1), (self.w - m, m, -1, 1),
                               (m, h - m, 1, -1), (self.w - m, h - m, -1, -1)):
            d.line((cx, cy, cx + L * sx, cy), fill=EDGE, width=1)
            d.line((cx, cy, cx, cy + L * sy), fill=EDGE, width=1)

        bg.convert("RGB").save(path, optimize=True)
        return path, self.w, h
