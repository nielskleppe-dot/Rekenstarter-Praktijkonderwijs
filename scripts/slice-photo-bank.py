"""Technically extract commissioned contact-sheet cells; no image synthesis."""
from pathlib import Path
import base64, hashlib, io, json, sys
from PIL import Image

root = Path(__file__).resolve().parents[1]
bank = root / 'assets' / 'photo-bank'
manifest = json.loads((bank / 'manifest.json').read_text(encoding='utf-8'))
selected = set(sys.argv[1:])
done = 0
for source in sorted(bank.glob('*.b64')):
    if selected and source.stem not in selected:
        continue
    sheet = Image.open(io.BytesIO(base64.b64decode(source.read_text(encoding='utf-8').strip()))).convert('RGB')
    records = [r for r in manifest['images'] if r['sheet'] == source.stem]
    if not records:
        continue
    columns = records[0].get('gridColumns', 4)
    rows = records[0].get('gridRows', 4)
    if len(records) != columns * rows:
        raise ValueError('The sheet grid does not match the commissioned scenes')
    for r in records:
        col, row = r['cell'] % columns, r['cell'] // columns
        box = (round(col * sheet.width / columns), round(row * sheet.height / rows), round((col + 1) * sheet.width / columns), round((row + 1) * sheet.height / rows))
        cell = sheet.crop(box)
        target = bank / 'images' / r['file']
        cell.save(target, 'WEBP', quality=88, method=6)
        raw = target.read_bytes()
        r.update(status='generated', width=cell.width, height=cell.height, bytes=len(raw), sha256=hashlib.sha256(raw).hexdigest())
        done += 1
manifest['generated'] = sum(r['status'] == 'generated' for r in manifest['images'])
(bank / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(json.dumps({'extractedNow':done,'generatedTotal':manifest['generated'],'planned':manifest['count']}))
