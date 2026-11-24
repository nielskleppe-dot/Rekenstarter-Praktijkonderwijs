const $ = id => document.getElementById(id);
const DATA = JSON.parse($("rekenstart-data").textContent);
const escapeHTML = value => String(value ?? "").replace(/[&<>"']/g, char => ({
  "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
}[char]));
const today = () => amsterdamDate();
const dateLabel = (value,options={day:"numeric",month:"short"}) => new Intl.DateTimeFormat("nl-NL",{...options,timeZone:"UTC"})
  .format(new Date(value+"T12:00:00Z"));
const disk = {
  get(key,fallback){
    try { return JSON.parse(localStorage.getItem("rekenstart."+key)) ?? fallback; }
    catch { return fallback; }
  },
  put(key,value){ try { localStorage.setItem("rekenstart."+key,JSON.stringify(value)); } catch {} }
};
let settings;
try { settings=validatedSettings(disk.get("plan",baseSettings(DATA)),DATA); }
catch { settings=baseSettings(DATA); }
let service={shared:false,canEdit:true,liveCoach:false,ai:{provider:"gemini",label:"Gemini",ready:false},revision:0};
const state = {
  page:"overview",year:disk.get("year",1)===2?2:1,sector:disk.get("sector","groen"),
  week:activeWeek(settings.starts,today(),DATA.holidays).nearest,pinned:false,deck:null,prep:null,
  previewPhase:disk.get("practice-preview","planning"),
  editLesson:null, draft:null
};
if(!DATA.sectors.some(sector=>sector.id===state.sector)) state.sector="groen";
if(!isPhase(DATA,state.previewPhase))state.previewPhase="planning";
const sectorInfo = () => DATA.sectors.find(sector=>sector.id===state.sector);
const weekRecord = () => DATA.years[state.year-1][state.week];
const goalFor = lesson => settings.goalLabels[lesson.id] ?? lesson.goal;
const slotFor = lesson => DATA.slots.find(slot=>slot.key===lesson.day);
const dayDate = (week,slot) => shiftDate(settings.starts[week],slot.offset);
const currentStatus = () => activeWeek(settings.starts,today(),DATA.holidays);
const isCancelled = (week,lesson) => settings.cancelled.includes((week+1)+"-"+lesson.day);
const phaseFor = (lesson,sector=state.sector) => lessonPhase(DATA,settings,lesson,sector,state.previewPhase);
const variantKey = (lesson,sector=state.sector,phase=phaseFor(lesson,sector).key) => lesson.id+":"+sector+":"+phase;
function variantDraft(lesson,sector=state.sector,phase=phaseFor(lesson,sector).key){
  return settings.variants[variantKey(lesson,sector,phase)] ?? (phase==="orienteren"?settings.variants[lesson.id+":"+sector]:undefined);
}
function activeVariant(lesson,sector=state.sector){
  const phase=phaseFor(lesson,sector);
  const base=lesson.byPhase[phase.key][sector];
  const override=variantDraft(lesson,sector,phase.key);
  const published=override?.status==="ready"?override:override?.previous;
  const variant={...base,...published,phasePlanned:phase.planned,confirmed:Boolean(phase.planned&&published?.task&&published?.source)};
  if(published?.source&&published.source!==base.source)variant.link="";
  return variant;
}
function phaseOptions(selected=state.previewPhase){
  const values=[["planning","Volgens planning"],...Object.entries(DATA.phaseLabels).map(([key,label])=>[key,"Voorbeeld "+label])];
  return values.map(([key,label])=>'<option value="'+key+'" '+(selected===key?"selected":"")+'>'+escapeHTML(label)+'</option>').join("");
}
function setPreviewPhase(value){
  if(value!=="planning"&&!isPhase(DATA,value))return;
  state.previewPhase=value;
  disk.put("practice-preview",value);
  renderPage();
}
function byDay(day){
  return weekRecord().lessons.find(lesson=>lesson.day===day);
}
function showToast(message){
  const view=$("toast");
  view.textContent=message;
  view.hidden=false;
  clearTimeout(showToast.timer);
  showToast.timer=setTimeout(()=>{view.hidden=true;},3400);
}

