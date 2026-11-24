const CATALOG = JSON.parse(document.getElementById("catalog-data").textContent);
const catalogById = new Map(CATALOG.entries.map(lesson => [lesson.id, lesson]));
const catalogFilters = {domain:"all", year:"all", week:"all", query:"", limit:30};

function normalizeCatalogQuery(value) {
  return String(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
}

function catalogSearchText(lesson) {
  const aliases = {
    columnAdd:"optellen onder elkaar cijferen kolomsommen optelsommen plus",
    columnSub:"aftrekken onder elkaar cijferen kolomsommen minsommen",
    priceAdd:"geld prijzen optellen euro cent",
    change:"wisselgeld teruggeven geld",
    duration:"tijdsduur klok minuten",
    fractionPicture:"breuken helft kwart halveren",
    ratioScale:"verhoudingstabel verhoudingen recept",
    cm:"metriek stelsel meter centimeter omrekenen",
    gram:"metriek stelsel kilogram gram omrekenen",
    boxLitres:"binnenmaten inhoud volume liter bak lengte breedte hoogte"
  };
  return normalizeCatalogQuery([lesson.title,lesson.goal,lesson.studentGoal||'',lesson.theme,lesson.kind,
    CATALOG.domains.find(domain=>domain.id===lesson.domain)?.title,aliases[lesson.kind]||"",
    /column/i.test(lesson.kind)?"onder elkaar":"",
    /cm|gram|mass|Volume|small/i.test(lesson.kind)?"metriek stelsel omrekenen":""].join(" "));
}

function catalogMetricEntries() {
  return metricTopics.flatMap((week,weekIndex)=>week.items.map((item,day)=>({
    id:"metriek-"+weekIndex+"-"+day,title:item[0],goal:"Omrekenen van "+item[2]+" naar "+item[3]+".",
    theme:week.title,domain:"meten",kind:"metriek stelsel",year:null,week:weekIndex+1,day:["ma","di","do"][day],
    metric:{week:weekIndex,day}
  })));
}

function filteredCatalogEntries() {
  const tokens=normalizeCatalogQuery(catalogFilters.query).split(" ").filter(Boolean);
  return [...CATALOG.entries,...catalogMetricEntries()].filter(lesson=>
    (catalogFilters.domain==="all"||lesson.domain===catalogFilters.domain)&&
    (catalogFilters.year==="all"||lesson.year===null||lesson.year===Number(catalogFilters.year))&&
    (catalogFilters.week==="all"||lesson.week===Number(catalogFilters.week))&&
    tokens.every(token=>catalogSearchText(lesson).includes(token))
  );
}

function catalogSchedule(lesson) {
  if(lesson.metric)return "Metriekreeks · week "+lesson.week+" · "+["maandag","dinsdag","donderdag"][lesson.metric.day];
  const slot=DATA.slots.find(item=>item.key===lesson.day);
  const when=lesson.schedule[0];
  const date=when.week<=settings.starts.length?dateLabel(shiftDate(settings.starts[when.week-1],slot.offset)):"";
  return "PrO "+(lesson.year+2)+" · lesweek "+when.week+" · "+slot.name.toLowerCase()+(date?" · "+date:"")+
    (lesson.phase==="Extra instructie"?" · extra instructie":"");
}

function catalogControls() {
  const h=escapeHTML;
  return '<div class="catalog-filters"><label>Zoek een les<input type="search" id="catalog-query" value="'+h(catalogFilters.query)+'" placeholder="Bijvoorbeeld optellen onder elkaar"></label>'+
    '<label>Schooljaar<select id="catalog-year"><option value="all">Beide schooljaren</option>'+[1,2].map(year=>
      '<option value="'+year+'" '+(String(year)===catalogFilters.year?'selected':'')+'>'+schoolYearLabel(year)+'</option>').join("")+'</select></label>'+
    '<label>Lesweek<select id="catalog-week"><option value="all">Alle lesweken</option>'+Array.from({length:36},(_,i)=>
      '<option value="'+(i+1)+'" '+(String(i+1)===catalogFilters.week?'selected':'')+'>Lesweek '+(i+1)+'</option>').join("")+'</select></label>'+
    '<label>Sector<select id="catalog-sector">'+DATA.sectors.map(sector=>'<option value="'+sector.id+'" '+(state.sector===sector.id?'selected':'')+'>'+h(sector.name)+'</option>').join("")+'</select></label></div>';
}

function renderCatalog() {
  const h=escapeHTML;
  $("lessen").innerHTML='<div class="page-banner"><h1 id="catalog-title">Lessen</h1><p>Kies een onderwerp en geef de les wanneer jouw groep die nodig heeft.</p></div>'+
    '<div class="catalog-domains" role="group" aria-label="Rekendomeinen"><button type="button" data-catalog-domain="all" aria-pressed="'+(catalogFilters.domain==="all")+"\"><strong>Alle lessen</strong><span>Doorzoek de hele leerlijn.</span></button>"+
    CATALOG.domains.map(domain=>'<button type="button" data-catalog-domain="'+domain.id+'" aria-pressed="'+(catalogFilters.domain===domain.id)+'"><strong>'+h(domain.title)+'</strong><span>'+h(domain.description)+'</span></button>').join("")+'</div>'+
    '<div class="catalog-quick-links" aria-label="Snel naar een meetonderwerp"><span>Snel kiezen</span>'+[['aflezen','Meten en aflezen'],['tarra','Wegen met tarra'],['metriek stelsel','Metriek stelsel'],['omtrek','Omtrek'],['binnenmaten','Inhoud van een bak']].map(([query,label])=>'<button type="button" class="btn" data-catalog-query="'+query+'">'+label+'</button>').join('')+'</div>'+
    catalogControls()+'<p class="catalog-week-note">De lesweken volgen de tweejarige leerlijn. Extra meetlessen staan bij de week waarin het onderwerp aan bod komt. De metriekreeks heeft een eigen weeknummering.</p>'+
    '<div class="catalog-results-heading"><p id="catalog-count" role="status"></p><button type="button" class="text-btn" data-catalog-reset="true">Wis filters</button></div>'+
    '<details class="lesson-image-library"><summary>Lesbeelden bij jouw keuze</summary><p>Bekijk de beroepssituaties en bewaar een beeld voor je eigen uitleg of werkkaart.</p><div id="lesson-image-results"></div></details>'+
    '<div id="catalog-results" class="catalog-results"></div><div id="catalog-more"></div>';
  renderCatalogResults();
}

function renderCatalogResults() {
  const h=escapeHTML,entries=filteredCatalogEntries();
  renderLessonImageBank(entries);
  $("catalog-count").textContent=entries.length+" lessen gevonden";
  $("catalog-results").innerHTML=entries.length?entries.slice(0,catalogFilters.limit).map(lesson=>{
    const open=lesson.metric?'data-catalog-metric-week="'+lesson.metric.week+'" data-catalog-metric-day="'+lesson.metric.day+'"':'data-catalog-open="'+lesson.id+'"';
    const prepare=lesson.metric?'data-catalog-metric-prep="'+lesson.metric.week+'" data-catalog-metric-day="'+lesson.metric.day+'"':'data-catalog-prep="'+lesson.id+'"';
    return '<article class="catalog-card"><p class="catalog-schedule">'+h(catalogSchedule(lesson))+'</p><h2>'+h(lesson.title)+'</h2><p>'+h(lesson.goal)+'</p>'+
      '<div class="catalog-card-actions"><button type="button" class="btn primary" '+open+'>Presenteren</button><button type="button" class="btn" '+prepare+'>Voorbereiden</button></div></article>';
  }).join(""):'<p class="catalog-empty">Er zijn geen lessen bij deze zoekopdracht. Pas de zoekterm of de filters aan.</p>';
  $("catalog-more").innerHTML=entries.length>catalogFilters.limit?'<button type="button" class="btn" data-catalog-more="true">Toon meer lessen</button>':"";
}

let lessonImageLimit=12;
function renderLessonImageBank(entries=filteredCatalogEntries()){
 const target=$('lesson-image-results');if(!target)return;
 const h=escapeHTML,unique=new Map();
 for(const lesson of entries){const photo=lessonPhotosById.get(lesson.contexts?.[state.sector]?.photoBankId);if(photo&&!unique.has(photo.id))unique.set(photo.id,{photo,lesson});}
 const candidates=[...unique.values()];
 target.innerHTML='<p class="lesson-image-count">'+candidates.length+' beelden · '+h(sectorInfo().name)+'</p>'+
  '<div class="lesson-image-grid">'+candidates.slice(0,lessonImageLimit).map(({photo,lesson})=>'<article>'+lessonBankPhoto(photo.id,state.sector)+'<h3>'+h(lesson.title)+'</h3><p>'+h(catalogSchedule(lesson))+'</p><div><button type="button" class="btn" data-catalog-open="'+h(lesson.id)+'">Open les</button><a class="btn" href="'+h(photo.url+'&download=1')+'" download="'+h(photo.id)+'.webp">Bewaar afbeelding</a></div></article>').join('')+'</div>'+
  (candidates.length>lessonImageLimit?'<button type="button" class="btn" data-photo-more="true">Toon meer beelden</button>':'')+
  (!candidates.length?'<p>Voor deze keuze zijn geen nieuwe beroepsfoto’s. De les bevat de bijpassende rekenbeelden en meetinstrumenten.</p>':'');
}

function catalogLessonUrl(lesson,sector) {
  const url=new URL(location.href);
  url.hash=new URLSearchParams({bibliotheek:lesson.id,sector}).toString();
  return url.href;
}

function openCatalogLesson(id,fullscreen=true) {
  const lesson=catalogById.get(id);
  if(!lesson)return;
  state.page="lessen";
  state.deck={catalog:lesson,sector:state.sector,step:1,revealed:false,modelSteps:0};
  if(lesson.example.model?.kind==="column")state.deck.columnSteps=0;
  if($("details").open)$("details").close();
  renderPage();
  renderDeck();
  if(!$("presentation").open)$("presentation").showModal();
  writeHash(catalogLessonUrl(lesson,state.sector));
  if(fullscreen)enterFullscreen();
}

function catalogContext(lesson,sector) {
  const original=lesson.contexts[sector];
  if(/^temperature/.test(lesson.kind)){
    const place={eco:'in de koeling van de winkel',zw:'in de koelkast van de woongroep',hbr:'van het eten in de pan',groen:'bij de jonge planten in de kas',techniek:'in de werkplaats'}[sector];
    return {...original,context:'Je controleert de temperatuur '+place+'. Lees de thermometer af en noteer het aantal graden.'};
  }
  if(/^choose(Length|Mass|Volume)$/.test(lesson.kind))return {...original,context:'Je schrijft een maat op de werkbon. Kijk eerst wat je gaat meten. Welke eenheid past daarbij?'};
  return original;
}
function catalogTaskForSector(task,lesson,sector){
  if(task.model?.kind==='reference'&&task.model.quantity){
    const {row,quantity,unit}=task.model,n=Number(quantity.replaceAll('.','').replace(',','.'));
    const things={
      groen:{length:"een maat van het materiaal bij het aanleggen van een tuin",mass:'een hoeveelheid diervoer',volume:'een hoeveelheid water voor planten'},
      techniek:{length:"een maat van het materiaal in de werkplaats",mass:'een hoeveelheid metalen onderdelen',volume:'een hoeveelheid schoon water voor de werkplaats'},
      hbr:{length:"een maat van het materiaal voor de buffetinrichting",mass:'een hoeveelheid meel in de keuken',volume:'een hoeveelheid melk in de keuken'},
      zw:{length:"een maat van het materiaal voor de linnenkast",mass:'een hoeveelheid havermout voor het ontbijt',volume:'een hoeveelheid drinkwater voor bewoners'},
      eco:{length:"een maat van het materiaal voor het winkelschap",mass:'het gewicht van een pakket',volume:'een hoeveelheid water voor een winkeldemonstratie'}
    };
    let object=things[sector][row];
    if(row==='mass'&&unit==='kg'&&n>=100)object='een levering op een pallet';
    if(row==='mass'&&unit==='g'&&n<=2)object='een paperclip op het bureau';
    if(row==='length'&&unit==='mm')object='de dikte van een schroef';
    if(row==='length'&&unit==='m'&&n>3)object='de afstand tussen twee werkplekken';
    if(row==='volume'&&unit==='ml'&&n===1)object='de inhoud van een volle pipet';
    const choices=row==='mass'?'g of kg':row==='volume'?'ml of l':'mm, cm of m';
    return {...task,question:'Je meet '+object+': ongeveer '+quantity+'. Welke eenheid past: '+choices+'?'};
  }
  if(sector!=='eco'||lesson.kind!=='tareScale')return task;
  const wording=text=>text.replaceAll('bakje','doos');
  return {...task,question:wording(task.question),hint:wording(task.hint),steps:task.steps.map(wording),facts:task.facts.map(f=>({...f,label:wording(f.label)}))};
}

function catalogMaterialPhoto(lesson,sector,task=lesson.example){return variedWorkPhoto(catalogMaterialPhotoBase(lesson,sector,task),{catalog:lesson,sector});}
function catalogMaterialPhotoBase(lesson,sector,task=lesson.example) {
  const context=catalogContext(lesson,sector);
  task=catalogTaskForSector(task,lesson,sector);
  let record=lessonPhotosById.get(context.photoBankId);
  if(record?.referenceSubject){
    const subject=/paperclip/.test(task.question)?'paperclip':/pipet/.test(task.question)?'pipette':/schroef/.test(task.question)?'screw':null;
    if(subject!==record.referenceSubject){
      const model=task.model,quantity=Number(String(model?.quantity??0).replaceAll('.','').replace(',','.'));
      const familyKind=model?.row==='length'?(model.unit==='m'&&quantity>3?'gridRoute':'readTape'):model?.row==='mass'?'readDigital':'readJug';
      record=model?.row==='mass'&&model.unit==='kg'&&quantity>=100?null:lessonPhotoBank.find(p=>p.kind===familyKind&&p.sector===sector);
    }
  }
  if(lesson.kind==='borderOrSurface'&&task.model?.edge===false)record=lessonPhotoBank.find(p=>p.kind==='area'&&p.sector===sector)||record;
  const bankPhoto=record?lessonBankPhoto(record.id,sector):'';
  if(bankPhoto)return bankPhoto;
  const photo=(key,label)=>taskPhoto(key,label,sector);
  if(lesson.visualTopic==='money')return paymentPhoto(sector);
  if(lesson.visualTopic==='coins')return '';
  if(lesson.kind==='boxLitres')return photo(sector+'-box',boxNames[sector]);
  if(context.measurementGroup==='area'||/^(perimeter|area|edgeOrArea|formulaChoose|coverage|halfSides)/.test(lesson.kind)){
    const surface=['techniek','hbr'].includes(sector);
    return photo(sector+(surface?'-surface':'-floor'),(surface?surfaceNames:floorNames)[sector]);
  }
  if(/^temperature/.test(lesson.kind))return photo(sector+'-temperature','Temperatuur meten op de werkplek');
  if(/^(grid|route|scaleRead|scaleLength|scaleCheck)/.test(lesson.kind))return photo('plan','Een plattegrond met een schaalliniaal');
  if(task.model?.kind==='clock')return '';
  if(/^(planning|duration|startTime|endTime|sumMinutes)/.test(lesson.kind))return photo('clock','De klok op de werkplek');
  if(task.model?.kind==='reference'){
    if(/paperclip/.test(task.question))return photo('clip','Een paperclip');
    if(/pipet/.test(task.question))return photo('pipette','Een pipet voor kleine hoeveelheden');
    if(/schroef/.test(task.question))return photo('screw','De dikte van een schroef meten');
  }
  if(context.photoKey)return sectorMeasurementPhoto(sector,context.photoKey);
  return '';
}
function catalogGoalVisual(lesson,deck){
  const task=catalogTaskForSector(lesson.example,lesson,deck.sector);
  const bank=lessonPhotosById.has(catalogContext(lesson,deck.sector).photoBankId)?catalogMaterialPhoto(lesson,deck.sector,task):'';
  const withPhoto=visual=>bank?'<div class="goal-measure-combo"><div>'+visual+'</div>'+bank+'</div>':visual;
  if(lesson.visualTopic==='coins')return coinPicture({compact:true});
  if(lesson.visualTopic==='money')return withPhoto(moneyPicture(task,lesson,{...deck,step:1}));
  if(task.model?.kind==='column'&&lesson.visualTopic==='column')return withPhoto('<figure class="lesson-topic-picture" data-lesson-visual="column">'+columnCalculation(task.model,0)+'</figure>');
  const model=catalogModel(task,{...deck,step:1,modelSteps:0,columnSteps:0},true);
  const photo=catalogMaterialPhoto(lesson,deck.sector,task);
  if(photo)return '<div class="goal-measure-combo"><div>'+(model||lessonFactPicture(task,lesson.visualTopic))+'</div>'+photo+'</div>';
  return '<div class="lesson-topic-picture" data-lesson-visual="'+escapeHTML(lesson.visualTopic)+'">'+(model||lessonFactPicture(task,lesson.visualTopic))+'</div>';
}

function catalogTable(model) {
  const h=escapeHTML;
  return '<table class="catalog-data-table"><thead><tr>'+model.head.map(value=>'<th scope="col">'+h(value)+'</th>').join("")+
    '</tr></thead><tbody>'+model.rows.map(row=>'<tr>'+row.map((value,index)=>'<'+(index?'td':'th scope="row"')+'>'+h(value)+'</'+(index?'td':'th')+'>').join("")+'</tr>').join("")+'</tbody></table>';
}

function catalogChart(model) {
  const h=escapeHTML,values=model.values,max=Math.ceil(Math.max(...values)/5)*5+5;
  const x=index=>70+index*150,y=value=>190-value/max*150;
  let svg='<text x="10" y="20">'+h(model.unit)+'</text>';
  for(let value=0;value<=max;value+=model.step||5){
    svg+='<path d="M45 '+y(value)+'H440" stroke="#dfd4e6"/><text x="32" y="'+(y(value)+4)+'" text-anchor="end">'+value+'</text>';
  }
  svg+='<path d="M45 35V190H440" stroke="#543260" fill="none"/>';
  if(model.kind==="lineChart")svg+='<polyline points="'+values.map((value,index)=>x(index)+","+y(value)).join(" ")+'" fill="none" stroke="#7a358f" stroke-width="3"/>';
  values.forEach((value,index)=>{
    if(model.kind==="lineChart")svg+='<circle cx="'+x(index)+'" cy="'+y(value)+'" r="5" fill="#7a358f"/><text x="'+x(index)+'" y="'+(y(value)-9)+'" text-anchor="middle">'+value+'</text>';
    else if(model.labels[index]!==model.missing)svg+='<rect x="'+(x(index)-22)+'" y="'+y(value)+'" width="44" height="'+(190-y(value))+'" fill="#87579c"/>';
    svg+='<text x="'+x(index)+'" y="216" text-anchor="middle">'+h(model.labels[index])+'</text>';
  });
  return '<figure class="catalog-chart"><figcaption>'+h(model.title)+'</figcaption><svg viewBox="0 0 470 235" role="img" aria-label="'+h(model.title)+'. Waarden aflezen in '+model.unit+'.">'+svg+'</svg>'+
    (model.sourceValues?catalogTable({head:["Plek","Stuks"],rows:model.labels.map((label,index)=>[label,model.sourceValues[index]])}):"")+'</figure>';
}

function catalogModel(task,deck,exercise=false) {
  const model=task.model,h=escapeHTML;
  if(deck.catalog?.kind==="bridge"&&model?.kind==="column"){
    const gap=(10-model.a%10)%10;
    const jumps=gap&&gap<model.b?[{from:model.a,to:model.a+gap,label:"+ "+gap},{from:model.a+gap,to:model.a+model.b,label:"+ "+(model.b-gap)}]:[{from:model.a,to:model.a+model.b,label:"+ "+model.b}];
    const shown=deck.step===2?Math.min(deck.modelSteps??0,jumps.length):deck.step===3&&deck.revealed?jumps.length:0;
    return visualSVG({type:"jumps",end:Math.ceil((model.a+model.b)/10)*10,jumps:jumps.slice(0,shown)},"stuks");
  }
  if(deck.catalog&&(deck.catalog.visualTopic==='money'||deck.catalog.visualTopic==='coins'))return deck.step===4?'':moneyPicture(task,deck.catalog,deck);
  const measure=measurementTaskModel(task);
  if(measure)return measurementVisual(measure,{compact:deck.step===4});
  if(!model)return task.visual?visualSVG(task.visual,"materiaal"):"";
  if(model.kind==="column")return exercise?
    '<p class="catalog-column-task">'+h(model.a)+(model.add?" + ":" − ")+h(model.b)+' = …</p>':columnCalculation(model,deck.step===2?0:deck.columnSteps??0,{interactive:deck.step!==2});
  if(model.kind==="table"||model.kind==="ratio")return catalogTable(model);
  if(model.kind==="bars"||model.kind==="lineChart")return catalogChart(model);
  if(model.kind==="metric"){
    const route=measureRoute(model.row,model.from,model.to,model.value);
    return '<section class="catalog-conversion">'+drawArches(route,exercise?0:Math.min(route.count,deck.modelSteps??0))+pmMetricButton(model.row)+'</section>';
  }
  if(model.kind==="reference")return metricReference(model.row,false);
  if(model.kind==="price")return '<p class="catalog-price">'+h(moneyForCatalog(model.cents))+'</p>';
  if(model.kind==="clock"){
    const minute=model.minutes%60,hour=model.minutes/60%12;
    const end=(degrees,radius)=>[100+Math.sin(degrees*Math.PI/180)*radius,100-Math.cos(degrees*Math.PI/180)*radius];
    const m=end(minute*6,67),hr=end(hour*30,47);
    const ticks=Array.from({length:12},(_,i)=>{const p=end(i*30,82);return '<text x="'+p[0]+'" y="'+(p[1]+5)+'" text-anchor="middle">'+(i||12)+'</text>';}).join("");
    return '<svg class="catalog-clock" viewBox="0 0 200 200" role="img" aria-label="Analoge klok"><circle cx="100" cy="100" r="95" fill="#fff" stroke="#67327e"/>'+ticks+
      '<path d="M100 100L'+hr.join(" ")+'" stroke="#352142" stroke-width="6"/><path d="M100 100L'+m.join(" ")+'" stroke="#c62a42" stroke-width="3"/></svg>';
  }
  if(model.kind==="timeline"){
    const kind=deck.catalog?.kind||'',solved=deck.step===2?(deck.modelSteps||0)>=task.steps.length:deck.step===3&&deck.revealed;
    const hideStart=/^startTime/.test(kind)&&!solved,hideEnd=/^endTime/.test(kind)&&!solved;
    return '<div class="catalog-timeline"><div><span>Begin</span><strong>'+(hideStart?'?':catalogClock(model.start))+'</strong></div><span>Werktijd</span><div><span>Klaar</span><strong>'+(hideEnd?'?':catalogClock(model.end))+'</strong></div></div>';
  }
  if(model.kind==="rectangle"){
    const cells=model.grid?Array.from({length:model.length*model.width},()=>'<span></span>').join(""):"";
    return '<figure class="catalog-rectangle"><span>'+h(model.length)+' m</span><div style="--columns:'+Math.ceil(model.length)+';aspect-ratio:'+model.length+'/'+model.width+'" aria-label="Rechthoek met lengte '+model.length+' meter en breedte '+model.width+' meter">'+cells+'</div><figcaption>Breedte '+h(model.width)+' m</figcaption></figure>';
  }
  if(model.kind==="fraction"||model.kind==="percent"){
    const parts=model.parts||10,filled=model.filled??model.percent/10;
    return (model.total?'<p>De hele voorraad is '+h(model.total)+' stuks.</p>':"")+'<div class="catalog-fraction" role="img" aria-label="'+parts+' gelijke delen, waarvan '+filled+' gekleurd">'+Array.from({length:parts},(_,i)=>'<span class="'+(i<filled?"filled":"")+'"></span>').join("")+'</div>';
  }
  if(model.kind==="tally"){
    return '<div class="catalog-tally" role="img" aria-label="Turfstreepjes">'+Array.from({length:Math.floor(model.total/5)},()=>'<span>||||<i></i></span>').join("")+'<span>'+"|".repeat(model.total%5)+'</span></div>';
  }
  if(model.kind==="thermometer"){
    const labels=Array.from({length:31},(_,i)=>i);
    return '<svg class="catalog-thermometer" viewBox="0 0 130 220" role="img" aria-label="Thermometer met een schaal in graden Celsius"><path d="M40 20v170" stroke="#d9d5dc" stroke-width="20"/><path d="M40 190v-'+(model.value/model.max*170)+'" stroke="#c42142" stroke-width="13"/><circle cx="40" cy="192" r="17" fill="#c42142"/>'+
      labels.map(value=>'<path d="M55 '+(190-value/model.max*170)+'h'+(value%5===0?15:7)+'" stroke="#4b2d60"/>'+(value%5===0?'<text x="75" y="'+(195-value/model.max*170)+'">'+value+' °C</text>':'')).join("")+'</svg>';
  }
  if(model.kind==="jug"){
    const top=150-model.amount/model.capacity*130;
    return '<svg class="catalog-jug" viewBox="0 0 260 180" role="img" aria-label="Maatbeker met schaal in milliliters"><path d="M35 15h100l-8 140H43z" fill="#f7fdff" stroke="#455a71"/><path d="M43 '+top+'h85v'+(155-top)+'H43z" fill="#78b7d8"/>'+
      Array.from({length:model.capacity/model.step+1},(_,i)=>{const value=i*model.step,y=155-value/model.capacity*130;return '<path d="M115 '+y+'h'+(value%250===0?20:10)+'" stroke="#43506a"/>'+(value%250===0?'<text x="145" y="'+(y+5)+'">'+value+' ml</text>':'');}).join("")+'</svg>';
  }
  if(model.kind==="grid"){
    let grid='';
    for(let i=0;i<=8;i++)grid+='<path d="M'+(20+i*25)+' 15v175M20 '+(15+i*25)+'h200" stroke="#d8cbe2"/>';
    const sx=45,sy=165,ex=sx+model.east*25,ey=sy-model.north*25;
    return '<figure class="catalog-grid"><svg viewBox="0 0 250 230" role="img" aria-label="Route op een raster"><rect x="20" y="15" width="200" height="175" fill="#fff"/>'+grid+
      '<path d="M'+sx+' '+sy+'H'+ex+'V'+ey+'" stroke="#863c90" stroke-width="5" fill="none"/><text x="'+(sx-14)+'" y="'+(sy+15)+'">S</text><text x="'+(ex+6)+'" y="'+ey+'">E</text></svg><figcaption>1 vakje = '+model.scale+' m</figcaption></figure>';
  }
  return "";
}

function catalogClock(minutes){return String(Math.floor(minutes/60)%24).padStart(2,"0")+"."+String(minutes%60).padStart(2,"0");}
function moneyForCatalog(cents){return "€ "+(cents/100).toLocaleString("nl-NL",{minimumFractionDigits:2,maximumFractionDigits:2});}

function catalogWork(task,lesson,deck,exercise=false) {
  return '<section class="work-document catalog-work"><header>Werkbon · '+escapeHTML(lesson.title)+'</header>'+factCards(task.facts)+catalogModel(task,deck,exercise)+'</section>';
}

function catalogWorkedSteps(task,visible) {
  const count=Math.min(visible,task.steps.length);
  return '<section class="answer-pane" aria-label="Uitwerking" tabindex="-1"><ol>'+task.steps.slice(0,count).map(step=>'<li>'+escapeHTML(step)+'</li>').join("")+'</ol>'+
    (count===task.steps.length?'<strong>'+escapeHTML(task.answer)+'</strong>':"")+'</section>';
}

function catalogOpeningPhoto(lesson,sector){return variedWorkPhoto(catalogOpeningPhotoBase(lesson,sector),{catalog:lesson,sector});}
function catalogOpeningPhotoBase(lesson,sector){
 if(lesson.kind==='boxLitres'){const box=careerBoxPhoto(sector);if(box)return box;}
 if(lesson.visualTopic==='clock'||lesson.example.model?.kind==='clock'){
  const planning=careerPhoto('start-'+sector+'-planning',sector);if(planning)return planning;
 }
  const photo=catalogMaterialPhotoBase(lesson,sector,lesson.example);
  if(photo)return photo;
  if(lesson.visualTopic==='coins'||lesson.visualTopic==='money')return paymentPhoto(sector);
  if(lesson.visualTopic==='clock'||lesson.example.model?.kind==='clock')return taskPhoto('clock','De klok op de werkplek',sector);
  return sectorMeasurementPhoto(sector,catalogContext(lesson,sector).measurementGroup||'length');
}
function catalogSlides(deck){
  const lesson=deck.catalog,context=catalogContext(lesson,deck.sector),h=escapeHTML;
  const example=catalogTaskForSector(lesson.example,lesson,deck.sector),exercise=catalogTaskForSector(lesson.exercise,lesson,deck.sector);
  const practice=lesson.practice.map(task=>catalogTaskForSector(task,lesson,deck.sector));
  const photo=catalogMaterialPhoto(lesson,deck.sector,example),exercisePhoto=catalogMaterialPhoto(lesson,deck.sector,exercise);
  const discussionDeck={...deck,modelSteps:0,columnSteps:0,revealed:false};
  const evidence=(task,exercise=false)=>{
    const work=catalogWork(task,lesson,deck.step===2?discussionDeck:deck,exercise),image=exercise?exercisePhoto:photo;
    return measurementTaskModel(task)?'<div class="measure-focus">'+work+image+'</div>':image+work;
  };
  const challenge=lesson.challenge.question+' '+lesson.challenge.facts.map(f=>f.label+' '+f.value).join(' \u00b7 ');
  return [
    lessonOpening(catalogOpeningPhoto(lesson,deck.sector),deck.sector,{material:context.material}),
    lessonSlide('Samen bespreken',lesson.title,'<p class="deck-context">'+h(context.context)+'</p><p class="lesson-question">'+h(example.question)+'</p>'+classDiscussion(),evidence(example),lesson.studentGoal),
    lessonSlide('Samen oefenen','Laat je aanpak zien','<p class="deck-context">'+h(context.context)+'</p><p class="lesson-question">'+h(exercise.question)+'</p><p class="edi-response">Denk eerst zelf. Laat tegelijk je antwoord met eenheid zien. Leg daarna je aanpak aan je buur uit.</p>'+
      differentiation(exercise.hint,challenge)+(deck.revealed?catalogWorkedSteps(exercise,exercise.steps.length):revealControl('Toon uitwerking')),evidence(exercise,true)),
    '<article class="drill-board catalog-practice"><h2>Nog even oefenen?</h2><p>Kies samen \u00e9\u00e9n of meer sommen. Je kunt ook na de klassenvraag afronden.</p>'+(lesson.visualTopic==='coins'?coinPicture():'')+rekenwoordHulp(lesson.studentGoal+' '+practice.map(task=>task.question).join(' '))+(example.model?.kind==='reference'?'':'<div class="practice-context-visual">'+photo+'</div>')+'<ol>'+practice.map(task=>
      '<li>'+(task.model?.kind==='reference'?catalogMaterialPhoto(lesson,deck.sector,task):'')+'<p>'+h(task.question)+'</p>'+factCards(task.facts)+catalogModel(task,deck,true)+'<details><summary>Antwoord</summary><strong>'+h(task.answer)+'</strong></details></li>').join('')+'</ol></article>'
  ];
}

function catalogNumoPractice(lesson) {
  const domain=lesson.domain;
  let module="Getallen 1F",topic="A · Optellen en aftrekken";
  if(domain==="gegevens"){module="Verbanden 1F";topic="A–C · Tabellen, diagrammen en conclusies";}
  if(domain==="verhoudingen"){module="Verhoudingen 1F";topic=/percent|discount/i.test(lesson.kind)?"C en F · Procenten en bewerkingen met percentages":"D en I · Verhoudingen toepassen";}
  if(domain==="ruimte"||domain==="meten"){module="Meten en meetkunde 1F";topic=/area|coverage|formula|edge/i.test(lesson.kind)?"D · Oppervlakte":/^scale(?:Read|Length|Check)$|^route/.test(lesson.kind)?"I · Schaal":/mass|gram|scale/i.test(lesson.kind)?"B · Gewichten":/volume|jug/i.test(lesson.kind)?"F · Inhoud":"A en J · Lengte en meetinstrumenten";}
  if(domain==="geldtijd"){/time|clock|duration|minutes|planning/i.test(lesson.kind)?(module="Meten en meetkunde 1F",topic="C · Datum en tijd"):(topic="Q · Rekenen met geld");}
  const numberTopics={multiply:["Getallen 1F","E · Vermenigvuldigen"],divide:["Getallen 1F","G · Vermenigvuldigen en delen"],rest:["Getallen 1F","G · Vermenigvuldigen en delen"],pack:["Getallen 1F","G · Vermenigvuldigen en delen"],both:["Getallen 1F","G · Vermenigvuldigen en delen"],count:["Getallen 1F","L · Getalkennis"],countCheck:["Getallen 1F","L · Getalkennis"],line:["Getallen 1F","P · Getallenlijnen"],round:["Getallen 1F","N · Afronden"],estimate:["Getallen 1F","N · Afronden"],estimateEnough:["Getallen 1F","N · Afronden"],decimalEqual:["Verhoudingen 1F","A · Decimale getallen"],decimalCompare:["Verhoudingen 1F","A · Decimale getallen"],decimalLimit:["Verhoudingen 1F","A · Decimale getallen"]};
  const calculationTopics={sub:'Aftrekken',columnSub:'Aftrekken',add:'Optellen',columnAdd:'Optellen',bridge:'Optellen',stock:'Optellen en aftrekken'};
  if(calculationTopics[lesson.kind])numberTopics[lesson.kind]=['Getallen 1F',calculationTopics[lesson.kind]];
  if(numberTopics[lesson.kind])[module,topic]=numberTopics[lesson.kind];
  return numoPracticeReference(module,topic);
}

function openCatalogMetric(week,day,prepare=false) {
  const previousYear=state.year;
  if(catalogFilters.year!=="all")state.year=Number(catalogFilters.year);
  if(prepare){
    openMetricNotes({metric:{week,day},sector:state.sector,step:2});
    state.year=previousYear;
    return;
  }
  state.page="lessen";
  openMetricDeck(week,day);
  state.deck.libraryYearBefore=previousYear;
}

function openCatalogNotes(id) {
  const lesson=catalogById.get(id);
  if(!lesson)return;
  const h=escapeHTML,context=catalogContext(lesson,state.deck?.sector||state.sector);
  state.prep=null;
  const task=(label,raw)=>{const item=catalogTaskForSector(raw,lesson,state.deck?.sector||state.sector);return '<section class="detail-section"><h3>'+label+'</h3><p>'+h(item.question)+'</p>'+factCards(item.facts)+catalogModel(item,{catalog:lesson,step:3,revealed:true,columnSteps:99,modelSteps:99},false)+
    '<ol>'+item.steps.map(step=>'<li>'+h(step)+'</li>').join("")+'</ol><p><strong>'+h(item.answer)+'</strong></p></section>';};
  $("details").setAttribute("aria-label","Les voorbereiden");
  $("details-body").innerHTML='<div class="detail-head"><h2>'+h(lesson.title)+'</h2>'+detailsCloseButton()+'</div>'+
    '<section class="detail-section"><p>'+h(catalogSchedule(lesson))+'</p><p><strong>Doel</strong> '+h(lesson.goal)+'</p><p><strong>Voorkennis</strong> '+h(lesson.prerequisites)+'</p><p>'+h(context.context)+'</p>'+
    '<p><strong>Voordoen</strong> '+h(lesson.strategy.method)+'</p><p><strong>Verwachte denkfout</strong> '+h(lesson.strategy.mistake)+'</p><p><strong>Vraag door</strong> '+h(lesson.strategy.followup)+'</p><p><strong>Na de starter</strong> '+h(lesson.strategy.transfer)+'</p>'+
    '<button type="button" class="btn primary" data-catalog-open="'+lesson.id+'">Presenteren</button></section>'+
    task("Docentvoorbeeld",lesson.example)+task("Klassenvraag",lesson.exercise)+
    '<section class="detail-section"><h3>Steun en uitdaging</h3><p>'+h(lesson.exercise.hint)+'</p><p>'+h(lesson.challenge.question)+'</p>'+factCards(lesson.challenge.facts)+'<p>'+h(lesson.challenge.answer)+'</p></section>'+
    lesson.practice.map((item,index)=>task("Extra som "+(index+1),item)).join("");
  if(!$("details").open)$("details").showModal();
}

document.addEventListener("input",event=>{
  if(event.target.id!=="catalog-query")return;
  catalogFilters.query=event.target.value;catalogFilters.limit=30;renderCatalogResults();
});
document.addEventListener("change",event=>{
  if(event.target.id==="catalog-year"){catalogFilters.year=event.target.value;catalogFilters.limit=30;renderCatalogResults();}
  if(event.target.id==="catalog-week"){catalogFilters.week=event.target.value;catalogFilters.limit=30;renderCatalogResults();}
  if(event.target.id==="catalog-sector")setSector(event.target.value);
});
document.addEventListener("click",event=>{
  const button=event.target.closest("button");
  if(!button||button.disabled)return;
  const d=button.dataset;
  if(d.catalogQuery){Object.assign(catalogFilters,{domain:'all',week:'all',query:d.catalogQuery,limit:30});renderCatalog();}
  if(d.catalogDomain){catalogFilters.domain=d.catalogDomain;catalogFilters.limit=30;renderCatalog();}
  if(d.catalogReset){Object.assign(catalogFilters,{domain:"all",year:"all",week:"all",query:"",limit:30});renderCatalog();}
  if(d.catalogMore){catalogFilters.limit+=30;renderCatalogResults();}
  if(d.photoMore){lessonImageLimit+=12;renderLessonImageBank();}
  if(d.catalogOpen)openCatalogLesson(d.catalogOpen);
  if(d.catalogPrep)openCatalogNotes(d.catalogPrep);
  if(d.catalogMetricWeek!==undefined)openCatalogMetric(Number(d.catalogMetricWeek),Number(d.catalogMetricDay));
  if(d.catalogMetricPrep!==undefined)openCatalogMetric(Number(d.catalogMetricPrep),Number(d.catalogMetricDay),true);
});

