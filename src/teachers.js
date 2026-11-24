const closeDetails = detailsCloseButton();
const e = escapeHTML;

function renderCurriculum(){
  const year = DATA.curriculum[state.year-1];
  const topics = ["Aantallen","Meten","Geld en tijd","Verhoudingen","Ruimte en meetkunde","Gegevens"];
  const blocks = topics.map((topic,index)=>{
    const rows = year.slice(index*6,index*6+6);
    const cells = rows.map(row=>'<tr><td><strong>Week '+row.week+'</strong><br>'+e(row.theme)+(row.week<=8?' <span class="label">In dit blok</span>':"")+
      '</td>'+row.goals.map((goal,day)=>'<td><button type="button" class="catalog-goal-link" data-catalog-open="pro'+(state.year+2)+'-w'+String(row.week).padStart(2,"0")+'-'+["ma","di","do"][day]+'">'+e(goal)+'</button></td>').join("")+'</tr>').join("");
    return '<details class="block" '+(index===0?"open":"")+'><summary>Blok '+(index+1)+' · '+e(topic)+' <span class="label">Week '+rows[0].week+'–'+rows.at(-1).week+
      '</span></summary><div class="table-wrap"><table class="week-table"><thead><tr><th scope="col">Weekdoel</th><th scope="col">Maandag</th><th scope="col">Dinsdag</th><th scope="col">Donderdag</th></tr></thead><tbody>'+
      cells+'</tbody></table></div></details>';
  }).join("");
  $("curriculum").innerHTML='<div class="page-banner"><span class="eyebrow">Tweejarige opbouw</span><h1 id="curriculum-title">'+gradeLabel(state.year)+' · Trajectjaar '+state.year+'</h1><p>'+
    (state.year===1?"Basisvaardigheden met zichtbare materialen en eenvoudige getallen.":"Dezelfde vaardigheden komen terug met kommagetallen en meer rekenstappen.")+
    ' De starters in dit blok horen bij lesweek 1 tot en met 8.</p></div>'+blocks;
}

function renderPhaseEditor(){
  const scope=state.year+":"+state.sector;
  const plan=settings.phasePlans[scope]??{start:"",orientation:"",follow:""};
  const field=(name,label,value,required=false)=>'<label class="field">'+e(label)+'<input type="date" name="'+name+'" value="'+e(value)+'" '+(required?"required":"") + '></label>';
  return '<form id="phase-form" class="panel phase-plan"><h2>Praktijkfasen plannen</h2><p>'+e("Trajectjaar "+state.year+" · "+sectorInfo().name)+
    ' · Gebruik jullie schooldatums. De fase bepaalt de werkopdracht bij de gezamenlijke rekenles.</p><label class="field">Sector<select id="phase-sector">'+
    DATA.sectors.map(item=>'<option value="'+item.id+'" '+(state.sector===item.id?"selected":"")+'>'+e(item.name)+'</option>').join("")+
    '</select></label><div class="fields">'+field("start","Kennismaken vanaf",plan.start,true)+field("orientation","Oriënteren vanaf",plan.orientation)+
    field("follow","Vervolgopdrachten vanaf",plan.follow)+'</div><div class="admin-row"><button type="submit" class="btn primary">Faseplanning opslaan</button>'+
    (plan.start?'<button type="submit" class="btn" value="reset" formnovalidate>Faseplanning wissen</button>':"")+'</div></form>';
}

