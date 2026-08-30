#!/usr/bin/env python3
"""
Write the ROBLOX_WEAPONRY_SET_01 texture set from palette.SWATCHES.

Outputs into ../textures/ :
    atlas_color_1024.png       sRGB, the only map Roblox needs for a plain MeshPart
    atlas_metalness_1024.png   greyscale, for SurfaceAppearance.MetalnessMap
    atlas_roughness_1024.png   greyscale, for SurfaceAppearance.RoughnessMap
    atlas_emissive_1024.png    greyscale, NOT a Roblox map -- drives glow in the
                               Blender renders only (see SPEC.md 'In-engine glow')
    atlas_key.png              labelled reference sheet, for humans

Deterministic: fixed seeds, no wall-clock or random state leaks. Re-running it
byte-for-byte reproduces the same maps.
"""
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import palette as PAL  # noqa: E402

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "textures")
N = PAL.CELL_PX


def u_modulation(pattern, seed):
    """Per-column multiplier, length N, mean ~1.0. This is the 's' axis."""
    rng = np.random.default_rng(seed)
    u = (np.arange(N) + 0.5) / N
    if pattern == "grain":
        m = np.ones(N)
        for freq, amp in ((5.0, 0.045), (11.0, 0.022), (23.0, 0.012)):
            m += amp * np.sin(2 * np.pi * freq * u + rng.uniform(0, 6.283))
        m += rng.normal(0.0, 0.008, N)
    elif pattern == "band":
        m = 1.0 + 0.085 * np.sin(2 * np.pi * 6.5 * u + 0.4) \
                + 0.025 * np.sin(2 * np.pi * 13.0 * u)
    elif pattern == "brush":
        m = 1.0 + rng.normal(0.0, 0.016, N)
        m = np.convolve(m, np.ones(3) / 3.0, mode="same")
        m[0], m[-1] = m[1], m[-2]
    elif pattern == "gem":
        m = 1.0 + 0.018 * np.sin(2 * np.pi * 3.0 * u)
    else:  # 'grad', 'flat'
        m = np.ones(N)
    return m


def v_ramp(pattern):
    """Per-row 0..1 ramp, length N. This is the 't' axis (0 shade, 1 lit)."""
    v = (np.arange(N) + 0.5) / N
    if pattern == "flat":
        return np.full(N, 0.55)
    r = v ** 0.85
    if pattern == "gem":
        # deep core, narrow facet catch high up: reads as a cut stone, not plastic
        r = 0.06 + 0.52 * r
        r += 0.30 * np.exp(-((v - 0.845) ** 2) / 0.0016)
        r += 0.07 * np.exp(-((v - 0.34) ** 2) / 0.012)
    return np.clip(r, 0.0, 1.35)


