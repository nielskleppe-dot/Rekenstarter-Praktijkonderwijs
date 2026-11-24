import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
const read=p=>readFile(new URL('../'+p,import.meta.url),'utf8');
const data=JSON.parse(await read('src/lesson-data.json')),catalog=JSON.parse(await read('src/catalog-data.json'));
const bank=JSON.parse(await read('assets/photo-bank/manifest.json')).images;
const career=JSON.parse(await read('assets/career-openings/manifest.json')).images;
const assignments=JSON.parse(await read('assets/career-openings/variety-generation-jobs.json')).images;
assert.equal(assignments.length,70);
assert.equal(new Set([...bank,...career].map(p=>p.sha256)).size,bank.length+career.length,'A different photo means genuinely different image bytes');
const nodes=new Map(),document={querySelectorAll(){return[];},addEventListener(){},getElementById(id){if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',setAttribute(){},addEventListener(){},querySelector(){return null;}});return nodes.get(id);}};
for(const key of Object.keys(data.images))data.images[key]='fixture:'+key;
data.brand.logo='fixture:logo';
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);
document.getElementById('catalog-data').textContent=JSON.stringify(catalog);
const photos={};for(const dir of ['tasks','measurement'])for(const file of await readdir(new URL('../assets/'+dir+'/',import.meta.url)))if(file.endsWith('.webp'))photos[file.slice(0,-5)]='https://fixture.test/'+dir+'/'+file;
const topics={};for(const file of await readdir(new URL('../assets/topics/',import.meta.url)))if(file.endsWith('.webp'))topics[file.slice(0,-5)]='https://fixture.test/topics/'+file;
let source=(await Promise.all(['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/catalog.js','src/client.js','src/photo-variety.js'].map(read))).join('\n');
const meta=items=>items.map(p=>({...p,url:'/lesbeelden/'+p.file}));
source=source.replace('/* LESSON_PHOTO_BANK */[]',()=>JSON.stringify(meta(bank))).replace('/* CAREER_PHOTOS */[]',()=>JSON.stringify(meta(career))).replace('/* MEASUREMENT_PHOTOS */{}',()=>JSON.stringify(photos)).replace('/* TOPIC_PHOTOS */{}',()=>JSON.stringify(topics));
const app=new Function('document','window','localStorage','location','history',source+'\nreturn {state,activeVariant,regularSlides,catalogSlides,metricSlides,renderDeck,allWorkplacePhotos,workplaceRecord,workplaceFamily,workplacePhotoMarkup};')(document,{addEventListener(){}},{getItem(){return null;}},{href:'https://fixture.test/',hash:''},{replaceState(){}});
const registry=app.allWorkplacePhotos(),used=new Set();
for(const assignment of assignments){
 const photo=registry.byId.get(assignment.id),original=registry.byId.get(assignment.sourceId);
 assert(photo&&original,assignment.id+' source and alternative available');
 assert.equal(photo.sector,original.sector);assert.equal(photo.group,original.group,assignment.id+' exact reviewed material family');
}
function photoIds(html,sector){
 const ids=new Set();
 for(const match of html.matchAll(/<figure\b[^>]*>/g)){
  const record=app.workplaceRecord(match[0],sector);if(record){assert.equal(record.sector,sector);ids.add(record.id);used.add(record.id);}
 }
 return [...ids].sort();
}
let pairs=0,days=0,slides=0,weekEdges=0,yearEdges=0;
function checkSeries(label,decks){
 let previous=[],previousDeck;
 for(const deck of decks){
  app.state.deck=deck;app.state.year=deck.year||deck.catalog?.year||Number(deck.lesson?.id.split('-')[0])||1;
  const all=new Set();
  for(let step=1;step<=4;step++){
   deck.step=step;
   const before=JSON.stringify(deck),render=()=>{app.renderDeck();return nodes.get('deck').innerHTML;};
   const html=render();assert.doesNotMatch(html,/undefined|\bNaN\b/);
   assert.doesNotMatch(html,/<a[^>]*href="[^"]*numo\.nl|Open Numo/i,'Numo is an exercise reference without a link');
   if(step===4)assert.match(html,/Dit kun je ook oefenen in Numo:/);
   if(step===2){assert.match(html,/class="lesson-heading"/);assert.match(html,/lesson-goal-banner/);assert.match(html,/class-discussion/);}
   const ids=photoIds(html,deck.sector);assert.deepEqual(photoIds(render(),deck.sector),ids,'Same lesson and day stays stable after rerendering');
   assert.equal(JSON.stringify(deck),before,'Photo choice cannot change the lesson or the sums');
   for(const id of ids)all.add(id);slides++;
  }
  assert(all.size,label+' every lesson has a relevant occupational image');
  for(const id of previous)assert(!all.has(id),label+' '+(deck.catalog?.id||deck.lesson?.id||JSON.stringify(deck.metric))+' repeats '+id+' from the previous lesson day');
  if(previousDeck){pairs++;
   const previousDay=previousDeck.catalog?.day||previousDeck.lesson?.day||previousDeck.metric?.day,currentDay=deck.catalog?.day||deck.lesson?.day||deck.metric?.day;
   if((previousDay==='do'&&currentDay==='ma')||(previousDay===2&&currentDay===0))weekEdges++;
   if((previousDeck.year||previousDeck.catalog?.year||previousDeck.lesson?.id[0])!==(deck.year||deck.catalog?.year||deck.lesson?.id[0]))yearEdges++;
  }
  previous=[...all];previousDeck=deck;days++;
 }
}
for(const {id:sector} of data.sectors){
 for(const phase of Object.keys(data.phaseLabels)){
  app.state.previewPhase=phase;app.state.sector=sector;
  checkSeries('starter '+sector+' '+phase,data.years.flatMap(y=>y.flatMap(w=>w.lessons)).map(lesson=>({lesson,variant:app.activeVariant(lesson,sector),sector,revealed:false})));
 }
 checkSeries('catalogue '+sector,catalog.entries.filter(l=>/^pro[34]-w\d\d-/.test(l.id)).map(lesson=>({catalog:lesson,sector,revealed:false})));
 checkSeries('extra lessons '+sector,catalog.entries.filter(l=>!/^pro[34]-w\d\d-/.test(l.id)).map(lesson=>({catalog:lesson,sector,revealed:false})));
 const metrics=[];for(const year of [1,2])for(let week=0;week<8;week++)for(let day=0;day<3;day++)metrics.push({metric:{week,day},year,sector,revealed:false});
 checkSeries('metric '+sector,metrics);
}
assert(weekEdges>500&&yearEdges>=25,'Includes Thursday to Monday and both school years');
for(const assignment of assignments)assert(used.has(assignment.id),'Use the commissioned alternative '+assignment.id);
const html=await read('dist/index.html');assert.doesNotMatch(html,/href="https?:\/\/(?:mijn\.)?numo\.nl\//);
console.log('PASS: '+pairs+' adjacent-day comparisons, '+days+' lessons / '+slides+' slides, '+weekEdges+' week boundaries, '+yearEdges+' year boundaries; distinct material-matched photos, stable lesson choices and no Numo hyperlinks.');
