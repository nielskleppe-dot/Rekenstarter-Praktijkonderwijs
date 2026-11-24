const iconPaths = {
  wrench:'<path d="M14.6 6.4a5 5 0 0 0-6.5-2.9l3 3-2.6 2.6-3-3a5 5 0 0 0 6.4 6.4l6.5 6.5a1.9 1.9 0 0 0 2.7-2.7l-6.5-6.5a5 5 0 0 0 0-3.4Z"/>',
  store:'<path d="M3 10l2-5h14l2 5M4 10v9h16v-9M9 19v-6h6v6M3 10c0 3 5 3 5 0 0 3 4 3 4 0 0 3 4 3 4 0 0 3 5 3 5 0"/>',
  heart:'<path d="M20 12c-2.1 3.3-8 7-8 7s-5.9-3.7-8-7C1.6 8.1 4.2 4.9 7.1 5c2 .1 3.7 1.2 4.9 3 1.2-1.8 2.9-2.9 4.9-3 2.9-.1 5.5 3.1 3.1 7Z"/><path d="M10 12h4m-2-2v4"/>',
  utensils:'<path d="M5 3v6c0 2 4 2 4 0V3M7 3v18M18 21V3c-2 1-3 4-3 8h3"/>',
  sprout:'<path d="M12 21V9M12 13C8 13 4 10 4 5c4 0 8 2 8 7Zm0-1c0-4 3-7 8-8 0 4-2 8-8 8ZM8 21h8"/>',
  left:'<path d="m15 18-6-6 6-6"/>',right:'<path d="m9 18 6-6-6-6"/>',
  arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',
  play:'<path d="m9 5 11 7-11 7V5Z"/>',
  check:'<path d="m5 12 4 4 10-10"/>',
  calendar:'<rect x="4" y="5" width="16" height="15" rx="3"/><path d="M8 3v5m8-5v5M4 10h16"/>',
  close:'<path d="m6 6 12 12M18 6 6 18"/>',
  screen:'<path d="M9 3H3v6m12-6h6v6m0 6v6h-6m-6 0H3v-6"/>',
  link:'<path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1.5 1.5M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1.5-1.5"/>'
};

function icon(name) {
  return '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">'+(iconPaths[name]??"")+"</svg>";
}