function renderAdmin(){
  const active = weekRecord();
  const allLessons = DATA.years[state.year-1].flatMap(week=>week.lessons);
  const lesson = allLessons.find(item=>item.id===state.editLesson)??active.lessons[0];
  const phase=phaseFor(lesson);
  const original=lesson.byPhase[phase.key][state.sector];
  const saved=variantDraft(lesson);
  const entry=saved??original;
  const dates=settings.starts.map((start,index)=>'<div class="week-setting"><label class="field">Lesweek '+(index+1)+' · Start op maandag'+
    '<input type="date" name="week" required value="'+e(start)+'"></label><div class="check-row"><span>Vervallen</span>'+
    DATA.slots.map(slot=>'<label><input type="checkbox" name="cancelled" value="'+(index+1)+'-'+slot.key+'" aria-label="Lesweek '+(index+1)+' '+slot.name+' vervallen" '+
      (settings.cancelled.includes((index+1)+"-"+slot.key)?"checked":"")+'> '+e(slot.short)+'</label>').join("")+'</div></div>').join("");
  const roles = service.shared ? (service.canEdit ? "Wijzigingen worden centraal bewaard." : "De site-eigenaar beheert deze planning.") : "Wijzigingen worden op dit apparaat bewaard.";
  const shell = '<div class="page-banner"><span class="eyebrow">Herfst tot kerst 2026</span><h1 id="admin-title">Beheer</h1><p>'+e(roles)+'</p></div>';
  if(!service.canEdit) {$("admin").innerHTML=shell;return;}
  $("admin").innerHTML=shell+aiConnectionPanel()+renderPhaseEditor()+
    '<div class="admin-grid"><form id="dates-form" class="panel"><h2>Lesweken en vrije dagen</h2><p>Maandag, dinsdag en donderdag houden hun eigen rekendoel. Markeer hier een dag waarop een les vervalt.</p><div class="admin-fields">'+
    dates+'</div><div class="admin-row"><button type="submit" class="btn primary">Planning opslaan</button></div></form>'+
    '<div><form class="panel" id="variant-form"><h2>Sectorvariant aanpassen</h2><p>De gemeenschappelijke opgave en uitwerking staan vast.</p><div class="fields"><label class="field">Les<select id="admin-lesson" name="lesson">'+
    allLessons.map(item=>'<option value="'+e(item.id)+'" '+(item.id===lesson.id?"selected":"")+'>Week '+item.id.split("-")[1]+' · '+e(slotFor(item).name)+' · '+e(item.theme)+'</option>').join("")+
    '</select></label><label class="field">Sector<select id="admin-sector">'+DATA.sectors.map(sector=>'<option value="'+sector.id+'" '+(state.sector===sector.id?"selected":"")+'>'+e(sector.name)+'</option>').join("")+
    '</select></label><label class="field">Praktijkfase<select id="edit-preview-phase">'+phaseOptions()+'</select></label>'+
    '<input type="hidden" name="phase" value="'+e(phase.key)+'"><p class="source-meta">'+e(DATA.phaseLabels[phase.key]+(phase.planned?" · volgens planning":" · voorbeeld"))+'</p>'+
    '<label class="field">Titel<input name="title" maxlength="100" required value="'+e(entry.title)+'"></label>'+
    '<label class="field">Situatie voor de klas<textarea name="context" maxlength="500" rows="3" required>'+e(entry.context)+'</textarea></label>'+
    '<label class="field">Werkopdracht<input name="task" maxlength="140" value="'+e(entry.task??original.task)+'"></label>'+
    '<label class="field">Boekje of werkkaart<input name="source" maxlength="180" value="'+e(saved?.source??(original.link?original.source:""))+'"></label>'+
    '<label class="field">Pagina, indien bekend<input name="page" maxlength="35" value="'+e(entry.page??original.page)+'"></label>'+
    '<label class="field">Vervolghandeling in de praktijkles<textarea name="next" maxlength="260" rows="2">'+e(entry.next??original.next)+'</textarea></label>'+
    '<p class="source-meta">'+e(saved?.status==="draft"?"Status · Concept ter controle":saved?.status==="ready"?"Status · Eigen variant beschikbaar":"Status · Voorbeeldstarter beschikbaar")+
    '</p></div><div class="admin-row"><button type="submit" value="draft" class="btn">Concept opslaan</button><button type="submit" value="ready" class="btn primary">Variant vrijgeven</button></div></form>'+
    '<form class="panel" id="goal-form"><h2>Gezamenlijk dagdoel formuleren</h2><p>Deze tekst verschijnt tegelijk bij alle sectoren.</p><input type="hidden" name="lesson" value="'+e(lesson.id)+
    '"><label class="field">Dagdoel<textarea name="goal" maxlength="180" rows="2" required>'+e(goalFor(lesson))+'</textarea></label><div class="admin-row"><button type="submit" class="btn">Dagdoel opslaan</button></div></form></div></div>';
}

