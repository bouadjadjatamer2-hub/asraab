"""Renders the Tayyar app icon and every size the app, installer and extension need.

Run from the repository root:  python scripts/make-icons.py
"""

from __future__ import annotations

import math
import os
from PIL import Image, ImageDraw, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SS = 4  # supersampling factor
SIZE = 1024
S = SIZE * SS

VIOLET = (139, 92, 246)
CYAN = (34, 211, 238)


def lerp(a: float, b: float, t: float) -> float:
    return a + (b - a) * t


def gradient(size: int, start: tuple[int, int, int], end: tuple[int, int, int]) -> Image.Image:
    """Diagonal gradient, 45 degrees."""
    img = Image.new("RGB", (size, size))
    px = img.load()
    for y in range(size):
        for x in range(size):
            t = (x / size + y / size) / 2
            px[x, y] = (
                int(lerp(start[0], end[0], t)),
                int(lerp(start[1], end[1], t)),
                int(lerp(start[2], end[2], t)),
            )
    return img


def rounded_mask(size: int, radius: int) -> Image.Image:
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size - 1, size - 1), radius=radius, fill=255)
    return mask


def build() -> Image.Image:
    # Background: a deep, slightly blue surface with a soft top-light.
    bg = Image.new("RGB", (S, S), (13, 15, 21))
    px = bg.load()
    for y in range(S):
        t = y / S
        for x in range(S):
            d = math.dist((x, y), (S * 0.28, S * 0.12)) / (S * 1.05)
            glow = max(0.0, 1.0 - d) ** 3
            base = (
                int(lerp(26, 11, t) + glow * 16),
                int(lerp(28, 13, t) + glow * 12),
                int(lerp(38, 19, t) + glow * 30),
            )
            px[x, y] = base

    canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    canvas.paste(bg, (0, 0), rounded_mask(S, int(S * 0.225)))

    # Hairline inner highlight along the top edge.
    highlight = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    hd = ImageDraw.Draw(highlight)
    hd.rounded_rectangle(
        (2 * SS, 2 * SS, S - 2 * SS, S - 2 * SS),
        radius=int(S * 0.22),
        outline=(255, 255, 255, 34),
        width=int(1.6 * SS),
    )
    canvas = Image.alpha_composite(canvas, highlight)

    # The glyph: a download arrow whose shaft is split into two streams that merge.
    glyph_mask = Image.new("L", (S, S), 0)
    gd = ImageDraw.Draw(glyph_mask)

    cx = S / 2
    stem_top = S * 0.235
    stem_bottom = S * 0.560
    lane = S * 0.062
    gap = S * 0.024
    head_top = S * 0.520
    head_half = S * 0.238
    head_tip = S * 0.800

    # Two lanes, one per connection, feeding a single arrow: the product in one glyph.
    for side in (-1, 1):
        left = cx + side * gap / 2 if side > 0 else cx - gap / 2 - lane
        gd.rounded_rectangle(
            (left, stem_top, left + lane, stem_bottom),
            radius=lane * 0.48,
            fill=255,
        )

    # The head: a solid triangle, its corners rounded by a blur/threshold pass below.
    gd.polygon(
        [(cx - head_half, head_top), (cx + head_half, head_top), (cx, head_tip)],
        fill=255,
    )

    # Base bar: the file landing.
    bar_w = S * 0.30
    bar_h = S * 0.040
    bar_y = S * 0.852
    gd.rounded_rectangle(
        (cx - bar_w / 2, bar_y, cx + bar_w / 2, bar_y + bar_h),
        radius=bar_h / 2,
        fill=255,
    )

    # Round every corner of the mark the same way, then restore a clean edge.
    glyph_mask = glyph_mask.filter(ImageFilter.GaussianBlur(S * 0.007))
    glyph_mask = glyph_mask.point(lambda v: 255 if v > 120 else 0)
    glyph_mask = glyph_mask.filter(ImageFilter.GaussianBlur(S * 0.0016))

    grad = gradient(S, VIOLET, CYAN).convert("RGBA")
    grad.putalpha(glyph_mask)
    canvas = Image.alpha_composite(canvas, grad)

    # A soft bloom under the arrow, so it sits in the surface instead of on it.
    bloom_src = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    bloom_src.putalpha(glyph_mask.filter(ImageFilter.GaussianBlur(S * 0.03)))
    bloom = Image.new("RGBA", (S, S), (120, 110, 255, 60))
    bloom.putalpha(bloom_src.getchannel("A").point(lambda v: int(v * 0.45)))
    canvas = Image.alpha_composite(
        Image.alpha_composite(canvas, bloom), Image.new("RGBA", (S, S), (0, 0, 0, 0))
    )

    return canvas.resize((SIZE, SIZE), Image.LANCZOS)


def main() -> None:
    icon = build()

    build_dir = os.path.join(ROOT, "build")
    res_dir = os.path.join(ROOT, "resources")
    ext_icons = os.path.join(ROOT, "extension", "icons")
    for d in (build_dir, res_dir, ext_icons):
        os.makedirs(d, exist_ok=True)

    icon.save(os.path.join(build_dir, "icon.png"))
    icon.save(os.path.join(res_dir, "icon-dark.png"))
    icon.save(
        os.path.join(build_dir, "icon.ico"),
        sizes=[(16, 16), (24, 24), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)],
    )

    for size in (16, 32, 48, 128):
        small = icon.resize((size, size), Image.LANCZOS)
        small.save(os.path.join(ext_icons, f"icon-{size}.png"))
        gray = small.convert("LA").convert("RGBA")
        r, g, b, a = gray.split()
        flat = Image.merge("RGBA", (r.point(lambda v: int(v * 0.55 + 40)),) * 3 + (a.point(lambda v: int(v * 0.75)),))
        flat.save(os.path.join(ext_icons, f"icon-off-{size}.png"))

    print("icons written:", SIZE, "px + ico + extension sizes")


if __name__ == "__main__":
    main()
