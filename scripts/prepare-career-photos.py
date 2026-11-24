"""Extract the commissioned work scenes and encode web assets, without synthesis."""
from pathlib import Path
import base64, hashlib, io, json
from PIL import Image, ImageOps, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
folder=root/'assets'/'career-openings'
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
sources={}
for item in manifest['images']:
    key=item['sheet']
    if key not in sources:
        raw=base64.b64decode((root.parent/('Rekenstart_'+key+'.b64')).read_text(encoding='utf-8'))
        sources[key]=(Image.open(io.BytesIO(raw)).convert('RGB'),hashlib.sha256(raw).hexdigest())
    sheet,source_hash=sources[key]
    columns,rows=item['columns'],item['rows']
    col,row=item['cell']%columns,item['cell']//columns
    box=(round(col*sheet.width/columns),round(row*sheet.height/rows),round((col+1)*sheet.width/columns),round((row+1)*sheet.height/rows))
    image=sheet.crop(box)
    if columns==1:image=ImageOps.fit(image,(1024,512),method=Image.Resampling.LANCZOS)
    target=folder/'images'/item['file']
    image.save(target,'WEBP',quality=90,method=6)
    raw=target.read_bytes()
    item.update(status='generated',width=image.width,height=image.height,bytes=len(raw),sha256=hashlib.sha256(raw).hexdigest(),sourceSha256=source_hash,alt=item['material']+' tijdens het werk',origin='Fotorealistisch AI-beeld van de beroepspraktijk; geen rekengegevens in de foto.')
manifest['generated']=len(manifest['images'])
(folder/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
canvas=Image.new('RGB',(1600,7*165),'white');draw=ImageDraw.Draw(canvas);font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',16)
for i,item in enumerate(manifest['images']):
    x=(i%4)*400;y=(i//4)*165
    image=Image.open(folder/'images'/item['file']);image.thumbnail((390,132))
    canvas.paste(image,(x+(400-image.width)//2,y))
    draw.text((x+5,y+135),item['id'],font=font,fill='#432654')
review=root.parent/'Rekenstart_career_review.jpg';canvas.save(review,quality=94)
print(json.dumps({'generated':manifest['generated'],'distinct':len({x['sha256'] for x in manifest['images']}),'review':str(review)}))