async function saveSettings(next,confirmation){
  try {
    const checked=validatedSettings(next,DATA);
    if(service.shared){
      const response=await fetch("/api/state",{method:"PUT",headers:{"content-type":"application/json"},body:JSON.stringify({settings:checked,revision:service.revision})});
      const result=await response.json();
      if(!response.ok) throw Error(result.error??"Opslaan is niet gelukt.");
      service.revision=result.revision;
      settings=validatedSettings(result.settings,DATA);
    }else{
      disk.put("plan",checked);
      settings=checked;
    }
    if(!state.pinned) state.week=currentStatus().nearest;
    renderPage();
    showToast(confirmation);
  } catch(error) {showToast(error.message);}
}

function saveDates(form){
  const fields=new FormData(form);
  saveSettings({...settings,starts:fields.getAll("week"),cancelled:fields.getAll("cancelled")},"Planning opgeslagen.");
}
function savePhasePlan(form,action){
  const fields=new FormData(form),scope=state.year+":"+state.sector;
  const phasePlans={...settings.phasePlans};
  if(action==="reset")delete phasePlans[scope];
  else phasePlans[scope]={start:fields.get("start"),orientation:fields.get("orientation"),follow:fields.get("follow")};
  state.previewPhase="planning";
  disk.put("practice-preview","planning");
  saveSettings({...settings,phasePlans},action==="reset"?"Faseplanning gewist.":"Faseplanning opgeslagen.");
}
function saveVariant(form,status){
  const fields=new FormData(form);
  const lesson=lessonLookup(DATA,fields.get("lesson")),phase=fields.get("phase");
  if(!lesson||!isPhase(DATA,phase))return;
  const key=variantKey(lesson,state.sector,phase);
  const old=variantDraft(lesson,state.sector,phase);
  const previous=old?.status==="ready"?editedFields(old):old?.previous;
  const variant={title:fields.get("title"),context:fields.get("context"),task:fields.get("task"),source:fields.get("source"),page:fields.get("page")??"",next:fields.get("next")??"",status:status==="ready"?"ready":"draft"};
  if(variant.status==="ready"&&(!safeText(variant.task,140)||!safeText(variant.source,180))){showToast("Vul de werkopdracht en het boekje of de werkkaart in.");return;}
  if(variant.status==="draft"&&previous)variant.previous=previous;
  state.editLesson=lesson.id;
  saveSettings({...settings,variants:{...settings.variants,[key]:variant}},status==="ready"?"Werkopdracht en bron bevestigd.":"Concept opgeslagen.");
}
function saveGoal(form){
  const fields=new FormData(form);
  const lesson=lessonLookup(DATA,fields.get("lesson"));
  if(!lesson)return;
  const goal=String(fields.get("goal")).trim();
  const labels={...settings.goalLabels};
  if(goal===lesson.goal)delete labels[lesson.id];
  else labels[lesson.id]=goal;
  state.editLesson=lesson.id;
  saveSettings({...settings,goalLabels:labels},"Dagdoel opgeslagen voor alle sectoren.");
}

