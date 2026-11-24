const CARD_ASSETS=JSON.parse(document.getElementById("workcard-assets").textContent);
const CARD_EXAMPLES=JSON.parse(document.getElementById("workcard-examples").textContent);
const WC={view:"start",card:null,dirty:false,tab:"opdracht",teacher:false,page:0,records:[],online:false,checkedService:false,proposal:null,busy:false,chatOpen:false,messages:[]};
function wcCanReplace(){return !WC.dirty||confirm("Je hebt niet-opgeslagen wijzigingen. Wil je deze laten vervallen en een andere kaart openen?");}
const clone=x=>JSON.parse(JSON.stringify(x));
function openHomeAssistant(){
 if(!WC.card){
  WC.card=emptyCard({sector:state.sector,year:state.year});
  WC.card.grade=gradeLabel(state.year);
  WC.dirty=true;WC.page=0;WC.tab="opdracht";
 }
 WC.view="editor";state.page="workcards";renderPage();wcChat();
 if(!WC.checkedService)wcRefreshRecords();
}
function getPath(obj,path){return path.split(".").reduce((o,k)=>o?.[k],obj);}
function setPath(obj,path,value){const parts=path.split(".");const last=parts.pop();let cur=obj;for(const p of parts){if(p==="__proto__"||p==="constructor"||p==="prototype")return;cur=cur[p];if(!cur)return;}cur[last]=value;}
function wcField(label,path,rows=0,max=400,options=null){
  const value=getPath(WC.card,path)??"",id="wc-"+path.replaceAll(".","-");
  return '<label class="wc-field" for="'+id+'">'+e(label)+(options?'<select id="'+id+'" data-card-path="'+path+'">'+options.map(o=>'<option value="'+e(Array.isArray(o)?o[0]:o)+'" '+((Array.isArray(o)?o[0]:o)===value?"selected":"")+'>'+e(Array.isArray(o)?o[1]:o)+'</option>').join("")+'</select>':rows?'<textarea id="'+id+'" rows="'+rows+'" maxlength="'+max+'" data-card-path="'+path+'">'+e(value)+'</textarea>':'<input id="'+id+'" maxlength="'+max+'" data-card-path="'+path+'" value="'+e(value)+'">')+'</label>';
}
function wcImageField(path,altPath){
  const value=getPath(WC.card,path),keys=Object.keys(CARD_ASSETS).filter(k=>k!=="logo"&&k.startsWith(WC.card.sector+"-"));
  return '<div class="wc-image-field"><label class="wc-field">Foto<select data-card-path="'+path+'"><option value="">Nog geen foto</option>'+keys.map(k=>'<option value="asset:'+k+'" '+(value==="asset:"+k?"selected":"")+'>'+e(CARD_ASSETS[k].alt||k)+'</option>').join("")+(value?.startsWith("data:")?'<option value="'+e(value)+'" selected>Eigen foto</option>':"")+'</select></label><label class="wc-upload">Eigen foto kiezen<input type="file" accept="image/png,image/jpeg" data-card-image="'+path+'" data-alt-path="'+altPath+'"></label></div>'+wcField("Korte beschrijving van de foto",altPath,1,220);
}
async function wcDB(){
  return new Promise((resolve,reject)=>{const r=indexedDB.open("rekenstart-workcards",1);r.onupgradeneeded=()=>{r.result.createObjectStore("cards",{keyPath:"id"});r.result.createObjectStore("versions",{keyPath:"key"});};r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(Error("Bewaren op dit apparaat is niet beschikbaar."));});
}
async function wcLocal(action,value){
  const db=await wcDB();try{return await new Promise((resolve,reject)=>{
    const tx=db.transaction(["cards","versions"],action==="save"?"readwrite":"readonly"),cards=tx.objectStore("cards"),versions=tx.objectStore("versions");let result;
    if(action==="list"){const r=cards.getAll();r.onsuccess=()=>{result=r.result.sort((a,b)=>b.updatedAt.localeCompare(a.updatedAt)).map(x=>({...x.card,updated_at:x.updatedAt}));};}
    if(action==="get"){const r=cards.get(value);r.onsuccess=()=>{result=r.result?.card;};}
    if(action==="history"){const r=versions.getAll();r.onsuccess=()=>{result=r.result.filter(x=>x.id===value).sort((a,b)=>b.revision-a.revision);};}
    if(action==="save"){
      const r=cards.get(value.card.id);r.onsuccess=()=>{
        if((r.result?.card.revision??0)!==value.expected){tx.abort();reject(Error("Deze kaart is in een ander tabblad gewijzigd. Sla een kopie op."));return;}
        const next={...value.card,revision:value.expected+1},now=new Date().toISOString();
        cards.put({id:next.id,card:next,updatedAt:now});versions.put({key:next.id+":"+next.revision,id:next.id,revision:next.revision,card:next,created_at:now});result=next;
      };
    }
    tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(Error("Bewaren is niet gelukt. Je concept blijft open."));tx.onabort=()=>reject(Error("Bewaren is niet gelukt. Je concept blijft open."));
  });}finally{db.close();}
}
async function wcRefreshRecords(){
  try{
    if(["http:","https:"].includes(location.protocol)){
      const r=await fetch("/api/cards",{cache:"no-store",signal:AbortSignal.timeout(6000)});
      if(r.ok){const j=await r.json();WC.online=true;WC.records=j.cards;WC.checkedService=true;return;}
      if(WC.online)throw Error("Je bewaarde kaarten kunnen tijdelijk niet worden geladen.");
    }
    WC.online=false;WC.records=await wcLocal("list");WC.checkedService=true;
  }catch(error){WC.checkedService=true;showToast(error.message);}
}
function wcStorageLabel(){return WC.online?"Bewaard op de website":"Bewaren op dit apparaat";}
async function openWorkcards(fromLesson=null){
  if(fromLesson){
    if(!wcCanReplace())return;
    const v=activeVariant(fromLesson),phase=phaseFor(fromLesson).key;
    WC.card=emptyCard({title:v.task||v.title,sector:state.sector,year:state.year,phase:DATA.phaseLabels[phase],description:v.context,linkedLesson:fromLesson.id,mathGoal:goalFor(fromLesson)});
    WC.card.source=v.source;WC.card.sourceStatus=v.confirmed?"Bron bevestigd":"Voorbeeld · te controleren";WC.view="editor";WC.dirty=true;WC.page=0;WC.tab="opdracht";
  }
  if($("details").open)$("details").close();state.page="workcards";renderPage();
  await wcRefreshRecords();if(state.page==="workcards")renderWorkcards();
}
function renderWorkcards(){
  const host=$("workcards");if(!host)return;
  if(WC.view==="start"){
    host.innerHTML='<div class="wc-intro"><div><span class="eyebrow">Praktijkassistent</span><h1>Een werkkaart die werkt.</h1><p>Jouw praktijkopdracht, in één herkenbare opzet. Met foto’s, korte stappen en taal en rekenen.</p><div class="wc-actions"><button class="btn primary" data-wc="new">+ Nieuwe werkkaart</button><label class="btn wc-upload">Bestaande opdracht gebruiken<input type="file" accept=".docx,.txt,.md,.json" data-wc-import></label></div></div><div class="wc-intro-visual"><img src="'+CARD_ASSETS.logo.data+'" alt="CSG Prins Maurits Praktijkonderwijs"><span>KIJK · LEES · DOE</span><strong>Van uitleg naar doen</strong><p>Vast sjabloon · Bewerkbaar · Printklaar</p></div></div>'+
    '<div class="wc-section-title"><h2>Begin met een voorbeeld</h2><span>Vijf sectoren, dezelfde opzet</span></div><div class="wc-example-grid">'+CARD_EXAMPLES.map(c=>'<button class="wc-example" data-wc-example="'+c.id+'"><img src="'+CardPrint.asset(c.overviewImage,CARD_ASSETS)+'" alt="'+e(CARD_ASSETS[c.overviewImage.slice(6)]?.alt||c.overviewAlt)+'"><span class="wc-example-copy"><small>'+e(CARD_SECTORS[c.sector])+'</small><strong>'+e(c.title)+'</strong><span>Gebruik dit voorbeeld →</span></span></button>').join("")+'</div>'+
    '<div class="wc-section-title"><h2>Mijn werkkaarten</h2><span>'+wcStorageLabel()+'</span></div><div class="wc-saved">'+(WC.records.length?WC.records.map(c=>'<button class="wc-saved-card" data-wc-open="'+e(c.id)+'"><span><strong>'+e(c.title)+'</strong><small>'+e(CARD_SECTORS[c.sector]||c.sector)+' · '+e(c.grade)+' · Versie '+c.revision+'</small></span><span class="label">'+(c.status==="checked"?"Gecontroleerd":"Concept")+'</span></button>').join(""):'<div class="wc-empty"><strong>Je eerste werkkaart begint hier.</strong><p>Kies een voorbeeld of maak een nieuwe kaart. Opgeslagen versies vind je hier terug.</p></div>')+'</div><div class="wc-bottom-note">'+(service.liveCoach?e(service.ai.label)+" is beschikbaar voor voorstellen en vragen.":"De kaarteditor en voorbeelden werken. Koppel Gemini voor echte AI-antwoorden."+aiConnectButton())+'</div>';
    return;
  }
  const c=WC.card;
  host.innerHTML='<div class="wc-editor-top"><button class="text-btn" data-wc="back">← Alle werkkaarten</button><div class="wc-actions"><span class="wc-save-state" id="wc-save-state">'+(WC.dirty?"Niet opgeslagen":"Versie "+c.revision)+'</span><button class="btn" data-wc="assistant">Praktijkassistent</button><button class="btn primary" data-wc="save">Opslaan</button></div></div>'+
    '<div class="wc-editor-title"><div><span class="eyebrow">'+e(CARD_SECTORS[c.sector])+' · '+e(c.grade)+'</span><h1 id="wc-card-title">'+e(c.title)+'</h1></div><span class="label">'+(c.status==="checked"?"Gecontroleerd":"Concept · controleren")+'</span></div>'+
    '<div class="wc-workspace"><section class="wc-edit-panel" aria-label="Werkkaart bewerken"><nav class="wc-edit-tabs" aria-label="Onderdelen">'+[["opdracht","Opdracht"],["stappen","Stappen"],["oefenen","Taal & rekenen"],["docent","Docent"]].map(([k,n])=>'<button data-wc-tab="'+k+'" aria-pressed="'+(WC.tab===k)+'">'+n+'</button>').join("")+'</nav><div id="wc-fields">'+wcFields()+'</div></section>'+
    '<section class="wc-preview-panel" aria-label="A4 voorbeeldweergave"><div class="wc-preview-toolbar"><strong>Voorbeeldweergave</strong><label><input id="wc-teacher" type="checkbox" '+(WC.teacher?"checked":"")+'> Met docentblad</label></div><div class="wc-preview-actions"><button class="btn" data-wc="pdf">Download PDF</button><button class="btn" data-wc="word">Download Word</button><button class="text-btn" data-wc="print">Afdrukken</button></div><div class="wc-page-nav"><button class="icon-btn" data-wc="prev" aria-label="Vorige pagina">←</button><span id="wc-page-label"></span><button class="icon-btn" data-wc="next" aria-label="Volgende pagina">→</button></div><div class="wc-preview-scroll" id="wc-preview-scroll"><div id="wc-preview"></div></div><p class="wc-preview-caption">Eén vaste opmaak · Het logo staat op iedere pagina rechtsboven.</p></section></div>';
  wcRenderPreview();
}
function wcFields(){
 const c=WC.card;
 if(WC.tab==="opdracht")return '<h2>Wat gaan leerlingen doen?</h2><p class="wc-muted">Begin bij de praktijk. Taal en rekenen ondersteunen de handelingen.</p>'+
 wcField("Titel","title",0,140)+wcField("Korte opdracht","description",3,500)+
 '<div class="wc-form-grid">'+wcField("Sector","sector",0,0,Object.entries(CARD_SECTORS))+wcField("Leerjaar","grade",0,60)+wcField("Praktijkfase","phase",0,0,CARD_PHASES)+wcField("Ondersteuning","level",0,0,["Basis","Meer ondersteuning","Meer uitdaging"])+'</div>'+
 wcField("Tijd / aantallen","duration",0,120)+wcField("Richting","direction",0,80)+
 '<h3>Dit leer je</h3>'+wcField("Praktijkdoel","goals.practice",2,300)+wcField("Taaldoel","goals.language",2,300)+wcField("Rekendoel","goals.math",2,300)+
 '<h3>Overzichtsfoto</h3>'+wcImageField("overviewImage","overviewAlt")+
 '<h3>Dit heb je nodig</h3>'+c.materials.map((m,i)=>'<div class="wc-row-fields">'+wcField("Materiaal","materials."+i+".name",0,100)+wcField("Hoeveelheid","materials."+i+".amount",0,120)+'<button class="wc-remove" data-wc-remove-material="'+i+'" aria-label="Materiaal verwijderen">×</button></div>').join("")+'<button class="text-btn" data-wc="add-material">+ Materiaal toevoegen</button>'+wcField("Zet klaar","tools",3,600)+
 '<h3>Voorbereiden</h3>'+c.precautions.map((p,i)=>wcField("Afspraak "+(i+1),"precautions."+i,2,400)).join("")+'<button class="text-btn" data-wc="add-precaution">+ Afspraak toevoegen</button>'+
 '<details class="wc-more"><summary>Bron en leskoppeling</summary>'+wcField("Bron / bestaande werkkaart","source",2,600)+wcField("Bronstatus","sourceStatus",0,100)+wcField("Brontekst","sourceText",6,12000)+wcField("Trajectjaar","year",0,0,["1","2"])+
 '<label class="wc-field">Koppel aan Rekenstart<select id="wc-link-lesson"><option value="">Geen leskoppeling</option>'+weekRecord().lessons.map(l=>'<option value="'+l.id+'" '+(c.linkedLesson===l.id?"selected":"")+'>'+e(slotFor(l).name+" · "+goalFor(l))+'</option>').join("")+'</select></label><label class="btn wc-upload">Opdracht inlezen<input type="file" accept=".docx,.txt,.md,.json" data-wc-import></label></details>';
 if(WC.tab==="stappen")return '<h2>Kijk · lees · doe</h2><p class="wc-muted">Grote foto links, korte instructie rechts. Elke stap krijgt een afvinkvakje.</p>'+c.steps.map((s,i)=>'<details class="wc-step-edit" '+(i===0?"open":"")+'><summary><span>'+String(i+1).padStart(2,"0")+'</span>'+e(s.title||"Nieuwe stap")+'</summary>'+wcField("Staptitel","steps."+i+".title",0,90)+wcField("Korte instructies, één per regel","steps."+i+".text",5,650)+wcImageField("steps."+i+".image","steps."+i+".alt")+wcField("Meet- of controlevraag (optioneel)","steps."+i+".check",2,220)+'<div class="wc-actions"><button class="text-btn" data-wc-move="'+i+':-1" '+(i===0?"disabled":"")+'>↑ Omhoog</button><button class="text-btn" data-wc-move="'+i+':1" '+(i===c.steps.length-1?"disabled":"")+'>↓ Omlaag</button><button class="text-btn" data-wc-remove-step="'+i+'">Stap verwijderen</button></div></details>').join("")+'<button class="btn" data-wc="add-step">+ Stap toevoegen</button>';
 if(WC.tab==="oefenen")return '<h2>Taal en rekenen</h2><h3>Welk woord hoort erbij?</h3>'+c.words.map((w,i)=>wcField("Vakwoord "+(i+1),"words."+i+".word",0,70)+wcField("Betekenis","words."+i+".definition",2,180)).join("")+
 '<h3>Vertel het aan je maatje</h3>'+wcField("Vraag","oral.question",2,250)+wcField("Zinstart","oral.start",1,180)+wcField("Docentantwoord","oral.answer",2,400)+
 '<h3>Rekenen bij de opdracht</h3>'+wcField("Titel rekenonderdeel","math.title",0,100)+c.math.items.map((q,i)=>'<div class="wc-math-edit">'+wcField("Vraag "+(i+1),"math.items."+i+".question",3,400)+wcField("Antwoord met berekening en eenheid","math.items."+i+".answer",2,500)+'<button class="text-btn" data-wc-remove-question="'+i+'">Vraag verwijderen</button></div>').join("")+'<button class="text-btn" data-wc="add-question">+ Rekenvraag toevoegen</button>'+wcField("Hulp","math.hint",2,350)+wcField("Extra uitdaging","math.extra",2,400)+wcField("Antwoord extra uitdaging","math.extraAnswer",2,500)+
 '<h3>Dit ging goed</h3>'+c.reflection.map((r,i)=>wcField("Afvinkpunt "+(i+1),"reflection."+i,1,180)).join("");
 return '<h2>Docentenblad</h2><p class="wc-muted">Dit blad wordt alleen meegenomen als je “Met docentblad” kiest.</p>'+wcField("Voor en tijdens de les","teacher.before",5,1400)+wcField("Meer ondersteuning","teacher.support",4,1400)+wcField("Meer uitdaging","teacher.challenge",4,1400)+wcField("Over de beelden","teacher.images",3,1400)+
 '<label class="wc-field">Controle<select data-card-path="status"><option value="draft" '+(c.status==="draft"?"selected":"")+'>Concept · nog controleren</option><option value="checked" '+(c.status==="checked"?"selected":"")+'>Door mij gecontroleerd</option></select></label><p class="wc-muted">Controleer de werkstappen, hoeveelheden, eenheden en antwoorden voordat je de kaart vrijgeeft.</p>'+
 '<div class="wc-actions"><button class="btn" data-wc="copy">Opslaan als kopie</button><button class="btn" data-wc="history" '+(!c.revision?"disabled":"")+'>Versiegeschiedenis</button><button class="text-btn" data-wc="json">Bewerkbaar bestand (.json)</button></div><div id="wc-history"></div>';
}
function wcRenderPreview(){
 if(!WC.card||!$("wc-preview"))return;
 const pages=CardPrint.build(WC.card,CARD_ASSETS,WC.teacher);
 WC.pages=pages;WC.page=Math.max(0,Math.min(WC.page,pages.length-1));
 $("wc-preview").innerHTML=CardPrint.html([pages[WC.page]],CARD_ASSETS);$("wc-page-label").textContent="Pagina "+(WC.page+1)+" van "+pages.length;
 const container=$("wc-preview-scroll"),scale=Math.min(1,(container.clientWidth-32)/(210*96/25.4));
 $("wc-preview").style.setProperty("--page-scale",scale);$("wc-preview").style.height=(297*96/25.4*scale)+"px";
 $("wc-preview").style.width=(210*96/25.4*scale)+"px";
}
function wcDirty(){WC.dirty=true;if($("wc-save-state"))$("wc-save-state").textContent="Niet opgeslagen";if($("wc-card-title"))$("wc-card-title").textContent=WC.card.title;clearTimeout(wcDirty.timer);wcDirty.timer=setTimeout(wcRenderPreview,220);}
function wcUseExample(id){if(!wcCanReplace())return;const original=CARD_EXAMPLES.find(c=>c.id===id);if(!original)return;WC.card={...clone(original),id:cardId(),revision:0};WC.dirty=true;WC.view="editor";WC.tab="opdracht";WC.page=0;renderWorkcards();}
async function wcSave(copy=false){
 if(WC.saving)return;WC.saving=true;
 try{
   const c=validateCard(WC.card,WC.card.status==="checked");
   if(copy){c.id=cardId();c.revision=0;}
   let saved;
   if(WC.online){const r=await fetch("/api/cards",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({card:c,expectedRevision:c.revision})});const j=await r.json();if(!r.ok)throw Error(j.error);saved=j.card;}
   else saved=await wcLocal("save",{card:c,expected:c.revision});
   WC.card=saved;WC.dirty=false;showToast((WC.online?"Werkkaart bewaard":"Op dit apparaat bewaard")+" · versie "+saved.revision);
   await wcRefreshRecords();renderWorkcards();
 }catch(error){showToast(error.message);}finally{WC.saving=false;}
}
async function wcOpen(id,revision){
 if(!wcCanReplace())return;
 try{
 let card;
 if(WC.online){const r=await fetch("/api/cards/"+encodeURIComponent(id)+(revision?"?revision="+revision:""));const j=await r.json();if(!r.ok)throw Error(j.error);card=j.card;if(revision){card.id=cardId();card.revision=0;}}
 else{card=revision?(await wcLocal("history",id)).find(v=>v.revision===revision)?.card:await wcLocal("get",id);if(revision)card={...card,id:cardId(),revision:0};}
 if(!card)throw Error("De kaart is niet gevonden.");
 WC.card=validateCard(card);WC.view="editor";WC.dirty=Boolean(revision);WC.page=0;WC.tab="opdracht";renderWorkcards();
 }catch(error){showToast(error.message);}
}
async function wcHistory(){
 try{let versions;if(WC.online){const r=await fetch("/api/cards/"+WC.card.id+"?history=1");const j=await r.json();if(!r.ok)throw Error(j.error);versions=j.versions;}else versions=await wcLocal("history",WC.card.id);
 $("wc-history").innerHTML='<h3>Eerdere versies</h3><p class="wc-muted">Een eerdere versie opent als nieuwe kopie.</p>'+versions.map(v=>'<button class="wc-version" data-wc-version="'+v.revision+'">Versie '+v.revision+' · '+new Date(v.created_at).toLocaleString("nl-NL")+' →</button>').join("");
 }catch(error){showToast(error.message);}
}
async function wcPhoto(file){
 if(!["image/png","image/jpeg"].includes(file.type)||file.size>10000000)throw Error("Kies een JPG of PNG van maximaal 10 MB.");
 const url=URL.createObjectURL(file);
 try{const img=new Image();img.src=url;await img.decode();const can=document.createElement("canvas"),s=Math.min(1,1000/Math.max(img.naturalWidth,img.naturalHeight));can.width=img.naturalWidth*s;can.height=img.naturalHeight*s;const ctx=can.getContext("2d");ctx.fillStyle="white";ctx.fillRect(0,0,can.width,can.height);ctx.drawImage(img,0,0,can.width,can.height);let data=can.toDataURL("image/jpeg",.8);if(data.length>600000)data=can.toDataURL("image/jpeg",.6);if(data.length>600000)throw Error("Deze foto is te groot. Kies een kleiner bestand.");return data;}finally{URL.revokeObjectURL(url);}
}
async function wcImport(file){
 if(!wcCanReplace())return;
 try{
 if(!file||file.size>25000000)throw Error("Kies een DOCX, tekstbestand of werkkaartbestand van maximaal 25 MB.");
 if(/\.json$/i.test(file.name)){const card=validateCard(JSON.parse(await file.text()));WC.card={...card,id:cardId(),revision:0};}
 else{
   let text="";
   if(/\.docx$/i.test(file.name)){
     const zip=await JSZip.loadAsync(file).catch(()=>{throw Error("Dit Word-bestand kon niet worden gelezen. Kies een geldig DOCX-bestand.");});const part=zip.file("word/document.xml");if(!part||part._data.uncompressedSize>2000000)throw Error("Dit Word-bestand bevat geen leesbare opdracht of is te groot.");
     const xml=new DOMParser().parseFromString(await part.async("string"),"application/xml");if(xml.querySelector("parsererror"))throw Error("Dit Word-bestand kon niet worden gelezen.");
     text=[...xml.getElementsByTagNameNS("*","p")].map(p=>[...p.getElementsByTagNameNS("*","t")].map(t=>t.textContent).join("")).filter(Boolean).join("\n");
   }else if(/\.(txt|md)$/i.test(file.name))text=await file.text();else throw Error("Gebruik DOCX, TXT, MD of een geëxporteerde werkkaart (.json). Een PDF kun je als tekst plakken.");
   if(!text.trim()||text.length>12000)throw Error("De opdracht is leeg of te lang. Plak maximaal 12.000 tekens bij Brontekst.");
   WC.card=emptyCard({sector:state.sector,year:state.year});
   WC.card.source=file.name;WC.card.sourceText=text;WC.card.sourceStatus="Ingelezen bron · verwerking controleren";
   WC.card.title=text.split("\n").find(x=>x.trim())?.slice(0,140)||file.name;
   WC.card.description="Werk de ingelezen opdracht uit in het vaste sjabloon.";
 }
 WC.view="editor";WC.tab="opdracht";WC.dirty=true;state.page="workcards";renderPage();
 showToast("Bestand ingelezen. Controleer de bron en werk de kaart uit, of vraag een AI-voorstel als AI is aangesloten.");
 }catch(error){showToast(error.message);}
}
function wcChat(){
 const dialog=$("wc-assistant");
 if(!WC.card){WC.card=emptyCard({sector:state.sector,year:state.year});WC.view="editor";renderWorkcards();}
 $("wc-assistant-body").innerHTML='<header class="wc-chat-head"><div><span class="eyebrow">Praktijkassistent</span><h2>Meedenken met jouw les</h2></div><button class="icon-btn" data-wc="close-chat" aria-label="Sluiten">×</button></header><p class="wc-chat-context">'+e(CARD_SECTORS[WC.card.sector]+" · "+WC.card.grade+" · "+WC.card.phase)+'</p><p class="wc-ai-status">'+(service.liveCoach?"● "+e(service.ai.label)+" verbonden":"○ Gemini nog niet verbonden"+aiConnectButton())+'</p><div class="wc-chat-modes"><button class="btn primary" data-wc="chat-card">Werkkaart</button><button class="btn" data-wc="chat-coach">Rekencoach</button></div><div class="wc-chat-actions">'+[["simpler","Maak eenvoudiger"],["challenge","Geef meer uitdaging"],["practice","Pas aan op mijn praktijkopdracht"],["stage","Maak een stagevoorbeeld"],["generate","Maak een werkkaart"]].map(([k,n])=>'<button class="btn" data-wc-help="'+k+'">'+n+'</button>').join("")+'</div><div class="wc-chat-messages" id="wc-chat-messages" aria-live="polite"></div><form id="wc-chat-form"><label class="wc-field">Je vraag<textarea name="question" required maxlength="1500" rows="3" placeholder="Bijvoorbeeld: hoe laat ik leerlingen het meten uitleggen?"></textarea></label><div class="wc-actions"><button class="btn" type="submit">Vraag stellen</button><button class="btn primary" type="button" data-wc="generate">Maak kaartvoorstel</button></div></form><div id="wc-proposal"></div>';
 wcChatMessages();if(!dialog.open)dialog.showModal();
}
function wcChatMessages(){if($("wc-chat-messages"))$("wc-chat-messages").innerHTML=WC.messages.slice(-8).map(m=>'<div class="wc-chat-message '+(m.role==="user"?"wc-chat-user":"")+'"><strong>'+(m.role==="user"?"Jij":"Praktijkassistent")+'</strong><p>'+e(m.text)+'</p></div>').join("");}
async function wcAsk(question,mode="chat"){
 if(WC.busy)return;
 WC.messages.push({role:"user",text:question});
 if(!service.liveCoach){WC.messages.push({role:"assistant",text:"Gemini is nog niet verbonden. De sitebeheerder kan de Google-sleutel koppelen via Beheer → Gemini koppelen. Daarna kun je hier echte AI-antwoorden en kaartvoorstellen proberen. Je ingevoerde opdracht blijft behouden."});wcChatMessages();return;}
 WC.busy=true;wcChatMessages();$("wc-proposal").textContent="Voorstel wordt gemaakt…";
 try{const r=await fetch("/api/assistant",{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({mode,question,card:validateCard(WC.card)}),signal:AbortSignal.timeout(65000)});const j=await r.json();if(!r.ok)throw Error(j.error);
 WC.messages.push({role:"assistant",text:j.message});if(j.card){WC.proposal=validateCard(j.card);$("wc-proposal").innerHTML='<div class="wc-proposal"><h3>'+e(j.card.title)+'</h3><p>'+e(j.card.description)+'</p><p>'+j.card.steps.length+' stappen · '+j.card.math.items.length+' rekenvragen</p><button class="btn primary" data-wc="apply-proposal">Voorstel overnemen en bewerken</button><button class="text-btn" data-wc="discard-proposal">Voorstel wegleggen</button></div>';}else $("wc-proposal").textContent="";
 }catch(error){WC.messages.push({role:"assistant",text:error.message});$("wc-proposal").textContent="";}finally{WC.busy=false;wcChatMessages();}
}
function wcHelp(action){
 const q={simpler:"Maak deze werkkaart eenvoudiger met hetzelfde leerdoel.",challenge:"Geef meer uitdaging door leerlingen te laten plannen, vergelijken en onderbouwen.",practice:"Pas de werkkaart aan op mijn praktijkopdracht en bron.",stage:"Maak een herkenbaar stagevoorbeeld bij deze opdracht.",generate:"Maak een complete werkkaart bij mijn opdracht, doelen en brontekst."}[action];
 if(service.liveCoach)return wcAsk(q,"card");
 const c=WC.card;
 if(action==="simpler"){c.level="Meer ondersteuning";c.teacher.support="Lees samen één stap. Laat de leerling eerst aanwijzen wat nodig is. Doe de eerste handeling voor. Gebruik concreet materiaal bij de rekenvraag.";wcDirty();}
 if(action==="challenge"){c.level="Meer uitdaging";c.teacher.challenge="Laat de leerling vóór het werken de benodigde materialen plannen. Laat de berekening en de praktische keuze aan een maatje uitleggen.";wcDirty();}
 const response={simpler:"Vaste hulp toegepast: meer ondersteuning, één stap tegelijk en concreet materiaal. De doelen en getallen zijn behouden. Bekijk het docentblad.",challenge:"Vaste hulp toegepast: extra plannen en onderbouwen. De doelen en getallen zijn behouden. Bekijk het docentblad.",practice:"Vul de nieuwe praktijkopdracht in bij Opdracht en pas de materialen en stappen aan. Voor automatische aanpassing is live AI nodig.",stage:"Vaste aanpak: begin met ‘Je werkt als … bij …’. Laat de leerling met dezelfde rekenhandeling een werkbeslissing aan een collega uitleggen. Gebruik een werkbon met exacte gegevens. Vul zelf een passende werkplek in.",generate:"Kies een van de vijf voorbeeldkaarten of vul het lege sjabloon in. Automatisch een nieuwe kaart laten schrijven kan zodra live AI is aangesloten."}[action];
 WC.messages.push({role:"assistant",text:response});wcChatMessages();
}
document.addEventListener("input",event=>{
 const path=event.target.dataset.cardPath;if(!path||!WC.card)return;setPath(WC.card,path,event.target.value);wcDirty();
});
document.addEventListener("change",async event=>{
 const el=event.target;
 if(el.id==="wc-teacher"){WC.teacher=el.checked;wcRenderPreview();}
 if(el.id==="wc-link-lesson"){WC.card.linkedLesson=el.value;if(el.value)WC.card.goals.math=goalFor(lessonLookup(DATA,el.value));wcDirty();renderWorkcards();}
 if(el.dataset.cardPath==="sector"){wcDirty();renderWorkcards();}
 if(el.dataset.cardImage&&el.files?.[0]){try{setPath(WC.card,el.dataset.cardImage,await wcPhoto(el.files[0]));setPath(WC.card,el.dataset.altPath,el.files[0].name.replace(/\.[^.]+$/,""));WC.card.teacher.images="Eigen foto’s en eventuele voorbeeldillustraties. Controleer de beeldbron en gebruik de exacte gegevens in de tekst.";wcDirty();renderWorkcards();}catch(error){showToast(error.message);}}
 if(el.hasAttribute("data-wc-import")&&el.files?.[0])await wcImport(el.files[0]);
});
document.addEventListener("submit",event=>{if(event.target.id==="wc-chat-form"){event.preventDefault();wcAsk(String(new FormData(event.target).get("question")));}});
document.addEventListener("click",async event=>{
 const b=event.target.closest("button");if(!b||b.disabled)return;const d=b.dataset;
 if(d.wcExample){wcUseExample(d.wcExample);return;}
 if(d.wcOpen){await wcOpen(d.wcOpen);return;}
 if(d.wcTab){WC.tab=d.wcTab;renderWorkcards();return;}
 if(d.wcHelp){wcHelp(d.wcHelp);return;}
 if(d.wcVersion){await wcOpen(WC.card.id,Number(d.wcVersion));return;}
 if(d.wcRemoveStep!==undefined){WC.card.steps.splice(+d.wcRemoveStep,1);wcDirty();renderWorkcards();return;}
 if(d.wcRemoveMaterial!==undefined){WC.card.materials.splice(+d.wcRemoveMaterial,1);wcDirty();renderWorkcards();return;}
 if(d.wcRemoveQuestion!==undefined){WC.card.math.items.splice(+d.wcRemoveQuestion,1);wcDirty();renderWorkcards();return;}
 if(d.wcMove){const[i,delta]=d.wcMove.split(":").map(Number);[WC.card.steps[i],WC.card.steps[i+delta]]=[WC.card.steps[i+delta],WC.card.steps[i]];wcDirty();renderWorkcards();return;}
 const a=d.wc;if(!a)return;
 if(a==="new"){if(!wcCanReplace())return;WC.card=emptyCard({sector:state.sector,year:state.year});WC.view="editor";WC.dirty=true;WC.page=0;WC.tab="opdracht";renderWorkcards();}
 if(a==="back"){WC.view="start";renderWorkcards();}
 if(a==="save")await wcSave();
 if(a==="copy")await wcSave(true);
 if(a==="history")await wcHistory();
 if(a==="prev"){WC.page--;wcRenderPreview();}
 if(a==="next"){WC.page++;wcRenderPreview();}
 if(a==="assistant"||a==="chat-card")wcChat();
 if(a==="close-chat")$("wc-assistant").close();
 if(a==="chat-coach"){$("wc-assistant").close();openPrep(weekRecord().lessons.find(l=>l.id===WC.card.linkedLesson)||weekRecord().lessons[0]);}
 if(a==="add-material"&&WC.card.materials.length<24){WC.card.materials.push({name:"",amount:""});wcDirty();renderWorkcards();}
 if(a==="add-step"&&WC.card.steps.length<30){WC.card.steps.push({title:"",text:"",image:"",alt:"",check:""});wcDirty();renderWorkcards();}
 if(a==="add-precaution"&&WC.card.precautions.length<6){WC.card.precautions.push("");wcDirty();renderWorkcards();}
 if(a==="add-question"&&WC.card.math.items.length<6){WC.card.math.items.push({question:"",answer:""});wcDirty();renderWorkcards();}
 if(a==="json"){CardPrint.download(new Blob([JSON.stringify(validateCard(WC.card),null,2)],{type:"application/json"}),CardPrint.filename(WC.card)+".json");}
 if(["pdf","word","print"].includes(a)){
   b.disabled=true;const label=b.textContent;b.textContent="Bezig…";
   try{
     const card=validateCard(WC.card);
     if(a==="pdf")await CardPrint.pdf(card,CARD_ASSETS,WC.teacher);
     if(a==="word")await CardPrint.word(card,CARD_ASSETS,WC.teacher);
     if(a==="print"){const root=$("wc-print-root");root.innerHTML=CardPrint.html(CardPrint.build(card,CARD_ASSETS,WC.teacher),CARD_ASSETS);await Promise.all([...root.querySelectorAll("img")].map(im=>im.decode().catch(()=>{})));document.body.classList.add("printing-card");window.print();document.body.classList.remove("printing-card");}
     if(a!=="print")showToast("Bestand gemaakt. Bekijk de download van je browser.");
   }catch(error){showToast("Export niet gelukt: "+error.message);}finally{b.disabled=false;b.textContent=label;}
 }
 if(a==="generate"){const q=$("wc-chat-form")?.elements.question.value?.trim()||"Maak een volledige werkkaart bij de ingevulde praktijkopdracht en brontekst.";wcAsk(q,"card");}
 if(a==="apply-proposal"&&WC.proposal){WC.card=WC.proposal;WC.proposal=null;WC.dirty=true;$("wc-assistant").close();renderWorkcards();showToast("Voorstel overgenomen als concept. Controleer de gegevens.");}
 if(a==="discard-proposal"){WC.proposal=null;$("wc-proposal").textContent="";}
});
window.addEventListener("resize",()=>{if(state.page==="workcards"&&WC.view==="editor")wcRenderPreview();});
window.addEventListener("beforeunload",event=>{if(WC.dirty){event.preventDefault();event.returnValue="";}});
window.addEventListener("afterprint",()=>document.body.classList.remove("printing-card"));
window.RekenstartWorkcards={get card(){return WC.card;},examples:CARD_EXAMPLES,assets:CARD_ASSETS,validate:validateCard,print:CardPrint,open:openWorkcards};