const rekenWoorden=[
 [/\bomtrek\b/i,'Omtrek','De lengte van alle randen samen.'],
 [/\boppervlakte\b/i,'Oppervlakte','Hoe groot het hele vlak is. Je meet dit bijvoorbeeld in m².'],
 [/\btarra\b/i,'Tarra','Zet het lege bakje op de weegschaal. Druk op tarra. De weegschaal staat dan op nul.'],
 [/\bgemiddeld(?:e)?\b/i,'Gemiddelde','Tel alle aantallen op. Deel daarna door het aantal getallen.'],
 [/\bverhoudingstabel\b/i,'Verhoudingstabel','In deze tabel zie je welke aantallen bij elkaar horen.'],
 [/\blegenda\b/i,'Legenda','De uitleg bij de tekening. Bijvoorbeeld: één vakje is één meter.'],
 [/\bschaalverdeling\b/i,'Schaalverdeling','De getallen en streepjes op een meetinstrument. Kijk hoeveel één stapje is.'],
 [/\bbinnenmaten\b/i,'Binnenmaten','De maten aan de binnenkant van de bak.'],
 [/\b(?:procent|procenten)\b|%/i,'Procent','1% betekent 1 van de 100. 50% is de helft.'],
 [/\b(?:tiental|tientallen)\b/i,'Tiental','Een groep van 10. Het getal 34 heeft 3 tientallen en 4 losse stuks.'],
 [/\beenheid\b/i,'Eenheid','Het woord of teken bij een maat. Bijvoorbeeld cm, kg of liter.'],
 [/\bvoorraad\b/i,'Voorraad','De spullen die er nu liggen.'],
 [/\bbudget\b/i,'Budget','Het geld dat je kunt uitgeven.'],
 [/\bsets?\b/i,'Set','Spullen die bij elkaar horen. Bijvoorbeeld een mes, een vork en een lepel.'],
 [/\bkolom\b/i,'Kolom','Een strook in de tabel van boven naar beneden.'],
 [/\brij\b/i,'Rij','Een strook in de tabel van links naar rechts.']
];
function rekenwoordHulp(text){
 const plain=String(text).replace(/<[^>]*>/g,' ');
 const words=rekenWoorden.filter(([pattern])=>pattern.test(plain)).slice(0,2);
 if(!words.length)return '';
 return '<details class="rekenwoord-hulp"><summary>Hulp bij: '+words.map(([,word])=>escapeHTML(word.toLowerCase())).join(' en ')+'</summary>'+words.map(([,word,meaning])=>'<p><strong>'+escapeHTML(word)+':</strong> '+escapeHTML(meaning)+'</p>').join('')+'</details>';
}
const careerPhotos=/* CAREER_PHOTOS */[];
const careerPhotosById=new Map(careerPhotos.map(photo=>[photo.id,photo]));
function careerPhoto(id,sector){
 const photo=careerPhotosById.get(id);if(!photo||photo.sector!==sector)return '';
 const h=escapeHTML;
 return '<figure class="task-photo lesson-bank-photo career-work-photo" data-career-photo-id="'+h(photo.id)+'" data-photo-sector="'+h(sector)+'"><img src="'+h(photo.url)+'" width="'+photo.width+'" height="'+photo.height+'" loading="lazy" decoding="async" alt="'+h(photo.alt)+'"><figcaption>'+h(photo.material)+' - AI-foto</figcaption></figure>';
}
function careerBoxPhoto(sector){
 return careerPhoto({groen:'start-groen-waterbox',techniek:'start-techniek-waterbox',eco:'start-eco-waterbox',zw:'start-zw-washbox',hbr:'start-hbr-foodbox'}[sector],sector);
}
const lessonPhotoBank=/* LESSON_PHOTO_BANK */[];
const lessonPhotosById=new Map(lessonPhotoBank.map(photo=>[photo.id,photo]));
function lessonBankPhoto(id,sector){
 const photo=lessonPhotosById.get(id);
 if(!photo||photo.sector!==sector)return '';
 const h=escapeHTML;
 return '<figure class="task-photo lesson-bank-photo" data-photo-id="'+h(photo.id)+'" data-photo-sector="'+h(sector)+'" data-photo-kind="'+h(photo.kind)+'"><img src="'+h(photo.url)+'" width="'+photo.width+'" height="'+photo.height+'" loading="lazy" decoding="async" alt="'+h(photo.alt)+'"><figcaption>'+h(photo.material)+' · AI-foto</figcaption></figure>';
}
const topicPhotos=/* TOPIC_PHOTOS */{};
const paymentCaptions={groen:'Afrekenen in de boerderijwinkel',techniek:'Afrekenen aan de garagebalie',hbr:'Afrekenen aan de koffiebar',zw:'Betalen in het winkeltje van het woonzorgcentrum',eco:'Afrekenen bij de winkelkassa'};
function paymentPhoto(sector){
 const caption=paymentCaptions[sector];if(!caption)return '';
 return '<figure class="topic-photo" data-topic-photo="money" data-photo-sector="'+sector+'"><img src="'+(topicPhotos['money-'+sector]||'')+'" alt="'+escapeHTML(caption)+'" width="1247" height="252"><figcaption>'+escapeHTML(caption)+' · AI-foto</figcaption></figure>';
}
let coinPictureCounter=0;
const coinPhotos=/* COIN_PHOTOS */{};
function coinPicture({compact=false,zoom=true}={}){
 const id='coins-'+(++coinPictureCounter),values=compact?[200,100,50,20]:[200,100,50,20,10,5,2,1];
  const enlarge=zoom?'<button type="button" class="btn coin-zoom" data-coin-zoom="true">'+(compact?'Bekijk alle munten':'Vergroot de munten')+'</button>':'';
  if(values.every(value=>coinPhotos[value]))return '<figure class="coin-picture" data-lesson-visual="coins"><div class="coin-grid">'+values.map(value=>'<figure data-denomination-cents="'+value+'"><img src="'+coinPhotos[value]+'" alt="'+(value>=100?value/100+' euro':value+' cent')+'" width="800" height="800"><figcaption>'+(value>=100?'€ '+value/100:value+' cent')+'</figcaption></figure>').join('')+'</div><figcaption>Deze muntsoorten kun je gebruiken. Je mag meer van dezelfde munt kiezen.<small><a href="https://www.ecb.europa.eu/euro/coins/common/html/index.en.html" target="_blank" rel="noopener">Muntfoto’s: ECB</a></small></figcaption>'+enlarge+'</figure>';
 const definitions='<defs><radialGradient id="'+id+'-gold"><stop stop-color="#fae4a2"/><stop offset=".7" stop-color="#c6a250"/><stop offset="1" stop-color="#9b722b"/></radialGradient><radialGradient id="'+id+'-silver"><stop stop-color="#f5f6f6"/><stop offset=".7" stop-color="#bfc6c8"/><stop offset="1" stop-color="#7b858a"/></radialGradient><radialGradient id="'+id+'-copper"><stop stop-color="#efc19a"/><stop offset=".7" stop-color="#ba7750"/><stop offset="1" stop-color="#865035"/></radialGradient></defs>';
 const coins=values.map((value,index)=>{
  const x=100+(index%4)*190,y=65+Math.floor(index/4)*136,copper=value<10;
  const outer=value===200?'silver':value===100?'gold':copper?'copper':'gold';
  const inner=value===200?'gold':value===100?'silver':outer;
  const number=value>=100?value/100:value,unit=value>=100?'EURO':'CENT';
  return '<g data-denomination-cents="'+value+'"><ellipse cx="'+x+'" cy="'+(y+46)+'" rx="47" ry="7" fill="#18303c" opacity=".13"/><circle cx="'+x+'" cy="'+y+'" r="49" fill="url(#'+id+'-'+outer+')" stroke="#786746" stroke-width="1.5"/><circle cx="'+x+'" cy="'+y+'" r="43" fill="none" stroke="#fff5d1" stroke-opacity=".65" stroke-dasharray="2 3"/>'+(value>=100?'<circle cx="'+x+'" cy="'+y+'" r="34" fill="url(#'+id+'-'+inner+')" stroke="#897b5d"/>':'')+'<text x="'+x+'" y="'+(y+9)+'" text-anchor="middle" font-size="39" font-weight="800" fill="#493a29">'+number+'</text><text x="'+x+'" y="'+(y+28)+'" text-anchor="middle" font-size="13" font-weight="750" fill="#493a29">'+unit+'</text></g>';
 }).join('');
 return '<figure class="coin-picture" data-lesson-visual="coins"><svg viewBox="0 0 780 '+(compact?140:264)+'" role="img" aria-label="Muntsoorten: 2 euro, 1 euro, 50 cent, 20 cent, 10 cent, 5 cent, 2 cent en 1 cent" font-family="system-ui,sans-serif">'+definitions+coins+'</svg><figcaption>Deze muntsoorten kun je gebruiken. Je mag meer van dezelfde munt kiezen.</figcaption>'+enlarge+'</figure>';
}
function openCoinPicture(){
 $('details').setAttribute('aria-label','Munten bekijken');
 $('details-body').innerHTML='<div class="detail-head"><h2>Welke munten herken je?</h2><button type="button" class="btn" data-action="close-details">Sluiten</button></div><div class="coin-enlarged">'+coinPicture({zoom:false})+'</div>';
 if(!$('details').open)$('details').showModal();
}
function lessonFactPicture(task,topic){
 const facts=task.facts||[];
 return '<figure class="lesson-fact-picture" data-lesson-visual="'+escapeHTML(topic)+'"><div class="visual-document-title">'+(topic==='money'?'Prijskaart of werkbon':'Gegevens bij deze opdracht')+'</div>'+factCards(facts)+(facts.length?'':'<p>'+escapeHTML(task.question)+'</p>')+'</figure>';
}
function moneyPicture(task,lesson,deck){
 const showAnswer=deck.step===2?(deck.modelSteps||0)>=task.steps.length:deck.step===3&&deck.revealed;
 if(lesson.kind==='coins')return '<div class="money-picture"><p class="payment-target">Te betalen <strong>'+escapeHTML(moneyForCatalog(task.model.cents))+'</strong></p>'+coinPicture()+'</div>';
 const facts=task.facts||[];
 const lines=facts.map(f=>'<div class="receipt-line"><span>'+escapeHTML(f.label)+'</span><strong>'+escapeHTML(f.value)+'</strong></div>').join('');
 const price=task.model?.kind==='price'?task.model.cents:null;
 const amount=!facts.length&&price!==null?'<p class="receipt-price">'+escapeHTML(moneyForCatalog(price))+'</p>':'';
 return '<figure class="money-receipt" data-lesson-visual="money"><div class="visual-document-title">'+(lesson.kind==='priceRead'?'Prijskaartje':'Bestelling')+'</div>'+lines+amount+(showAnswer?'<div class="receipt-total"><span>Antwoord</span><strong>'+escapeHTML(task.answer)+'</strong></div>':'')+'</figure>';
}
function heroArt(week) {
  const ticks=Array.from({length:21},(_,i)=>'<path d="M'+(20+i*14)+' 135v'+(i%5===0?13:6)+'"/>').join("");
  return '<svg class="hero-art" viewBox="0 0 325 175" aria-hidden="true" fill="none">'+
    '<g stroke="#d8b7ea" opacity=".45" stroke-width="1"><circle cx="246" cy="71" r="64"/><circle cx="246" cy="71" r="49"/><circle cx="246" cy="71" r="34"/><path d="M182 71h128m-64-64v128"/></g>'+
    '<g fill="#f1e4f8"><rect x="21" y="36" width="69" height="69" rx="15"/><rect x="100" y="36" width="69" height="69" rx="15" fill="#ffc9d4"/></g>'+
    '<g stroke="#522776" stroke-width="2.5" stroke-linecap="round"><path d="M44 70h23M55.5 59v23"/><path d="M123 65h23m-23 10h23"/></g>'+
    '<g stroke="#d8b7ea" stroke-width="1.3" stroke-linecap="round"><path d="M20 134h281"/>'+ticks+'</g>'+
    '<g fill="#f3e4fa" font-size="12" font-family="system-ui,sans-serif"><text x="18" y="169">0</text><text x="84" y="169">10</text><text x="154" y="169">20</text><text x="224" y="169">30</text><text x="293" y="169">40</text></g>'+
    '<circle cx="'+(20+week*14)+'" cy="134" r="5" fill="#ffc9d4"/>'+
    '</svg>';
}