function professionalPrep(lesson,variant){
 const w=variant.workplace;
 return '<section class="detail-section"><h3>Docentnotities</h3><p><strong>Hardop voordoen</strong> '+e(lesson.teaching.modelSpeech)+'</p>'+
  '<p><strong>Verwachte denkfout en vervolgvraag</strong> '+e(lesson.teaching.discuss)+'</p>'+
  '<p><strong>Geef een hint</strong> Geef eerst denktijd. Open de hint als leerlingen geen eerste stap kunnen kiezen. '+e(lesson.check.hint)+'</p>'+
  '<p><strong>Daag uit</strong> Laat leerlingen die vlot klaar zijn hun antwoord controleren of onderbouwen. '+e(lesson.check.explain)+'</p></section>'+
  '<section class="detail-section"><h3>De beroepssituatie</h3><p>'+e(variant.context)+'</p><p><strong>Fasegerichte steun</strong> '+e(w.phaseSupport)+'</p></section>';

}
function openPrep(lesson){

  const variant=activeVariant(lesson);
  const slot=slotFor(lesson);
  const teaching=lesson.teaching;
  const applied=applicationFor(lesson,state.sector,variant);
  state.prep=lesson;
  state.draft=null;
  $("details").setAttribute("aria-label","Les voorbereiden");
  $("details-body").innerHTML='<div class="detail-head"><div><span class="eyebrow">'+e(slot.name+" · "+slot.phase+" · 6 tot 8 minuten")+'</span><h2>'+e(variant.title)+'</h2></div>'+closeDetails+
    '</div><section class="detail-section"><h3>Leg klaar</h3><p>'+e(practiceCheck(lesson).kit)+'</p><h3>Beslis na het samen oefenen</h3><p>Laat iedereen tegelijk antwoorden. Kijk ook wie het materiaal goed gebruikt.</p><p><strong>Bij twijfel</strong> '+e(practiceCheck(lesson).repair)+'</p><p><strong>Zelfstandig verder</strong> Geef de tweede werkbon. Laat de leerling de uitkomst aanwijzen of controleren op de werkplek.</p></section><section class="detail-section"><h3>Praktijkopdracht</h3><p><strong>'+e(variant.task)+'</strong></p><p class="source-meta">Het praktijkbeeld is een realistische illustratie. Gebruik de gegevens naast het beeld.</p></section>'+
    '<section class="detail-section"><h3>Bespreek met de klas</h3><p><strong>'+e(goalFor(lesson))+'</strong></p><ol class="prep-flow">'+
    '<li><strong>Dia 1: gesprek over het beroep</strong> Laat de grote foto zien. Vraag eerst: Wat zie je op deze foto? Bespreek daarna de beroepsvraag op dia 1.</li><li><strong>Dia 2: samen bespreken</strong> Benoem het lesdoel. Laat leerlingen eerst zelf nadenken en daarna hun aanpak bespreken. Gebruik de uitleg hieronder wanneer korte instructie nodig is.</li><li><strong>Dia 3: samen oefenen</strong> Laat iedereen tegelijk antwoorden en bespreek de aanpak.</li><li><strong>Optioneel: extra oefenen</strong> Kies uit vijf sommen. Dit kun je ook oefenen in Numo.</li></ol>'+
    '<p><strong>Korte uitleg</strong> '+e(teaching.explanation)+'</p><p><strong>Daarna op de werkplek</strong> Laat de leerling bij een nieuwe opdracht de gegevens kiezen, rekenen en de uitkomst controleren.</p><button type="button" class="btn" data-action="copy-link">'+icon("link")+' Leslink kopiëren</button></section>'+
    professionalPrep(lesson,variant)+'<section class="detail-section"><h3>Rekenvoorbeeld bij dia 2</h3>'+workedSteps(lesson.main)+visualSVG(lesson.main.methodVisual||lesson.main.visual,variant.material)+(columnOperands(lesson.main)?columnCalculation(columnOperands(lesson.main),99):'')+'</section><section class="detail-section"><h3>Steun en verdieping</h3><ul><li><strong>Steunvraag</strong> '+e(lesson.main.hint)+'</li><li><strong>Verdieping</strong> '+e(lesson.main.explain)+
    '</li><li><strong>Antwoord hoofdvraag</strong> '+e(lesson.main.answer)+'</li></ul></section>'+
    '<section class="detail-section"><h3>Dia 3 · '+e(applied.label)+'</h3><p>'+e(applied.context)+'</p><ul>'+
    '<li><strong>Steunvraag</strong> '+e(lesson.check.hint)+'</li><li><strong>Controleer begrip</strong> '+e(lesson.check.explain)+'</li>'+
    '<li><strong>Rekenstappen</strong> '+e(lesson.check.steps.join(" · "))+'</li><li><strong>Antwoord checkvraag</strong> '+e(lesson.check.answer)+'</li>'+
    '<li><strong>Bespreek</strong> '+e(applied.action)+'</li></ul></section>'+
    '<section class="detail-section"><h3>Werkkaart bij deze les</h3><p>Neem de opdracht en het rekendoel mee naar het vaste werkkaartsjabloon.</p><button type="button" class="btn primary" data-action="make-workcard">Maak een werkkaart</button></section><section class="detail-section"><h3>Rekencoach</h3><p class="source-meta">'+(service.liveCoach?"Online Rekencoach beschikbaar":"Voorbereide opties · AI-verbinding nog in te stellen")+
    '</p><div class="coach-controls"><button type="button" class="btn" data-coach="simple">Maak eenvoudiger</button><button type="button" class="btn" data-coach="challenge">Geef meer uitdaging</button>'+
    '<button type="button" class="btn" data-coach="extra">Extra starter</button><button type="button" class="btn" data-coach="stage">Beroepssituatie aanscherpen</button></div>'+
    '<label class="field">Eigen praktijkopdracht<input id="context-input" maxlength="500" placeholder="Bijvoorbeeld Je controleert de linnenvoorraad in een verzorgingshuis."></label>'+
    '<button type="button" class="btn" data-coach="context">Pas aan op mijn praktijkopdracht</button>'+
    (service.liveCoach?'<form id="coach-form"><label class="field">Vraag over de les, zonder leerlinggegevens<textarea name="question" rows="2" maxlength="700" required></textarea></label>'+
      '<button type="submit" class="btn">Maak een AI-concept</button></form>':"")+
    '<div id="coach-result" class="coach-result" aria-live="polite" hidden></div></section>';
  if(!$("details").open) $("details").showModal();
}