def build():
    os.makedirs(OUT, exist_ok=True)
    col = np.zeros((PAL.ATLAS_PX, PAL.ATLAS_PX, 3), np.float64)
    met = np.zeros((PAL.ATLAS_PX, PAL.ATLAS_PX), np.float64)
    rgh = np.zeros((PAL.ATLAS_PX, PAL.ATLAS_PX), np.float64)
    emi = np.zeros((PAL.ATLAS_PX, PAL.ATLAS_PX), np.float64)

    for idx, (name, hx, shade, tint, pattern, m_val, r_val, e_val) in enumerate(PAL.SWATCHES):
        base = np.array(PAL.hex_rgb(hx))
        dark = base * (1.0 - shade)
        lit = base + (np.minimum(base + (1.0 - base) * 0.75, 1.0) - base) * (tint / 0.45)
        lit = np.clip(lit, 0.0, 1.0)

        ramp = v_ramp(pattern)[:, None]                  # (N,1)
        mod = u_modulation(pattern, 1000 + idx)[None, :]  # (1,N)

        cell = dark[None, None, :] + (lit - dark)[None, None, :] * ramp[:, :, None]
        cell = cell * mod[:, :, None]
        cell = np.clip(cell, 0.0, 1.0)

        r_cell = np.clip(r_val + (mod - 1.0) * 1.6, 0.02, 1.0) * np.ones((N, 1))
        m_cell = np.full((N, N), m_val)
        e_cell = np.full((N, N), e_val)
        if e_val > 0.0:
            e_cell = e_cell * np.clip(0.55 + 0.45 * ramp, 0, 1)

        x0, y0, x1, y1 = PAL.cell_px_box(idx)
        col[y0:y1, x0:x1, :] = cell
        met[y0:y1, x0:x1] = m_cell
        rgh[y0:y1, x0:x1] = r_cell
        emi[y0:y1, x0:x1] = e_cell

    def save_rgb(arr, fname):
        img = Image.fromarray(np.flipud((arr * 255.0 + 0.5).astype(np.uint8)), "RGB")
        p = os.path.join(OUT, fname)
        img.save(p, optimize=True)
        return p

    def save_grey(arr, fname):
        img = Image.fromarray(np.flipud((arr * 255.0 + 0.5).astype(np.uint8)), "L")
        p = os.path.join(OUT, fname)
        img.save(p, optimize=True)
        return p

    made = [
        save_rgb(col, "atlas_color_1024.png"),
        save_grey(met, "atlas_metalness_1024.png"),
        save_grey(rgh, "atlas_roughness_1024.png"),
        save_grey(emi, "atlas_emissive_1024.png"),
    ]
    made.append(save_key(col))
    return made


def save_key(col):
    """Labelled sheet so a human can see which swatch is which."""
    pad, header, cell, gut = 30, 92, 116, 38
    rows = (len(PAL.SWATCHES) + PAL.GRID - 1) // PAL.GRID
    w = PAL.GRID * cell + pad * 2
    h = header + rows * (cell + gut) + pad
    sheet = Image.new("RGB", (w, h), (24, 25, 28))
    d = ImageDraw.Draw(sheet)

    def font(sz, bold=False):
        base = "/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else "")
        try:
            return ImageFont.truetype(base, sz)
        except OSError:
            return ImageFont.load_default()

    d.text((pad, 24), "ROBLOX_WEAPONRY_SET_01", font=font(26, True), fill=(238, 240, 244))
    d.text((pad, 55), "atlas_color_1024.png  ·  8 x 8 grid of 128 px swatches  ·  "
                      "vertical ramp = shading  ·  %d of 64 slots used"
           % len(PAL.SWATCHES), font=font(13), fill=(150, 156, 166))
    d.text((pad, 72), "one texture and one material for all eight weapons",
           font=font(13), fill=(150, 156, 166))

    src = Image.fromarray(np.flipud((col * 255.0 + 0.5).astype(np.uint8)), "RGB")
    for idx, sw in enumerate(PAL.SWATCHES):
        cx, cy = idx % PAL.GRID, idx // PAL.GRID
        x0, y0, x1, y1 = PAL.cell_px_box(idx)
        crop = src.crop((x0, PAL.ATLAS_PX - y1, x1, PAL.ATLAS_PX - y0))
        crop = crop.resize((cell - 10, cell - 10), Image.LANCZOS)
        px, py = pad + cx * cell, header + cy * (cell + gut)
        sheet.paste(crop, (px, py))
        d.rectangle([px - 1, py - 1, px + cell - 10, py + cell - 10], outline=(62, 65, 72))
        d.text((px, py + cell - 4), "%02d" % idx, font=font(11, True), fill=(224, 228, 234))
        d.text((px + 20, py + cell - 4), sw[0], font=font(10), fill=(186, 192, 202))
        d.text((px, py + cell + 11), "metal %.2f   rough %.2f" % (sw[5], sw[6]),
               font=font(9), fill=(120, 126, 136))
        d.text((px, py + cell + 23), sw[4], font=font(9), fill=(120, 126, 136))

    p = os.path.join(OUT, "atlas_key.png")
    sheet.save(p, optimize=True)
    return p


if __name__ == "__main__":
    for p in build():
        print("wrote", p, os.path.getsize(p), "bytes")
