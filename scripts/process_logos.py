import os
import cv2
import numpy as np
from PIL import Image

def process_logo(input_path, output_prefix, bg_thresh=180):
    # Load image
    bgr = cv2.imread(input_path)
    rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
    h, w, _ = rgb.shape

    # Grayscale
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)

    # Invert so logo is bright, background is dark
    # Background in all images is > 200. Foreground is < 100.
    # We want alpha = 255 for foreground, 0 for background.
    # Use inverted normalized gray with smooth transition:
    # 0 to 100 -> 255
    # 100 to 210 -> smooth ramp
    # > 210 -> 0
    alpha = np.zeros((h, w), dtype=np.float32)
    fg_mask = gray < 120
    bg_mask = gray > 215
    ramp_mask = (~fg_mask) & (~bg_mask)

    alpha[fg_mask] = 255.0
    alpha[bg_mask] = 0.0
    alpha[ramp_mask] = 255.0 * (215.0 - gray[ramp_mask]) / (215.0 - 120.0)
    alpha = np.clip(alpha, 0, 255).astype(np.uint8)

    # Bounding box of non-zero alpha
    y_indices, x_indices = np.where(alpha > 10)
    if len(y_indices) == 0:
        print(f"Error: no foreground found in {input_path}")
        return

    pad = 20
    min_x = max(0, np.min(x_indices) - pad)
    max_x = min(w, np.max(x_indices) + 1 + pad)
    min_y = max(0, np.min(y_indices) - pad)
    max_y = min(h, np.max(y_indices) + 1 + pad)

    crop_alpha = alpha[min_y:max_y, min_x:max_x]
    crop_rgb = rgb[min_y:max_y, min_x:max_x]
    ch, cw = crop_alpha.shape

    # 1. Color version (original navy #072053)
    color_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    # Target navy color: (7, 32, 83)
    color_rgba[:, :, 0] = 7
    color_rgba[:, :, 1] = 32
    color_rgba[:, :, 2] = 83
    color_rgba[:, :, 3] = crop_alpha

    # 2. Black/Dark version (#0f172a - slate 900)
    dark_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    dark_rgba[:, :, 0] = 15
    dark_rgba[:, :, 1] = 23
    dark_rgba[:, :, 2] = 42
    dark_rgba[:, :, 3] = crop_alpha

    # 3. White version (#ffffff)
    white_rgba = np.zeros((ch, cw, 4), dtype=np.uint8)
    white_rgba[:, :, 0] = 255
    white_rgba[:, :, 1] = 255
    white_rgba[:, :, 2] = 255
    white_rgba[:, :, 3] = crop_alpha

    # Save PNGs
    Image.fromarray(color_rgba).save(f"{output_prefix}_color.png")
    Image.fromarray(dark_rgba).save(f"{output_prefix}_dark.png")
    Image.fromarray(white_rgba).save(f"{output_prefix}_white.png")

    # 4. Generate SVG via contours
    # Binary mask for clean contour detection
    _, binary_mask = cv2.threshold(crop_alpha, 128, 255, cv2.THRESH_BINARY)
    # Find contours with hierarchy
    contours, hierarchy = cv2.findContours(binary_mask, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_TC89_KCOS)

    def generate_svg(fill_color):
        svg_header = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {cw} {ch}" width="{cw}" height="{ch}" fill="{fill_color}">\n'
        svg_paths = []
        if hierarchy is not None and len(hierarchy[0]) > 0:
            # Group into outer and inner holes
            # In SVG, fill-rule="evenodd" allows combining paths cleanly
            d_parts = []
            for i, cnt in enumerate(contours):
                if cv2.contourArea(cnt) < 10:
                    continue
                # Smooth contour points
                epsilon = 0.0012 * cv2.arcLength(cnt, True)
                approx = cv2.approxPolyDP(cnt, epsilon, True)
                if len(approx) < 3:
                    continue
                d = f"M {approx[0][0][0]} {approx[0][0][1]} "
                for pt in approx[1:]:
                    d += f"L {pt[0][0]} {pt[0][1]} "
                d += "Z"
                d_parts.append(d)
            combined_d = " ".join(d_parts)
            svg_paths.append(f'  <path d="{combined_d}" fill-rule="evenodd" fill="{fill_color}" />\n')

        svg_footer = '</svg>\n'
        return svg_header + "".join(svg_paths) + svg_footer

    with open(f"{output_prefix}_dark.svg", "w", encoding="utf-8") as f:
        f.write(generate_svg("#0f172a"))

    with open(f"{output_prefix}_color.svg", "w", encoding="utf-8") as f:
        f.write(generate_svg("#072053"))

    with open(f"{output_prefix}_white.svg", "w", encoding="utf-8") as f:
        f.write(generate_svg("#ffffff"))

    print(f"Successfully processed {output_prefix} (dimensions: {cw}x{ch})")

os.makedirs("assets/logos_v2", exist_ok=True)
process_logo(r"C:\Users\Ignacio\Desktop\Dama (2).png", "assets/logos_v2/dama-symbol")
process_logo(r"C:\Users\Ignacio\Desktop\Dama (3).png", "assets/logos_v2/dama-logo-horizontal")
process_logo(r"C:\Users\Ignacio\Desktop\Dama (1).png", "assets/logos_v2/dama-logo-vertical")
