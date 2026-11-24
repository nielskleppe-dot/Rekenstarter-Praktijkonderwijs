function openMetricDeck(week,day,fullscreen=true){
 if(!metricTopics[week]?.items[day])return;
 const libraryYearBefore=state.deck?.libraryYearBefore;
 state.deck={metric:{week,day},sector:state.sector,step:1,revealed:false};
 if(libraryYearBefore)state.deck.libraryYearBefore=libraryYearBefore;
 renderDeck();
 const presentation=$("presentation");
 if(!presentation.open)presentation.showModal();
 const url=new URL(location.href);
 url.hash=new URLSearchParams({metriek:week+"-"+day,jaar:state.year,sector:state.sector}).toString();
 writeHash(url.href);
 if(fullscreen)enterFullscreen();
}
// Unit rows and factors follow the school poster, “Rekenen op de PM doen we zo!”.
const metricRows={
 length:["Lengte","km hm dam m dm cm mm",10],mass:["Gewicht","kg hg dag g dg cg mg",10],
 volume:["Inhoud in liters","kl hl dal l dl cl ml",10],area:["Oppervlakte","km² hm² dam² m² dm² cm² mm²",100],
 cube:["Volume in kubieke maten","km³ hm³ dam³ m³ dm³ cm³ mm³",1000]
};
const sectorMaterials={
 groen:["het tuinpad","het voerbakje","de gieter","het plantvak","de waterbak"],
 techniek:["de montagelat","het bakje moeren","de kan met schoon water","het werkblad","de bak voor schoon water"],
 hbr:["de buffettafel","het pak meel","de melkkan","het tafelblad","de voorraadbak"],
 zw:["de linnenplank","de kom havermout","de waterkan","het schap","de afwasbak"],
 eco:["het winkelschap","het pakket","de navulfles","het reclamebord","de demonstratiebak"]
};
// Titel, grootheid, beginmaat, doelmaat, hoeveelheid per lesfase.
const metricTopics=[
 ["Lengte zien en meten",[
 ["Van een meter naar decimeters","length","m","dm",1,2,1.5],["De streepjes op een liniaal","length","cm","mm",1,3,4],["Een maat aftekenen","length","dm","cm",2,4,3]]],
 ["Lengte op de werkbon",[
 ["Een breedte uitzetten","length","m","cm",1.5,1.2,1.5],["Terug naar meters","length","cm","m",150,125,165],["Past het materiaal?","length","m","mm",1,1.2,1.4]]],
 ["Gewicht op de weegschaal",[
 ["Een kilogram afwegen","mass","kg","g",1,2,3],["Een halve kilo afwegen","mass","kg","g",0.5,0.25,0.75],["Een gewicht doorgeven","mass","g","kg",500,250,750]]],
 ["Schenken en afmeten",[
 ["Van literpak naar maatbeker","volume","l","ml",1,0.5,0.25],["Lees het etiket","volume","ml","l",750,500,250],["Een kan bijvullen","volume","cl","ml",25,50,75]]],
 ["Kies de juiste maat",[
 ["Werk met de rolmaat","length","m","cm",2,0.5,1.25],["Lees een verpakking","mass","g","kg",1000,500,1250],["Vergelijk twee vulstrepen","volume","dl","ml",2,4,6]]],
 ["Zelfstandig controleren",[
 ["Controleer de werkbon","length","mm","cm",120,240,350],["Weeg de voorraad","mass","kg","g",1.5,2.5,1.25],["Controleer de bestelling","volume","ml","l",500,750,1250]]],
 ["Herhaling en oppervlakte",[
 ["Haal de lengterij terug","length","cm","m",200,150,175],["Bedek een vlak","area","dm²","cm²",1,2,3],["Bepaal de oppervlakte","area","m²","cm²",1,2,0.5]]],
 ["Inhoud en herhaling",[
 ["Een bak met duidelijke binnenmaten","cube","dm³","cm³",1,2,0.5],["Een liter afmeten voor een bak","volume","l","ml",1,2,1.5],["Controleer de maat van een bak","cube","cm³","dm³",1000,2000,1500]]]
].map(([title,items])=>({title,items}));
const metricNumber=n=>Number(n.toPrecision(12)).toLocaleString("nl-NL",{maximumFractionDigits:9});
function measureRoute(row,from,to,value){
 const [,labels,factor]=metricRows[row],units=labels.split(" "),start=units.indexOf(from),end=units.indexOf(to);
 const count=Math.abs(end-start),dir=Math.sign(end-start);
 const values=Array.from({length:count+1},(_,i)=>metricNumber(value*Math.pow(factor,i*dir)));
 return {row,units,start,end,count,dir,factor,values};
}
function drawArches(route, visibleSteps, showRoute = true) {
  const shown = Math.max(0, Math.min(route.count, visibleSteps));
  const position = index => 60 + index * 110;
  const text = (x, y, label, className) => '<text x="' + x + '" y="' + y + '" class="' + className + '">' + escapeHTML(label) + '</text>';
  let content = '';
  for (let index = 0; index < route.units.length - 1; index++) {
    for (const direction of [1, -1]) {
      const from = direction === 1 ? index : index + 1;
      const to = from + direction;
      const above = direction === 1;
      const y = above ? 55 : 114;
      const peak = above ? 4 : 165;
      const used = showRoute && direction === route.dir &&
        (from - route.start) * direction >= 0 && (to - route.start) * direction <= shown;
      const className = used ? 'active' : 'quiet';
      const tip = position(to) - direction * 5;
      const operation = (above ? '× ' : '÷ ') + metricNumber(route.factor);
      content += '<g class="' + className + '"><path d="M' + (position(from) + direction * 5) + ' ' + y +
        ' Q' + ((position(from) + position(to)) / 2) + ' ' + peak + ' ' + tip + ' ' + y + '"/>' +
        '<path class="tip" d="M' + (tip - direction * 10) + ' ' + (y + (above ? -3 : 3)) +
        ' L' + tip + ' ' + y + ' l' + (-direction * 2) + ' ' + (above ? -10 : 10) + '"/>' +
        text((position(from) + position(to)) / 2, above ? 22 : 160, operation, 'op') + '</g>';
    }
  }
  route.units.forEach((unit, index) => {
    const progress = (index - route.start) * route.dir;
    const className = !showRoute ? 'unit' : index === route.start ? 'from' : index === route.end ? 'to' : 'unit';
    content += '<g class="' + className + '"><rect x="' + (position(index) - 42) +
      '" y="60" width="84" height="44" rx="9"/>' + text(position(index), 90, unit, 'symbol') + '</g>';
    if (showRoute && (index === route.start || index === route.end)) {
      content += text(position(index), 51, index === route.start ? 'START' : 'DOEL', 'badge');
    }
    const reached = route.dir === 0 ? index === route.start : progress >= 0 && progress <= shown;
    if (showRoute && reached) {
      content += text(position(index), 131, route.values[progress], 'value');
    }
  });
  const domain = metricRows[route.row]?.[0] || 'Metriek stelsel';
  const description = domain + '. ' + route.units.join(', ') + '. Naar rechts maal ' + route.factor +
    ' per stap. Naar links delen door ' + route.factor + ' per stap.';
  const progressText = showRoute ? ' ' + route.values.slice(0, shown + 1).map((value, index) =>
    value + ' ' + route.units[route.start + route.dir * index]).join(' is gelijk aan ') + '.' : '';
  return '<svg class="arches" viewBox="0 0 780 170" role="img" aria-label="' +
    escapeHTML(description + progressText) + '">' + content + '</svg>';
}

