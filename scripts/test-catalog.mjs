import assert from "node:assert/strict";
import fs from "node:fs/promises";
import {buildCatalog} from "../src/catalog-authoring.mjs";
const readSource=path=>fs.readFile(new URL("../"+path,import.meta.url),"utf8");
const taskImages=Object.fromEntries((await fs.readdir(new URL('../assets/tasks/',import.meta.url))).map(file=>[file.slice(0,-5),'data:image/webp;base64,fixture']));
const bankFixture=JSON.parse(await readSource('assets/photo-bank/manifest.json')).images.filter(p=>p.status==='generated').map(p=>({id:p.id,kind:p.kind,sector:p.sector,material:p.material,alt:p.alt,width:p.width,height:p.height,referenceSubject:p.referenceSubject,batch:p.batch,url:'https://fixture.test/lesbeelden/'+p.file}));
const read=async path=>(await readSource(path)).replace('/* MEASUREMENT_PHOTOS */{}',JSON.stringify(taskImages)).replace('/* LESSON_PHOTO_BANK */[]',JSON.stringify(bankFixture));

const data=JSON.parse(await read("src/lesson-data.json"));
const catalog=JSON.parse(await read("src/catalog-data.json"));
const photoBank=JSON.parse(await read('assets/photo-bank/manifest.json'));
assert.deepEqual(buildCatalog(data,photoBank.images),catalog,"Authored lessons and image contexts must match the published catalogue.");
assert.equal(catalog.entries.length,244);
const ids=new Set(catalog.entries.map(lesson=>lesson.id));
assert.equal(ids.size,244);
for(let year=1;year<=2;year++)for(let week=1;week<=36;week++)for(const day of ["ma","di","do"]){
  assert(ids.has("pro"+(year+2)+"-w"+String(week).padStart(2,"0")+"-"+day));
}
const fromNL=value=>Number(value.replaceAll(".","").replace(",","."));
let sums=0;
for(const lesson of catalog.entries){
  assert(lesson.studentGoal.startsWith("Ik kan "),lesson.id);
  assert.equal(Object.keys(lesson.contexts).length,5);
  assert.equal(lesson.practice.length,5);
  for(const task of [lesson.example,lesson.exercise,...lesson.practice]){
    assert(task.question&&task.answer&&task.hint&&task.steps.length,lesson.id+": incomplete task");
    assert.doesNotMatch(JSON.stringify(task),/undefined|NaN/);
    for(const step of task.steps){
      const pattern=/((?:\d[\d.,]*\s*[+×÷−-]\s*)+\d[\d.,]*)\s*=\s*(-?\d[\d.,]*)/gu;
      for(const match of step.matchAll(pattern)){
        const tokens=match[1].match(/\d[\d.,]*|[+×÷−-]/g);
        const values=tokens.filter((_,i)=>i%2===0).map(fromNL);
        const operators=tokens.filter((_,i)=>i%2===1);
        for(let i=0;i<operators.length;){
          if(operators[i]==="×"||operators[i]==="÷"){
            const value=operators[i]==="×"?values[i]*values[i+1]:values[i]/values[i+1];
            values.splice(i,2,value);operators.splice(i,1);
          }else i++;
        }
        const expected=values.slice(1).reduce((total,value,i)=>operators[i]==="+"?total+value:total-value,values[0]);
        const result=fromNL(match[2]);
        assert(Math.abs(expected-result)<0.00001,lesson.id+": "+step);
        sums++;
      }
    }
  }
}
assert(sums>1500);
const nodes=new Map(),listeners={};
const document={
  documentElement:{requestFullscreen:()=>Promise.resolve()},
  addEventListener(event,fn){(listeners[event]??=[]).push(fn);},
  querySelectorAll(){return [];},
  getElementById(id){
    if(!nodes.has(id))nodes.set(id,{textContent:"",innerHTML:"",hidden:false,open:false,attributes:{},handlers:{},
      addEventListener(event,fn){this.handlers[event]=fn;},setAttribute(key,value){this.attributes[key]=value;},removeAttribute(){},focus(){},
      querySelector(){return null;},showModal(){this.open=true;},close(){this.open=false;this.handlers.close?.();}});
    return nodes.get(id);
  }
};
for(const key of Object.keys(data.images))data.images[key]="data:image/png;base64,fixture";
data.brand.logo="data:image/png;base64,logo";
document.getElementById("rekenstart-data").textContent=JSON.stringify(data);
document.getElementById("catalog-data").textContent=JSON.stringify(catalog);
const location={href:"https://fixture.test/",hash:"",protocol:"https:"};
const history={replaceState(a,b,url){const parsed=new URL(url);location.href=parsed.href;location.hash=parsed.hash;}};
const code=(await Promise.all(["src/common.js","src/visuals.js","src/measurement-visuals.js","src/metric.js","src/catalog.js","src/client.js","src/photo-variety.js","src/teachers.js"].map(read))).join("\n");
const app=new Function("document","window","localStorage","location","history",code+
  "\nreturn {state,settings,catalogFilters,renderCatalog,renderCatalogResults,filteredCatalogEntries,openCatalogLesson,openCatalogNotes,renderDeck,parseLink};")(
    document,{addEventListener(){}},{getItem(){return null;}},location,history);