function showDraft(draft){
  const lesson=state.prep;
  const variant=activeVariant(lesson);
  const applied=applicationFor(lesson,state.sector,variant,draft);
  const task=draft.mode==="extra"?lesson.check:lesson.main;
  const check=draft.mode==="extra"?lesson.main:lesson.check;
  state.draft={...draft,stage:applied.stage};
  const view=$("coach-result");
  view.hidden=false;
  view.innerHTML='<h3>Concept · '+e(draft.label)+'</h3><div class="fields">'+
    '<label class="field">Titel<input id="draft-title" maxlength="100" value="'+e(draft.title)+'"></label>'+
    '<label class="field">Dia 1 · Praktijksituatie<textarea id="draft-context" maxlength="500" rows="2">'+e(draft.context)+'</textarea></label>'+
    '<p class="source-meta">'+e(task.question)+'</p>'+
    '<label class="field">Beeldidee<textarea id="draft-image" maxlength="250" rows="2">'+e(draft.imageIdea??variant.image.alt)+'</textarea></label>'+
    '<p class="source-meta">'+e(task.facts.map(fact=>fact.label+' '+fact.value).join(' · '))+'</p>'+
    '<label class="field">Dia 2 · Korte uitleg<textarea id="draft-explanation" maxlength="260" rows="2">'+e(draft.explanation??lesson.teaching.explanation)+'</textarea></label>'+
    '<p class="source-meta"><strong>Uitwerking</strong> '+e(task.steps.join(' · ')+' · '+task.answer)+'</p>'+
    '<label class="field">Dia 3 · Werkplek<select id="draft-placement"><option value="school" '+(applied.stage?'':'selected')+'>Werk op school</option>'+
    '<option value="stage" '+(applied.stage?'selected':'')+'>Stagevoorbeeld</option></select></label>'+
    '<label class="field">Dia 3 · Toepassing<textarea id="draft-application" maxlength="380" rows="2">'+e(applied.context)+'</textarea></label>'+
    '<p class="source-meta">'+e(check.question)+'</p><p class="source-meta"><strong>Docentantwoord</strong> '+e(check.answer)+'</p>'+
    '<label class="field">Docenttip<textarea id="draft-tip" maxlength="400" rows="2">'+e(draft.tip)+'</textarea></label></div>'+
    '<button type="button" class="btn primary" data-action="use-draft">Toon in presentatie</button>';
}

function runCoach(mode){
  const lesson=state.prep;
  if(!lesson)return;
  const variant=activeVariant(lesson);
  const options={
    simple:{label:"Extra steun",tip:lesson.main.hint},
    challenge:{label:"Extra uitdaging",tip:lesson.main.explain},
    extra:{label:"Extra starter",tip:"Gebruik de checkopgave als hoofdvraag en werk dezelfde aanpak hardop uit."},
    context:{label:"Eigen praktijksituatie",tip:"Controleer of de gedeelde gegevens bij deze situatie passen."},
    stage:{label:"Beroepssituatie",tip:"Geef de leerling een rol als medewerker. Laat de drie dia’s één werkopdracht volgen en sluit af met een terugmelding aan een collega."}
  };
  const option=options[mode];
  if(!option)return;
  const input=$("context-input");
  const context=mode==="context"?input.value.trim():variant.context;
  if(!safeText(context,500)){input.focus();showToast("Vul eerst een korte praktijksituatie in.");return;}
  showDraft({mode,title:variant.title,context,...option});
}