const pmMetricExamples = {
  length: ["Hoe lang is het?", "1 m = 10 dm = 100 cm = 1.000 mm.", "Leg een meterstok langs de rolmaat. Wijs 1 m en 100 cm aan."],
  area: ["Hoe groot is het vlak?", "1 m² = 100 dm² = 10.000 cm².", "Eén m² heeft 10 rijen van 10 vierkante decimeters. Elke stap is daarom × 100."],
  cube: ["Hoeveel ruimte neemt het in?", "1 m³ = 1.000 dm³. 1 dm³ = 1.000 cm³.", "Eén dm³ heeft 10 lagen van 100 blokjes van 1 cm³. Ook geldt 1 dm³ = 1 l."],
  volume: ["Hoeveel vloeistof past erin?", "1 l = 10 dl = 100 cl = 1.000 ml.", "Vier maatbekers met 250 ml vullen samen een literpak."],
  mass: ["Hoe zwaar is het?", "1 kg = 10 hg = 100 dag = 1.000 g.", "Twee porties van 500 g wegen samen evenveel als een pak van 1 kg."]
};

function pmMetricButton(row) {
  if (!metricRows[row]) return '';
  return '<button type="button" class="btn pm-card-button" data-pm-metric-row="' + row + '">Vergroot de PM-rekenkaart</button>';
}

