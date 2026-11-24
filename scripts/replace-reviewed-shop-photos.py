"""Resize two newly commissioned replacement photos; preserve all other assets."""
from pathlib import Path
import base64, hashlib, io, json
from PIL import Image

bank = Path(__file__).resolve().parents[1] / 'assets' / 'photo-bank'
manifest = json.loads((bank / 'manifest.json').read_text(encoding='utf-8'))
scenes = {
    'eco-086-massrefill': 'Over-the-shoulder close-up of a Dutch shop employee in a dark green apron adding loose mixed nuts from a metal scoop into a brown paper food bag on a commercial weighing scale. Scale display faces away; no readable data.',
    'eco-137-fillmass': 'Front three-quarter close-up of a Dutch delicatessen employee in a grey apron adding mixed nuts from a metal scoop into a food-safe tray on a commercial digital scale. Display is unreadable; no text or exact data.',
}
for photo in manifest['images']:
    if photo['id'] not in scenes:
        continue
    source = bank / (photo['id'] + '-replacement.b64')
    raw = base64.b64decode(source.read_text(encoding='utf-8').strip())
    image = Image.open(io.BytesIO(raw)).convert('RGB')
    assert image.width == 2 * image.height, 'Keep the commissioned wide composition'
    image = image.resize((512, 256), Image.Resampling.LANCZOS)
    target = bank / 'images' / photo['file']
    image.save(target, 'WEBP', quality=88, method=6)
    content = target.read_bytes()
    photo.update(width=512, height=256, bytes=len(content), sha256=hashlib.sha256(content).hexdigest(), scene=scenes[photo['id']])
    photo['replacementReview'] = {
        'reason': 'Losse noten aanvullen tot een gewenst gewicht is een echte winkeltaak; verpakkingsmateriaal toevoegen voor extra gewicht is geen passende casus.',
        'sourceSha256': hashlib.sha256(raw).hexdigest(),
        'reviewed': 'Nieuwe losse foto beoordeeld op sector, weegschaal, noten, werkhandeling en overeenkomst met de les.',
    }
(bank / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(json.dumps({'replaced': len(scenes), 'total': len(manifest['images'])}))
