import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {measurementKinds,measurementTask} from '../src/measurement-authoring.mjs';
const readSource=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const taskImages=Object.fromEntries((await fs.readdir(new URL('../assets/tasks/',import.meta.url))).map(file=>[file.slice(0,-5),'data:image/webp;base64,fixture']));
const bankFixture=JSON.parse(await readSource('assets/photo-bank/manifest.json')).images.filter(p=>p.status==='generated').map(p=>({id:p.id,kind:p.kind,sector:p.sector,material:p.material,alt:p.alt,width:p.width,height:p.height,referenceSubject:p.referenceSubject,batch:p.batch,url:'https://fixture.test/lesbeelden/'+p.file}));
const read=async path=>(await readSource(path)).replace('/* MEASUREMENT_PHOTOS */{}',JSON.stringify(taskImages)).replace('/* LESSON_PHOTO_BANK */[]',JSON.stringify(bankFixture));

const data=JSON.parse(await read('src/lesson-data.json'));
const catalog=JSON.parse(await read('src/catalog-data.json'));
const fromNL=s=>Number(String(s).replaceAll('.','').replace(',','.'));
let tasks=0;
for(const year of [1,2])for(const [kind] of measurementKinds)for(let i=0;i<8;i++){
 const task=measurementTask(kind,i,year),m=task.model;
 if(m.kind==='measureRuler'){
  if(kind!=='markLength')assert(Math.abs((m.objectEnd-m.objectStart)-task.result)<1e-8);
  assert(m.objectEnd===null||m.objectEnd<=m.max);
 }
 if(kind==='readDigital'||kind==='readDial')assert.equal(task.result,m.value);
 if(m.kind==='measureDial'||m.kind==='measureJug'){
  assert(m.value>=0&&m.value<=m.max);
  assert(Math.abs(m.value/m.minor-Math.round(m.value/m.minor))<1e-9,'Readout must land on a tick: '+kind);
  assert.equal(m.major/m.minor,Math.round(m.major/m.minor));
 }
 if(kind==='tareScale')assert.equal(task.result,m.value-fromNL(task.facts[0].value.replace(' g','')));
 if(kind==='fillMass')assert.equal(task.result,fromNL(task.facts[0].value.replace(' kg',''))*1000-m.value);
 if(kind==='boxLitres')assert.equal(task.result,m.length*m.width*m.height/1000);
 if(kind==='borderOrSurface')assert.equal(task.result,m.edge?2*(m.length+m.width):m.length*m.width);
 if(m.kind==='measureJug')assert.equal(task.result,m.value);
 assert.doesNotMatch(JSON.stringify(task),/undefined|NaN/);tasks++;
}
assert.notEqual(measurementTask('readDial',0,1).model.minor,measurementTask('readDial',0,2).model.minor,'Advanced grade uses a finer scale.');
const photoKeys=(await fs.readdir(new URL('../assets/measurement',import.meta.url))).filter(f=>f.endsWith('.webp'));
assert.equal(photoKeys.length,15);
const photoHashes=new Set();
for(const sector of data.sectors)for(const kind of ['length','mass','volume']){
 const image=await fs.readFile(new URL('../assets/measurement/'+sector.id+'-'+kind+'.webp',import.meta.url));
 assert.equal(image.toString('ascii',0,4),'RIFF');assert.equal(image.toString('ascii',8,12),'WEBP');
 assert(image.length>10000);photoHashes.add(createHash('sha256').update(image).digest('hex'));
}
assert.equal(photoHashes.size,15,'Every sector and tool has its own image.');
const nodes=new Map(),listeners={};
const document={documentElement:{requestFullscreen:()=>Promise.resolve()},querySelectorAll(){return[];},
 addEventListener(event,fn){(listeners[event]??=[]).push(fn);},getElementById(id){
  if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',hidden:false,open:false,handlers:{},attributes:{},focus(){},
   addEventListener(event,fn){this.handlers[event]=fn;},setAttribute(k,v){this.attributes[k]=v;},removeAttribute(){},querySelector(){return null;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();}});
  return nodes.get(id);
 }};
for(const key of Object.keys(data.images))data.images[key]='data:image/png;base64,fixture';
data.brand.logo='data:image/png;base64,logo';
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);
document.getElementById('catalog-data').textContent=JSON.stringify(catalog);
const location={href:'https://fixture.test/',hash:'',protocol:'https:'};
const history={replaceState(a,b,url){const p=new URL(url);location.href=p.href;location.hash=p.hash;}};
const files=['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/catalog.js','src/client.js','src/photo-variety.js','src/teachers.js'];
const app=new Function('document','window','localStorage','location','history',(await Promise.all(files.map(read))).join('\n')+
 '\nreturn {state,settings,catalogFilters,measurementVisual,legacyMeasureModel,metricReadout,lessonMeasure,renderDeck,openCatalogLesson,openMetricNotes,parseLink,filteredCatalogEntries};')(
  document,{addEventListener(){}},{getItem(){return null;}},location,history);