function pmMetricReference(row) {
  const [title, symbols, factor] = metricRows[row];
  const units = symbols.split(' ');
  const [question, equality, explanation] = pmMetricExamples[row];
  const route = measureRoute(row, units[0], units.at(-1), 1);
  return '<section class="pm-metric-card" data-metric-row="' + row +
    '" aria-label="Metriek stelsel van de PM-poster, ' + escapeHTML(title) + '">' +
    '<header><span>Rekenen op de PM</span><h3>' + escapeHTML(title) + '</h3></header>' +
    '<div class="pm-metric-body"><p class="pm-measure-question">' + question + '</p>' + drawArches(route, 0, false) +
    '<div class="pm-direction-rules"><p>Naar rechts <strong>× ' + metricNumber(factor) +
    '</strong> per boogje</p><p>Naar links <strong>÷ ' + metricNumber(factor) + '</strong> per boogje</p></div>' +
    '<p class="pm-example">' + equality + '</p><p>' + explanation +
    '</p><p>De hoeveelheid blijft gelijk. Je schrijft die in een andere eenheid.</p></div></section>';
}

function metricRouteWorking(lesson, shown) {
  const route = lesson.route;
  const lines = route.values.slice(1, shown + 1).map((value, index) => {
    const before = route.units[route.start + route.dir * index];
    const after = route.units[route.start + route.dir * (index + 1)];
    const operation = route.dir > 0 ? '×' : '÷';
    return '<li><span>' + escapeHTML(before + ' naar ' + after) + '</span><strong>' +
      escapeHTML(route.values[index] + ' ' + operation + ' ' + metricNumber(route.factor) + ' = ' + value) +
      '</strong><span>' + escapeHTML(route.values[index] + ' ' + before + ' = ' + value + ' ' + after) + '</span></li>';
  });
  return lines.length ? '<ol class="metric-route-working" aria-label="Tussenstappen" aria-live="polite">' +
    lines.join('') + '</ol>' : '';
}

