import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
const readSource=p=>fs.readFile(new URL('../'+p,import.meta.url),'utf8');
const taskImages=Object.fromEntries((await fs.readdir(new URL('../assets/tasks/',import.meta.url))).map(file=>[file.slice(0,-5),'data:image/webp;base64,fixture']));
const read=async path=>(await readSource(path)).replace('/* MEASUREMENT_PHOTOS */{}',JSON.stringify(taskImages));

const source=JSON.parse(await read('src/lesson-data.json'));
const html=await read('dist/index.html');
const embedded=JSON.parse(html.match(/<script type="application\/json" id="rekenstart-data">([\s\S]*?)<\/script>/)[1]);
assert.deepEqual(embedded,source,'The deployed page must contain the complete v7 lesson data and pictures');
assert.equal(source.professionalRevision.phaseVariants,720);
assert.match(html,/id="ai-connection"/);
assert.match(html,/id="wc-assistant"/);
// Avoid repeatedly allocating embedded photo bytes; inspect their loading in the browser.
const data=structuredClone(source);
for(const key of Object.keys(data.images))data.images[key]='data:image/png;base64,fixture';
data.brand.logo='data:image/png;base64,logo';
const nodes=new Map();
const document={addEventListener(){},getElementById(id){
 if(!nodes.has(id))nodes.set(id,{textContent:'',innerHTML:'',hidden:false,open:false,addEventListener(){},setAttribute(){},showModal(){this.open=true;},querySelector(){return null;}});
 return nodes.get(id);
}};
document.getElementById('rekenstart-data').textContent=JSON.stringify(data);
const code=(await Promise.all(['src/common.js','src/visuals.js','src/measurement-visuals.js','src/metric.js','src/client.js','src/photo-variety.js','src/teachers.js'].map(read))).join('\n');
const app=new Function('document','window','localStorage',code+'\nreturn {state,renderDeck,openPrep,activeVariant,metricItem,renderMetricOverview,columnCalculation,columnOperands,pmMetricReference,measureRoute,drawArches,metricRouteWorking,openPMMetricReference,referenceForTask};')(
 document,{addEventListener(){}},{getItem(){return null;}}
);
let variants=0,slides=0;
for(const year of data.years)for(const week of year)for(const lesson of week.lessons){
 for(const phase of Object.keys(data.phaseLabels))for(const sector of data.sectors){
  app.state.previewPhase=phase;app.state.sector=sector.id;
  const variant=app.activeVariant(lesson,sector.id),w=variant.workplace;
  assert(w?.role&&w.place&&w.secondContext&&w.teacherReport,lesson.id+': missing workplace context');
  assert(Number.isInteger(w.panel)&&w.panel>=0&&w.panel<6);
  assert.equal(variant.phase,phase);
  app.state.deck={lesson,variant,sector:sector.id,mode:'main',step:1,revealed:false};
  for(let step=1;step<=4;step++){
   app.state.deck.step=step;app.renderDeck();
   const view=nodes.get('deck').innerHTML;
   assert.doesNotMatch(view,/undefined|\bNaN\b/);
   assert.match(view,new RegExp('Dia '+step+' van 4'));
   assert.match(view,/class="deck-logo"/);
   assert.doesNotMatch(view,/<a[^>]+href="[^"]*numo\.nl|Open Numo/i);
   if(step===4){assert.match(view,/Dit kun je ook oefenen in Numo:/);assert.doesNotMatch(view,/Verder oefenen in Numo/);}

   if(step===4)assert.equal((view.match(/<summary>Antwoord/g)||[]).length,5);
   if(step===1){
    assert.match(view,/class="career-opening"/);assert.match(view,/class="career-photo"/);
    assert.doesNotMatch(view,/lesson-goal-banner|class="lesson-question"/);
   }
   assert(!view.includes('aria-label="Uitwerking"'),'Answers are hidden on opening each slide');
   if(step===2){
    assert.match(view,/lesson-goal-banner/);assert.match(view,/class-discussion/);
    assert.doesNotMatch(view,/Toon de rekenstap|data-action="show-model"|gebruikte aantal in handige stukken/);
    app.state.deck.modelSteps=99;app.state.deck.revealed=true;app.renderDeck();
    assert.doesNotMatch(nodes.get('deck').innerHTML,/aria-label="Uitwerking"|rekenstappen van de uitwerking/);
    app.state.deck.modelSteps=0;app.state.deck.revealed=false;
   }
   if(step===3){
    assert.match(view,/<details><summary>Geef een hint<\/summary>/);
    assert.match(view,/<details><summary>Daag uit<\/summary>/);
   }
   if(step===3){
    assert.match(view,/Toon uitwerking/);
    app.state.deck.revealed=true;app.renderDeck();
    assert(nodes.get('deck').innerHTML.includes('aria-label="Uitwerking"'));
    app.state.deck.revealed=false;
   }
   slides++;
  }
  app.openPrep(lesson);
  assert.match(nodes.get('details-body').innerHTML,/De beroepssituatie/);
  assert.match(nodes.get('details-body').innerHTML,/Maak een werkkaart/);
  assert.match(nodes.get('details-body').innerHTML,/Rekencoach/);
  assert.match(nodes.get('details-body').innerHTML,/details-close/);
  assert.match(nodes.get('details-body').innerHTML,/Rekenvoorbeeld bij dia 2/);
  assert.doesNotMatch(nodes.get('details-body').innerHTML,/Bronkoppeling|curriculumkoppeling/);
  if(lesson.id==='1-4-di'){
   assert.match(nodes.get('details-body').innerHTML,/gebruikte aantal in handige stukken/);
   assert(nodes.get('details-body').innerHTML.includes(lesson.main.steps[0]));
  }
  variants++;
 }
}
assert.equal(variants,720);assert.equal(slides,2880);
console.log('Passed: exact embedded v7 data, all 720 professional variants / 2880 slides, hidden answers, teacher preparation and workcard/coach entry points.');