assert.equal(app.legacyMeasureModel({type:'scale',grams:'1.250 g'}).value,1250);
// Check actual rendered positions against independent scale calculations.
const jug=app.measurementVisual({kind:'measureJug',value:375,max:1000,minor:25,major:250,unit:'ml'});
const waterLine=jug.match(/<path d="M215 ([\d.]+)H495" stroke="#075e80"/);
assert(waterLine);assert.equal(Number(waterLine[1]),335-(375/1000)*295);
const dial=app.measurementVisual({kind:'measureDial',value:425,max:1000,minor:25,major:250,unit:'g'});
const needle=dial.match(/<path d="M390 208L([\d.]+) ([\d.]+)" stroke="#c51f43"/);
assert(needle);
const angle=(-140+280*425/1000)*Math.PI/180;
assert(Math.abs(Number(needle[1])-(390+140*Math.sin(angle)))<1e-8);
assert(Math.abs(Number(needle[2])-(208-140*Math.cos(angle)))<1e-8);
const ruler=app.measurementVisual({kind:'measureRuler',start:0,max:20,minor:.1,major:1,unit:'cm',objectStart:3,objectEnd:11.4});
const endpoint=ruler.matchAll(/<path d="M([\d.]+) 54V112"/g);
const endpoints=[...endpoint].map(m=>Number(m[1]));
assert.equal(endpoints.length,2);
assert(Math.abs(endpoints[0]-(45+690*3/20))<1e-8);
assert(Math.abs(endpoints[1]-(45+690*11.4/20))<1e-8);
const thermometer=app.measurementVisual({kind:'measureThermometer',value:16,max:30});
assert.match(thermometer,/<path d="M310 330V175" stroke="#bf2341"/);
let views=0;
for(const lesson of catalog.entries.filter(l=>measurementKinds.some(([kind])=>kind===l.kind)))for(const sector of data.sectors){
 app.state.deck={catalog:lesson,sector:sector.id,step:1,revealed:false,modelSteps:0};
 for(let step=1;step<=4;step++){
  app.state.deck.step=step;app.renderDeck();const html=nodes.get('deck').innerHTML;
  assert.match(html,/<svg|<img/);assert.doesNotMatch(html,/undefined|NaN/);
  if(lesson.kind!=='borderOrSurface')assert.match(html,new RegExp('data-photo-sector="'+sector.id+'"'));
  for(const other of data.sectors.filter(s=>s.id!==sector.id))assert(!html.includes('data-photo-sector="'+other.id+'"'));
  if(step===1)assert.match(html,/class="career-opening"/);
  if(step===2||step===3)assert.match(html,/data-measure-zoom/);
  if(step===3)assert(!html.includes('aria-label="Uitwerking"'));
  if(step===4)assert.equal((html.match(/<summary>Antwoord/g)||[]).length,5);
  views++;
 }
}
for(const year of [1,2])for(const sector of data.sectors)for(let week=0;week<8;week++)for(let day=0;day<3;day++){
 app.state.year=year;app.state.deck={metric:{week,day},sector:sector.id,step:2,revealed:false};
 const l=app.lessonMeasure(app.state.deck),picture=app.metricReadout(l,app.state.deck);
 assert.match(picture,/<svg/);assert.doesNotMatch(picture,/undefined|NaN/);
 if(l.row==='cube'){assert.match(l.question,/binnenmaten/);assert.doesNotMatch(l.question,/blokjes|lagen/);}
 app.openMetricNotes(app.state.deck);assert.match(nodes.get('details-body').innerHTML,/Wij oefenen en controleren/);
}
const close=()=>nodes.get('details').close();close();
app.openCatalogLesson('pro3-readDial',false);app.state.deck.step=3;app.renderDeck();
const before=JSON.stringify(app.state.deck),settingsBefore=JSON.stringify(app.settings);
const model=measurementTask('readDial',1,1).model;
const button={dataset:{measureZoom:JSON.stringify(model)}};
for(const fn of listeners.click)fn({target:{closest(selector){return selector.startsWith('button')?button:null;}}});
assert(nodes.get('details').open);assert.match(nodes.get('details-body').innerHTML,/measure-enlarged/);
assert.equal(JSON.stringify(app.state.deck),before);
for(const fn of listeners.keydown)fn({key:'ArrowRight',target:{closest(){return null;}},preventDefault(){}});
assert.equal(JSON.stringify(app.state.deck),before,'Keyboard arrows must not change the lesson behind a zoomed instrument.');
close();assert.equal(JSON.stringify(app.state.deck),before);
assert.equal(JSON.stringify(app.settings),settingsBefore);
app.catalogFilters.query='aflezen';app.catalogFilters.domain='all';
assert(app.filteredCatalogEntries().filter(l=>/readRuler|readTape|readDigital|readDial|readJug|jugIntervals/.test(l.kind)).length>=12);
app.catalogFilters.query='binnenmaten';assert(app.filteredCatalogEntries().some(l=>l.kind==='boxLitres'));
location.hash='#metrieklessen';app.parseLink();assert.equal(app.state.page,'lessen');assert.equal(app.catalogFilters.domain,'meten');
const index=await read('src/index.html');
assert(!index.includes('data-page="metrieklessen"'),'The retired metric button must not remain in navigation or the start page.');
const html=await read('dist/index.html');assert.match(html,/const measurementPhotos=\{"/);assert.match(html,/data-catalog-query/);
console.log('Passed: '+tasks+' exact measurement tasks, 15 distinct sector photos, '+views+' sector-specific slides, hidden solutions, instrument zoom, concrete box capacity and retained routes.');