const gradeLabel=year=>"PrO "+(year+2);
const schoolYearLabel=year=>year===1?'2026/2027':'2027/2028';
function yearButtons(){
 return [1,2].map(year=>'<button type="button" data-year="'+year+'" aria-label="Schooljaar '+schoolYearLabel(year)+'" aria-pressed="'+(state.year===year)+'"><span>Schooljaar</span><strong>'+schoolYearLabel(year)+'</strong></button>').join("");
}
function renderYear(){
 $("year-picker").innerHTML=yearButtons();
}
function selectedHomeLesson(data,plan,year,week,pinned,day,preferredDay=null){
 const items=data.years[year-1].flatMap((record,index)=>record.lessons.map(lesson=>({lesson,week:index,date:shiftDate(plan.starts[index],data.slots.find(s=>s.key===lesson.day).offset)})))
  .filter(item=>!plan.cancelled.includes((item.week+1)+"-"+item.lesson.day));
 const inWeek=items.filter(item=>item.week===week);
 if(pinned)return inWeek.find(item=>item.lesson.day===preferredDay)??inWeek.find(item=>item.date>=day)??inWeek[0]??null;
 return items.find(item=>item.date>=day)??items.at(-1)??null;
}
function homeLessonTitle(lesson){
 const titles={count:"Klopt de telling?",line:"Waar hoort het aantal?",diff:"Hoeveel scheelt het?",add:"Wat is samen nodig?",bridge:"De levering is binnen",sub:"Wat blijft er over?",refill:"Vul de voorraad aan",need:"Is er genoeg voor de klus?",multiply:"Hoeveel is het samen?",divide:"Verdeel de bestelling",round:"Maak een snelle inschatting",estimate:"Schat eerst, controleer daarna",stock:"Werk de voorraad bij",rest:"Wat doe je met de rest?",pack:"Kan de hele bestelling mee?",both:"Hoeveel bakken moeten mee?",ruler:"Lees de maat goed af",cm:"Geef de juiste maat door",decimalCm:"Van meters naar centimeters",decimalEqual:"Zijn de maten gelijk?",decimalCompare:"Welke maat is groter?",cmCompare:"Vergelijk de twee lengtes",decimalLimit:"Welke maat past?",fit:"Past het op deze plek?",decimalFit:"Past het op deze plek?",scale:"Lees het gewicht af",gram:"Hoeveel gram is het?",massCompare:"Welke hoeveelheid is zwaarder?",massRefill:"Weeg de juiste hoeveelheid af"};
 return titles[lesson.type]??lesson.theme;
}
function homePhoto(variant,className=""){
 const im=variant.workplace?.lessonImage;
 if(!im||!DATA.images[im.group])return "";
 const x=100*(im.index%im.columns)/(im.columns-1),y=100*Math.floor(im.index/im.columns)/(im.rows-1);
 return '<div class="home-photo '+className+'" role="img" aria-label="'+escapeHTML(im.alt)+'"><span style="background-image:url('+DATA.images[im.group]+');background-position:'+x+'% '+y+'%;background-size:'+im.columns+'00% '+im.rows+'00%"></span></div>';
}
function renderOverview(){
 const day=today(),h=escapeHTML;
 const featured=selectedHomeLesson(DATA,settings,state.year,state.week,state.pinned,day,state.selectedDay);
 if(!state.pinned&&featured)state.week=featured.week;
 const record=weekRecord(),active=currentStatus(),first=settings.starts[state.week],last=shiftDate(first,4);
 const hour=Number(new Intl.DateTimeFormat("nl-NL",{hour:"numeric",hourCycle:"h23",timeZone:"Europe/Amsterdam"}).format(new Date()));
 const greeting=hour<12?"Goedemorgen":hour<18?"Goedemiddag":"Goedenavond";
 const selected=featured?.lesson,variant=selected?activeVariant(selected):null;
 const badge=featured?.date===day?"Vandaag":state.pinned?"Jouw leskeuze":featured?.date>day?"Volgende les":"Laatste les van dit blok";
 $("hero").innerHTML=featured?'<div class="hero-copy"><p class="home-welcome">'+greeting+'. Dit is jouw rekenstart.</p><div class="hero-kicker"><span class="hero-pill">'+badge+'</span><span>'+h(dateLabel(featured.date,{weekday:"long",day:"numeric",month:"long"}))+' · Week '+(featured.week+1)+'</span></div><h1>'+h(homeLessonTitle(selected))+'</h1><p class="home-lesson-meta">'+h(gradeLabel(state.year)+' · '+sectorInfo().name+' · '+variant.material)+'</p><p class="home-goal">'+h(goalFor(selected))+'</p><p class="kit-line"><strong>Leg klaar</strong> · '+h(practiceCheck(selected).kit)+'</p><div class="home-primary-actions"><button type="button" class="btn primary" data-start="'+selected.day+'">'+icon("play")+' Presenteren</button><button type="button" class="btn home-prepare" data-prep="'+selected.day+'">Bereid de les voor</button></div><p class="home-duration">3 dia’s + extra oefenen <span>·</span> 6–8 minuten <span>·</span> Samen kijken, rekenen en bespreken</p></div><div class="hero-preview">'+homePhoto(variant,"featured-photo")+'<span class="photo-credit">Beroepsbeeld · AI-illustratie</span><div class="hero-image-label">'+icon(sectorInfo().icon)+'<span>'+h(variant.material)+'</span></div></div>':
 '<div class="hero-copy"><p class="home-welcome">'+greeting+'.</p><h1>Deze week is vrij.</h1><p class="home-goal">De lesmomenten in deze week zijn vervallen. Kies hieronder een andere week.</p></div>';
 $("home-year-picker").innerHTML=yearButtons();
 $("sectors").innerHTML=DATA.sectors.map(sector=>{
  const sample=record.lessons.find(l=>!isCancelled(state.week,l))??record.lessons[0];
  const v=activeVariant(sample,sector.id);
  return '<button type="button" class="sector" data-sector="'+sector.id+'" aria-pressed="'+(state.sector===sector.id)+'">'+homePhoto(v,"sector-thumbnail")+'<span class="sector-copy"><strong>'+h(sector.name)+'</strong><small>'+h(sector.caption)+'</small></span><span class="sector-check" aria-hidden="true">'+(state.sector===sector.id?icon("check"):"")+'</span></button>';
 }).join("");
 $("home-day-picker").innerHTML=record.lessons.map(l=>{
  const slot=slotFor(l),cancelled=isCancelled(state.week,l);
  return '<button type="button" data-home-day="'+l.day+'" aria-pressed="'+(selected?.day===l.day)+'" '+(cancelled?'disabled':'')+'><strong>'+h(slot.name)+'</strong><span>'+h(dateLabel(dayDate(state.week,slot)))+(cancelled?' · vervallen':'')+'</span></button>';
 }).join("");
 $("week-nav").innerHTML='<div class="week-side"><button type="button" class="icon-btn" aria-label="Vorige week" data-week="'+(state.week-1)+'" '+(state.week===0?'disabled':'')+'>'+icon("left")+'</button><button type="button" class="icon-btn" aria-label="Volgende week" data-week="'+(state.week+1)+'" '+(state.week===DATA.defaultStarts.length-1?'disabled':'')+'>'+icon("right")+'</button></div><details class="home-week-picker"><summary><span><strong>Week '+record.week+'</strong><span>'+h(dateLabel(first)+' – '+dateLabel(last,{day:"numeric",month:"short",year:"numeric"}))+'</span></span><span class="week-change">Kies een andere week '+icon("calendar")+'</span></summary><nav class="week-chips" aria-label="Lesweek kiezen">'+DATA.defaultStarts.map((_,index)=>'<button type="button" data-week="'+index+'" aria-label="Lesweek '+(index+1)+'" aria-current="'+(state.week===index)+'">Week '+(index+1)+'</button>').join("")+'</nav></details><button type="button" class="text-btn" data-action="today">Actuele planning</button>';
 $("phase-view").innerHTML='<details class="home-phase-settings"><summary>Praktijkfase en bronkoppeling</summary><div><label for="phase-preview">Praktijkfase</label><select id="phase-preview">'+phaseOptions()+'</select><p>'+h(record.lessons.some(l=>phaseFor(l).planned)?"De geplande fase staat in de docentvoorbereiding.":"Kies een fase om voorbeelden te bekijken. Leg de overgangsdatums vast bij Beheer.")+'</p></div></details>';
 $("lessons-title").textContent="Deze week aan het werk";
 $("lessons-caption").textContent=gradeLabel(state.year)+" · "+sectorInfo().name+" · Week "+record.week;
 $("lessons").innerHTML=record.lessons.map(lesson=>{
  const v=activeVariant(lesson),slot=slotFor(lesson),date=dayDate(state.week,slot);
  const cancelled=isCancelled(state.week,lesson),chosen=selected?.id===lesson.id,isToday=date===day&&!cancelled;
  return '<article class="lesson'+(chosen?' is-selected':'')+(isToday?' is-today':'')+(cancelled?' is-cancelled':'')+'" data-lesson-card="'+lesson.id+'">'+homePhoto(v,"lesson-thumbnail")+'<div class="lesson-body"><div class="lesson-top"><span class="lesson-day">'+h(slot.name+' '+dateLabel(date))+'</span>'+(isToday?'<span class="label today">Vandaag</span>':chosen?'<span class="label">Geselecteerd</span>':cancelled?'<span class="label cancelled">Vervallen</span>':'')+'</div><p class="lesson-material">'+h(v.material)+'</p><h3>'+h(homeLessonTitle(lesson))+'</h3><p class="lesson-learning-goal">'+h(goalFor(lesson))+'</p><div class="lesson-bottom"><span class="lesson-duration">'+icon("calendar")+' 6–8 minuten</span><div class="lesson-actions"><button type="button" class="btn '+(chosen?'primary':'')+'" data-start="'+lesson.day+'" '+(cancelled?'disabled':'')+' aria-label="Presenteren '+h(slot.name.toLowerCase())+'">'+icon("play")+' Presenteren</button><button type="button" class="text-btn" data-prep="'+lesson.day+'" aria-label="Voorbereiden '+h(slot.name.toLowerCase())+'">Voorbereiden</button></div></div></div></article>';
 }).join("");
 $("home-assistant").innerHTML='<div class="assistant-mark" aria-hidden="true">'+icon("wrench")+'</div><div class="assistant-copy"><span class="eyebrow">Praktijkassistent</span><h2>Hulp bij jouw praktijkles</h2><p>Maak een werkkaart of pas een opdracht aan voor jouw groep.</p></div><button type="button" class="btn" data-home-assistant="true">Open de praktijkassistent '+icon("arrow")+'</button>';
}