function openPMMetricReference(row) {
  if (!metricRows[row]) return;
  const examples = metricCards[row] ? metricReference(row, false) : shapeReference(row);
  $('details').setAttribute('aria-label', 'PM-rekenkaart voor ' + metricRows[row][0]);
  $('details-body').innerHTML = '<div class="detail-head"><h2>Metriek stelsel op de PM</h2>' +
    ''+detailsCloseButton()+'</div>' +
    '<section class="large-measure">' + pmMetricReference(row) + instrumentPhoto(row === 'area' ? 'bricks' : row) + examples + '</section>';
  if (!$('details').open) $('details').showModal();
}
const flatGrid='<svg viewBox="0 0 120 115" width="145" role="img" aria-label="Vierkant van tien rijen en tien kolommen"><defs><pattern id="cm-grid" width="9" height="9" patternUnits="userSpaceOnUse"><rect width="9" height="9" fill="#d9f0dc" stroke="#316650"/></pattern></defs><rect x="9" y="9" width="90" height="90" fill="url(#cm-grid)" stroke="#164e40"/><text x="10" y="113">10 × 10 vakjes</text></svg>';
function shapeReference(row){
 if(row==="area")return flatGrid+'<p>Een vierkant van 1 dm bij 1 dm telt 10 rijen van 10 cm². Samen 100 cm².</p>';
 return measurementVisual({kind:'measureBox',length:10,width:10,height:10},{zoom:false})+'<p>Deze bak heeft binnenmaten van 10 × 10 × 10 cm. De inhoud is 1.000 cm³. Er past 1 liter in.</p>';
}
const measurePrep={
 length:["rolmaat, schilderstape en een strook karton","Leg de nul tegen de rand. Laat eerst schatten waar het eindpunt komt.","Wijs één meter aan. Ligt de gevraagde lengte ervoor of erna?","Laat de leerling de juiste plek markeren en vanaf nul nameten."],
 volume:["maatbeker, literpak en water","Schenk een halve liter in en bekijk de streep op ooghoogte.","Zoek eerst de literstreep. Welke maatstreep is de helft daarvan?","Laat de leerling tot de gevraagde streep schenken en de maat hardop aflezen."],
 mass:["weegschaal, bakje en afweegmateriaal","Zet het bakje op de schaal en zet de schaal op nul.","Wijs de eenheid op de schaal aan. Hoeveel gram is één kilogram?","Laat de leerling de hoeveelheid afwegen en de eenheid noemen."],
 area:["ruitjespapier, liniaal en potlood","Teken een vierkant van 10 cm bij 10 cm op centimeterruitjes.","Tel één rij vakjes. Hoeveel van die rijen bedekken het vlak?","Laat de leerling het vlak aanwijzen en de oppervlakte met vierkante eenheid noteren."],
 cube:["een rechthoekige bak, liniaal en litermaat","Meet de drie binnenmaten. Vermenigvuldig lengte, breedte en hoogte.","Welke drie maten gebruik je? Hoeveel cm³ is één liter?","Laat de leerling de binnenmaten aanwijzen, de inhoud berekenen en met een litermaat controleren."]
};
function renderMetricOverview(){
 const node=$("metric-overview");if(!node)return;
 node.innerHTML='<h1>Metrieklessen</h1><p>Open een les op maandag, dinsdag of donderdag.</p><label>Sector <select id="metric-sector">'+DATA.sectors.map(s=>'<option value="'+s.id+'" '+(state.sector===s.id?'selected':'')+'>'+escapeHTML(s.name)+'</option>').join("")+'</select></label><p>Week 1–6 bouwt de basis op. Week 7–8 haalt eerdere maten terug en introduceert vierkante en kubieke maten.</p>'+allRows()+methodOverview()+'<div class="metric-weeks">'+metricTopics.map((t,w)=>'<section><h3>Week '+(w+1)+' · '+t.title+'</h3><p><b>Leg klaar</b> · '+[...new Set(t.items.map(v=>measurePrep[v[1]][0]))].join(' / ')+'</p>'+t.items.map((v,d)=>'<button class="btn metric-start" data-metric-week="'+w+'" data-metric-day="'+d+'"><strong>'+["Maandag","Dinsdag","Donderdag"][d]+'</strong><span>'+v[0]+'</span><span>Presenteren</span></button>').join("")+'</section>').join("")+'</div>';
}
function metricItem(week,day){return metricTopics[week].items[day];}
function lessonMeasure(deck){
 const {week,day}=deck.metric,[title,row,from,to,...amounts]=metricItem(week,day);
 const phase=deck.step===3?2:0,photo=metricPhotoRecord(deck),material=photo&&!(week===1&&day===0&&deck.sector==='groen')?photo.material:sectorMaterials[deck.sector][Object.keys(metricRows).indexOf(row)];
 const value=amounts[phase]*(state.year===2&&week!==1?1.5:1);
 const route=measureRoute(row,from,to,value),start=route.values[0]+' '+from,end=route.values.at(-1)+' '+to;
 const offset={length:10,mass:50,volume:50,area:10,cube:10}[row];
 const difference=Math.min(offset,Number((value*Math.pow(route.factor,route.end-route.start)/2).toPrecision(9)));
 const lower=metricNumber(value*Math.pow(route.factor,route.end-route.start)-difference)+' '+to;
 let goal='Ik kan '+from+' omrekenen naar '+to+' en mijn antwoord controleren.';
 const questions=['Op de werkbon voor '+material+' staat '+start+'. Hoeveel is dat in '+to+'?',
 'Voor '+material+' staat '+start+' op de bon. Welke waarde hoort daarbij in '+to+'?',
 'De bon voor '+material+' vermeldt '+start+'. Je collega noteert '+lower+". Is de opgeschreven maat te klein of te groot? Hoe groot is het verschil?"];
 if(week===1&&day===0&&deck.sector==="groen"){
  questions[0]="De werkbon vraagt een pad van 1,5 m breed. Je rolmaat geeft centimeters aan. Bij welke streep zet je de markering?";
  questions[1]="Het volgende pad wordt 1,2 m breed. Waar zet je de markering op je rolmaat?";
  questions[2]="Je collega heeft het pad op 140 cm uitgezet. De bon vraagt 1,5 m. Moet het pad breder of smaller? Hoeveel?";
 }
 const sectorTask={groen:"Zet de markering op de juiste plek.",techniek:"Teken de zaaglijn af.",hbr:"Controleer de maat voor het buffet.",zw:"Controleer of de plank past.",eco:"Geef de maat door voor het prijskaartje."};
 if(row==="length"&&phase===1)questions[1]+=" "+sectorTask[deck.sector];
 const decisions={
  length:{groen:"Verschuif de markering",techniek:"Verschuif de markering",zw:"Verschuif de markering",hbr:"Verschuif de markering",eco:"Verschuif de markering"},
  mass:{groen:"Weeg extra voer af",techniek:"Vul het bakje moeren aan",zw:"Weeg extra havermout af",hbr:"Weeg extra meel af",eco:/noten/.test(material)?"Weeg extra noten af":"Vul het pakket aan"},
  volume:{groen:"Vul de gieter bij",techniek:"Vul de kan met schoon water bij",zw:"Schenk water bij",hbr:"Schenk melk bij",eco:"Vul de navulfles bij"}
 };
 if(phase===2&&decisions[row]&&!(week===1&&day===0&&deck.sector==="groen")){
  const verbs={length:"De afgetekende maat is",mass:"De weegschaal geeft",volume:"Je hebt"};
  const endings={length:"Hoeveel moet de markering opschuiven?",mass:"Hoeveel moet erbij?",volume:"Hoeveel moet je nog bijschenken?"};
  questions[2]="Je hebt voor "+material+" "+start+" nodig. "+verbs[row]+" "+lower+(row==="volume"?" afgemeten":"")+". "+endings[row];
 }
 let answer=phase===2?start+' = '+end+". De opgeschreven maat is "+metricNumber(difference)+' '+to+' te klein.'+(week===1&&day===0&&deck.sector==='groen'?' Maak het pad 10 cm breder.':decisions[row]?' '+decisions[row][deck.sector]+' ('+metricNumber(difference)+' '+to+').':''):start+' = '+end+'.';
 if(row==='cube'){
  const cc=Number(measureRoute('cube',from,'cm³',value).values.at(-1).replaceAll('.','').replace(',','.'));
  const dims=metricNumber(cc/100)+' cm × 10 cm × 10 cm';
  goal='Ik kan met de binnenmaten de inhoud van een bak berekenen en cm³ omrekenen.';
  questions[phase]='De bak heeft binnenmaten van '+dims+'. Bereken de inhoud in '+to+'.'+(phase===2?' Je collega noteert '+lower+'. Klopt dat? Leg uit.':'');
  answer=dims+' = '+metricNumber(cc)+' cm³. '+start+' = '+end+'.'+(phase===2?' De notitie is '+metricNumber(difference)+' '+to+' te klein.':'');
 }
 return {week,day,title,row,from,to,route,start,end,goal,material,value,difference,phase,lowerValue:Number((value*Math.pow(route.factor,route.end-route.start)-difference).toPrecision(9)),question:questions[phase],answer};
}
function metricNumo(row,from,to){
 return {length:'A4 · Rekenen met lengtematen - stapjes 1',mass:'B2 · Gewichten omrekenen',volume:'F · Inhoud',area:'D · Oppervlakte',cube:'F · Inhoud'}[row];
}
function allRows() {
  const order = ['length', 'area', 'cube', 'volume', 'mass'];
  return '<details class="all-rows pm-all-rows"><summary>Metriek stelsel van de PM-poster</summary>' +
    order.map(row => pmMetricReference(row)).join('') + '</details>';
}
function tapePractice(deck,lesson){
 if(deck.metric.week!==1||deck.metric.day!==0||deck.sector!=="groen")return "";
 const target=150;
 const instruction=deck.step===3?"De tape ligt bij 140 cm. Kies de nieuwe plek.":"Kies op de rolmaat waar de markering hoort.";
 const choice=deck.tapeChoice;
 const marks=Array.from({length:9},(_,i)=>{
  const cm=100+10*i;
  return '<button type="button" class="tape-mark" data-tape="'+cm+'" aria-label="'+cm+' centimeter" aria-pressed="'+(choice===cm)+'">'+cm+'</button>';
 }).join("");
 let feedback="";
 if(choice!=null){
  if(choice===target)feedback="Goed geplaatst. "+lesson.start+" komt uit bij "+target+" cm.";
  else feedback=choice<target?"Je markering ligt te dicht bij nul. Vergelijk de afstand na de eerste meter nog eens.":"Je markering ligt te ver van nul. Meet vanaf de eerste meter opnieuw.";
 }
 return '<section class="tape-task"><strong>'+instruction+'</strong><div class="tape-track" aria-label="Vergroot deel van de rolmaat in centimeters">'+marks+'</div><span>Centimeters · detail vanaf 1 meter</span><p role="status">'+feedback+'</p></section>';
}
function metricReadout(l,deck){
 const number=value=>Number(String(value).replaceAll('.','').replace(',','.'));
 const amount=l.phase===2&&l.row!=='cube'?l.lowerValue:l.value;
 const from=l.phase===2&&l.row!=='cube'?l.to:l.from;
 let model;
 if(l.row==='length'){
  const cm=number(measureRoute('length',from,'cm',amount).values.at(-1));
  const max=cm<=5?5:cm<=20?20:Math.max(50,Math.ceil(cm/50)*50);
  model={kind:'measureRuler',start:0,max,minor:max<=20?.1:max<=200?1:5,major:max<=20?1:max<=200?20:50,unit:'cm',objectStart:0,objectEnd:cm};
 }else if(l.row==='mass')model={kind:'measureDigital',value:number(measureRoute('mass',from,'g',amount).values.at(-1)),unit:'g'};
 else if(l.row==='volume'){
  const ml=number(measureRoute('volume',from,'ml',amount).values.at(-1)),max=Math.max(1000,Math.ceil(ml/500)*500);
  model={kind:'measureJug',value:ml,max,minor:50,major:500,unit:'ml'};
 }else if(l.row==='area'){model={kind:'measureArea',length:l.value,unit:l.from.replace('²','')};
 }else if(l.row==='cube'){
  const cc=number(measureRoute('cube',l.from,'cm³',l.value).values.at(-1));model={kind:'measureBox',length:cc/100,width:10,height:10};
 }
 return model?measurementVisual(model):shapeReference('area');
}
function metricSlides(deck){
 if(deck.step===4)return ['','','',extraPractice(deck)];
 const l=lessonMeasure(deck),photo=metricMaterialPhoto(deck);
 if(deck.step===1)return [lessonOpening(l.row==='cube'?variedWorkPhoto(careerBoxPhoto(deck.sector)||photo,deck):photo,deck.sector,{material:l.material}),'','',''];
 const r=l.route,shown=Math.min(r.count,deck.archSteps??0),visibleSteps=deck.revealed&&deck.step===3?r.count:shown;
 const buttons='<div class="arch-controls"><button type="button" class="btn" data-arch="back" '+(shown?'':'disabled')+'>Vorige stap</button><button type="button" class="btn primary" data-arch="next" '+(shown===r.count?'disabled':'')+'>Volgende stap</button><button type="button" class="btn" data-arch="reset">Opnieuw</button></div>';
 const diagram='<section class="metric-proof"><h3>Van '+l.from+' naar '+l.to+'</h3>'+drawArches(r,visibleSteps)+metricRouteWorking(l,visibleSteps)+buttons+pmMetricButton(l.row)+'</section>';
 const prompt='<p class="lesson-question">'+escapeHTML(l.question)+'</p>';
 const copy=prompt+(deck.step===2?classDiscussion():'<p class="edi-response">Denk eerst zelf. Schrijf je antwoord op met de juiste eenheid. Laat iedereen tegelijk het antwoord tonen en bespreek de aanpak.</p>'+differentiation(measurePrep[l.row][2],'Reken je antwoord terug. Welke maat hoort bij dezelfde hoeveelheid?')+(deck.revealed?'<section class="answer-pane" aria-label="Uitwerking" tabindex="-1">'+escapeHTML(l.answer)+'</section>':revealControl('Toon uitwerking')))+tapePractice(deck,l);
 const evidence='<div class="measure-focus">'+metricReadout(l,deck)+photo+'</div>';
 const slides=['',lessonSlide('Samen bespreken',l.title,copy+pmMetricButton(l.row),evidence,l.goal),lessonSlide('Samen oefenen',l.title,copy+'<details class="conversion-help"><summary>Hulp met omrekenen</summary>'+diagram+'</details>',evidence),''];
 return slides;
}