app.renderMetricOverview();
assert.equal((nodes.get("metric-overview").innerHTML.match(/data-metric-week=/g)||[]).length,24);
for(const year of [1,2])for(const sector of data.sectors)for(let week=0;week<8;week++)for(let day=0;day<3;day++){
 app.state.year=year;
 app.state.deck={metric:{week,day},sector:sector.id,step:3,revealed:false};
 app.renderDeck();
 const view=nodes.get("deck").innerHTML;
 assert.match(view,/Schrijf je antwoord op/);
 assert.match(view,/<details><summary>Geef een hint<\/summary>/);
 assert.match(view,/<details><summary>Daag uit<\/summary>/);
 assert.doesNotMatch(view,/undefined|aria-label="Uitwerking"/);
 app.state.deck.step=3;
 app.state.deck.revealed=true;
 app.renderDeck();
 assert.match(nodes.get("deck").innerHTML,/aria-label="Uitwerking"/);
 app.state.deck.step=4;app.renderDeck();assert.equal((nodes.get("deck").innerHTML.match(/<summary>Antwoord/g)||[]).length,5);assert.match(nodes.get("deck").innerHTML,/Dit kun je ook oefenen in Numo:/);assert.doesNotMatch(nodes.get("deck").innerHTML,/Open Numo|numo\.nl/);
}
console.log("Passed: 24 metric lessons, both grades and all five sectors.");

const addition=app.columnCalculation({a:38,b:17,add:true},1);
assert.match(addition,/Schrijf 5 en neem 1 mee naar links/);
assert.match(addition,/<td>\+1<\/td>/);
assert.match(addition,/<td><\/td><td>5<\/td>/);
const difference=app.columnCalculation({a:63,b:27,add:false},2);
assert.match(difference,/6 − 1 = 5\. 5 − 2 = 3/);
assert.match(difference,/<td>3<\/td><td>6<\/td>/);
console.log("Passed: collapsed differentiation and checked carrying and exchanging in column calculations.");

// Guard the different factors on the school poster and both conversion directions.
const conversionCases = [
  ['length', 'm', 'cm', 1.5, '150'],
  ['length', 'cm', 'm', 125, '1,25'],
  ['mass', 'kg', 'g', 0.75, '750'],
  ['mass', 'g', 'kg', 750, '0,75'],
  ['volume', 'l', 'ml', 1.5, '1.500'],
  ['volume', 'ml', 'l', 250, '0,25'],
  ['area', 'm²', 'cm²', 1, '10.000'],
  ['cube', 'dm³', 'cm³', 1, '1.000']
];
for (const [row, from, to, value, expected] of conversionCases) {
  const route = app.measureRoute(row, from, to, value);
  assert.equal(route.values.at(-1), expected, row + ': wrong conversion factor');
  const card = app.pmMetricReference(row);
  for (const unit of route.units) assert(card.includes('>' + unit + '</text>'));
  assert(card.includes('× ' + route.factor.toLocaleString('nl-NL')));
  assert(card.includes('÷ ' + route.factor.toLocaleString('nl-NL')));
  const unstarted = app.drawArches(route, 0);
  assert.equal((unstarted.match(/class="value"/g) || []).length, 1);
  assert.equal((unstarted.match(/class="active"/g) || []).length, 0);
  const firstStep = app.drawArches(route, 1);
  assert.equal((firstStep.match(/class="active"/g) || []).length, 1);
  assert.equal((app.drawArches(route, route.count).match(/class="active"/g) || []).length, route.count);
}
const lengthRoute = app.measureRoute('length', 'm', 'cm', 1.5);
assert.equal(app.metricRouteWorking({route: lengthRoute}, 0), '');
const firstWorking = app.metricRouteWorking({route: lengthRoute}, 1);
assert(firstWorking.includes('1,5 × 10 = 15'));
assert(firstWorking.includes('1,5 m = 15 dm'));
assert(!firstWorking.includes('150 cm'));
assert(app.metricRouteWorking({route: lengthRoute}, 2).includes('15 dm = 150 cm'));
const sameUnit = app.drawArches(app.measureRoute('length', 'm', 'm', 1), 0);
assert.equal((sameUnit.match(/class="value"/g) || []).length, 1);
const openLesson = app.state.deck;
app.openPMMetricReference('length');
assert.strictEqual(app.state.deck, openLesson, 'Opening the reference must preserve the lesson and slide');
assert.match(nodes.get('details-body').innerHTML, /Rekenen op de PM/);
assert.match(nodes.get('details-body').innerHTML, /1 m = 10 dm = 100 cm = 1.000 mm/);
assert.equal(app.referenceForTask(data.years[0][2].lessons[0].main, 'add'), '');
assert.match(app.referenceForTask(data.years[0][6].lessons[1].main, 'cm'), /data-pm-metric-row="length"/);
console.log('Passed: PM poster factors, full unit rows, incremental routes and reference entry points.');
