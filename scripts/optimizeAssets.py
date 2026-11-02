import os
from PIL import Image

Image.MAX_IMAGE_PIXELS = None

ASSETS_DIR = os.path.abspath("client/public/assets")

targets = [
    ("buses/tnstc-mofussil-deluxe.jpg", 1600),
    ("buses/tnstc-ordinary-town-bus.jpg", 1600),
    ("buses/setc-ultra-deluxe-coach.jpg", 1600),
    ("landmarks/madurai-meenakshi-temple.jpg", 1600),
    ("landmarks/chennai-central.jpg", 1600),
    ("landmarks/thanjavur-brihadisvara-temple.jpg", 1600),
    ("landmarks/tiruchirappalli-rockfort.jpg", 1600),
    ("bus-stands/madurai-mattuthavani-terminal.jpg", 1600),
    ("bus-stands/madurai-periyar-terminal.jpg", 1600),
]

for rel_path, max_dim in targets:
    src_path = os.path.join(ASSETS_DIR, rel_path)
    if not os.path.exists(src_path):
        print(f"Skipping {rel_path}, not found.")
        continue

    try:
        with Image.open(src_path) as img:
            # Convert RGBA/P to RGB if necessary
            if img.mode in ("RGBA", "P"):
                img = img.convert("RGB")
            
            w, h = img.size
            if max(w, h) > max_dim:
                ratio = max_dim / max(w, h)
                new_size = (int(w * ratio), int(h * ratio))
                img = img.resize(new_size, Image.Resampling.LANCZOS)
            
            # Save optimized JPEG
            img.save(src_path, "JPEG", quality=85, optimize=True)
            
            # Save WebP version
            webp_path = os.path.splitext(src_path)[0] + ".webp"
            img.save(webp_path, "WEBP", quality=85)
            
            # Save thumbnail version (400px)
            thumb_ratio = 400 / max(w, h)
            thumb_size = (int(w * thumb_ratio), int(h * thumb_ratio))
            thumb_img = img.resize(thumb_size, Image.Resampling.LANCZOS)
            thumb_path = os.path.splitext(src_path)[0] + "-thumb.webp"
            thumb_img.save(thumb_path, "WEBP", quality=80)
            
            print(f"Optimized {rel_path} -> JPEG, WebP, Thumb WebP ({os.path.getsize(webp_path)} bytes)")
    except Exception as e:
        print(f"Error processing {rel_path}: {e}")

# Copy hero bus image to branding folder
mofussil_webp = os.path.join(ASSETS_DIR, "buses/tnstc-mofussil-deluxe.webp")
mofussil_jpg = os.path.join(ASSETS_DIR, "buses/tnstc-mofussil-deluxe.jpg")
hero_dest_webp = os.path.join(ASSETS_DIR, "buses/tnstc-hero-madurai.webp")
hero_branding_webp = os.path.join(ASSETS_DIR, "branding/bus-hero.webp")
hero_branding_png = os.path.join(ASSETS_DIR, "branding/bus-hero.png")

if os.path.exists(mofussil_webp):
    with Image.open(mofussil_webp) as img:
        img.save(hero_dest_webp, "WEBP", quality=88)
        img.save(hero_branding_webp, "WEBP", quality=88)
        img.save(hero_branding_png, "PNG")
        print("Updated hero bus images in branding folder with authentic TNSTC photography.")