function renderPage(){
  renderYear();
  $("learning-toolbar").hidden=state.page==="overview"||state.page==="lessen";
  for(const page of ["overview","curriculum","admin","workcards","metrieklessen","lessen"]) $(page).hidden=page!==state.page;
  document.querySelectorAll("[data-page]").forEach(button=>{
    if(button.dataset.page===state.page) button.setAttribute("aria-current","page");
    else button.removeAttribute("aria-current");
  });
  if(state.page==="lessen") renderCatalog();
  if(state.page==="metrieklessen") renderMetricOverview();
  if(state.page==="overview") renderOverview();
  if(state.page==="curriculum") renderCurriculum();
  if(state.page==="admin") renderAdmin();
  if(state.page==="workcards") renderWorkcards();
}
function setWeek(week,pinned=true){
  if(!Number.isInteger(week) || week<0 || week>=DATA.defaultStarts.length) return;
  state.week=week;
  state.selectedDay=null;
  state.pinned=pinned;
  state.editLesson=null;
  renderPage();
}
function setSector(sector){
  if(!DATA.sectors.some(item=>item.id===sector)) return;
  state.sector=sector;
  disk.put("sector",sector);
  renderPage();
}

function deckUrl(lesson,sector){
  const url=new URL(location.href);
  const params=new URLSearchParams({les:lesson.id,sector});
  if(isPhase(DATA,state.previewPhase))params.set("fase",state.previewPhase);
  url.hash=params.toString();
  return url.href;
}
function writeHash(url){
  try { history.replaceState(null,"",url); } catch {}
}
function enterFullscreen(){
  const page=document.documentElement;
  if(!document.fullscreenElement && page?.requestFullscreen){
    page.requestFullscreen().catch(()=>{});
  }
}
function openDeck(lesson,custom=null,fullscreen=false){
  if(!lesson)return;
  const variant=activeVariant(lesson);
  state.deck={lesson,sector:state.sector,variant:custom?{...variant,title:custom.title,context:custom.context,next:custom.mode==="context"?"Gebruik de rekenstap bij de materialen van jullie werkopdracht.":variant.next}:variant,
    mode:custom?.mode??"main",draft:custom,step:1,revealed:false};
  if($("details").open) $("details").close();
  renderDeck();
  if(!$("presentation").open) $("presentation").showModal();
  writeHash(deckUrl(lesson,state.sector));
  if(fullscreen)enterFullscreen();
}
function parseLink(){
  if(location.hash==="#lessen"){state.page="lessen";renderPage();return;}
  const catalogParams=new URLSearchParams(location.hash.slice(1));
  const catalogId=catalogParams.get("bibliotheek");
  if(catalogId){
    const sector=catalogParams.get("sector");
    if(DATA.sectors.some(item=>item.id===sector))state.sector=sector;
    if(catalogById.has(catalogId))openCatalogLesson(catalogId,false);
    else {state.page="lessen";renderPage();showToast("Deze les is niet gevonden.");}
    return;
  }
  if(location.hash==="#metrieklessen"){state.page="lessen";catalogFilters.domain="meten";renderPage();return;}
  const params=new URLSearchParams(location.hash.slice(1));
  const metric=params.get("metriek");
  if(metric&&/^\d-\d$/.test(metric)){
    const [week,day]=metric.split("-").map(Number);
    if(!metricTopics[week]?.items[day])return;
    state.year=params.get("jaar")==="2"?2:1;
    const sector=params.get("sector");
    if(DATA.sectors.some(item=>item.id===sector))state.sector=sector;
    state.page="overview";
    renderPage();
    openMetricDeck(week,day,false);
    return;
  }
  const id=params.get("les");
  if(!id) return;
  const lesson=lessonLookup(DATA,id);
  if(!lesson) return;
  const [year,week]=id.split("-").map(Number);
  const sector=params.get("sector");
  const phase=params.get("fase");
  state.previewPhase=isPhase(DATA,phase)?phase:"planning";
  state.year=year;
  state.week=week-1;
  state.pinned=true;
  state.page="overview";
  if(DATA.sectors.some(item=>item.id===sector)) state.sector=sector;
  renderPage();
  openDeck(lesson);
}
function applicationFor(lesson,sector,variant,draft={}){
 const base=lesson.application.stages[sector];
 return {...base,stage:true,label:"Op dezelfde werkplek",context:draft.applicationContext||variant.workplace.secondContext,material:variant.material};
}

