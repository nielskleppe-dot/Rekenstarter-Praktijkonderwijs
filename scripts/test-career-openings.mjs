import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const bank=JSON.parse(await read('assets/photo-bank/manifest.json')).images;
const fresh=JSON.parse(await read('assets/career-openings/manifest.json')).images;
const data=JSON.parse(await read('src/lesson-data.json')),catalog=JSON.parse(await read('src/catalog-data.json'));
assert.equal(fresh.length,97);assert.equal(new Set(fresh.map(p=>p.sha256)).size,fresh.length);
const assets={};
for(const p of fresh){
 const bytes=await readFile(new URL('../assets/career-openings/images/'+p.file,import.meta.url));
 assert.equal(bytes.length,p.bytes);assert.equal(createHash('sha256').update(bytes).digest('hex'),p.sha256);
 assert.equal(bytes.subarray(8,12).toString(),'WEBP');assert(p.width>=500&&p.height>=250);
 assets[p.file]={data:bytes.toString('base64'),bytes:p.bytes,sha256:p.sha256};
}
const handler=new Function((await read('worker/photo-bank.js')).replace('/* LESSON_IMAGE_ASSETS */{}',()=>JSON.stringify(assets))+'\nreturn lessonImageResponse;')();
for(const p of fresh){
 const url=new URL('https://fixture.test/lesbeelden/'+p.file+'?v='+p.sha256.slice(0,12));
 const res=handler(new Request(url),url);assert.equal(res.status,200);assert.equal(res.headers.get('content-type'),'image/webp');
 assert.equal(createHash('sha256').update(Buffer.from(await res.arrayBuffer())).digest('hex'),p.sha256);
 assert.equal((await handler(new Request(url,{method:'HEAD'}),url).arrayBuffer()).byteLength,0);
 assert.equal(handler(new Request(url,{headers:{'if-none-match':res.headers.get('etag')}}),url).status,304);
}
const allMeta=bank.map(p=>({...p,url:'/lesbeelden/'+p.file+'?v='+p.sha256.slice(0,12)}));
const newMeta=fresh.map(p=>({...p,url:'/lesbeelden/'+p.file+'?v='+p.sha256.slice(0,12)}));
const photos={};for(const dir of ['measurement','tasks'])for(const f of await readdir(new URL('../assets/'+dir+'/',import.meta.url)))if(f.endsWith('.webp'))photos[f.slice(0,-5)]='https://fixture.test/'+dir+'/'+f;
const topicPhotos={};for(const f of await readdir(new URL('../assets/topics/',import.meta.url)))if(f.endsWith('.webp'))topicPhotos[f.slice(0,-5)]='https://fixture.test/topics/'+f;
const nodes=new Map(),document={documentElement:{},querySelectorAll(){return[];},addEventListener(){},getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},querySelector(){return null;}});return nodes.get(id);}};
for(const key of Object.keys(data.images))data.images[key]='fixture:'+key;
data.brand.logo='fixture:logo';
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);document.getElementById('catalog-data').textContent=JSON.stringify(catalog);
const code=(await Promise.all(['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/catalog.js','src/client.js','src/photo-variety.js'].map(read))).join('\n').replace('/* LESSON_PHOTO_BANK */[]',()=>JSON.stringify(allMeta)).replace('/* CAREER_PHOTOS */[]',()=>JSON.stringify(newMeta)).replace('/* MEASUREMENT_PHOTOS */{}',()=>JSON.stringify(photos)).replace('/* TOPIC_PHOTOS */{}',()=>JSON.stringify(topicPhotos));
const app=new Function('document','window','localStorage','location','history',code+'\nreturn {state,activeVariant,regularSlides,catalogSlides,metricSlides,regularCareerRecord,careerWorkProfile,lessonBankPhoto,workplaceRecord,workplaceFamily,allWorkplacePhotos};')(document,{addEventListener(){}},{getItem(){return null;}},{href:'https://fixture.test/',hash:''},{replaceState(){}});
const failures=[],used=new Set(),cases=[],topics=new Map();
function check(slide,sector,label){
 assert.match(slide,/<h2>Wat zie je op deze foto\?<\/h2>/,label);
 const matches=[...slide.matchAll(/class="career-job-question">([^<]+)<\/p>/g)];assert.equal(matches.length,1,label+' exactly one professional follow-up');
 const q=matches[0][1];assert.equal((q.match(/\?/g)||[]).length,1);assert(q.length<160);
 assert.doesNotMatch(q,/\b(?:hoeveel|hoe lang|hoe zwaar|hoe laat|reken|rekenen|optellen|aftrekken|vermenigvuldig|centimeter|milliliter|kilogram)\b|\d/iu,label+' no numeracy question on slide one');
 assert.doesNotMatch(slide,/lesson-goal-banner|class="lesson-question"|Wat gebeurt er op deze werkplek\?|Wat doe je hier tijdens je werk\?|Waar moet je goed op letten\?|undefined|NaN/);
 assert.match(slide,/<img [^>]*src="(?!undefined|")/);
 const id=slide.match(/data-opening-photo="([^"]+)"/)?.[1],topic=slide.match(/data-opening-topic="([^"]+)"/)?.[1];
 if(topic==='fallback')failures.push({label,sector,id,q});
 topics.set(topic,(topics.get(topic)||0)+1);
 const p=fresh.find(x=>x.id===id)||bank.find(x=>x.id===id);
 if(p){assert.equal(p.sector,sector,label+' correct sector');used.add(id);}
 cases.push({label,sector,id,q,topic});
}
for(const year of data.years)for(const week of year)for(const lesson of week.lessons)for(const sector of data.sectors)for(const phase of Object.keys(data.phaseLabels)){
 app.state.previewPhase=phase;app.state.sector=sector.id;
 const variant=app.activeVariant(lesson,sector.id),deck={lesson,variant,sector:sector.id,step:1,revealed:false};app.state.deck=deck;
 assert(app.regularCareerRecord(deck),lesson.id+' exact or reviewed equivalent material photo: '+sector.id+' '+variant.material);
 const slides=app.regularSlides(deck);check(slides[0],sector.id,lesson.id+':'+phase);
 assert.match(slides[1],/lesson-goal-banner/);assert.match(slides[1],/class-discussion/);
}
for(const lesson of catalog.entries)for(const sector of data.sectors){
 const deck={catalog:lesson,sector:sector.id,step:1,revealed:false};app.state.deck=deck;
 const slides=app.catalogSlides(deck);check(slides[0],sector.id,lesson.id);
 assert.match(slides[1],/lesson-goal-banner/);
 if(lesson.visualTopic==='clock'||lesson.example.model?.kind==='clock')assert.equal(app.workplaceRecord(slides[0],sector.id)?.group,app.workplaceFamily(sector.id,fresh.find(p=>p.id==='start-'+sector.id+'-planning').material),'A real work-planning conversation');
 if(lesson.kind==='boxLitres')assert.match(slides[0],/data-career-photo-id="start-/);
}
for(const year of [1,2])for(let week=0;week<8;week++)for(let day=0;day<3;day++)for(const sector of data.sectors){
 app.state.year=year;const deck={metric:{week,day},sector:sector.id,step:1,revealed:false};app.state.deck=deck;
 check(app.metricSlides(deck)[0],sector.id,'metric:'+year+':'+week+':'+day);
}
const unusedQuestions=[];for(const p of bank){const profile=app.careerWorkProfile(app.lessonBankPhoto(p.id,p.sector),p.sector);if(profile.topic==='fallback')unusedQuestions.push({id:p.id,material:p.material});}
if(failures.length||unusedQuestions.length)console.log(JSON.stringify({uncoveredUsedPhotos:failures,uncoveredBankPhotos:unusedQuestions}));
assert.equal(failures.length,0,'Every lesson needs an authored professional follow-up for its actual photo');
assert.equal(unusedQuestions.length,0,'Cover every existing bank subject deliberately');
for(const p of fresh){const group=app.workplaceFamily(p.sector,p.material,p.varietyGroup),pool=app.allWorkplacePhotos().byGroup.get(group);assert(pool?.some(item=>item.id===p.id),'Available in the correct reviewed family '+p.id);assert(p.question&&p.topic!=='fallback');}
assert(used.size>=70,'Use the commissioned photographs throughout the actual openings');
assert.equal(cases.length,2180);
console.log('PASS: 2180 lesson/sector/phase openings; exact first question, one professional follow-up, no numeracy on slide one, 97 reviewed workplace photographs available, 700 existing subjects covered, correct sector/material and photo downloads.');
