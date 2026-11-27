"""Create flattened public screenshots from a separate, private originals folder.

Usage: python tools/redact-school-screenshots.py --source PRIVATE_FOLDER --destination PUBLIC_FOLDER
Requires Pillow. Never point --source at the public destination.
The masks match these reviewed 1917-1919px-wide screenshots, not arbitrary new images.
"""

import argparse
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


PROFILE = (14, 830, 313, 920)


def rows(left, right, first, step, height, end=920):
    return [(left, y, right, min(y + height, end)) for y in range(first, end, step)]


REGIONS = {
    "2025-12-02 122759": [(534, 96, 865, 125)],
    "2025-12-02 122818": [],
    "2025-12-02 160800": rows(424, 1670, 230, 65, 33),
    "2025-12-02 173715": rows(424, 1340, 257, 67, 37),
    "2025-12-02 183613": rows(423, 1740, 228, 73, 55),
    "2025-12-02 191302": [(425, 115, 815, 146)]
    + [(847, y - 19, 1835, y + 20) for y in [278, 344, 414, 483, 549, 615, 681, 747, 813, 879]],
    "2025-12-02 193123": [],
    "2025-12-02 195043": [(1040, 204, 1225, 313)]
    + [(x, y, x + 186, min(y + 111, 920)) for x in [498, 714, 930, 1146, 1362, 1578] for y in [513, 695, 877]],
    "2025-12-02 205400": [],
    "2025-12-02 221927": [],
    "2025-12-02 224458": rows(1135, 1582, 258, 64, 38),
    "2025-12-02 230750": [],
    "2025-12-03 102002": [],
    "2025-12-03 113020": [],
    "2025-12-03 161036": [(534, 96, 865, 125)] + rows(423, 1618, 453, 66, 38),
    "2025-12-03 161720": rows(423, 1618, 155, 66, 38, 790),
    "2025-12-03 164617": rows(423, 1515, 230, 65, 35),
    "2025-12-04 130721": [],
    "2025-12-04 133352": [
        (458, 233, 1807, 262),
        (458, 334, 1807, 365),
        (805, 437, 1108, 465),
        (805, 665, 1807, 697),
        (458, 893, 1807, 920),
    ],
    "2025-12-04 143323": [
        (485, 194, 830, 233),
        (672, 337, 875, 709),
        (950, 274, 1833, 304),
        (950, 366, 1833, 397),
        (990, 691, 1833, 731),
    ],
    "2025-12-04 144704": rows(423, 1740, 228, 73, 55),
    "2025-12-04 150035": [(425, 115, 815, 146)]
    + [(847, y - 19, 1835, y + 20) for y in [279, 345, 415, 484, 550, 616, 682, 748, 814, 880]],
}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source", type=Path, required=True)
    parser.add_argument("--destination", type=Path, required=True)
    args = parser.parse_args()
    source = args.source.resolve(strict=True)
    destination = args.destination.resolve()
    if source == destination or source.is_relative_to(destination) or destination.is_relative_to(source):
        parser.error("Originals and public images must be in separate directory trees.")
    files = sorted(source.glob("Screenshot*.png"))
    expected = {f"Screenshot {stamp}.png" for stamp in REGIONS}
    if {file.name for file in files} != expected:
        parser.error("Screenshot set changed; review and update the masks first.")
    for file in files:
        with Image.open(file) as original:
            if original.width not in (1917, 1919) or not 900 <= original.height <= 920:
                parser.error(f"Unexpected screenshot dimensions: {file.name}")
    destination.mkdir(parents=True, exist_ok=True)
    font_path = Path("C:/Windows/Fonts/arial.ttf")
    font = ImageFont.truetype(str(font_path), 16) if font_path.exists() else ImageFont.load_default()
    for file in files:
        with Image.open(file) as original:
            # A fresh RGB image strips source metadata, alpha, and any hidden layers.
            image = Image.new("RGB", original.size)
            image.paste(original.convert("RGB"))
        draw = ImageDraw.Draw(image)
        for x0, y0, x1, y1 in [PROFILE, *REGIONS[file.stem.removeprefix("Screenshot ")]]:
            if y0 >= image.height:
                continue
            y1 = min(y1, image.height - 1)
            draw.rectangle((x0, y0, x1, y1), fill=(15, 23, 42))
            if y1 - y0 >= 22:
                draw.text(((x0 + x1) / 2, (y0 + y1) / 2), "REDACTED", font=font, fill="white", anchor="mm")
        image.save(destination / file.name, format="PNG", optimize=True)
    print(f"Redacted {len(files)} screenshots. Original source files were not modified.")


if __name__ == "__main__":
    main()