const settingsBefore=JSON.stringify(app.settings);
const startWeek=app.state.week;
app.state.page="lessen";
app.renderCatalog();
assert.match(nodes.get("lessen").innerHTML,/catalog-query/);
app.catalogFilters.domain="getallen";
app.catalogFilters.query="optellen onder elkaar";
assert.equal(app.filteredCatalogEntries().length,2);
app.catalogFilters.year="1";
assert.equal(app.filteredCatalogEntries().length,1);
app.catalogFilters.query="xyzgeenles";
app.renderCatalogResults();
assert.match(nodes.get("catalog-results").innerHTML,/geen lessen/);
Object.assign(app.catalogFilters,{domain:"all",year:"all",query:"",week:"all"});
let views=0;
for(const lesson of catalog.entries)for(const sector of data.sectors){
  app.state.sector=sector.id;
  app.state.deck={catalog:lesson,sector:sector.id,step:1,revealed:false,modelSteps:0,columnSteps:0};
  for(let step=1;step<=4;step++){
    app.state.deck.step=step;
    app.renderDeck();
    const html=nodes.get("deck").innerHTML;
    assert.doesNotMatch(html,/undefined|NaN/);
    assert.match(html,/Dia [1-4] van 4/);
    assert.doesNotMatch(html,/<a[^>]+href="[^"]*numo\.nl|Open Numo/i);
    if(step===1){assert.match(html,/career-opening/);assert.doesNotMatch(html,/lesson-goal-banner|class="lesson-question"/);}
    if(step===2){assert.match(html,/lesson-goal-banner/);assert.match(html,/class-discussion/);assert.doesNotMatch(html,/data-action="show-model"|data-action="show-column"|aria-label="Uitwerking"/);}
    if(step===4)assert.match(html,/Dit kun je ook oefenen in Numo:/);
    if(step===3){
      assert.match(html,/Geef een hint/);
      assert.match(html,/Daag uit/);
      assert(!html.includes('aria-label="Uitwerking"'));
      app.state.deck.revealed=true;app.renderDeck();
      assert.match(nodes.get("deck").innerHTML,/aria-label="Uitwerking"/);
      app.state.deck.revealed=false;
    }
    if(step===4)assert.equal((html.match(/<summary>Antwoord/g)||[]).length,5);
    views++;
  }
  app.openCatalogNotes(lesson.id);
  assert.match(nodes.get("details-body").innerHTML,/Extra som 5/);
}
assert.equal(views,4880);
const click=dataset=>{
  const button={dataset,disabled:false};
  for(const fn of listeners.click)fn({target:{closest(selector){return selector==="button"?button:null;}}});
};
app.state.sector="groen";
click({catalogOpen:"pro3-columnAdd"});
assert.equal(app.state.deck.catalog.id,"pro3-columnAdd");
assert.equal(app.state.deck.step,1);
click({action:"next-slide"});
assert.equal(app.state.deck.step,2);
assert.match(nodes.get("deck").innerHTML,/Onder elkaar rekenen/);
const deckBeforeNotes=JSON.stringify(app.state.deck);
click({action:"deck-notes"});
assert(nodes.get('details').open);
assert.match(nodes.get('details-body').innerHTML,/details-close/);
click({action:"close-details"});
assert(!nodes.get('details').open);
assert.equal(JSON.stringify(app.state.deck),deckBeforeNotes,'Closing teacher instructions preserves the lesson and slide');
click({action:"next-slide"});
click({action:"reveal"});
assert.equal(app.state.deck.revealed,true);
click({action:"close-deck"});
assert.equal(location.hash,"#lessen");
assert.equal(app.state.deck,null);
assert.equal(JSON.stringify(app.settings),settingsBefore);
assert.equal(app.state.week,startWeek,"A free choice must not change the planned week.");
location.hash="#bibliotheek=pro4-w36-di&sector=techniek";
app.parseLink();
assert.equal(app.state.deck.catalog.id,"pro4-w36-di");
assert.equal(app.state.deck.sector,"techniek");
assert.equal(JSON.stringify(app.settings),settingsBefore);
console.log("Passed: 244 lessons, "+sums+" checked calculations, 4880 presentation views, search, preparation, direct links and preserved planning.");


const chosen=app.state.deck.catalog.id;
for(const fn of listeners.change)fn({target:{id:"deck-sector",value:"zw"}});
assert.equal(app.state.deck.catalog.id,chosen);
assert.equal(app.state.deck.sector,"zw");
assert.equal(app.state.deck.step,1);
click({action:"close-deck"});
const beforeMetricYear=app.state.year;
app.catalogFilters.year="2";
click({catalogMetricWeek:"0",catalogMetricDay:"0"});
assert.equal(app.state.year,2);
assert(app.state.deck.metric);
click({action:"close-deck"});
assert.equal(app.state.year,beforeMetricYear);
assert.equal(location.hash,"#lessen");
console.log("Passed: sector switching and catalogue grade selection for metric lessons.");