function revealControl(label){
  return '<button type="button" class="btn primary" data-action="reveal">'+escapeHTML(label)+'</button>';
}
function detailsCloseButton(){
  return '<button type="button" class="icon-btn details-close" data-action="close-details" aria-label="Sluit venster" title="Sluiten">'+icon('close')+'</button>';
}
const regularCareerAliases={
 eco:{'ongezouten noten':'losse noten'},
 zw:{bekers:'drinkbekers',bordjes:'ontbijtbordjes',kastplank:'plank'},
 hbr:{borden:'dinerborden',bloem:'meel',buffetmodule:'buffettafel'},
 groen:{stekpotjes:'kunststof potten',bloemstelen:'tulpen',bamboestokken:'steunen','zakjes zaad':'bloemzaad',randstuk:'tuinrand'},
 techniek:{bevestigingsclips:'kabelclips',verbindingshoekjes:'montagebeugels','metalen sluitringen':'sluitringen'}
};
const careerWorkQuestions={
 groen:[
  [/boomsteun|steunen|bamboe|boompalen|boomanker/,'Waarvoor gebruik je deze stokken in een kwekerij?'],
  [/plantenringen|plantclips|boomband/,'Waarvoor gebruikt een kweker deze spullen bij de planten?'],
  [/tulp|rozen|zonnebloem|dahlia|bloemboeket|emmerboeket|bloemstelen|bloemvaas/,'Wat doet een medewerker met deze bloemen in de bloemenwinkel?'],
  [/haagplant|koolplant|lavendel|kruidenplant|jonge planten|aardbeienplant/,'Wat doet een medewerker om deze planten goed te verzorgen?'],
  [/potten|stekpot|plantenpot|potonderzet|onderzetter|plantenbak|zaaibak/,'Waarvoor gebruikt een kweker deze potten en bakken?'],
  [/zaad|bloembol|bonen/,'Wat doet een kweker met dit materiaal bij het zaaien of planten?'],
  [/voerbak|drinkbak|voerlepel|voederbal|diervoer/,'Wat doet een dierverzorger met deze spullen?'],
  [/gieter|tuinslang|druppelslang|waterkoppeling|waterdruppelaar|water voor|waterbak/,'Wat doet een medewerker met deze spullen bij de planten?'],
  [/snoeischaar/,'Waarvoor gebruikt een hovenier deze snoeischaar?'],
  [/handschoen/,'Waarom draagt een medewerker handschoenen bij dit werk?'],
  [/appel|fruit|eieren|aardbeienbak/,'Wat doet een medewerker met deze producten voordat ze naar de klant gaan?'],
  [/schors|compost|potgrond/,'Waarvoor gebruikt een hovenier dit materiaal in een tuin?'],
  [/gras|gazon/,'Wat doet een hovenier om dit gazon netjes aan te leggen?'],
  [/gronddoek/,'Waarvoor gebruikt een hovenier gronddoek in een tuin?'],
  [/looproute|route|kaspad|paden|kort pad|terrein/,'Wat doet een medewerker om spullen handig naar de werkplek te brengen?'],
  [/klinker|tegel|bestrating|terras|tuinrand|opsluitband|randhout|randstuk/,'Wat doet een stratenmaker met dit materiaal?'],
  [/plantvak|border|tuin in aanleg|werkvak/,'Wat doet een hovenier om deze plek klaar te maken voor planten?'],
  [/plank|tuinregel|plantenrek/,'Waarvoor gebruikt een medewerker dit materiaal in de kwekerij?'],
  [/emmer|werkemmers|tuinmateriaal/,'Waarvoor gebruikt een medewerker deze spullen tijdens het werk?']
 ],
 techniek:[
  [/bouten|moeren|sluitring|schroeven|scharnier|montagebeugel|deurknop|handgre|deurstop|plankdrager|slangklem/,'Wat doet een monteur met deze onderdelen?'],
  [/kabelbinder|kabelclip|kabeldoorvoer/,'Waarvoor gebruikt een monteur deze spullen bij kabels?'],
  [/stekker|zekering|accuhouder|afdekdop/,'Wat doet een monteur met deze onderdelen bij een reparatie?'],
  [/fiets|bandventiel|wielen/,'Wat doet een fietsenmaker met deze onderdelen?'],
  [/schroevendraaier|boorkop|rolmaat|gereedschap/,'Wat doet een monteur voordat hij aan een klus begint?'],
  [/verfroller|kwast|verfbeugel/,'Wat doet een schilder met deze spullen?'],
  [/schuurvel|schuurblok/,'Waarvoor gebruikt een medewerker dit materiaal bij het schuren?'],
  [/lasbril|veiligheidsbril|werkhandschoen/,'Waarom draagt een medewerker bescherming bij dit werk?'],
  [/spanband/,'Waarvoor gebruikt een monteur deze spanbanden?'],
  [/water/,'Waarvoor gebruikt een medewerker schoon water in de werkplaats?'],
  [/looproute|route|indeling|montagehal|magazijn/,'Wat doet een medewerker om spullen handig naar de werkplek te brengen?'],
  [/vloer|tegel|werkvak|montageplek|montagevak|machinevak|rand om/,'Wat doet een medewerker bij het klaarmaken van deze werkplek?'],
  [/hout|montagelat|buis|afwerkstrip|viltglijder|profiel|kastplank|metalen strip|werkplaatsrek|montagemateriaal/,'Waarvoor gebruikt een monteur dit materiaal in de werkplaats?']
 ],
 zw:[
  [/plank|opbergrek|opbergmand|opbergkast|kaststeun|voorraadkast/,'Welke spullen bergt een medewerker hier op?'],
  [/handdoeken/,'Waarvoor gebruikt een bewoner deze handdoeken?'],
  [/washand|handdoek|kussenslo|waszak|deken|beddengoed|badmat|linnen/,'Wat doet een medewerker met schoon linnengoed voor de bewoners?'],
  [/drinkbeker|drinkfles|waterkan|drinkwater|theekop|theedo[oz]|theezak|bekers/,'Wat doet een medewerker wanneer een bewoner iets wil drinken?'],
  [/tafelloper/,'Waarvoor legt een medewerker een tafelloper op de tafel?'],
  [/gordijnrail/,'Waarvoor gebruikt een medewerker een gordijnrail in een kamer?'],
  [/havermout|ontbijtspullen|ontbijtbord|bordjes|broodmand|slabben|placemat|servethouder|kommen|servetten/,'Wat doet een medewerker voordat de bewoners gaan eten?'],
  [/zeep|tandenborstel|haarborstel|shampoo|toiletspullen|pantoffel|sokken/,'Wat doet een medewerker met deze spullen bij de verzorging van een bewoner?'],
  [/schoonmaak|poetsborstel|keukendoek|afwasteil/,'Wat doet een medewerker om de spullen voor bewoners schoon te houden?'],
  [/borduurring|kwast|knutsel|tafelkaart|bloempot|bloemvaas/,'Wat doet een medewerker met deze spullen tijdens een activiteit met bewoners?'],
  [/looproute|route|gang|afdeling|woonkamer|huiskamer|zithoek/,'Wat doet een medewerker als hij spullen naar een bewoner brengt?'],
  [/vloer|tegel|activiteiten|werkplek|dagbesteding|ruimte|linnenkamer|rand in|rand om|vloerbedekking/,'Wat doet een medewerker om deze werkplek klaar te maken?']
 ],
 hbr:[
  [/broodje|croissant|muffin|gebak|koekje|cakes/,'Wat doet een medewerker voordat de bakkerij opengaat?'],
  [/bananen|tomaten|paprika|fruit|eieren|meel|bloem|deeg|chocolade/,'Wat maakt een medewerker in de keuken met deze producten?'],
  [/koffie|theezak|theelepel|thee$|limonade|appelsap|drinkpak|waterkaraf|melk|maatlepel/,'Wat doet een medewerker wanneer een gast iets wil drinken?'],
  [/glazen|dessertlepel|dinerbord|taartbord|soepkom|koffiekop|vorken|soepbeker|ijscoupe|sausschaal|melkkann|broodmand|servetten|tafelloper|onderzet/,'Wat doet een medewerker met deze spullen bij het klaarmaken van de tafel?'],
  [/dienblad|serveertang|afhaalbak|weckpot|bakvorm|snijplank/,'Wat doet een keukenmedewerker met deze spullen?'],
  [/schort/,'Waarom draagt een keukenmedewerker een schort bij het werk?'],
  [/looproute|route|indeling|horecazaal|hotel|keukenzones/,'Wat doet een medewerker om spullen handig naar de juiste plek te brengen?'],
  [/buffet|tafelblad|serveerplek|serveervak|restaurantplek|buffetspullen/,'Wat doet een medewerker voordat de gasten bij het buffet komen?'],
  [/vloer|tegel|rubbermat|vloermat|rand om|keukenvloer/,'Wat doet een medewerker om de werkvloer netjes en veilig te maken?'],
  [/voorraadrek|keukenplank|afwerkstrook|bakpapier/,'Waarvoor gebruikt een medewerker dit materiaal in de keuken?']
 ],
 eco:[
  [/cadeaulint|inpaklint|inpakvel|inpakrol|cadeauzak|verzendzak|pakket/,'Wat doet een medewerker om een bestelling netjes in te pakken?'],
  [/notitieboek|potlo|pennen|envelop|boek|brievenbak|ringenmap/,'Wat doet een winkelmedewerker met deze spullen voor de klanten?'],
  [/blikken soep|flessen sap|koffie|noten|boodschappen/,'Wat doet een winkelmedewerker met deze producten voordat ze naar de klant gaan?'],
  [/sokken|paraplu|telefoonhoes|tas|petten|sjaal|rugtas|handschoen|haarelastiek/,'Wat doet een winkelmedewerker om deze spullen netjes te presenteren?'],
  [/koffiemok|mokken|waterfles|broodtrommel|bekers|fotolijst|onderzetter|kaars|plantenpot|wasmand|borstel|bezem|keukendoek|theedoek|zeepfles|keukenspons|knijper|batterij|winkelartikelen/,'Wat doet een winkelmedewerker om een klant bij deze spullen te helpen?'],
  [/water voor|pipet/,'Wat laat een winkelmedewerker met deze spullen aan een klant zien?'],
  [/looproute|route|indeling|magazijnruimte/,'Wat doet een medewerker om de winkelvoorraad handig op zijn plek te krijgen?'],
  [/vloer|tegel|vloerbedekking|winkelvak|verkoopvak|verkoopruimte|presentatievak|rand om|vlak met/,'Wat doet een medewerker bij het klaarmaken van deze winkelplek?'],
  [/winkelschap|winkelbord|schapsteun|displayplank|presentatierek|presentatiestrook|etiketrol|plakband|magazijnplank/,'Wat doet een medewerker om de spullen in de winkel goed te presenteren?']
 ]
};
function careerMaterialKey(value){return String(value||'').toLowerCase().trim().replace(/^(?:een|de|het)\s+/,'').replace(/\s+/g,' ');}
function regularCareerRecord(deck){
 const key=careerMaterialKey(deck.variant.material),subject=regularCareerAliases[deck.sector]?.[key]||key;
 const fresh=careerPhotos.find(p=>p.sector===deck.sector&&careerMaterialKey(p.material)===subject);
 if(fresh)return {record:fresh,fresh:true};
 const matches=lessonPhotoBank.filter(p=>p.sector===deck.sector&&careerMaterialKey(p.material)===subject);
 const record=matches.find(p=>p.kind===deck.lesson.type)||matches[0];
 return record?{record,fresh:false}:null;
}
function careerWorkProfile(photo,sector,context={}){
 const freshId=photo.match(/data-career-photo-id="([^"]+)"/)?.[1],bankId=photo.match(/data-photo-id="([^"]+)"/)?.[1];
 const fresh=careerPhotosById.get(freshId),bank=lessonPhotosById.get(bankId);
 if(fresh)return {id:fresh.id,topic:fresh.topic,question:fresh.question,material:fresh.material};
 const key=photo.match(/data-task-photo-key="([^"]+)"/)?.[1]||'';
 if(photo.includes('data-topic-photo="money"'))return {id:'payment-'+sector,topic:'klanten',question:'Wat doet een medewerker om een klant goed te helpen bij de kassa?'};
 if(key.endsWith('-temperature')){
  const questions={groen:'Wat doet een kweker om de planten in de kas goed te verzorgen?',techniek:'Hoe zorgt een medewerker voor een fijne werkplek in de garage?',hbr:'Wat doet een kok om het eten goed te bereiden?',zw:'Waarom bewaart de medewerker eten in een koelkast?',eco:'Wat doet een winkelmedewerker met producten die koel moeten blijven?'};
  return {id:key,topic:'werkplek',question:questions[sector]};
 }
 if(key.endsWith('-surface')){
  const questions={groen:'Wat doet een hovenier met dit plantvak?',techniek:'Waarvoor gebruikt een monteur dit werkblad?',hbr:'Wat doet een medewerker voordat gasten aan deze tafel komen?',zw:'Welke spullen bergt een medewerker in deze kast op?',eco:'Hoe helpt dit winkelbord de klanten?'};
  return {id:key,topic:'werkplek',question:questions[sector]};
 }
 const material=bank?.material||context.material||'',text=careerMaterialKey(material);
 const common=[[/paperclip/,'Waarvoor gebruikt een medewerker een paperclip bij een werkbon?'],[/pipet/,'Waarvoor gebruikt een medewerker een pipet bij het werken met water?'],[/^schroef$/,'Wat doet een medewerker met deze schroef bij een reparatie?'],[/afstand|beschermblok|kunststof blok|houten blok|metalen buisje|verpakkingsblok|vakverdeler/,'Wat doet een medewerker met dit materiaal bij het maken of repareren van iets?']];
 const item=[...common,...(careerWorkQuestions[sector]||[])].find(([pattern])=>pattern.test(text));
 return {id:bank?.id||key||'legacy-'+sector+'-'+text,topic:item?'beroepspraktijk':'fallback',question:item?item[1]:'Wat doet een medewerker met deze spullen tijdens het werk?',material};
}

