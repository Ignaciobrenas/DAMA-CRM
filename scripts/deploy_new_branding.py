import os
import cv2
import numpy as np
from PIL import Image

def process_image(input_path, eps=0.0006):
    bgr = cv2.imread(input_path)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Smooth alpha extraction:
    # Foreground is dark (< 110), Background is light (> 210)
    alpha = np.zeros((h, w), dtype=np.float32)
    fg_mask = gray < 115
    bg_mask = gray > 215
    ramp_mask = (~fg_mask) & (~bg_mask)

    alpha[fg_mask] = 255.0
    alpha[bg_mask] = 0.0
    alpha[ramp_mask] = 255.0 * (215.0 - gray[ramp_mask]) / (215.0 - 115.0)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)

    # Find bounding box
    y_indices, x_indices = np.where(alpha > 15)
    pad = 24
    min_x = max(0, np.min(x_indices) - pad)
    max_x = min(w, np.max(x_indices) + 1 + pad)
    min_y = max(0, np.min(y_indices) - pad)
    max_y = min(h, np.max(y_indices) + 1 + pad)

    crop_alpha = alpha[min_y:max_y, min_x:max_x]
    ch, cw = crop_alpha.shape

    # Generate transparent RGBA for Black, Dark Navy, and White
    def make_rgba(r, g, b):
        arr = np.zeros((ch, cw, 4), dtype=np.uint8)
        arr[:, :, 0] = r
        arr[:, :, 1] = g
        arr[:, :, 2] = b
        arr[:, :, 3] = crop_alpha
        return Image.fromarray(arr)

    img_black = make_rgba(15, 23, 42)    # Slate 900
    img_navy = make_rgba(7, 32, 83)      # Corporate Navy
    img_white = make_rgba(255, 255, 255) # Pure White

    # Generate vector SVG
    _, binary_mask = cv2.threshold(crop_alpha, 120, 255, cv2.THRESH_BINARY)
    contours, hierarchy = cv2.findContours(binary_mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)

    def make_svg(fill_color):
        header = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" width="{cw}" height="{ch}">\n'
        d_parts = []
        if hierarchy is not None:
            for cnt in contours:
                if cv2.contourArea(cnt) < 15:
                    continue
                approx = cv2.approxPolyDP(cnt, eps * cv2.arcLength(cnt, True), True)
                if len(approx) < 3:
                    continue
                d = f"M {approx[0][0][0]} {approx[0][0][1]} "
                for pt in approx[1:]:
                    d += f"L {pt[0][0]} {pt[0][1]} "
                d += "Z"
                d_parts.append(d)
        body = f'  <path d="{" ".join(d_parts)}" fill-rule="evenodd" fill="{fill_color}" />\n'
        footer = '</svg>\n'
        return header + body + footer

    return {
        'cw': cw, 'ch': ch,
        'img_black': img_black,
        'img_navy': img_navy,
        'img_white': img_white,
        'svg_dark': make_svg('#0f172a'),
        'svg_navy': make_svg('#072053'),
        'svg_white': make_svg('#ffffff'),
    }

print("Processing symbol...")
symbol_res = process_image(r"C:\Users\Ignacio\Desktop\Dama (2).png", eps=0.0004)

print("Processing horizontal logo...")
horiz_res = process_image(r"C:\Users\Ignacio\Desktop\Dama (3).png", eps=0.0005)

print("Processing vertical logo...")
vert_res = process_image(r"C:\Users\Ignacio\Desktop\Dama (1).png", eps=0.0005)

dest_dirs = [
    "client/public/assets/logos",
    "assets/logos"
]

for d in dest_dirs:
    os.makedirs(d, exist_ok=True)

    # 1. Symbol assets
    symbol_res['img_black'].save(os.path.join(d, "dama-symbol-dark.png"))
    symbol_res['img_white'].save(os.path.join(d, "dama-symbol-white.png"))
    symbol_res['img_navy'].save(os.path.join(d, "dama-symbol-color.png"))
    with open(os.path.join(d, "dama-symbol-dark.svg"), "w", encoding="utf-8") as f:
        f.write(symbol_res['svg_dark'])
    with open(os.path.join(d, "dama-symbol-light.svg"), "w", encoding="utf-8") as f:
        f.write(symbol_res['svg_white'])
    with open(os.path.join(d, "dama-symbol-white.svg"), "w", encoding="utf-8") as f:
        f.write(symbol_res['svg_white'])

    # 2. Horizontal Logo assets (Main Logo)
    horiz_res['img_black'].save(os.path.join(d, "dama-logo-dark.png"))
    horiz_res['img_white'].save(os.path.join(d, "dama-logo-white.png"))
    horiz_res['img_black'].save(os.path.join(d, "dama-logo-black.png"))
    horiz_res['img_navy'].save(os.path.join(d, "dama-logo-color.png"))
    with open(os.path.join(d, "dama-logo-dark.svg"), "w", encoding="utf-8") as f:
        f.write(horiz_res['svg_dark'])
    with open(os.path.join(d, "dama-logo-white.svg"), "w", encoding="utf-8") as f:
        f.write(horiz_res['svg_white'])
    with open(os.path.join(d, "dama-logo-light.svg"), "w", encoding="utf-8") as f:
        f.write(horiz_res['svg_white'])

    # 3. Vertical Logo assets
    vert_res['img_black'].save(os.path.join(d, "dama-logo-vertical-dark.png"))
    vert_res['img_white'].save(os.path.join(d, "dama-logo-vertical-white.png"))
    with open(os.path.join(d, "dama-logo-vertical-dark.svg"), "w", encoding="utf-8") as f:
        f.write(vert_res['svg_dark'])
    with open(os.path.join(d, "dama-logo-vertical-white.svg"), "w", encoding="utf-8") as f:
        f.write(vert_res['svg_white'])

# Update favicon.svg
favicon_svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {symbol_res['cw']} {symbol_res['ch']}">
  <style>
    path {{ fill: #072053; }}
    @media (prefers-color-scheme: dark) {{
      path {{ fill: #38bdf8; }}
    }}
  </style>
  {symbol_res['svg_dark'].split('<path')[1].split('/>')[0]}/>
</svg>
'''
with open("client/public/favicon.svg", "w", encoding="utf-8") as f:
    f.write(favicon_svg)

print("✅ All new DAMA branding assets deployed successfully!")
