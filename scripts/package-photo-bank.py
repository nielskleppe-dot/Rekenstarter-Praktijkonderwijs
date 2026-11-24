"""Package all 700 assets, or the new 300 with --new, with a Dutch lesson index."""
from pathlib import Path
import csv, hashlib, html, io, json, zipfile, sys, math
from PIL import Image, ImageDraw, ImageFont

root=Path(__file__).resolve().parents[1]
bank=root/'assets'/'photo-bank'
manifest=json.loads((bank/'manifest.json').read_text(encoding='utf-8'))
records=[r for r in manifest['images'] if '--new' not in sys.argv or r.get('batch')=='meten-ruimte-300']
count=len(records)
assert count in (300,700) and all(r['status']=='generated' for r in records)
out=root.parent/f'Rekenstart_{count}_beroepsbeelden.zip'
rows=io.StringIO(newline='')
writer=csv.writer(rows,delimiter=';')
writer.writerow(['Bestand','Sector','Lesonderwerp','Materiaal','Situatie','Lesweken','Lessen','Prioriteit','Herkomst','Breedte','Hoogte'])
cards=[]
for r in records:
    file=r['sector']+'/'+r['file']
    writer.writerow([file,r['sectorName'],r['title'],r['material'],r['context'],' | '.join(r['weeks']),' | '.join(r['lessonIds']),r['priority'],r['origin'],r['width'],r['height']])
    text=' '.join([r['sectorName'],r['title'],r['material'],*r['weeks']])
    cards.append('<article data-sector="'+r['sector']+'" data-search="'+html.escape(text.lower(),quote=True)+'"><img loading="lazy" src="'+file+'" alt="'+html.escape(r['alt'],quote=True)+'" width="'+str(r['width'])+'" height="'+str(r['height'])+'"><div><small>'+html.escape(r['sectorName'])+' · AI-foto</small><h2>'+html.escape(r['title'])+'</h2><p>'+html.escape(r['context'])+'</p><p>'+html.escape(' | '.join(r['weeks']))+'</p><a download href="'+file+'">Bewaar afbeelding</a> · <a target="_blank" rel="noopener" href="https://rekenstart-herfst-2026.nielskleppe.chatgpt.site/#bibliotheek='+r['lessonIds'][0]+'&amp;sector='+r['sector']+'">Open les</a></div></article>')
index='''<!doctype html><html lang="nl"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>400 beroepsbeelden · Rekenstart</title><style>body{margin:0;background:#f6f3f8;color:#332040;font:17px system-ui,sans-serif}header{padding:30px max(24px,5vw);background:#43205a;color:white}main{padding:24px max(24px,5vw)}h1{margin:0;font-size:32px}header p{max-width:850px;line-height:1.5}nav{display:flex;gap:12px;flex-wrap:wrap;margin-bottom:20px}input,select{font:inherit;padding:12px;border:1px solid #b8a7c4;border-radius:9px}input{min-width:270px}#grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(285px,1fr));gap:20px}article{background:white;border-radius:14px;border:1px solid #e0d5e7;overflow:hidden}article[hidden]{display:none}img{display:block;width:100%;height:auto;aspect-ratio:3/2;object-fit:contain;background:#eee}article>div{padding:18px}h2{font-size:20px;margin:9px 0}article p{font-size:15px;line-height:1.4}a{color:#653282}small{color:#765a88}</style><header><h1>400 beroepsbeelden voor Rekenstart</h1><p>80 lesonderwerpen × 5 sectoren. Zoek een onderwerp of kies je sector. Elk beeld laat de beroepssituatie zien. De exacte aantallen, prijzen en maten staan in de les, los van de foto.</p></header><main><nav><input id="q" type="search" placeholder="Zoek les, materiaal of lesweek" aria-label="Zoek een afbeelding"><select id="s" aria-label="Sector"><option value="">Alle sectoren</option><option value="groen">Groen</option><option value="techniek">Techniek</option><option value="zw">Zorg en Welzijn</option><option value="hbr">Horeca, Bakkerij en Recreatie</option><option value="eco">Economie</option></select></nav><p id="count" role="status">400 beelden</p><section id="grid">'''+''.join(cards)+'''</section></main><script>const q=document.getElementById('q'),s=document.getElementById('s'),cards=[...document.querySelectorAll('article')];function filter(){let n=0;const words=q.value.toLowerCase().trim().split(/\\s+/).filter(Boolean);for(const c of cards){c.hidden=!!((s.value&&c.dataset.sector!==s.value)||!words.every(w=>c.dataset.search.includes(w)));if(!c.hidden)n++}document.getElementById('count').textContent=n+' beelden'}q.addEventListener('input',filter);s.addEventListener('change',filter)</script></html>'''
index=index.replace('400',str(count)).replace('80 lesonderwerpen',str(len(set(r['kind'] for r in records)))+' lesonderwerpen')
readme=f'''{count} BEROEPSBEELDEN - REKENSTART

Pak de hele ZIP uit. Open index.html om de beelden te zoeken en te bekijken.
Dit pakket bevat {count} verschillende afbeeldingen: {count//5} per sector.
Overzicht_{count}_lesbeelden.csv opent in Excel en vermeldt les, materiaal,
sector en de lesweken. De uitbreiding van 300 beelden richt zich op meten,
meetkunde en routes. De website bevat nu de bestaande 400 plus de nieuwe 300.

Herkomst: fotorealistische AI-beelden van beroepssituaties. Exacte aantallen,
bedragen, afleesbare maatverdelingen en berekeningen staan apart in de les.
Gebruik daarvoor de grote, nauwkeurige rekenbeelden en meetinstrumenten.
De afbeeldingsbestanden zijn geoptimaliseerd voor schermgebruik.
'''
with zipfile.ZipFile(out,'w',compression=zipfile.ZIP_DEFLATED) as z:
    z.writestr('index.html',index)
    z.writestr(f'Overzicht_{count}_lesbeelden.csv','\ufeff'+rows.getvalue())
    z.writestr('Lees_mij.txt',readme)
    for r in records:
        source=bank/'images'/r['file']
        assert hashlib.sha256(source.read_bytes()).hexdigest()==r['sha256']
        z.write(source,r['sector']+'/'+r['file'])
# Review sheets keep every individual image visible with its exact case ID.
review=root.parent/f'Rekenstart_beeldcontrole_{count}'
review.mkdir(exist_ok=True)
font=ImageFont.truetype('C:/Windows/Fonts/arial.ttf',15)
for sector in ['groen','techniek','zw','hbr','eco']:
    subset=[r for r in records if r['sector']==sector]
    canvas=Image.new('RGB',(1600,math.ceil(len(subset)/8)*120),'white');draw=ImageDraw.Draw(canvas)
    for i,r in enumerate(subset):
        x=(i%8)*200;y=(i//8)*120
        im=Image.open(bank/'images'/r['file']);im.thumbnail((196,98))
        canvas.paste(im,(x+(200-im.width)//2,y))
        draw.text((x+3,y+99),str(i+1)+' '+r['kind'],fill='#452455',font=font)
    canvas.save(review/(sector+'.jpg'),quality=92)
print(json.dumps({'zip':str(out),'bytes':out.stat().st_size,'images':len(records),'reviewSheets':str(review)}))
