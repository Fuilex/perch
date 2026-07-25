"""
Generate Tauri app icons from a base SVG.
Requires: pip install Pillow cairosvg
If cairosvg unavailable, falls back to solid colored squares.
"""
import os
import sys
import struct
import zlib
from pathlib import Path

ICONS_DIR = Path(__file__).parent.parent / "src-tauri" / "icons"
ICONS_DIR.mkdir(parents=True, exist_ok=True)

# Simple PNG generator without dependencies
def make_png(width: int, height: int, bg: tuple[int,int,int,int] = (10, 10, 11, 255)) -> bytes:
    """Create a minimal RGBA PNG."""
    def chunk(name: bytes, data: bytes) -> bytes:
        c = struct.pack(">I", len(data)) + name + data
        return c + struct.pack(">I", zlib.crc32(name + data) & 0xFFFFFFFF)

    # Create pixel data - solid dark background with white perch-bird shape
    pixels = []
    for y in range(height):
        row = []
        for x in range(width):
            cx, cy = x / width, y / height
            # Background
            r, g, b, a = bg

            # Draw a simple geometric bird/perch shape (circle + line)
            # Main circle (head)
            head_cx, head_cy = 0.65, 0.28
            head_r = 0.12
            dist_head = ((cx - head_cx)**2 + (cy - head_cy)**2) ** 0.5

            # Body arc (breast)
            body_cx, body_cy = 0.55, 0.52
            body_r = 0.22
            dist_body = ((cx - body_cx)**2 + (cy - body_cy)**2) ** 0.5

            # Tail
            tail = (cx < 0.28 and cy > 0.40 and cy < 0.65 and
                    cx > 0.12 and cy > (0.80 - cx * 1.2))

            # Perch/branch (horizontal line)
            branch = (cy > 0.69 and cy < 0.74 and cx > 0.10 and cx < 0.88)

            # Feet
            foot1 = (cx > 0.44 and cx < 0.47 and cy > 0.73 and cy < 0.82)
            foot2 = (cx > 0.58 and cx < 0.61 and cy > 0.73 and cy < 0.82)

            is_bird = (
                (dist_head < head_r and cy < head_cy + head_r * 0.8) or
                (dist_body < body_r and cy > body_cy - body_r * 0.6 and cy < 0.70) or
                tail or branch or foot1 or foot2
            )

            if is_bird:
                r, g, b, a = 245, 245, 247, 255
            else:
                # Subtle gradient
                r = int(10 + cy * 6)
                g = int(10 + cy * 6)
                b = int(11 + cy * 7)
                a = 255

            row.extend([r, g, b, a])
        filter_type = b'\x00'
        row_bytes = bytes(row)
        pixels.append(filter_type + row_bytes)

    raw = b''.join(pixels)
    compressed = zlib.compress(raw, 9)

    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack(">IIBBBBB", width, height, 8, 6, 0, 0, 0)
    ihdr = chunk(b'IHDR', ihdr_data)
    idat = chunk(b'IDAT', compressed)
    iend = chunk(b'IEND', b'')

    return sig + ihdr + idat + iend


def make_ico(png_data_32: bytes) -> bytes:
    """Wrap a 32x32 PNG inside an .ico file (Vista+ format)."""
    num_images = 1
    header = struct.pack("<HHH", 0, 1, num_images)  # reserved, type=1 (ICO), count
    offset = 6 + num_images * 16
    entry = struct.pack("<BBBBHHII",
        0, 0, 0, 0,  # width=0(256), height=0(256), colors, reserved
        1,  # planes
        32,  # bit count
        len(png_data_32),
        offset)
    return header + entry + png_data_32


sizes = [32, 128, 256]
png_cache = {}

print(f"Generating icons in {ICONS_DIR}")
for size in sizes:
    data = make_png(size, size)
    png_cache[size] = data
    if size == 128:
        p = ICONS_DIR / "128x128.png"
        p.write_bytes(data)
        print(f"  {p.name}")
        p2 = ICONS_DIR / "128x128@2x.png"
        p2.write_bytes(make_png(256, 256))
        print(f"  {p2.name}")
    elif size == 32:
        p = ICONS_DIR / "32x32.png"
        p.write_bytes(data)
        print(f"  {p.name}")

# icon.png (256x256)
icon_png = make_png(256, 256)
(ICONS_DIR / "icon.png").write_bytes(icon_png)
print("  icon.png")

# icon.ico
ico = make_ico(icon_png)
(ICONS_DIR / "icon.ico").write_bytes(ico)
print("  icon.ico")

# icon.icns — minimal valid icns with ic08 (256x256 PNG)
icns_type = b'ic08'
entry = icns_type + struct.pack(">I", 8 + len(icon_png)) + icon_png
header = b'icns' + struct.pack(">I", 8 + len(entry))
(ICONS_DIR / "icon.icns").write_bytes(header + entry)
print("  icon.icns")

print("Done!")
