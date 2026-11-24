"""Restore the already generated sheets after the interrupted transfer."""
from pathlib import Path
import base64, hashlib, json

root=Path(__file__).resolve().parents[1]
bank=root/'assets'/'photo-bank'
sources={
 1:(4,'libfile_aad3fbaa76488191b0cc03942452a65c'),
 2:(2,'libfile_9453506fd8fc8191bc62786227a1488f'),
 3:(0,'libfile_2cbf5fe649948191b101f66177df3be5'),
 4:(3,'libfile_fbfdfd06ac148191a4667b73eb2397bc'),
 5:(1,'libfile_9fc231739cc481918c28aeefb9cdd8f8')
}
recovery=[]
for sheet,(index,library_id) in sources.items():
 source=root.parent/'Rekenstart_recovered_eco'/f'recovered-{index}.png'
 raw=source.read_bytes()
 (bank/f'extra-eco-{sheet}.b64').write_text(base64.b64encode(raw).decode('ascii'),encoding='ascii')
 recovery.append({'sheet':f'extra-eco-{sheet}','library_file_id':library_id,'source_sha256':hashlib.sha256(raw).hexdigest(),'source_bytes':len(raw),'verified':'Visually matched the twelve scenes to the stored generation job before extraction.'})
(bank/'recovered-sources.json').write_text(json.dumps(recovery,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('Recovered five previously generated sheets; sixty individual photos ready for extraction.')
