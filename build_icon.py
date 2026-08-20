#!/usr/bin/env python3
"""Generate a 1990s green-phosphor CRT terminal app icon (1024x1024 PNG)."""
import os

from PIL import Image, ImageDraw, ImageFilter

S = 1024
img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

PHOS = (70, 255, 130)        # phosphor green
PHOS_DIM = (40, 170, 80)     # dim grid green
SCREEN_BG = (4, 22, 10)      # near-black green
CASE = (24, 27, 25)          # charcoal case
CASE_HI = (74, 82, 76)       # highlight edge
CASE_LO = (12, 14, 13)       # shadow edge

# ---- green glow layer (screen emits light) ----
glow = Image.new("RGBA", (S, S), (0, 0, 0, 0))
gd = ImageDraw.Draw(glow)
gd.rounded_rectangle([108, 138, 916, 764], radius=72, fill=(40, 255, 110, 120))
glow = glow.filter(ImageFilter.GaussianBlur(72))

# ---- stand / base ----
draw.rounded_rectangle([452, 818, 572, 904], radius=18, fill=CASE)
draw.rounded_rectangle([452, 818, 572, 904], radius=18, outline=CASE_LO, width=4)
draw.rounded_rectangle([360, 892, 664, 944], radius=28, fill=CASE)
draw.rounded_rectangle([360, 892, 664, 944], radius=28, outline=CASE_LO, width=4)

# ---- case (monitor body) ----
draw.rounded_rectangle([60, 64, 964, 856], radius=96, fill=CASE)
draw.rounded_rectangle([60, 64, 964, 856], radius=96, outline=CASE_HI, width=5)
draw.line([126, 92, 898, 92], fill=CASE_HI, width=3)  # top sheen

# ---- screen bezel + screen ----
draw.rounded_rectangle([102, 130, 922, 772], radius=66, fill=(8, 10, 8))
sx0, sy0, sx1, sy1 = 124, 150, 900, 752
draw.rounded_rectangle([sx0, sy0, sx1, sy1], radius=52, fill=SCREEN_BG)

# ---- screen content (clipped) ----
screen = Image.new("RGBA", (S, S), (0, 0, 0, 0))
sd = ImageDraw.Draw(screen)

# dot-matrix grid
step = 22
for x in range(sx0 + 12, sx1 - 8, step):
    sd.line([x, sy0 + 10, x, sy1 - 10], fill=(*PHOS_DIM, 26), width=1)
for y in range(sy0 + 12, sy1 - 8, step):
    sd.line([sx0 + 10, y, sx1 - 10, y], fill=(*PHOS_DIM, 22), width=1)

# simulated text rows
ty = 250
for w in (560, 430, 500, 360):
    sd.rounded_rectangle([180, ty, 180 + w, ty + 22], radius=6,
                         fill=(*PHOS, 205))
    ty += 64

# prompt ">" + blinking cursor on a fresh line
py = ty + 8
sd.line([182, py, 182, py + 44], fill=PHOS, width=12)          # stem
sd.line([182, py, 226, py + 22], fill=PHOS, width=12)          # upper arm
sd.line([182, py + 44, 226, py + 22], fill=PHOS, width=12)     # lower arm
sd.rectangle([244, py, 288, py + 44], fill=(160, 255, 185, 255))  # cursor block

img = Image.alpha_composite(img, screen)
img = Image.alpha_composite(img, glow)   # glow on top

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "AppIcon_1024.png")
img.save(OUT)
print("wrote", OUT)