function openMetricNotes(deck){
 const l=lessonMeasure(deck);
 $('details').setAttribute('aria-label','Docentkaart bij de metriekles');
 $('details-body').innerHTML='<div class="detail-head"><h2>Docentkaart · '+escapeHTML(l.title)+'</h2>'+detailsCloseButton()+'</div><section class="detail-section"><p><strong>Lesdoel</strong> '+escapeHTML(l.goal)+'</p><p><strong>Leg klaar</strong> '+measurePrep[l.row][0]+'.</p><h3>1. Gesprek over het beroep</h3><p>Laat de grote foto zien. Vraag eerst: Wat zie je op deze foto? Bespreek daarna de beroepsvraag op dia 1.</p><h3>2. Ik doe voor</h3><p>'+measurePrep[l.row][1]+'</p><p>'+escapeHTML(l.question)+'</p>'+metricReadout(l,deck)+'<p>Wijs de beginmaat en doelmaat aan. Naar rechts vermenigvuldig je per stap met '+l.route.factor+'; naar links deel je door '+l.route.factor+'. Schrijf één rekenstap per regel.</p>'+drawArches(l.route,l.route.count)+metricRouteWorking(l,l.route.count)+'<h3>3. Wij oefenen en controleren</h3><p>Laat iedereen tegelijk de maat met eenheid tonen. Vraag: '+measurePrep[l.row][2]+'</p><p><strong>Bij twijfel</strong> Gebruik het echte meetinstrument en één tussenstap.</p><p><strong>Bij een juiste uitleg</strong> Laat de leerling terugrekenen en de uitkomst controleren.</p><h3>4. Extra oefenen naar behoefte</h3><p>Dia 4 biedt vijf sommen en de verwijzing naar Numo. Laat leerlingen eerst zelf een gekozen som maken.</p><p><strong>Antwoord bij dit voorbeeld</strong> '+escapeHTML(l.answer)+'</p><p><strong>Praktijktransfer</strong> '+measurePrep[l.row][3]+'</p><p><strong>Numo</strong> Meten en meetkunde 1F · '+metricNumo(l.row,l.from,l.to)+'</p></section>';
 if(!$('details').open)$('details').showModal();
}
const otherModels=[
 ["Getallen · voorraad aanvullen","In de kas staan 28 potjes. Er komen er 7 bij.","28 → 30 → 35","Splits de 7 in 2 en 5. Spring eerst naar het tiental.","Er staan 38 potjes. Er komen er 6 bij.","38 + 2 + 4 = 44 potjes.","Tel 49 en 8 op via 50.","57 potjes.","Getallen 1F · A · Optellen en aftrekken"],
 ["Groepen · bakken vullen","Je verdeelt 24 broodjes over 4 bakken.","6 + 6 + 6 + 6 = 24","Teken vier bakken. Leg in elke bak evenveel broodjes.","Verdeel 30 broodjes over 5 bakken.","6 broodjes per bak.","Hoeveel bakken heb je nodig voor 36 broodjes bij 6 per bak?","6 bakken.","Getallen 1F · G · Vermenigvuldigen en delen"],
 ["Verhoudingen · recept aanpassen","Voor 4 porties is 300 g macaroni nodig. Hoeveel voor 6?","Porties|4|2|6;Macaroni (g)|300|150|450","Halveer beide rijen. Vermenigvuldig daarna beide rijen met 3.","Voor 4 porties is 200 g saus nodig. Hoeveel voor 6?","300 g saus.","Voor 8 porties gebruik je 600 g. Wat weeg je af voor 2?","150 g.","Verhoudingen 1F · I · Verhoudingen toepassen"],
 ["Procenten · de maatbeker","Een litermaat is voor de helft gevuld.","½ van 1 l = 0,5 l = 50% van 1 l","Verdeel de liter in vier gelijke delen. Twee delen vormen de helft.","Hoeveel ml is 25% van een liter?","250 ml.","Een litermaat heeft 750 ml. Welk percentage is gevuld?","75%.","Verhoudingen 1F · G · Breuken en procenten omzetten"],
 ["Geld · bij de kassa","Op de bon staan € 3,75 en € 2,50.","€ 3,75 + € 2,00 + € 0,50 = € 6,25","Schat eerst: ongeveer € 4 + € 3. Tel daarna euro's en centen op.","Een klant koopt iets van € 4,80 en € 2,35. Wat is het totaal?","€ 7,15.","De klant betaalt € 10. Hoeveel geef je terug?","€ 2,85.","Getallen 1F · Q · Rekenen met geld"],
 ["Tijd · werk plannen","Een klus duurt van 09.45 tot 10.20 uur.","09.45 → 10.00 → 10.20","Eerst 15 minuten tot het hele uur. Dan nog 20 minuten. Samen 35 minuten.","Je begint om 10.50 en stopt om 11.15. Hoe lang werk je?","10 + 15 = 25 minuten.","Een volgende klus begint om 13.40 en duurt 35 minuten. Wanneer ben je klaar?","14.15 uur.","Meten en meetkunde 1F · C · Datum en tijd"],
 ["Verbanden · groei vergelijken","Welke plant groeit deze week het meest?","Plant|Maandag|Vrijdag;A|8 cm|12 cm;B|5 cm|11 cm","Vergelijk per plant de begin- en eindhoogte. A groeit 4 cm, B groeit 6 cm.","Welke plant is vrijdag het hoogst?","Plant A, met 12 cm.","Hoeveel cm méér groeide B dan A?","2 cm.","Verbanden 1F · C · Conclusies trekken"]
];
function methodOverview(){
 return '<details class="method-models"><summary>Oefen andere rekendomeinen</summary>'+otherModels.map(([name,q,model,tip,practice,answer,transfer,check,numo])=>{
 const visual=model.includes('|')?'<table>'+model.split(';').map(row=>'<tr>'+row.split('|').map((v,i)=>i?'<td>'+v+'</td>':'<th>'+v+'</th>').join('')+'</tr>').join('')+'</table>':'<p><strong>'+model+'</strong></p>';
 return '<details><summary>'+name+'</summary><h4>Ik doe voor</h4><p>'+q+'</p>'+visual+'<p>'+tip+'</p><h4>Wij oefenen</h4><p>'+practice+'</p><details><summary>Bespreek het antwoord</summary>'+answer+'</details><h4>Jij past toe</h4><p>'+transfer+'</p><details><summary>Controleer</summary>'+check+'</details><p>'+numo+'</p></details>';}).join('')+'</details>';
}
function instrumentVisual(l){
 if(l.week===1&&l.day===0){
 const ticks=Array.from({length:61},(_,i)=>{const x=25+8*i,major=i%10===0;return '<path d="M'+x+' 20v'+(major?23:i%5===0?17:9)+'" stroke="#283e3a"/>'+(major?'<text x="'+x+'" y="62" text-anchor="middle">'+(100+i)+'</text>':'');}).join('');
 return '<details><summary>Bekijk de rolmaat · 100 tot 160 cm</summary><svg viewBox="0 0 540 75" class="instrument" role="img" aria-label="Detail van een rolmaat van 100 tot 160 centimeter. Elke kleine streep is hier één centimeter."><rect x="10" y="20" width="520" height="48" fill="#ffebae"/>'+ticks+'</svg><p>Dit is een uitvergroting. Wijs eerst 1 meter aan. Waar ligt een halve meter verder?</p></details>';
 }
 if(l.row==="volume"){
 return '<details><summary>Bekijk de maatbeker</summary><svg class="instrument" viewBox="0 0 320 160" role="img" aria-label="Maatbeker met 250 milliliter en vier gelijke intervallen tot één liter"><path d="M70 9h110l-5 140H78z" fill="#effaff" stroke="#346679"/><path d="M78 114h98v35H79z" fill="#65bfd6"/>'+[0,250,500,750,1000].map((v,i)=>'<path d="M155 '+(149-i*35)+'h22" stroke="#1d4554"/><text x="190" y="'+(153-i*35)+'">'+v+' ml</text>').join('')+'</svg><p>De vloeistof staat bij 250 ml. Vier van deze hoeveelheden vullen een literpak.</p></details>';
 }
 return '';
}