async function askLiveCoach(form){
  const lesson=state.prep;
  if(!lesson || !service.liveCoach)return;
  const sector=state.sector;
  const phase=phaseFor(lesson).key;
  const question=String(new FormData(form).get("question"));
  const button=form.querySelector("button");
  button.disabled=true;
  button.textContent="Concept maken.";
  try{
    const response=await fetch("/api/coach",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({lesson:lesson.id,sector,phase,question}),signal:AbortSignal.timeout(65000)});
    const result=await response.json();
    if(!response.ok)throw Error(result.error??"De Rekencoach is even niet beschikbaar.");
    if(state.prep===lesson && state.sector===sector && phaseFor(lesson).key===phase)showDraft({mode:"context",label:"AI-voorstel",...result});
  }catch(error){showToast(error.message);}
  finally{button.disabled=false;button.textContent="Maak een AI-concept";}
}

function useDraft(){
  const draft=state.draft;
  if(!state.prep||!draft)return;
  const title=$("draft-title").value.trim();
  const context=$("draft-context").value.trim();
  const applicationContext=$("draft-application").value.trim();
  const explanation=$("draft-explanation").value.trim();
  const stage=$("draft-placement").value==="stage";
  if(!safeText(title,100)||!safeText(context,500)||!safeText(applicationContext,380)||!safeText(explanation,260)){
    showToast("Vul de titel, beide situaties en de korte uitleg in.");return;
  }
  openDeck(state.prep,{...draft,title,context,applicationContext,explanation,stage,imageIdea:$("draft-image").value.trim(),tip:$("draft-tip").value.trim()});
}

async function copyLessonLink(){
  const url=deckUrl(state.prep,state.sector);
  try {await navigator.clipboard.writeText(url);showToast("Leslink gekopieerd.");}
  catch {window.prompt("Kopieer de leslink",url);}
}

function openAbout(){
  state.prep=null;
  state.draft=null;
  const starts=settings.starts;
  $("details").setAttribute("aria-label","Over deze periode");
  $("details-body").innerHTML='<div class="detail-head"><div><span class="eyebrow">Rekenstart</span><h2>Over deze periode</h2></div>'+closeDetails+
    '</div><section class="detail-section about-copy"><p>De proefperiode telt acht lesweken, van '+e(dateLabel(starts[0],{day:"numeric",month:"long"}))+
    ' t/m '+e(dateLabel(shiftDate(starts.at(-1),4),{day:"numeric",month:"long",year:"numeric"}))+
    '. Beide trajectjaren gebruiken de eerste acht weken van hun leerlijn. Op de startpagina kies je schooljaar 2026/2027 of 2027/2028. Stem de route af op het niveau van je groep.</p>'+
    '<p>De lesweek wordt bepaald in de tijdzone Europe/Amsterdam. De vakantiedata zijn gebaseerd op regio Midden. Stem vrije dagen en faseovergangen af op de interne schoolplanning. De leskaarten tonen voorbeeldkoppelingen tot de docent de opdracht en bron bevestigt.</p>'+
    '<ul><li><a href="'+e(DATA.calendarSource)+'" target="_blank" rel="noopener">Vakantiedata regio Midden</a></li>'+
    '<li><a href="'+e(DATA.sourceSchool)+'" target="_blank" rel="noopener">Vakantieoverzicht CSG Prins Maurits</a></li>'+
    '<li><a href="'+e(DATA.sourceWorkbook)+'" target="_blank" rel="noopener">Overzicht leerlijnen en werkkaarten</a></li>'+
    '<li><a href="'+e(DATA.brand.source)+'" target="_blank" rel="noopener">CSG Prins Maurits · huisstijl</a></li></ul></section>';
  if(!$("details").open) $("details").showModal();
}



