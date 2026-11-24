import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {lessonProfile} from '../src/lesson-profiles.mjs';
const read=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const catalog=JSON.parse(await read('src/catalog-data.json'));
const data=JSON.parse(await read('src/lesson-data.json'));
const taskFixtures=Object.fromEntries((await fs.readdir(new URL('../assets/tasks',import.meta.url))).filter(f=>f.endsWith('.webp')).map(f=>[f.slice(0,-5),'data:image/webp;base64,fixture']));
assert.throws(()=>lessonProfile('unassignedFutureLesson'),/No specific teaching profile/);
for(const lesson of catalog.entries){
 const profile=lessonProfile(lesson.kind);
 assert.equal(lesson.visualTopic,profile.visual);
 assert(lesson.strategy.method&&lesson.strategy.followup&&lesson.strategy.mistake);
 const instruction=lesson.strategy.method+' '+lesson.strategy.followup;
 if(['money','coins'].includes(lesson.visualTopic))assert.doesNotMatch(instruction,/\bminuten?|uren?|klok|wijzer\b/i,lesson.kind);
 if(['time','clock'].includes(lesson.visualTopic))assert.doesNotMatch(instruction,/\beuro|centen?|wisselgeld|korting\b/i,lesson.kind);
 if(lesson.kind==='priceAddWhole')assert.doesNotMatch(instruction,/komma|centen|minuten|uur/i);
}
const nodes=new Map(),listeners={};
const document={documentElement:{requestFullscreen:()=>Promise.resolve()},querySelectorAll(){return[];},addEventListener(event,fn){(listeners[event]??=[]).push(fn);},getElementById(id){
 if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',hidden:false,open:false,handlers:{},setAttribute(){},removeAttribute(){},focus(){},querySelector(){return null;},addEventListener(event,fn){this.handlers[event]=fn;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();}});
 return nodes.get(id);
}};
for(const key of Object.keys(data.images))data.images[key]='data:image/png;base64,fixture';
data.brand.logo='data:image/png;base64,logo';
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);
document.getElementById('catalog-data').textContent=JSON.stringify(catalog);
const files=['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/catalog.js','src/client.js','src/photo-variety.js','src/teachers.js'];
const app=new Function('document','window','localStorage','location','history',(await Promise.all(files.map(read))).join('\n').replace('/* MEASUREMENT_PHOTOS */{}',()=>JSON.stringify(taskFixtures)).replace('/* COIN_PHOTOS */{}',()=>JSON.stringify(Object.fromEntries([200,100,50,20,10,5,2,1].map(v=>[v,'data:image/jpeg;base64,fixture']))))+'\nreturn {state,catalogGoalVisual,catalogMaterialPhoto,catalogModel,catalogSlides,openCatalogNotes};')(
 document,{addEventListener(){}},{getItem(){return null;}},{href:'https://fixture.test/',hash:'',protocol:'https:'},{replaceState(){}});
let goals=0;
for(const lesson of catalog.entries)for(const sector of data.sectors){
 const deck={catalog:lesson,sector:sector.id,step:1,revealed:false,modelSteps:0,columnSteps:0};app.state.deck=deck;
 const goal=app.catalogGoalVisual(lesson,deck),photo=app.catalogMaterialPhoto(lesson,sector.id);
 assert(goal.length>80,lesson.id);assert.doesNotMatch(goal,/undefined|NaN|catalog-material-photo/);
 if(lesson.visualTopic==='coins'){
  assert.match(goal,/data-lesson-visual="coins"/);
  assert.equal((goal.match(/data-denomination-cents=/g)||[]).length,4);
  assert.doesNotMatch(goal,/voerbak|voeder|brokjes/);
  const full=app.catalogSlides({...deck,step:2})[1];assert.equal((full.match(/data-denomination-cents=/g)||[]).length,8);
 }
 if(photo){assert.match(photo,new RegExp('data-photo-sector="'+sector.id+'"'));assert(lesson.visualTopic==='money'||lesson.visualTopic==='coins'||lesson.contexts[sector.id].photoKey||photo.includes('task-photo'));}
 else assert(!lesson.contexts[sector.id].photoKey);
 goals++;
}
const payment=catalog.entries.find(l=>l.id==='pro3-w13-di');assert.equal(payment.kind,'coins');
const whole=catalog.entries.find(l=>l.id==='pro3-w14-ma');assert.equal(whole.kind,'priceAddWhole');
let deck={catalog:whole,sector:'groen',step:2,revealed:false,modelSteps:0};app.state.deck=deck;
let slide=app.catalogSlides(deck)[1];
assert.match(slide,/Welke gegevens heb je nodig/);assert.doesNotMatch(slide,/minuten|komma|voerbakjes/);
assert.match(slide,/money-receipt/);assert(!slide.includes('€ 17,00'));
deck.modelSteps=whole.example.steps.length;slide=app.catalogSlides(deck)[1];assert(!slide.includes(whole.example.answer),'Slide two stays interactive when old model progress exists');
app.openCatalogNotes(whole.id);assert(nodes.get('details-body').innerHTML.includes(whole.example.answer),'The worked example remains available to the teacher');
app.state.deck={catalog:payment,sector:'groen',step:3,revealed:false,modelSteps:0};
const beforeZoom=JSON.stringify(app.state.deck),zoomButton={dataset:{coinZoom:'true'}};
for(const fn of listeners.click)fn({target:{closest(selector){return selector.startsWith('button')?zoomButton:null;}}});
assert(nodes.get('details').open);assert.equal((nodes.get('details-body').innerHTML.match(/data-denomination-cents=/g)||[]).length,8);
assert.equal(JSON.stringify(app.state.deck),beforeZoom);nodes.get('details').close();assert.equal(JSON.stringify(app.state.deck),beforeZoom);
const bridge=catalog.entries.find(l=>l.kind==='bridge');
assert.equal(bridge.visualTopic,'numberline');assert.match(app.catalogGoalVisual(bridge,{catalog:bridge,sector:'groen',step:1}),/Getallenlijn/);
for(const kind of ['endTime','endTimeMulti','startTime','startTimeMulti','startTimePrep']){
 const lesson=catalog.entries.find(l=>l.kind===kind),task=lesson.exercise;
 deck={catalog:lesson,sector:'zw',step:3,revealed:false};
 const picture=app.catalogModel(task,deck,true);assert(picture.includes('<strong>?</strong>'),kind+' must keep the unknown time hidden');
 deck.revealed=true;assert(!app.catalogModel(task,deck,true).includes('<strong>?</strong>'));
}
const assets=(await fs.readdir(new URL('../assets/topics',import.meta.url))).filter(x=>x.endsWith('.webp'));
assert.equal(assets.length,5);
assert.equal((await fs.readdir(new URL('../assets/coins',import.meta.url))).filter(f=>/\.(jpg|png)$/.test(f)).length,8);
const html=await read('dist/index.html');assert.match(html,/const coinPhotos=\{"/);assert.match(html,/const topicPhotos=\{"/);assert(!JSON.stringify(catalog).includes('Wat stelt de komma voor? Hoeveel minuten zitten in een uur?'));
console.log('Passed: '+goals+' lesson-matched goal visuals, exact coin values, matching sector scenes, separate money/time instruction, hidden unknown times and both reported screenshot regressions.');