function visualSVG(v,material) {
  if(!v) return "";
  const largeMeasure=legacyMeasureModel(v);if(largeMeasure)return measurementVisual(largeMeasure);
  if(v.type==="jumps"){
    const px=n=>24+432*n/v.end;
    let marks='';for(let n=0;n<=v.end;n+=10)marks+='<path d="M'+px(n)+' 90v9" stroke="#522776"/><text x="'+px(n)+'" y="118" text-anchor="middle" font-size="13">'+n+'</text>';
    const arcs=v.jumps.map((j,i)=>{const a=px(j.from),b=px(j.to),top=25+(i%2)*20;return '<path d="M'+a+' 87 Q'+((a+b)/2)+' '+top+' '+b+' 87" fill="none" stroke="#522776" stroke-width="2"/><circle cx="'+b+'" cy="87" r="4" fill="#b31c40"/><text x="'+((a+b)/2)+'" y="'+(top+16)+'" text-anchor="middle" font-size="15" fill="#522776">'+j.label+'</text>';}).join('');
    return '<svg viewBox="0 0 480 130" role="img" aria-label="Getallenlijn met de rekenstappen van de uitwerking"><path d="M24 90h432" stroke="#522776"/>'+marks+arcs+'</svg>';
  }
  const open=(h,label)=>'<svg viewBox="0 0 480 '+h+'" role="img" aria-label="'+escapeHTML(label)+'" font-family="system-ui,sans-serif">';
  const label=(x,y,text,options="")=>'<text x="'+x+'" y="'+y+'" '+options+'>'+escapeHTML(String(text))+'</text>';
  if(v.type==="groups"){
    const rows=Math.ceil(v.groups/3),height=rows*61+(v.loose?38:0)+8;
    let content="";
    for(let g=0;g<v.groups;g++){
      const x=8+(g%3)*157,y=6+Math.floor(g/3)*61;
      content+='<rect x="'+x+'" y="'+y+'" width="145" height="52" rx="10" fill="#eee0f4" stroke="#c7a6d9"/>';
      for(let j=0;j<v.size;j++) content+='<circle cx="'+(x+25+(j%5)*23)+'" cy="'+(y+16+Math.floor(j/5)*20)+'" r="7" fill="#70458b"/>';
    }
    for(let i=0;i<v.loose;i++) content+='<circle cx="'+(24+i*24)+'" cy="'+(rows*61+17)+'" r="7.5" fill="#aa662b"/>';
    return open(height,v.groups+" volle groepjes met elk "+v.size+" "+material+(v.loose?" en losse stuks":""))+content+"</svg>";
  }
  if(v.type==="trays"){
    const width=432/v.count;
    let content="";
    for(let i=0;i<v.count;i++) content+='<rect x="'+(24+i*width)+'" y="12" width="'+(width-8)+'" height="51" rx="11" fill="#fff" stroke="#ad83c2" stroke-width="2"/>';
    return open(75,v.count+" lege bakken")+content+"</svg>";
  }
  if(v.type==="line"||v.type==="ruler"){
    const start=v.type==="ruler"?0:v.start;
    const end=v.end,step=v.type==="ruler"?1:v.step;
    const position=value=>26+428*(value-start)/(end-start);
    let content='<path d="M26 70h428" stroke="#56366b" stroke-width="2"/>';
    for(let value=start;value<=end;value+=step){
      const major=v.type==="ruler"?value%5===0:step>=10||value===start||value===end||value===(start+end)/2;
      const x=position(value);
      content+='<path d="M'+x+' 70v'+(major?14:7)+'" stroke="#56366b" stroke-width="'+(major?2:1)+'"/>';
      if(major) content+=label(x,103,value,'text-anchor="middle" fill="#523465" font-size="14" font-weight="700"');
    }
    if(v.type==="ruler"){
      const endpoint=position(v.length);
      content+='<rect x="26" y="27" width="'+(endpoint-26)+'" height="25" rx="5" fill="#79539b"/>'+
        '<path d="M'+endpoint+' 52v18" stroke="#9d5b29" stroke-width="2" stroke-dasharray="4 3"/>';
      content+=label(26,19,"Voorwerp",'fill="#56376a" font-size="14" font-weight="700"');
      content+=label(454,123,"cm",'text-anchor="end" fill="#56376a" font-size="13"');
    }else if(v.point!==undefined){
      const point=position(v.point);
      content+='<circle cx="'+point+'" cy="70" r="6" fill="#a76227"/>';
      content+=label(point,53,v.point,'text-anchor="middle" fill="#744b28" font-size="19" font-weight="800"');
    }
    return open(131,v.type==="ruler"?"Meetlat met een voorwerp vanaf het nulpunt. De streepjes staan één centimeter uit elkaar.":"Getallenlijn van "+start+" tot "+end)+content+"</svg>";
  }
  if(v.type==="fit"){
    const largest=Math.max(v.available,v.object);
    const scale=435/largest;
    return open(140,"Twee lengtebalken voor de vrije plek en het voorwerp.")+
      label(18,21,"Vrije plek",'font-size="15" font-weight="700" fill="#5c3b70"')+
      '<rect x="18" y="31" width="'+(v.available*scale)+'" height="26" rx="5" fill="#79539b"/>'+
      label(18,88,"Voorwerp",'font-size="15" font-weight="700" fill="#715230"')+
      '<rect x="18" y="97" width="'+(v.object*scale)+'" height="26" rx="5" fill="#c9995e"/>'+
      '<path d="M18 30v94" stroke="#5c3b70" stroke-width="2"/>'+"</svg>";
  }
  if(v.type==="scale"){
    return open(170,"Digitale weegschaal met "+v.grams)+
      '<rect x="123" y="15" width="232" height="19" rx="8" fill="#8ab092"/><path d="M125 44h228l21 86H104Z" fill="#d8e9d6" stroke="#7b9e80" stroke-width="2"/>'+
      '<rect x="145" y="62" width="188" height="47" rx="9" fill="#193d32"/>'+
      label(239,93,v.grams,'text-anchor="middle" fill="#e8f6dd" font-size="30" font-weight="760"')+
      '<path d="M104 130h270" stroke="#54755c" stroke-width="5" stroke-linecap="round"/>'+"</svg>";
  }
  if(v.type==="decimal"){
    const pos=value=>25+4.3*(value-100);
    let content='<path d="M25 73h430" stroke="#386b53" stroke-width="2"/>';
    for(let i=0;i<=10;i++) content+='<path d="M'+(25+i*43)+' 73v'+(i%5===0?14:6)+'" stroke="#386b53"/>';
    content+=label(25,107,"1 m",'text-anchor="middle" fill="#315c46" font-size="15"');
    content+=label(240,107,"1,5 m",'text-anchor="middle" fill="#315c46" font-size="15"');
    content+=label(455,107,"2 m",'text-anchor="middle" fill="#315c46" font-size="15"');
    content+='<path d="M'+pos(v.a)+' 36v37" stroke="#2d7552" stroke-width="2" stroke-dasharray="3 3"/><path d="M'+pos(v.b)+' 51v22" stroke="#ac6b2b" stroke-width="2" stroke-dasharray="3 3"/>';
    content+=label(pos(v.a),30,"A",'text-anchor="middle" fill="#2d7552" font-weight="800" font-size="15"');
    content+=label(pos(v.b),47,"B",'text-anchor="middle" fill="#9a5b27" font-weight="800" font-size="15"');
    return open(122,"Getallenlijn tussen 1 en 2 meter met maat A en maat B.")+content+"</svg>";
  }
  return "";
}

