import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {buildCatalog} from '../src/catalog-authoring.mjs';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const bank=JSON.parse(await read('assets/photo-bank/manifest.json'));
const data=JSON.parse(await read('src/lesson-data.json'));
assert.equal(bank.images.length,700);assert.equal(bank.generated,700);
assert.equal(new Set(bank.images.map(p=>p.id)).size,700);
assert.equal(new Set(bank.images.map(p=>p.sha256)).size,700,'700 distinct image files');
assert.equal((await readdir(new URL('../assets/photo-bank/images',import.meta.url))).filter(f=>f.endsWith('.webp')).length,700);
const expansion=bank.images.filter(p=>p.batch==='meten-ruimte-300');assert.equal(expansion.length,300);assert.equal(new Set(expansion.map(p=>p.kind)).size,60);
const originalHashes=JSON.parse(await read('assets/photo-bank/base-400-integrity.json'));assert.equal(Object.keys(originalHashes).length,400);
for(const [id,hash]of Object.entries(originalHashes))assert.equal(bank.images.find(p=>p.id===id)?.sha256,hash,'preserve original image '+id);
for(const sector of data.sectors){assert.equal(bank.images.filter(p=>p.sector===sector.id&&p.status==='generated').length,140);assert.equal(expansion.filter(p=>p.sector===sector.id).length,60);}
const before=buildCatalog(data),after=buildCatalog(data,bank.images);
assert.equal(after.entries.length,before.entries.length);
for(let i=0;i<before.entries.length;i++)for(const field of ['id','year','week','day','goal','example','exercise','practice','challenge','schedule'])assert.deepEqual(after.entries[i][field],before.entries[i][field],before.entries[i].id+': unchanged '+field);
const assets={};
for(const photo of bank.images){
 const bytes=await readFile(new URL('../assets/photo-bank/images/'+photo.file,import.meta.url));
 assert.equal(bytes.subarray(0,4).toString(),'RIFF');assert.equal(bytes.subarray(8,12).toString(),'WEBP');
 assert.equal(bytes.length,photo.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),photo.sha256);
 assert(photo.width>=380&&photo.height>=250,'context photo dimensions');
 assert(photo.lessonIds.length&&photo.weeks.length&&photo.context&&photo.alt);
 assets[photo.file]={bytes:photo.bytes,sha256:photo.sha256,data:bytes.toString('base64')};
 for(const id of photo.lessonIds){const lesson=after.entries.find(e=>e.id===id);assert(lesson);assert((photo.compatibleKinds||[photo.kind]).includes(lesson.kind));assert.equal(lesson.contexts[photo.sector].photoBankId,photo.id);assert.equal(lesson.contexts[photo.sector].material,photo.material);assert.equal(lesson.contexts[photo.sector].context,photo.contextByKind?.[lesson.kind]||photo.context);}
}
const handler=new Function((await read('worker/photo-bank.js')).replace('/* LESSON_IMAGE_ASSETS */{}',()=>JSON.stringify(assets))+'\nreturn lessonImageResponse;')();
for(const photo of bank.images){
 const url=new URL('https://fixture.test/lesbeelden/'+photo.file+'?v='+photo.sha256.slice(0,12));
 const response=handler(new Request(url),url);assert.equal(response.status,200);assert.equal(response.headers.get('content-type'),'image/webp');assert.match(response.headers.get('cache-control'),/immutable/);
 assert.equal(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex'),photo.sha256);
 const head=handler(new Request(url,{method:'HEAD'}),url);assert.equal((await head.arrayBuffer()).byteLength,0);
 const cached=handler(new Request(url,{headers:{'if-none-match':response.headers.get('etag')}}),url);assert.equal(cached.status,304);
 url.searchParams.set('download','1');assert.match(handler(new Request(url),url).headers.get('content-disposition'),/^attachment;/);
 url.searchParams.set('v','old');assert.doesNotMatch(handler(new Request(url,{method:'HEAD'}),url).headers.get('cache-control'),/immutable/);
}
for(const path of ['/lesbeelden/missing.webp','/lesbeelden/__proto__.webp','/lesbeelden/evil.svg','/lesbeelden/part/name.webp']){const url=new URL('https://fixture.test'+path);assert.equal(handler(new Request(url),url).status,404);}
const validUrl=new URL('https://fixture.test/lesbeelden/'+bank.images[0].file);assert.equal(handler(new Request(validUrl,{method:'POST'}),validUrl).status,405);
assert.equal(handler(new Request('https://fixture.test/api/state'),new URL('https://fixture.test/api/state')),null);
const nodes=new Map(),document={documentElement:{},querySelectorAll(){return[];},addEventListener(){},getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},querySelector(){return null;}});return nodes.get(id);}};
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);document.getElementById('catalog-data').textContent=JSON.stringify(after);
const careerPhotos=JSON.parse(await read('assets/career-openings/manifest.json')).images;
const metadata=bank.images.map(p=>({...p,url:'/lesbeelden/'+p.file+'?v='+p.sha256.slice(0,12)}));
const measurementFixture={};
for(const dir of ['measurement','tasks'])for(const file of await readdir(new URL('../assets/'+dir+'/',import.meta.url)))if(file.endsWith('.webp'))measurementFixture[file.slice(0,-5)]='https://fixture.test/'+dir+'/'+file;
const sources=await Promise.all(['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/catalog.js','src/client.js','src/photo-variety.js'].map(read));
const app=new Function('document','window','localStorage','location','history',sources.join('\n').replace('/* LESSON_PHOTO_BANK */[]',()=>JSON.stringify(metadata)).replace('/* MEASUREMENT_PHOTOS */{}',()=>JSON.stringify(measurementFixture)).replace('/* CAREER_PHOTOS */[]',()=>JSON.stringify(careerPhotos.map(p=>({...p,url:'/lesbeelden/'+p.file}))))+'\nreturn {state,catalogSlides,renderLessonImageBank,metricSlides,metricPhotoRecord,lessonMeasure,catalogMaterialPhoto,workplaceRecord,workplaceFamily};')(document,{addEventListener(){}},{getItem(){return null;}},{href:'https://fixture.test',hash:''},{replaceState(){}});
let linked=0;
for(const lesson of after.entries)for(const sector of data.sectors){
 const context=lesson.contexts[sector.id];if(!context.photoBankId)continue;
 const deck={catalog:lesson,sector:sector.id,step:1,modelSteps:0,columnSteps:0,revealed:false};app.state.deck=deck;
 const slides=app.catalogSlides(deck);assert.equal(slides.length,4);
 for(const [index,slide] of slides.entries()){
  if(!/^choose/.test(lesson.kind)&&lesson.kind!=='borderOrSurface'&&!(index===0&&(lesson.visualTopic==='clock'||lesson.example.model?.kind==='clock'||lesson.kind==='boxLitres'))){const base=bank.images.find(p=>p.id===context.photoBankId);assert.equal(app.workplaceRecord(slide,sector.id)?.group,app.workplaceFamily(sector.id,base.material),lesson.id+' all task slides have the exact reviewed material family');}
  else assert(slide.includes('data-photo-sector="'+sector.id+'"')||/reference|measure/.test(slide),lesson.id+' precise unit reference or matching sector image');
  for(const [,id]of slide.matchAll(/data-photo-id="([^"]+)"/g))assert.equal(bank.images.find(p=>p.id===id)?.sector,sector.id,'never mix sector photos');
  assert.doesNotMatch(slide,/undefined|NaN/);
 }
 linked++;
}
for(const sector of data.sectors){
 for(const [kind,referenceSubject]of [['chooseLength','screw'],['chooseMass','paperclip'],['chooseVolume','pipette']]){
  const lesson=after.entries.find(l=>l.kind===kind),reference=bank.images.find(p=>p.kind===kind&&p.sector===sector.id);
  assert.equal(reference.referenceSubject,referenceSubject);
  const wrongLarge={...lesson.example,model:{kind:'reference',row:'mass',unit:'kg',quantity:'120'},question:'Een levering op een pallet'};
  assert(!app.catalogMaterialPhoto(lesson,sector.id,wrongLarge).includes(reference.id),'never show a tiny reference object for a pallet');
 }
 for(const year of [1,2])for(let week=0;week<8;week++)for(let day=0;day<3;day++){
  const deck={metric:{week,day},sector:sector.id,step:2,revealed:false};app.state.year=year;app.state.deck=deck;
  const photo=app.metricPhotoRecord(deck),m=app.lessonMeasure(deck),slides=app.metricSlides(deck);
  assert.equal(slides.length,4);assert.doesNotMatch(slides.join(''),/undefined|NaN/);
  if(photo){assert.equal(photo.sector,sector.id);if(!(week===1&&day===0&&sector.id==='groen'))assert.equal(m.material,photo.material);assert.equal(app.workplaceRecord(slides[1],sector.id)?.group,app.workplaceFamily(sector.id,photo.material),'matching material family in metric lesson');}
  if(photo?.material==='losse noten'){
   const practice=app.lessonMeasure({...deck,step:3});
   assert.match(practice.answer,/Weeg extra noten af/,'the follow-up action must match the reviewed shop photo');
   assert.doesNotMatch(practice.question+' '+practice.answer,/pakket/);
  }
 }
}
app.state.sector='groen';app.renderLessonImageBank(after.entries);assert.match(nodes.get('lesson-image-results').innerHTML,/140 beelden/);assert.equal((nodes.get('lesson-image-results').innerHTML.match(/data-photo-id=/g)||[]).length,12);
const careerBank=JSON.parse(await read('assets/career-openings/manifest.json'));
const html=await read('dist/index.html');assert.equal((html.match(/\/lesbeelden\/[^" ]+\.webp\?v=/g)||[]).length,700+careerBank.images.length);assert(!html.includes(bank.images[0].sha256+'","bytes"'),'image bytes are kept out of initial HTML');
console.log('PASS: 700 distinct photo assets (original 400 unchanged + new 300), 140 per sector, exact lesson/sector context links, '+linked+' four-slide lessons, unchanged calculations/planning, all image routes and downloads.');