function lessonOpening(photo,sector,context={}){
 const name=DATA.sectors.find(item=>item.id===sector)?.name||'',profile=careerWorkProfile(photo,sector,context),h=escapeHTML;
 return '<article class="career-opening" data-opening-photo="'+h(profile.id)+'" data-opening-topic="'+h(profile.topic)+'"><div class="career-photo">'+photo+'</div><div class="career-conversation"><span class="slide-label">Aan het werk - '+h(name)+'</span><h2>Wat zie je op deze foto?</h2><div class="career-prompts"><p class="career-job-question">'+h(profile.question)+'</p></div></div></article>';
}
function lessonGoalBanner(goal){
  return '<aside class="lesson-goal-banner" aria-label="Lesdoel"><strong>Lesdoel</strong><p>'+escapeHTML(goal)+'</p></aside>';
}
function classDiscussion(){
  return '<aside class="class-discussion"><strong>Denk eerst zelf. Bespreek daarna samen.</strong><ol><li>Welke gegevens heb je nodig?</li><li>Hoe zou jij beginnen? Leg je idee uit.</li></ol></aside>';
}
function lessonSlide(label,title,copy,evidence,goal=''){
  copy+=rekenwoordHulp(title+' '+copy);
  const heading='<span class="slide-label">'+escapeHTML(label)+'</span><h2>'+escapeHTML(title)+'</h2>';
  const slide='<div class="deck-content professional-slide teaching-slide'+(evidence?'':' single-column')+'"><div class="slide-copy">'+(goal?'<header class="lesson-heading">'+heading+'</header>':heading)+copy+'</div>'+(evidence?'<div class="work-evidence">'+evidence+'</div>':'')+'</div>';
  return goal?'<section class="lesson-with-goal">'+lessonGoalBanner(goal)+slide+'</section>':slide;
}