function factCards(facts) {
  if(!facts.length) return "";
  return '<div class="facts">'+facts.map(fact=>'<div class="fact"><small>'+escapeHTML(fact.label)+'</small><strong>'+escapeHTML(fact.value)+'</strong></div>').join("")+"</div>";
}

function taskVisual(task,material,labels) {
  const facts=labels?task.facts.map((fact,index)=>({...fact,label:labels[index]??fact.label})):task.facts;
  const multi=task.visual?.type==="line"&&task.visual.point===undefined;
  const visual=task.visual;
  return (multi?'<p class="line-instruction">Lijn A: plaats het eerste aantal.</p>'+visualSVG(task.visual,material)+'<p class="line-instruction">Lijn B: plaats het tweede aantal. Beide lijnen hebben dezelfde schaal.</p>'+visualSVG(task.visual,material):visualSVG(visual,material))+factCards(facts);
}

function workplacePhoto(variant,compact=false){
 const w=variant.workplace;if(!w)return '';
 const im=w.lessonImage;
 if(im){
  const x=100*(im.index%im.columns)/(im.columns-1),y=100*Math.floor(im.index/im.columns)/(im.rows-1);
  return '<figure class="job-scene'+(compact?' compact':'')+'"><div class="scene-window"><div class="job-photo" role="img" aria-label="'+escapeHTML(im.alt)+'" style="aspect-ratio:1;background-image:url('+DATA.images[im.group]+');background-size:400% 300%;background-position:'+x+'% '+y+'%"></div></div><figcaption>'+escapeHTML(variant.material)+' · AI-illustratie</figcaption></figure>';
 }
 const pos=[['0%','0%'],['50%','0%'],['100%','0%'],['0%','100%'],['50%','100%'],['100%','100%']][w.panel];
 return '<figure class="job-scene'+(compact?' compact':'')+'"><div class="scene-window"><div class="job-photo" role="img" aria-label="'+escapeHTML(w.alt)+'" style="background-image:url('+DATA.images.workplaces+');background-position:'+pos.join(' ')+'"></div></div><figcaption>Werkplekbeeld · AI-illustratie</figcaption></figure>';
}
function workplaceLabels(lesson,task,variant){
 if(task===lesson.main)return variant.factLabels;
 const original=lesson.application.stages[state.deck?.sector||state.sector];
 return original?.labels??task.facts.map(f=>f.label);
}
function workDocument(lesson,task,variant,second=false){
 const w=variant.workplace;
 return '<section class="work-document" aria-label="'+escapeHTML(w.document)+'"><header><span>'+escapeHTML(w.document)+'</span><strong>'+escapeHTML(lesson.id.toUpperCase())+' / '+(second?'02':'01')+'</strong></header><p class="document-material">'+escapeHTML(variant.material)+' <span>• '+(second?(w.changedOrder?'Aangepaste bon vervangt bon 01':'Nieuwe zelfstandige bon'):'Eerste bon')+'</span></p>'+
 taskVisual(task,variant.material,workplaceLabels(lesson,task,variant))+
 '<p class="document-foot">Voorbeeldgegevens voor deze werkopdracht. Gebruik de bon, niet de aantallen op de foto.</p></section>';
}
function jobQuestions(questions){
 const deck=state.deck;
 const shown=Math.min(questions.length,deck?.questionProgress?.[deck.step]??1);
 return '<p class="question-count">Vraag '+shown+' van '+questions.length+'</p><ol class="job-questions" aria-live="polite">'+questions.map((q,i)=>'<li data-step="'+(i+1)+'"'+(i!==shown-1?' hidden':' aria-current="step"')+'>'+escapeHTML(q)+'</li>').join('')+'</ol><div class="question-navigation">'+
  (shown>1?'<button type="button" class="text-btn" data-action="prev-question" data-count="'+questions.length+'">Vorige vraag</button>':'')+
  (shown<questions.length?'<button type="button" class="btn" data-action="next-question" data-count="'+questions.length+'">Volgende vraag '+icon("arrow")+'</button>':'<span class="question-status">Bespreek je antwoord.</span>')+'</div>';
}
function interactionLabel(lesson,step){
 const i=lesson.interaction;
 const title=step===1?i.firstLabel:step===2?i.middleLabel:i.lastLabel;
 const instruction=step===1?i.firstInstruction:step===2?'Reken eerst zelf. Bespreek daarna de overlegvraag met je buur.':i.lastInstruction;
 return '<aside class="interaction-label" aria-label="Werkvorm"><strong>'+escapeHTML(title)+'</strong></aside>';
}
function interactionChoices(lesson){
 const i=lesson.interaction;
 if((state.deck?.questionProgress?.[1]??1)>1)return '';
 return '<div class="interaction-choices" aria-label="Antwoordmogelijkheden">'+i.options.map((option,n)=>'<p><strong>'+String.fromCharCode(65+n)+'</strong> '+escapeHTML(option)+'</p>').join('')+'</div>';
}
function jobExtra(title,text){
 return '<details class="job-extra"><summary>'+escapeHTML(title)+'</summary><p>'+escapeHTML(text)+'</p></details>';
}

