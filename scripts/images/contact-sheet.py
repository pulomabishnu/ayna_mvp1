"""Render a labelled contact sheet of processed product images (white tiles on grey).
Usage: python3 scripts/images/contact-sheet.py public/products/catalog out.png"""
import sys, os
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
files = sorted(f for f in os.listdir(src) if f.endswith('.webp'))
T, C = 150, 8
rows = (len(files) + C - 1) // C
sheet = Image.new('RGB', (C * (T + 6) + 6, rows * (T + 20) + 6), (110, 110, 120))
d = ImageDraw.Draw(sheet)
for i, f in enumerate(files):
    im = Image.open(os.path.join(src, f)).convert('RGB').resize((T, T))
    x, y = 6 + (i % C) * (T + 6), 6 + (i // C) * (T + 20)
    sheet.paste(im, (x, y))
    d.text((x, y + T + 2), f[2:-5][:24], fill=(255, 255, 255))
sheet.save(out)
print(len(files), sheet.size)