function workedSteps(task,visibleSteps=task.steps.length){
  const h=escapeHTML;
  return '<section class="answer-pane" tabindex="-1" aria-label="Uitwerking"><ol>'+task.steps.slice(0,visibleSteps).map(step=>'<li>'+h(step)+'</li>').join("")+'</ol>'+(visibleSteps>=task.steps.length?'<strong>'+h(task.answer)+'</strong>':'')+'</section>';
}
function regularMaterialPhoto(deck){return variedWorkPhoto(regularMaterialPhotoBase(deck),deck);}
function regularMaterialPhotoBase(deck){
 const {variant,sector}=deck,h=escapeHTML;
 const matched=regularCareerRecord(deck);
 if(matched)return matched.fresh?careerPhoto(matched.record.id,sector):lessonBankPhoto(matched.record.id,sector);
 const photo=lessonPhotoBank.find(p=>p.batch==='meten-ruimte-300'&&p.sector===sector&&p.kind===deck.lesson.type);
 if(photo){
  const families=[/voer|brok/i,/havermout/i,/\bmeel\b|\bbloem\b/i,/moer/i,/pakket/i,/\bmelk\b/i,/\bwater\b/i];
  if(families.some(pattern=>pattern.test(variant.material)&&pattern.test(photo.material)))return lessonBankPhoto(photo.id,sector);
 }
 if(sector==='zw'&&/havermout/i.test(variant.material))return sectorMeasurementPhoto(sector,'mass');
 if(sector==='hbr'&&/\b(bloem|meel)\b/i.test(variant.material))return sectorMeasurementPhoto(sector,'mass');
 if(sector==='groen'&&/randstuk|straatband|opsluitband|trottoirband/i.test(variant.material))return instrumentPhoto('kerb');
 return '<figure class="lesson-object">'+homePhoto(variant,'board-object')+'<figcaption>'+h(variant.material)+' · beroepsillustratie</figcaption></figure>';
}
function regularSlides(deck){
  const {lesson,variant}=deck;
  const example=deck.mode==='extra'?lesson.check:lesson.main;
  const exercise=deck.mode==='extra'?lesson.main:lesson.check;
  const exampleSecond=example===lesson.check,exerciseSecond=exercise===lesson.check;
  const h=escapeHTML;
  const context=exerciseSecond?applicationFor(lesson,deck.sector,variant,deck.draft??{}).context:variant.context;
  const materialPhoto=regularMaterialPhoto(deck);
  return [
    lessonOpening(materialPhoto,deck.sector,{material:variant.material}),
    lessonSlide('Samen bespreken',homeLessonTitle(lesson),
      '<p class="job-role">'+h(variant.context)+'</p><p class="lesson-question">'+h(example.question)+'</p>'+classDiscussion(),
      measurementEvidence(example,materialPhoto,workDocument(lesson,example,variant,exampleSecond)),goalFor(lesson)),
    lessonSlide('Samen oefenen','Bekijk de werkbon','<p class="deck-context">'+h(context)+'</p><p class="lesson-question">'+h(exercise.question)+'</p>'+
      '<p class="deck-context">Vertel welke gegevens je gebruikt en hoe je het antwoord controleert.</p>'+
      differentiation(exercise.hint,exercise.explain)+(deck.revealed?workedSteps(exercise):revealControl('Toon uitwerking')),
      measurementEvidence(exercise,materialPhoto,workDocument(lesson,exercise,variant,exerciseSecond))),
    extraPractice(deck)
  ];
}
function numoPracticeReference(module,topic){
  const subject=String(topic).split(/\s+[\u00b7\u2013\u2014-]\s+/).at(-1);
  return '<aside class="numo-practice"><strong>Dit kun je ook oefenen in Numo:</strong><span>'+escapeHTML(module+' \u00b7 '+subject)+'</span></aside>';
}