function workFigure(variant,task){
  if(variant.workplace?.lessonImage)return workplacePhoto(variant)+taskVisual(task,variant.material,variant.factLabels);
  const asset=DATA.images[variant.image.group];
  const photograph='<figure class="work-figure"><div class="work-photo" role="img" aria-label="'+escapeHTML(variant.image.alt)+
    '" style="background-image:url('+asset+');background-position:'+variant.image.position+'"></div>' +
    '<figcaption>Praktijkbeeld · voorbeeld</figcaption></figure>';
  const result=taskVisual(task,variant.material,variant.factLabels);
  return photograph+'<div class="lesson-data' +(task.visual?" with-diagram":"")+'"><span class="eyebrow">Gegevens van de opgave</span>'+result+'</div>';
}

function differentiation(hint,challenge){
  const h=escapeHTML;
  return '<div class="differentiation">'+[
    ["Geef een hint",hint],["Daag uit",challenge]
  ].map(([label,text])=>'<details><summary>'+h(label)+'</summary><p>'+h(text)+'</p></details>').join("")+'</div>';
}

const metricCards={
  volume:{title:"Hoeveel past erin?",units:["l","dl","cl","ml"],
    objects:[["pipette","1 ml","Een volle pipet van 1 ml geeft meerdere druppels."],["jug","250 ml","Een maatbeker gevuld tot 250 ml."],["milk","1 l","Een vol literpak melk."]],
    route:["1 l","10 dl","100 cl","1.000 ml"],example:"Vier keer 250 ml vult één literpak."},
  mass:{title:"Hoe zwaar is het?",units:["kg","hg","dag","g"],
    objects:[["clip","± 1 g","Een kleine paperclip."],["weight","100 g","Een gewichtje op de weegschaal."],["flour","1 kg","Een pak meel met 1 kg inhoud."]],
    route:["1 kg","10 hg","100 dag","1.000 g"],example:"Voor 500 g meel weeg je de helft van een kilopak af."},
  length:{title:"Hoe lang is het?",units:["m","dm","cm","mm"],
    objects:[["ruler","1 mm","Tussen twee kleine streepjes op een liniaal."],["cube","1 cm","De rand van een blokje van 1 cm."],["stick","1 m","Een uitgeklapte meterstok."]],
    route:["1 m","10 dm","100 cm","1.000 mm"],example:"Een plank van 1,2 m is 100 cm + 20 cm = 120 cm."}
};
const metricDrawings={
  pipette:'<g transform="rotate(35 44 27)"><rect x="37" y="1" width="14" height="16" rx="5" fill="#287d88"/><path d="M39 17h10v24l-5 8-5-8z" fill="#e4f8ff"/><path d="M40 27h8v13l-4 6-4-6z" fill="#45b7df"/></g><path d="M29 48q-9 12 0 12t0-12" fill="#45b7df"/>',
  jug:'<path d="M60 16h9q12 14-9 20" fill="none"/><path d="M13 10h47l-3 45H23l-4-38z" fill="#e9f8fb"/><path d="M23 31h34l-2 22H25z" fill="#6bc4da"/><path d="M49 20h9m-14 11h14m-9 10h8" />',
  milk:'<path d="m25 15 7-11h23l8 13v39H25z" fill="#fcfaf2"/><path d="m25 16 10-8 7 9h21M42 17v39" fill="none"/><path d="M26 24h15v16H26zm17 0h19v16H43z" fill="#61a8cb"/><text x="51" y="36">1 L</text>',
  clip:'<path d="m27 40 24-29c8-9 21 0 14 9L39 52c-12 13-29-1-19-14l23-27m7 8L26 43c-4 5 2 9 6 5l23-28" fill="none" stroke-width="3"/>',
  weight:'<circle cx="45" cy="15" r="8" fill="none"/><path d="M31 23h28l9 32H22z" fill="#acc3ca"/><text x="45" y="44">100 g</text>',
  flour:'<path d="M27 5h34l-2 9 5 10-2 32H25l-2-32 6-10z" fill="#e8cb99"/><path d="M28 13h31M25 26h37v20H25z" fill="#fff8e9"/><text x="44" y="39">1 kg</text>',
  ruler:'<path d="M7 15h76v25H7z" fill="#f7dca0"/><path d="M18 15v17m10-17v10m10-10v10m10-10v10m10-10v10m10-10v16"/><path d="M18 43v6h10v-6" stroke="#aa402b" fill="none"/><text x="26" y="61">1 mm</text>',
  cube:'<path d="m24 17 17-10 24 10v23L48 51 24 39z" fill="#b2d7a8"/><path d="m24 17 24 11 17-11M48 28v23" fill="none"/>',
  stick:'<path d="m6 43 73-30 4 10L10 53z" fill="#f7dca0"/><path d="m23 36 4 10m11-16 4 10m11-16 4 10m11-16 4 10"/>'
};
function metricReference(unit, fullRow = true) {
  const card = metricCards[unit];
  if (!card) return '';
  const objects = card.objects.map(([icon, size, caption]) =>
    '<figure><svg viewBox="0 0 90 64" aria-hidden="true">' + metricDrawings[icon] + '</svg><b>' +
    size + '</b><figcaption>' + caption + '</figcaption></figure>').join('');
  return (fullRow ? pmMetricReference(unit) : '') + '<section class="measure-guide"><h3>' + card.title +
    '</h3><div class="measure-objects">' + objects + '</div><div class="measure-route">' +
    card.route.map(value => '<b>' + value + '</b>').join('<span aria-hidden="true">=</span>') +
    '</div><p class="measure-example">' + card.example + '</p></section>';
}
const instrumentPhotos=/* INSTRUMENT_PHOTOS */{};
const instrumentSources={
 kerb:["Kerb.jpg","Straatband langs een bestrating","Bekijk de rand tussen de straat en het trottoir. Foto: SelfishSeahorse."],
 length:["Measuring-tape.jpg","Rolmaat","Leg de haak tegen de rand van het materiaal. Volg het lint tot het andere uiteinde."],
 mass:["Kitchen-scale.jpg","Keukenweegschaal met meel en eieren","Bekijk de wijzerplaat. Welke eenheid staat bij de getallen?"],
 volume:["Messbecher.png","Litermaat met schaalverdeling","Zoek 500 ml op de maatbeker. Waar staat één liter?"],
 bricks:["Red_bricks_2025.jpg","Stapel bakstenen","Wijs een vlak van één steen aan. Welke twee maten heb je nodig voor de oppervlakte?"]
};
function instrumentPhoto(key){
 const source=instrumentSources[key];
 if(!source)return "";
 return '<figure class="instrument-photo"><img src="'+(instrumentPhotos[key]||"")+'" alt="'+source[1]+'"><figcaption><strong>'+source[1]+'</strong> · '+source[2]+' <a href="https://commons.wikimedia.org/wiki/File:'+source[0]+'" target="_blank" rel="noopener">Fotobron</a></figcaption></figure>';
}
function referenceForTask(task,type){
 const row={cm:"length",fit:"length",decimalCm:"length",cmCompare:"length",decimalFit:"length",gram:"mass",massCompare:"mass",massRefill:"mass"}[type];
 if(!row)return "";
 const units=new Set((task.facts.map(f=>f.value).join(" ")+" "+task.question+" "+task.steps.join(" ")).toLowerCase()
   .replace(/centimeters?/g,"cm").replace(/kilogram(men)?/g,"kg").replace(/gram(men)?/g,"g").match(/(?<![a-z])(?:kg|g|mm|cm|m)(?![a-z])/g)||[]);
 const relevant=[...units].filter(u=>metricRows[row][1].split(" ").includes(u));
 if(relevant.length<2)return "";
 const r=measureRoute(row,relevant[0],relevant[1],1);
 return '<details class="conversion-help"><summary>Omrekenen · '+relevant[0]+' naar '+relevant[1]+'</summary>'+drawArches(r,r.count)+pmMetricButton(row)+'</details>';
}

