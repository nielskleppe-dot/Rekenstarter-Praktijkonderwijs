"""Extract commissioned workplace photographs from generated contact sheets.

This script only crops image cells and exports WebP; it does not synthesize images.
Pass the temporary folder containing Rekenstart_variety-N.b64 as the first argument.
"""
import base64
import hashlib
import io
import json
import sys
from pathlib import Path

from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
source_dir = Path(sys.argv[1]).resolve()
folder = root / "assets" / "career-openings"
jobs = json.loads((folder / "variety-generation-jobs.json").read_text(encoding="utf-8"))
manifest_path = folder / "manifest.json"
manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
existing = {p["id"]: p for p in manifest["images"]}
review = Image.new("RGB", (1080, ((len(jobs["images"]) + 3) // 4) * 164), "#ffffff")
draw = ImageDraw.Draw(review)
for index, item in enumerate(jobs["images"]):
    raw = base64.b64decode((source_dir / ("Rekenstart_" + item["sheet"] + ".b64")).read_text(encoding="utf-8").strip())
    sheet = Image.open(io.BytesIO(raw)).convert("RGB")
    cell = item["cell"]
    col, row = cell % item["columns"], cell // item["columns"]
    left, right = round(col * sheet.width / item["columns"]), round((col + 1) * sheet.width / item["columns"])
    top, bottom = round(row * sheet.height / item["rows"]), round((row + 1) * sheet.height / item["rows"])
    image = sheet.crop((left, top, right, bottom))
    target = folder / "images" / item["file"]
    image.save(target, "WEBP", quality=90, method=6)
    content = target.read_bytes()
    existing[item["id"]] = {
        **item,
        "status": "generated",
        "width": image.width,
        "height": image.height,
        "bytes": len(content),
        "sha256": hashlib.sha256(content).hexdigest(),
        "sourceSha256": hashlib.sha256(raw).hexdigest(),
        "origin": "Fotorealistisch AI-beeld van de beroepspraktijk; geen meet- of telgegevens in de foto.",
    }
    thumbnail = image.copy()
    thumbnail.thumbnail((266, 133))
    x, y = index % 4 * 270, index // 4 * 164
    review.paste(thumbnail, (x, y))
    label = f"{index+1}. {item['sector']} - {item['material']}"
    draw.text((x + 3, y + 134), label[:43], fill="#392348")
manifest["images"] = list(existing.values())
manifest["generated"] = len(existing)
manifest["version"] = 2
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
review.save(source_dir / "Rekenstart_variety_review.jpg", quality=88)
print(f"Prepared {len(jobs['images'])} distinct workplace alternatives; {len(existing)} commissioned photos total.")