function numoPractice(deck){
  if(deck.catalog)return catalogNumoPractice(deck.catalog);
  const measure="Meten en meetkunde 1F";
  const length="A4 · Rekenen met lengtematen - stapjes 1";
  const weight="B2 · Gewichten omrekenen";
  const routes=[
    ["Turborekenen 100","Getallenlijn",["line"]],
    ["Turborekenen 100","Sommen over het tiental",["bridge"]],
    ["Getallen 1F","L · Getalkennis",["count"]],
    ["Getallen 1F","A · Optellen en aftrekken",["diff","add","refill","need","stock"]],
    ["Getallen 1F","B · Aftrekken",["sub"]],
    ["Getallen 1F","E · Vermenigvuldigen",["multiply"]],
    ["Getallen 1F","G · Vermenigvuldigen en delen",["divide","rest","pack","both"]],
    ["Getallen 1F","N · Afronden",["round","estimate"]],
    ["Verhoudingen 1F","A · Decimale getallen",["decimalEqual","decimalCompare","decimalLimit"]],
    [measure,"A1 · Meten met een meetlint",["ruler"]],
    [measure,length,["cm","fit","decimalCm","cmCompare","decimalFit"]],
    [measure,"B · Gewichten",["scale","massCompare","massRefill"]],
    [measure,weight,["gram"]]
  ];
  const route=deck.metric?[measure,metricNumo(metricItem(deck.metric.week,deck.metric.day)[1])]:
    routes.find(([, , types])=>types.includes(deck.lesson.type));
  if(!route)return "";
  return numoPracticeReference(route[0],route[1]);
}
function renderDeck(){
  const deck=state.deck;
  if(!deck)return;
  const {step}=deck;
  const h=escapeHTML;
  const slides=deck.catalog?catalogSlides(deck):deck.metric?metricSlides(deck):regularSlides(deck);
  const heading=deck.catalog?catalogSchedule(deck.catalog):deck.metric?["Maandag","Dinsdag","Donderdag"][deck.metric.day]+" · Week "+(deck.metric.week+1):
    slotFor(deck.lesson).name+" · Week "+deck.lesson.id.split("-")[1];
  const deckPhase=deck.catalog?"Lesbibliotheek":deck.metric?"Metriek stelsel":DATA.phaseLabels[deck.variant.phase];
  const progress=slides.map((_,index)=>'<i'+(index+1===step?' class="current"':'')+'></i>').join("");
  const end=step===slides.length;
  $("deck").innerHTML='<header class="deck-top"><div class="deck-identity">'+
    '<div class="deck-meta"><strong>'+h(heading)+'</strong><span>'+h(deckPhase)+'</span></div></div>'+
    '<div class="deck-tools"><select id="deck-sector" aria-label="Sector in de presentatie">'+DATA.sectors.map(item=>
      '<option value="'+item.id+'" '+(item.id===deck.sector?'selected':'')+'>'+h(item.name)+'</option>').join("")+'</select>'+
    '<button type="button" class="icon-btn" data-action="fullscreen" aria-label="Volledig scherm">'+icon("screen")+'</button>'+
    '<button type="button" class="icon-btn" data-action="close-deck" aria-label="Sluit presentatie">'+icon("close")+'</button></div><img class="deck-logo" src="'+DATA.brand.logo+'" alt="CSG Prins Maurits – Praktijkonderwijs" width="150" height="75"></header>'+
    '<section class="deck-slide" aria-label="Dia '+step+'">'+slides[step-1]+(end?numoPractice(deck):'')+'</section>'+
    '<footer class="deck-bottom"><button type="button" class="btn deck-prev" data-action="prev-slide" '+(step===1?'disabled':'')+'>'+
    icon("left")+' Vorige</button>'+(step===3?'<button class="text-btn" data-action="close-deck">Afronden</button>':'')+'<div class="deck-progress"><span>Dia '+step+' van '+slides.length+'</span><span aria-hidden="true">'+progress+'</span><button type="button" class="text-btn deck-notes" data-action="deck-notes">Docenteninstructie</button></div>'+
    '<button type="button" class="btn primary" data-action="'+(end?'close-deck':'next-slide')+'">'+(end?'Afronden':step===3?'Extra oefenen':'Volgende '+icon("arrow"))+'</button></footer>';
}
function changeSlide(step){
  if(!state.deck||!Number.isInteger(step)||step<1||step>4||state.deck.step===step) return;
  state.deck.step=step;
  delete state.deck.tapeChoice;
  state.deck.archSteps=0;state.deck.cardOpen=false;
  renderDeck();
  const heading=$("deck").querySelector("h2");
  heading?.setAttribute("tabindex","-1");
  heading?.focus();
}

async function readService(){
  if(!["https:","http:"].includes(location.protocol)) return;
  try {
    const response=await fetch("/api/state",{cache:"no-store",signal:AbortSignal.timeout(4500)});
    if(!response.ok) return;
    const config=await response.json();
    const sessionLink=$("teacher-session");
    if(config.signedIn){
      sessionLink.textContent="Uitloggen";
      sessionLink.href="/signout-with-chatgpt?return_to=%2F";
    }
    service={shared:Boolean(config.shared),canEdit:config.canEdit!==false,liveCoach:Boolean(config.liveCoach),ai:config.ai??service.ai,revision:config.revision??0};
    if(service.shared) settings=validatedSettings(config.settings,DATA);
    if(!state.pinned) state.week=currentStatus().nearest;
    renderPage();
    if(service.shared&&state.deck?.mode==="main"&&!state.deck.metric&&!state.deck.catalog){state.deck.variant=activeVariant(state.deck.lesson,state.deck.sector);renderDeck();}
  } catch {}
}