function columnOperands(task){
  const facts=task.facts.map(fact=>/^(\d{1,3}) stuks$/u.exec(fact.value));
  if(facts.length!==2||facts.some(fact=>!fact))return null;
  const [a,b]=facts.map(fact=>Number(fact[1]));
  if(task.verb==="bij elkaar tellen")return {a,b,add:true};
  if(task.verb==="overhouden"&&a>=b)return {a,b,add:false};
  return null;
}

function columnCalculation(operands,visible=0,{interactive=true}={}){
  const {a,b,add}=operands;
  const total=add?a+b:a-b;
  const width=Math.max(2,String(Math.max(a,b,total)).length);
  const top=String(a).padStart(width," ").split("");
  const bottom=String(b).padStart(width," ").split("");
  const digits=String(total).padStart(width," ").split("");
  const notes=Array(width).fill("");
  const messages=[];
  const places=["eenheden","tientallen","honderdtallen","duizendtallen"];
  let transfer=0;
  for(let i=width-1;i>=0;i--){
    const step=width-i;
    const x=Number(top[i]),y=Number(bottom[i]);
    const raw=add?x+y+transfer:x-y-transfer;
    const next=add?Number(raw>=10):Number(raw<0);
    if(step<=visible&&i>0&&next)notes[i-1]=add?"+1":"−1";
    if(add){
      messages.push(places[step-1]+": "+x+" + "+y+(transfer?" + 1":"")+" = "+raw+
        (next?". Schrijf "+(raw%10)+" en neem 1 mee naar links.":"."));
    }else{
      const available=x-transfer;
      const first=transfer?x+" − 1 = "+available+". ":"";
      messages.push(places[step-1]+": "+first+(next?"Wissel één uit de kolom links voor 10. ":"")+
        (available+next*10)+" − "+y+" = "+(raw+next*10)+".");
    }
    transfer=next;
  }
  const row=(cells,label,classes)=>'<tr class="'+classes+'"><th scope="row">'+label+'</th>'+cells.map(cell=>'<td>'+escapeHTML(cell)+'</td>').join("")+'</tr>';
  const names=["E","T","H","D"].slice(0,width).reverse();
  const result=digits.map((digit,i)=>width-i<=visible?digit:"");
  return '<section class="column-calculation"><h3>Onder elkaar rekenen</h3><table aria-label="Cijferopstelling">'+
    '<thead><tr><td></td>'+names.map(name=>'<th scope="col">'+name+'</th>').join("")+'</tr></thead><tbody>'+
    row(notes,add?"Mee":"Wissel","transfer-row")+row(top,"","operand")+row(bottom,add?"+":"−","operand")+
    row(result,"=","result-row")+'</tbody></table>'+
    (interactive?'<p aria-live="polite">'+escapeHTML(visible?messages[Math.min(visible,width)-1]:"Zet de eenheden onder elkaar. Begin rechts.")+'</p>':'')+
    (interactive&&visible<width?'<button type="button" class="btn" data-action="show-column">'+(visible?"Volgende cijferkolom":"Reken de eenheden uit")+'</button>':'')+
    '</section>';
}


