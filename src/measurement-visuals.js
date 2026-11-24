const measurementPhotos=/* MEASUREMENT_PHOTOS */{};
const measurementPhotoLabels={
 groen:{length:'Een opsluitband meten bij straatwerk',mass:'Voer afwegen in de dierenverzorging',volume:'Water afmeten voor de gieter'},
 techniek:{length:'Een montagelat meten in de werkplaats',mass:'Moeren wegen in de autogarage',volume:'Schoon water afmeten in de werkplaats'},
 hbr:{length:'Een buffettafel meten in het restaurant',mass:'Meel afwegen in de bakkerij',volume:'Melk afmeten in de keuken'},
 zw:{length:'Een plank meten in de linnenkamer',mass:'Havermout afwegen voor het ontbijt',volume:'Een waterkan klaarzetten voor bewoners'},
 eco:{length:'Een winkelschap meten',mass:'Een pakket wegen in het magazijn',volume:'Water afmeten voor een winkeldemonstratie'}
};
function sectorMeasurementPhoto(sector,group){
 const kind=group==='cube'?'volume':group==='area'?'length':group;
 const label=measurementPhotoLabels[sector]?.[kind];
 if(!label)return '';
 const src=measurementPhotos[sector+'-'+kind]||instrumentPhotos[kind]||'';
 return '<figure class="sector-measure-photo" data-photo-sector="'+sector+'" data-photo-kind="'+kind+'"><img src="'+src+'" alt="'+escapeHTML(label)+'" width="416" height="252"><figcaption>'+escapeHTML(label)+' · AI-foto</figcaption></figure>';
}
function taskPhoto(key,label,sector){
 return '<figure class="sector-measure-photo task-photo" data-task-photo-key="'+escapeHTML(key)+'" data-photo-sector="'+escapeHTML(sector)+'"><img src="'+measurementPhotos[key]+'" alt="'+escapeHTML(label)+'" loading="lazy"><figcaption>'+escapeHTML(label)+' · AI-foto</figcaption></figure>';
}
const floorNames={eco:'De winkelvloer',zw:'De vloer van de linnenkamer',hbr:'De keukenvloer',groen:'Het terras met opsluitbanden',techniek:'De werkplaatsvloer'};
const surfaceNames={eco:'Het reclamebord',zw:'De kastplank',hbr:'Het tafelblad',groen:'Het plantvak',techniek:'Het werkblad'};
const boxNames={eco:'De demonstratiebak',zw:'De afwasbak',hbr:'De voorraadbak',groen:'De waterbak',techniek:'De bak voor schoon water'};
function metricMaterialPhoto(deck){return variedWorkPhoto(metricMaterialPhotoBase(deck),deck);}
function metricMaterialPhotoBase(deck){
 const record=metricPhotoRecord(deck);
 if(record)return lessonBankPhoto(record.id,deck.sector);
 const row=lessonMeasure(deck).row,sector=deck.sector;
 if(row==='area')return taskPhoto(sector+'-surface',surfaceNames[sector],sector);
 if(row==='cube')return taskPhoto(sector+'-box',boxNames[sector],sector);
 return sectorMeasurementPhoto(sector,row);
}
function metricPhotoRecord(deck){
 if(!deck.metric)return null;
 const {week,day}=deck.metric;
 if(week===1&&day===0&&deck.sector==='groen')return lessonPhotoBank.find(p=>p.sector==='groen'&&p.kind==='scaleLength')||null;
 const kinds=[['readTape','readRuler','markLength'],['cm','decimalCm','readTape'],['gram','massCompare','readDigital'],['convertVolume','volumeCompare','volumeRefill'],['readTape','gram','volumeCompare'],['smallConvert','massRefill','volumeFit'],['cmCompare',null,null],[null,'readJug',null]];
 const kind=kinds[week]?.[day];
 return kind?lessonPhotoBank.find(p=>p.kind===kind&&p.sector===deck.sector&&p.batch==='meten-ruimte-300')||null:null;
}
function measurementVisual(model,{compact=false,zoom=true}={}){
 if(!model)return '';
 const h=escapeHTML,n=v=>Number(v.toFixed(5)).toLocaleString('nl-NL');
 const text=(x,y,value,extra='')=>'<text x="'+x+'" y="'+y+'" '+extra+'>'+h(value)+'</text>';
 let content='',label='',caption='',width=780,height=390,origin=0;
 if(model.kind==='measureDigital'){
  label="Digitale weegschaal. Het scherm toont "+n(model.value)+' '+model.unit+'.';caption='Lees de cijfers én de eenheid. Controleer of het lege bakje is meegerekend.';
  content='<defs><linearGradient id="scale-steel" x2="0" y2="1"><stop stop-color="#dce4e8"/><stop offset="1" stop-color="#aebdc4"/></linearGradient></defs><ellipse cx="390" cy="96" rx="251" ry="34" fill="#dce4e8" stroke="#7b9098" stroke-width="4"/><path d="M140 103H640L686 309Q688 337 657 337H123Q92 337 94 309Z" fill="url(#scale-steel)" stroke="#637d87" stroke-width="4"/><rect x="160" y="166" width="460" height="116" rx="10" fill="#223f3d" stroke="#526662" stroke-width="5"/>'+text(555,249,n(model.value),'text-anchor="end" fill="#e2ffd9" font-size="91" font-weight="700"')+text(574,249,model.unit,'fill="#e2ffd9" font-size="34"')+'<circle cx="214" cy="308" r="15" fill="#617783"/>'+text(249,316,'TARRA / NUL','fill="#213e49" font-size="22" font-weight="700"');
 }else if(model.kind==='measureDial'){
  origin=150;width=480;height=410;
  label='Analoge weegschaal van 0 tot '+model.max+' '+model.unit+'. Lees de naald af.';caption="Tel de stapjes tussen twee getallen. De rode naald geeft het gewicht aan.";
  const cx=390,cy=208,r=163,point=(value,rad)=>{const angle=(-140+280*value/model.max)*Math.PI/180;return [cx+Math.sin(angle)*rad,cy-Math.cos(angle)*rad];};
  content='<circle cx="390" cy="208" r="183" fill="#edf1f1" stroke="#617883" stroke-width="6"/><circle cx="390" cy="208" r="168" fill="#fff"/>';
  for(let value=0;value<=model.max;value+=model.minor){const major=value%model.major===0,a=point(value,r),b=point(value,major?r-24:r-12),p=point(value,r-48);content+='<path d="M'+a.join(' ')+'L'+b.join(' ')+'" stroke="#273d4c" stroke-width="'+(major?4:2)+'"/>'+(major?text(p[0],p[1]+7,n(value),'font-size="24" text-anchor="middle" font-weight="700"'):'');}
  const end=point(model.value,140);content+='<path d="M390 208L'+end.join(' ')+'" stroke="#c51f43" stroke-width="6" stroke-linecap="round"/><circle cx="390" cy="208" r="13" fill="#c51f43"/>'+text(390,305,model.unit,'text-anchor="middle" font-size="36" font-weight="700"');
 }else if(model.kind==='measureJug'){
  label='Maatbeker van 0 tot '+model.max+' '+model.unit+". Lees de streep bij de inhoud af.";caption="Kijk op ooghoogte naar de inhoud. Lees de streep af.";
  const top=40,bottom=335,x=215,w=270,y=value=>bottom-(value/model.max)*(bottom-top);
  content='<path d="M485 78H568Q604 78 601 123L589 235Q586 267 481 267" fill="none" stroke="#7993a2" stroke-width="13"/><path d="M196 30H502L480 350H228Z" fill="#f2fafc" stroke="#637e8c" stroke-width="4"/><path d="M'+x+' '+y(model.value)+'H495L478 335H229Z" fill="#76bddc" fill-opacity=".7"/><path d="M'+x+' '+y(model.value)+'H495" stroke="#075e80" stroke-width="5"/>';
  for(let value=0;value<=model.max;value+=model.minor){const major=value%model.major===0,py=y(value);content+='<path d="M'+(major?398:423)+' '+py+'H470" stroke="#233b4c" stroke-width="'+(major?3:2)+'"/>'+(major?text(380,py+7,n(value),'text-anchor="end" font-size="26" font-weight="700"'):'');}
  content+=text(320,28,model.unit,'text-anchor="middle" font-size="25" font-weight="700"')+'<path d="M505 '+y(model.value)+'H650" stroke="#075e80" stroke-dasharray="8 6" stroke-width="2"/>'+text(657,y(model.value)+8,'ooghoogte','font-size="22" fill="#075e80"');
 }else if(model.kind==='measureRuler'){
  height=300;label='Meetlat in '+model.unit+', van '+model.start+' tot '+model.max+'.';caption=model.objectStart?'Lees het beginpunt en het eindpunt. De lengte is het verschil.':'Begin bij de nulstreep. Kijk recht boven het einde van het voorwerp.';
  const left=45,span=690,x=value=>left+(value-model.start)/(model.max-model.start)*span;
  content='<rect x="25" y="110" width="730" height="125" rx="10" fill="#ffefb8" stroke="#b99a4a" stroke-width="3"/>';
  const count=Math.round((model.max-model.start)/model.minor);
  for(let i=0;i<=count;i++){const value=model.start+i*model.minor,major=Math.abs(value/model.major-Math.round(value/model.major))<.00001,mid=!major&&Math.abs(value/(model.major/2)-Math.round(value/(model.major/2)))<.00001;content+='<path d="M'+x(value)+' 111v'+(major?48:mid?33:20)+'" stroke="#303a42" stroke-width="'+(major?2.5:1)+'"/>'+(major?text(x(value),193,n(value),'text-anchor="middle" font-size="24" font-weight="700"'):'');}
  if(model.objectEnd!=null){content+='<rect x="'+x(model.objectStart||0)+'" y="61" width="'+(x(model.objectEnd)-x(model.objectStart||0))+'" height="35" fill="#0c7187" rx="3"/>';for(const value of [model.objectStart||0,model.objectEnd])content+='<path d="M'+x(value)+' 54V112" stroke="#9f2041" stroke-width="3" stroke-dasharray="6 4"/>';}
  content+=text(723,225,model.unit,'text-anchor="end" font-size="25" font-weight="700"');
 }else if(model.kind==='measureArea'){
  label='Rechthoek met lengte '+n(model.length)+' '+model.unit+' en breedte 1 '+model.unit+'.';caption='Meet het hele vlak: lengte × breedte. Gebruik vierkante eenheden. Gebruik de maten bij de tekening.';
  const w=540,hh=Math.min(235,235/Math.max(model.length,1));
  content='<rect x="130" y="85" width="'+w+'" height="'+hh+'" fill="#dcefe3" stroke="#416c56" stroke-width="4"/>'+text(400,58,n(model.length)+' '+model.unit,'text-anchor="middle" font-size="33" font-weight="700"')+text(110,100+hh/2,'1 '+model.unit,'text-anchor="end" font-size="29" font-weight="700"')+text(400,hh+139,'lengte × breedte','text-anchor="middle" font-size="27"');
 }else if(model.kind==='measureFloor'){
  label='Bovenaanzicht van een rechthoek van '+model.length+' bij '+model.width+' meter.';caption=model.edge?'De rode lijn volgt alle vier de randen. Je zoekt meters randmateriaal.':"Elk vak is 1 m bij 1 m. Je zoekt vierkante meters materiaal.";
  const left=110,top=80,w=540,hh=230,cellw=w/model.length,cellh=hh/model.width;
  content='<rect x="110" y="80" width="540" height="230" fill="#e1f1e6" stroke="'+(model.edge?'#bb2341':'#426652')+'" stroke-width="'+(model.edge?8:3)+'"/>';
  for(let i=1;i<model.length;i++)content+='<path d="M'+(left+i*cellw)+' 80V310" stroke="#7f9e8b" stroke-width="2"/>';
  for(let i=1;i<model.width;i++)content+='<path d="M110 '+(top+i*cellh)+'H650" stroke="#7f9e8b" stroke-width="2"/>';
  content+=text(380,51,model.length+' m','text-anchor="middle" font-size="33" font-weight="700"')+text(83,205,model.width+' m','text-anchor="end" font-size="29" font-weight="700"')+text(380,356,'1 vak = 1 m²','text-anchor="middle" font-size="27"');
 }else if(model.kind==='measureBox'){
  label='Rechthoekige open bak. Binnenlengte '+model.length+' cm, binnenbreedte '+model.width+' cm en binnenhoogte '+model.height+' cm.';caption='Gebruik de binnenmaten. Lengte × breedte × hoogte geeft cm³. 1.000 cm³ = 1 liter.';
  content='<path d="M150 130L310 55H670L510 130Z" fill="#e1eef2" fill-opacity=".5" stroke="#456578" stroke-width="3"/><path d="M150 130H510V310H150Z" fill="#97cbe0" fill-opacity=".65" stroke="#456578" stroke-width="3"/><path d="M510 130L670 55V235L510 310Z" fill="#77b3ce" fill-opacity=".65" stroke="#456578" stroke-width="3"/><path d="M150 310L310 235H670M310 235V55" stroke="#456578" stroke-width="2" stroke-dasharray="8 5" fill="none"/>'+text(330,355,'lengte '+model.length+' cm','text-anchor="middle" font-size="30" font-weight="700"')+text(589,287,'breedte '+model.width+' cm','font-size="24" font-weight="700"')+text(133,225,model.height+' cm','text-anchor="end" font-size="28" font-weight="700"')+text(390,28,'BINNENMATEN','text-anchor="middle" font-size="21" letter-spacing="2"');
 }else if(model.kind==='measureThermometer'){
  origin=225;width=300;
  label='Thermometer in graden Celsius.';caption="Lees de temperatuur bij de bovenkant van de rode streep.";
  const bottom=335,top=35,y=value=>bottom-value/model.max*(bottom-top);
  content='<path d="M310 35V327" stroke="#dbe2e5" stroke-width="36" stroke-linecap="round"/><path d="M310 330V'+y(model.value)+'" stroke="#bf2341" stroke-width="21"/><circle cx="310" cy="334" r="30" fill="#bf2341"/>';
  for(let value=0;value<=model.max;value++){const major=value%5===0;content+='<path d="M338 '+y(value)+'h'+(major?35:17)+'" stroke="#344650" stroke-width="2"/>'+(major?text(391,y(value)+8,value+' °C','font-size="27" font-weight="700"'):'');}
 }else return '';
 const button=zoom?'<button type="button" class="btn measure-zoom" data-measure-zoom="'+h(JSON.stringify(model))+'">Vergroot het meetbeeld</button>':'';
 return '<figure class="measure-diagram'+(compact?' compact':'')+'" data-measure-kind="'+model.kind+'"><svg viewBox="'+origin+' 0 '+width+' '+height+'" role="img" aria-label="'+h(label)+'" font-family="system-ui,sans-serif" fill="#253b47">'+content+'</svg><figcaption>'+h(caption)+'</figcaption>'+button+'</figure>';
}
function legacyMeasureModel(visual){
 if(visual?.type==='scale'){const match=String(visual.grams).match(/[\d.,]+/);return match?{kind:'measureDigital',value:Number(match[0].replaceAll('.','').replace(',','.')),unit:'g'}:null;}
 if(visual?.type==='ruler')return {kind:'measureRuler',start:0,max:visual.end,minor:1,major:5,unit:'cm',objectStart:0,objectEnd:visual.length};
 return null;
}
function measurementGroupForType(type){return /gram|mass|Mass|^scale$|Digital|Dial|tare|fillMass/.test(type)?'mass':/jug|Jug|Volume|volume/.test(type)?'volume':/cube|boxLitres/.test(type)?'cube':/area|Area|perimeter|coverage|borderOrSurface/.test(type)?'area':'length';}
function measurementTaskModel(task){
 const m=task.model;
 if(m?.kind?.startsWith('measure'))return m;
 if(m?.kind==='jug')return {kind:'measureJug',value:m.amount,max:m.capacity,minor:m.step,major:m.capacity/4,unit:'ml'};
 if(m?.kind==='thermometer')return {kind:'measureThermometer',value:m.value,max:m.max,unit:'°C'};
 return legacyMeasureModel(task.visual);
}
function measurementEvidence(task,photo,rendered){
 const model=measurementTaskModel(task);
 return model?'<div class="measure-focus">'+measurementVisual(model)+photo+'</div>':photo+rendered;
}
document.addEventListener('click',event=>{
 const button=event.target.closest('button[data-measure-zoom]');
 if(!button||!button.dataset.measureZoom)return;
 let model;try{model=JSON.parse(button.dataset.measureZoom);}catch{return;}
 const picture=measurementVisual(model,{zoom:false});if(!picture)return;
 $('details').setAttribute('aria-label','Vergroot meetbeeld');
 $('details-body').innerHTML='<div class="detail-head"><h2>Bekijk het meetinstrument</h2><button type="button" class="btn" data-action="close-details">Sluiten</button></div><div class="measure-enlarged">'+picture+'</div>';
 if(!$('details').open)$('details').showModal();
});