$("presentation").addEventListener("close",()=>{
  const libraryYearBefore=state.deck?.libraryYearBefore;
  state.deck=null;
  if(libraryYearBefore)state.year=libraryYearBefore;
  if(document.fullscreenElement===document.documentElement&&document.fullscreenElement) document.exitFullscreen().catch(()=>{});
  const url=new URL(location.href);
  if(url.hash.startsWith("#les=")||url.hash.startsWith("#metriek=")||url.hash.startsWith("#bibliotheek=")) { url.hash=state.page==="lessen"?"lessen":state.page==="metrieklessen"?"metrieklessen":""; writeHash(url.href); }
});
$("details").addEventListener("close",()=>{state.prep=null;state.draft=null;});
document.addEventListener("keydown",event=>{
  if(!$("presentation").open || $("details").open || !state.deck || event.target?.closest?.("select,input,textarea,[contenteditable]")) return;
  if(event.key==="ArrowRight"){event.preventDefault();changeSlide(state.deck.step+1);}
  if(event.key==="ArrowLeft"){event.preventDefault();changeSlide(state.deck.step-1);}
});
window.addEventListener("hashchange",parseLink);
document.addEventListener("click",event=>{
  const btn=event.target.closest("button");
  if(event.target.closest("#home-link")){
    event.preventDefault();state.page="overview";renderPage();
  }
  if(!btn || btn.disabled) return;
  const d=btn.dataset;
  if(d.page){const pageUrl=new URL(location.href);pageUrl.hash=d.page==="lessen"?"lessen":d.page==="metrieklessen"?"metrieklessen":"";writeHash(pageUrl.href);state.page=d.page;state.editLesson=null;if(d.page==="workcards")openWorkcards();else renderPage();}
  if(d.year){state.selectedDay=null;state.year=Number(d.year);disk.put("year",state.year);state.editLesson=null;renderPage();}
  if(d.homeDay){state.selectedDay=d.homeDay;state.pinned=true;renderPage();}
  if(d.homeAssistant){openHomeAssistant();}
  if(d.sector) setSector(d.sector);
  if(d.week!==undefined) setWeek(Number(d.week));
  if(d.start) openDeck(byDay(d.start),null,true);
  if(d.pmMetricRow) openPMMetricReference(d.pmMetricRow);
  if(d.coinZoom)openCoinPicture();
  if(d.action==="large-reference" && state.deck?.metric){
    openPMMetricReference(lessonMeasure(state.deck).row);
  }
  if(d.tape && state.deck?.metric){
    state.deck.tapeChoice=Number(d.tape);
    renderDeck();
    $("deck").querySelector('[data-tape="'+d.tape+'"]')?.focus();
  }
  if(d.arch && state.deck?.metric){
    const deck=state.deck,limit=lessonMeasure(deck).route.count;
    deck.archSteps=d.arch==="reset"?0:Math.max(0,Math.min(limit,(deck.archSteps??0)+(d.arch==="next"?1:-1)));
    deck.cardOpen=true;
    renderDeck();
    $("deck").querySelector('[data-arch="'+d.arch+'"]:not(:disabled)')?.focus();
  }
  if(d.metricWeek!==undefined)openMetricDeck(Number(d.metricWeek),Number(d.metricDay));
  if(d.prep) openPrep(byDay(d.prep));
  if(d.action==="make-workcard"&&state.prep)openWorkcards(state.prep);
  if(d.action==="today") setWeek(currentStatus().nearest,false);
  if(d.action==="deck-notes"&&state.deck){
    if(state.deck.catalog)openCatalogNotes(state.deck.catalog.id);
    else if(state.deck.metric)openMetricNotes(state.deck);
    else openPrep(state.deck.lesson);
  }
  if(d.action==="show-column"&&state.deck?.step===2){
    state.deck.columnSteps=(state.deck.columnSteps??-1)+1;
    renderDeck();
    const target=$("deck").querySelector("[data-action=show-column]")??$("deck").querySelector(".column-calculation");
    target?.setAttribute("tabindex","-1");
    target?.focus();
  }
  if(d.action==="show-model"&&state.deck?.step===2){
    state.deck.modelShown=true;
    state.deck.modelSteps=(state.deck.modelSteps??0)+1;
    renderDeck();
    ($("deck").querySelector("[data-action=show-model]")??$("deck").querySelector(".answer-pane"))?.focus();
  }
  if(d.action==="next-slide"&&state.deck) changeSlide(state.deck.step+1);
  if(d.action==="prev-slide"&&state.deck) changeSlide(state.deck.step-1);
  if(d.action==="reveal" && state.deck?.step===3){state.deck.revealed=true;renderDeck();$("deck").querySelector(".answer-pane")?.focus();}
  if(d.action==="close-deck") $("presentation").close();
  if(d.action==="fullscreen"){
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{});
    else enterFullscreen();
  }
  if(d.action==="about") openAbout();
  if(d.action==="close-details") $("details").close();
  if(d.action==="copy-link" && state.prep) copyLessonLink();
  if(d.coach) runCoach(d.coach);
  if(d.action==="use-draft") useDraft();
});
document.addEventListener("change",event=>{
  if(event.target.id==="metric-sector")setSector(event.target.value);
  if(event.target.id==="admin-lesson"){state.editLesson=event.target.value;renderAdmin();}
  if(["admin-sector","phase-sector"].includes(event.target.id))setSector(event.target.value);
  if(["phase-preview","edit-preview-phase"].includes(event.target.id))setPreviewPhase(event.target.value);
  if(event.target.id==="deck-sector" && state.deck){
    const sector=event.target.value;
    if(!DATA.sectors.some(item=>item.id===sector))return;
    setSector(sector);
    state.deck.sector=sector;
    if(state.deck.catalog){
      const lesson=state.deck.catalog;
      state.deck={catalog:lesson,sector,step:1,revealed:false,modelSteps:0};
      if(lesson.example.model?.kind==="column")state.deck.columnSteps=0;
      renderDeck();writeHash(catalogLessonUrl(lesson,sector));$("deck-sector").focus();return;
    }
    if(state.deck.metric){openMetricDeck(state.deck.metric.week,state.deck.metric.day,false);$("deck-sector").focus();return;}
    state.deck.variant=activeVariant(state.deck.lesson,sector);
    state.deck.mode="main";
    state.deck.draft=null;
    state.deck.revealed=false;state.deck.modelShown=false;state.deck.modelSteps=0;delete state.deck.columnSteps;state.deck.step=1;
    renderDeck();
    writeHash(deckUrl(state.deck.lesson,sector));
    $("deck-sector").focus();
  }
});
document.addEventListener("submit",event=>{
  const form=event.target;
  if(form.id==="dates-form"){event.preventDefault();saveDates(form);}
  if(form.id==="phase-form"){event.preventDefault();savePhasePlan(form,event.submitter?.value);}
  if(form.id==="variant-form"){event.preventDefault();saveVariant(form,event.submitter?.value);}
  if(form.id==="goal-form"){event.preventDefault();saveGoal(form);}
  if(form.id==="coach-form"){event.preventDefault();askLiveCoach(form);}
});