// Een korte begripsvraag tussen het voorgedane voorbeeld en de nieuwe werkbon.
const practiceChecks=[
 {types:"count stock", kit:"twaalf kleine materialen en twee bakjes", question:"Leg tien stuks bij elkaar en twee los. Hoeveel liggen er?",answer:"12 stuks. Eén groep van tien en twee losse.",repair:"Laat de leerling het tiental bijeenhouden en vanaf tien doortellen."},
 {types:"line diff sub refill need",kit:"twee bakjes, twaalf kleine materialen en een getallenlijn",question:"Je hebt 8 stuks. Op de bon staan 12 stuks. Hoeveel ontbreken er?",answer:"4 stuks. Van 8 naar 10 is 2, daarna nog 2.",repair:"Laat acht stuks liggen en vul één voor één aan tot twaalf. Tel wat erbij kwam."},
 {types:"add bridge",kit:"twee bakjes met 8 en 5 kleine materialen",question:"Er liggen 8 stuks en er komen 5 bij. Hoe maak je eerst tien?",answer:"Schuif er 2 bij. Van de 5 blijven er 3 over. Samen zijn het 13 stuks.",repair:"Schuif twee losse voorwerpen naar de acht. Wijs aan welke drie nog apart liggen."},
 {types:"multiply divide rest pack both",kit:"drie bakjes en dertien kleine materialen",question:"Je verdeelt 13 stuks over bakjes van 4. Hoeveel volle bakjes krijg je en wat blijft over?",answer:"3 volle bakjes en 1 los stuk.",repair:"Vul een bakje en stop bij vier. Zet volle bakjes apart en tel wat overblijft."},
 {types:"round estimate",kit:"een getallenlijn van 10 tot 30 en een knijper",question:"Zet de knijper bij 18. Welk tiental ligt het dichtstbij?",answer:"20. De afstand tot 20 is 2 en tot 10 is 8.",repair:"Laat de leerling beide afstanden op dezelfde getallenlijn aanwijzen."},
 {types:"decimalEqual decimalCompare decimalLimit",kit:"kaartjes met 1,2 en 1,05 en een getallenlijn",question:"Welk getal komt verder naar rechts op de getallenlijn: 1,2 of 1,05?",answer:"1,2. Dat is 1,20, dus twintig honderdsten boven één.",repair:"Zet eerst 1 en 1,1 op de lijn. Vraag aan welke kant van 1,1 elk kaartje hoort."},
 {types:"ruler",kit:"een rolmaat, een strook karton en een potlood",question:"Leg de strook bij nul. Wijs de streep bij 12 cm aan. Waar komt je potloodstreep?",answer:"Recht boven de maatstreep bij 12 cm, gemeten vanaf nul.",repair:"Laat de leerling eerst de nul tegen de rand leggen en daarna het eindpunt aanwijzen."},
 {types:"cm fit decimalCm cmCompare decimalFit",kit:"een rolmaat, twee stukjes tape en een meter vrije ruimte",question:"Op de bon staat 0,8 m. Wijs aan waar je de tape plakt.",answer:"Bij 80 cm. Dat is 20 cm vóór de meter.",repair:"Wijs eerst één meter aan. Laat de leerling voorspellen aan welke kant 0,8 meter ligt."},
 {types:"scale",kit:"een weegschaal en een voorwerp uit het lokaal",question:"Leg het voorwerp op de weegschaal. Schrijf het getal én de eenheid op.",answer:"Vergelijk ieders antwoord met wat er nu op het scherm staat. Getal en eenheid moeten overeenkomen.",repair:"Laat één leerling de eenheid aanwijzen en een tweede het getal aflezen."},
 {types:"gram massCompare massRefill",kit:"een weegschaal, een bakje en afweegmateriaal",question:"Je hebt een halve kilo nodig. Welke waarde wil je op een schaal in grammen zien?",answer:"500 g. Twee van deze porties zijn samen 1 kg.",repair:"Zet het lege bakje op nul. Weeg 500 g en bespreek hoe twee gelijke porties samen 1 kg vormen."}
];
const specificChecks={
 line:["Wijs 8 en 12 aan op de getallenlijn. Welk getal ligt verder naar rechts?","12 ligt rechts van 8.","Tel vanaf nul vooruit en volg de richting met je vinger."],
 sub:["Leg 12 stuks neer. Haal er 4 weg. Hoeveel houd je over?","8 stuks.","Leg de vier weggehaalde stuks apart en tel alleen wat achterblijft."],
 stock:["Er liggen 12 stuks. Je gebruikt er 4 en krijgt er 3 bij. Hoeveel heb je nu?","11 stuks. Eerst 8, daarna 11.","Voer beide handelingen na elkaar uit met twee bakjes."],
 multiply:["Leg drie groepjes van vier. Hoeveel stuks liggen er?","12 stuks. 3 × 4 = 12.","Wijs de drie groepen aan en tel 4, 8, 12."],
 divide:["Verdeel 12 stuks eerlijk over drie bakjes. Hoeveel zitten er in ieder bakje?","4 stuks per bakje.","Geef elk bakje steeds één stuk tot de voorraad op is."],
 decimalEqual:["Een collega schrijft 1,2 en een ander 1,20. Wijs beide getallen aan op dezelfde lijn.","Beide staan op dezelfde plek.","Verdeel één tiende in tien honderdsten."],
 decimalLimit:["De grens is 1,1. Welk kaartje past eronder: 1,2 of 1,05?","1,05 valt onder de grens van 1,10.","Zet de grens eerst op de getallenlijn."],
 massRefill:["Je hebt 500 g nodig. Er ligt al 350 g. Hoeveel moet erbij?","150 g. Vul 350 eerst aan tot 400 en daarna tot 500.","Laat de leerling het huidige gewicht en doelgewicht naast elkaar aanwijzen."],
 massCompare:["Wat is zwaarder: een halve kilo of 450 g?","Een halve kilo. Dat is 500 g.","Weeg beide hoeveelheden en vergelijk ze in grammen."],
 fit:["Er is 1 m ruimte. Je strook is 80 cm. Past hij? Wijs de vrije ruimte aan.","Ja. Er blijft 20 cm vrij.","Leg het begin van de strook bij nul en markeer het einde van de vrije plek."],
 decimalFit:["De beschikbare ruimte is 0,9 m. Past een strook van 85 cm?","Ja, met 5 cm ruimte.","Markeer eerst 90 cm op de rolmaat."],
 cmCompare:["Welke maat is langer: 0,8 m of 75 cm? Wijs beide aan.","0,8 m is 80 cm en dus 5 cm langer.","Leg twee stukjes tape op dezelfde rolmaat."]
};
function practiceCheck(lesson){
 const base=practiceChecks.find(c=>c.types.split(" ").includes(lesson.type));
 const override=specificChecks[lesson.type];
 if(!override)return base;
 const [question,answer,repair]=override;
 return {...base,question,answer,repair};
}
function checkBoard(check){
 return '<p class="lesson-question">'+escapeHTML(check.question)+'</p><p>Doe het eerst zelf. Laat op het teken van de docent tegelijk je antwoord zien.</p><details><summary>Bespreek de check</summary><p>'+escapeHTML(check.answer)+'</p><p>'+escapeHTML(check.repair)+'</p></details>';
}

