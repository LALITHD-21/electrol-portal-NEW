import os
import base64
from PIL import Image, ImageDraw, ImageEnhance

img1_path = r"C:\Users\techb\.gemini\antigravity\brain\a7dcfd88-0201-4db5-9507-265ca552054a\.user_uploaded\media_1792672997205_4f6168ec.jpg"
img2_path = r"C:\Users\techb\.gemini\antigravity\brain\a7dcfd88-0201-4db5-9507-265ca552054a\.user_uploaded\media_1792673193028_317c458b.png"

pub_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\public"
app_dir = r"C:\Users\techb\Desktop\electrol-portal-NEW-main\electrol-portal-NEW-main\web\app"

print(f"Reading Image 1 from: {img1_path}")
print(f"Reading Image 2 from: {img2_path}")

# --- 1. Process Image 1 (Circular Emblem / App Logo) ---
im1 = Image.open(img1_path).convert("RGB")
w, h = im1.size

# Slight contrast & sharpness enhancement for ultra-crisp HD presentation
enhancer = ImageEnhance.Sharpness(im1)
im1_sharp = enhancer.enhance(1.15)
enhancer = ImageEnhance.Contrast(im1_sharp)
im1_enhanced = enhancer.enhance(1.04)

# 4x supersampled mask for clean anti-aliasing
scale = 4
mask = Image.new("L", (w * scale, h * scale), 0)
draw = ImageDraw.Draw(mask)
cx_4x = (w * scale - 1) / 2.0
cy_4x = (h * scale - 1) / 2.0
r_4x = 510.5 * scale
draw.ellipse((cx_4x - r_4x, cy_4x - r_4x, cx_4x + r_4x, cy_4x + r_4x), fill=255)
mask = mask.resize((w, h), Image.Resampling.LANCZOS)

im1_rgba = im1_enhanced.convert("RGBA")
im1_rgba.putalpha(mask)

# Save 1024x1024
app_logo_path = os.path.join(pub_dir, "app-logo.png")
im1_rgba.save(app_logo_path, "PNG", optimize=True)
print(f"Saved: {app_logo_path}")

logo_emblem_path = os.path.join(pub_dir, "logo-emblem.png")
im1_rgba.save(logo_emblem_path, "PNG", optimize=True)
print(f"Saved: {logo_emblem_path}")

# Generate icon-512.png
im_512 = im1_rgba.resize((512, 512), Image.Resampling.LANCZOS)
icon_512_path = os.path.join(pub_dir, "icon-512.png")
im_512.save(icon_512_path, "PNG", optimize=True)
print(f"Saved: {icon_512_path}")

app_icon_path = os.path.join(app_dir, "icon.png")
im_512.save(app_icon_path, "PNG", optimize=True)
print(f"Saved: {app_icon_path}")

# Generate icon-192.png
im_192 = im1_rgba.resize((192, 192), Image.Resampling.LANCZOS)
icon_192_path = os.path.join(pub_dir, "icon-192.png")
im_192.save(icon_192_path, "PNG", optimize=True)
print(f"Saved: {icon_192_path}")

# Generate apple-touch-icon.png (180x180)
im_180 = im1_rgba.resize((180, 180), Image.Resampling.LANCZOS)
apple_touch_path = os.path.join(pub_dir, "apple-touch-icon.png")
im_180.save(apple_touch_path, "PNG", optimize=True)
apple_precomp_path = os.path.join(pub_dir, "apple-touch-icon-precomposed.png")
im_180.save(apple_precomp_path, "PNG", optimize=True)
print(f"Saved: {apple_touch_path} and {apple_precomp_path}")

# Generate app-logo.svg
with open(app_logo_path, "rb") as f:
    b64_data = base64.b64encode(f.read()).decode("utf-8")

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1024 1024" width="100%" height="100%">
  <defs>
    <clipPath id="circleClip">
      <circle cx="512" cy="512" r="510" />
    </clipPath>
  </defs>
  <image href="data:image/png;base64,{b64_data}" width="1024" height="1024" clip-path="url(#circleClip)" />
</svg>'''

svg_path = os.path.join(pub_dir, "app-logo.svg")
with open(svg_path, "w", encoding="utf-8") as f:
    f.write(svg_content)
print(f"Saved SVG logo: {svg_path}")

# --- 2. Process Image 2 (Ballot Paper Guide) ---
im2 = Image.open(img2_path).convert("RGBA")
# Enhanced sharpness & clarity for high-DPI screens
enhancer2 = ImageEnhance.Sharpness(im2)
im2_sharp = enhancer2.enhance(1.1)

ballot_guide_path = os.path.join(pub_dir, "ballot-candidate-guide.png")
im2_sharp.save(ballot_guide_path, "PNG", optimize=True)
print(f"Saved Ballot guide: {ballot_guide_path} (size {im2.size})")

# Remove test file if exists
test_path = os.path.join(pub_dir, "test_emblem.png")
if os.path.exists(test_path):
    os.remove(test_path)
    print(f"Removed temporary file: {test_path}")

print("All brand assets successfully updated and enhanced!")