const drillGoals={
 count:"een voorraad tellen in tientallen en losse stuks",line:"getallen op de juiste plek op een getallenlijn zetten",diff:"het verschil tussen twee aantallen uitrekenen",add:"twee aantallen bij elkaar optellen",bridge:"optellen via een heel tiental",sub:"uitrekenen hoeveel stuks overblijven",multiply:"het totaal van gelijke groepjes uitrekenen",divide:"een voorraad eerlijk verdelen",refill:"uitrekenen hoeveel stuks erbij moeten",need:"uitrekenen hoeveel materiaal nog nodig is",ruler:"een lengte vanaf nul aflezen in centimeters",cm:"meters en centimeters herkennen en een maat in centimeters geven",decimalCm:"een maat met een komma van meter naar centimeter omrekenen",fit:"met een rolmaat bepalen of een voorwerp past",decimalFit:"uitrekenen hoeveel ruimte overblijft",scale:"het gewicht op een weegschaal aflezen",gram:"kilogrammen omrekenen naar grammen",massCompare:"twee gewichten vergelijken",massRefill:"uitrekenen hoeveel gram erbij moet",round:"afronden op een tiental",estimate:"een totaal schatten en precies uitrekenen",decimalEqual:"uitleggen wanneer twee kommagetallen even groot zijn",decimalCompare:"twee kommagetallen vergelijken",decimalLimit:"bepalen welke maat binnen de grens valt",stock:"de voorraad na levering en gebruik berekenen",rest:"bepalen hoeveel stuks overblijven bij het verpakken",pack:"uitrekenen hoeveel verpakkingen nodig zijn",both:"volle verpakkingen en overgebleven stuks tellen",cmCompare:"lengtes in meters en centimeters vergelijken"
};
function drillItem(type,i){
 const n=i+1,a=12+7*n,b=3+n,k=10*n+7;
 const num=metricNumber;
 switch(type){
 case "count":return [n+" tientallen en "+b+" losse stuks. Hoeveel samen?",10*n+b];
 case "line":return ["Op de lijn: "+a+" — … — "+(a+2)+". Welk getal ontbreekt?",a+1];
 case "diff":return ["Wat is het verschil tussen "+a+" en "+b+"?",a-b];
 case "bridge":return [k+" + "+b+" = …",k+b];
 case "add":return [a+" + "+b+" = …",a+b];
 case "sub":return [a+" − "+b+" = …",a-b];
 case "multiply":return [b+" bakken met elk "+n+" stuks. Hoeveel samen?",b*n];
 case "divide":return [b*n+" stuks verdeeld over "+b+" bakken. Hoeveel per bak?",n];
 case "refill":case "need":return ["Nodig: "+a+" stuks. Aanwezig: "+b+". Hoeveel erbij?",a-b];
 case "stock":return [a+" op voorraad, "+b+" erbij, "+n+" gebruikt. Hoeveel over?",a+b-n];
 case "rest":case "both":case "pack":{
 const total=b*n+1;
 return type==="pack"?[total+" stuks, "+b+" per doos. Hoeveel dozen voor alles?",n+1]:[total+" stuks, "+b+" per doos. Hoeveel vol en hoeveel los?",n+" vol en 1 los"];}
 case "round":return ["Rond "+a+" af op een tiental.",Math.round(a/10)*10];
 case "estimate":return ["Schat "+a+" + "+(b+13)+" met tientallen. Reken dan precies.",(Math.round(a/10)+Math.round((b+13)/10))*10+" geschat · "+(a+b+13)+" precies"];
 case "decimalEqual":return [num(n/10)+" en 0,"+n+(i%2?"5":"0")+". Even groot?",i%2?"Nee":"Ja"];
 case "decimalCompare":case "decimalLimit":return type==="decimalLimit"?["Grens "+num(n+0.5)+" m. Past "+num(n+(i%2?0.6:0.45))+" m?",i%2?"Nee":"Ja"]:["Welke is groter: "+num(n+0.09)+" of "+num(n+0.1)+"?",num(n+0.1)];
 case "cm":case "decimalCm":return [num(a/100)+" m = … cm",a+" cm"];
 case "cmCompare":return ["Welke is langer: "+num(a/100)+" m of "+(a+(i%2?-3:3))+" cm?",i%2?num(a/100)+" m":a+3+" cm"];
 case "fit":case "decimalFit":return ["Ruimte "+num(a/100)+" m. Materiaal "+(a+(i%2?b:-b))+" cm. Past het?",i%2?b+" cm tekort":b+" cm vrij"];
 case "gram":return [num(n/4)+" kg = … g",n*250+" g"];
 case "massRefill":return ["Doel 1 kg. Al afgewogen: "+n*125+" g. Hoeveel erbij?",1000-n*125+" g"];
 case "massCompare":return ["Wat is zwaarder: "+num(n/4)+" kg of "+(n*250+(i%2?-25:25))+" g?",i%2?num(n/4)+" kg":n*250+25+" g"];
 case "scale":return ["Lees het scherm: <samp>"+a*5+' g</samp>. Welk gewicht noteer je?',a*5+" g"];
 case "ruler":{
 const ticks=Array.from({length:11},(_,j)=>'<path d="M'+(8+18*j)+' 15v8"/><text x="'+(8+18*j)+'" y="34">'+j+'</text>').join('');
 return ['Lees de blauwe strook af. <svg class="mini-tape" viewBox="0 0 200 37" role="img" aria-label="Strook op een centimeterliniaal"><rect x="8" y="4" width="'+18*b+'" height="9" fill="#147684"/>'+ticks+'</svg>',b+" cm"];}
 }
}
function extraPractice(deck){
 const items=Array.from({length:5},(_,i)=>{
   if(!deck.metric)return drillItem(deck.lesson.type,i);
   const [,row,from,to]=metricItem(deck.metric.week,deck.metric.day);
   const values=state.year===2?[0.25,1.5,0.75,2.4,3.05]:[1,2,5,0.5,1.25];
   const value=values[i]*(metricRows[row][1].split(" ").indexOf(from)>metricRows[row][1].split(" ").indexOf(to)?measureRoute(row,to,from,1).factor**measureRoute(row,to,from,1).count:1);
   return [metricNumber(value)+" "+from+" = … "+to,measureRoute(row,from,to,value).values.at(-1)+" "+to];
 });
 return '<article class="drill-board"><h2>Nog even oefenen?</h2><p>Kies samen één of meer sommen. Je kunt hier ook afronden.</p><div class="practice-context-visual">'+(deck.metric?metricMaterialPhoto(deck):regularMaterialPhoto(deck))+'</div><ol>'+items.map(([q,a])=>'<li><span>'+q+'</span><details><summary>Antwoord</summary><strong>'+a+'</strong></details></li>').join("")+'</ol></article>';
}
