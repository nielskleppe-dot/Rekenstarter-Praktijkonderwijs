const num=n=>Number(n.toFixed(4)).toLocaleString('nl-NL');
const f=(label,value)=>({label,value:String(value)});
export const measurementKinds=[
 ['readRuler','Een liniaal aflezen','meten',7,'ma'],
 ['readTape','Een rolmaat aflezen','meten',7,'di'],
 ['offsetRuler','Meten vanaf een ander beginpunt','meten',7,'do'],
 ['markLength','Een maat nauwkeurig aftekenen','meten',10,'ma'],
 ['readDigital','Een digitale weegschaal aflezen','meten',8,'ma'],
 ['readDial','Een analoge weegschaal aflezen','meten',8,'di'],
 ['tareScale','Wegen met een bakje: tarra','meten',8,'do'],
 ['fillMass','Afwegen tot het doelgewicht','meten',12,'di'],
 ['readJug','Een maatbeker op ooghoogte aflezen','meten',9,'ma'],
 ['jugIntervals','Kleine maatstreepjes aflezen','meten',9,'di'],
 ['borderOrSurface','Een rand meten of een vlak bedekken','ruimte',29,'ma'],
 ['boxLitres','Hoeveel liter past in een bak?','ruimte',30,'do']
];
const settings={
 groen:{role:'medewerker groen en dierverzorging',place:'een hoveniersbedrijf en dierenverzorging',length:"Je legt een tuin aan. Meet een opsluitband en teken de maat op de bon af voordat je het materiaal bestelt.",mass:'Je verzorgt de dieren. Weeg de brokjes in een voerbakje af voordat je de voerporties klaarzet.',volume:'Je werkt bij een kwekerij. Meet schoon water af voor de gieter voordat je de planten water geeft.',area:'Je legt een rechthoekig terras aan. Je bestelt materiaal voor de rand of voor het hele vlak.',cube:'Je controleert hoeveel water er in een rechthoekige waterbak voor de kwekerij past.',materials:['een opsluitband','de voerbrokjes','het water voor de gieter']},
 techniek:{role:'werkplaatsmedewerker',place:'een garage en werkplaats',length:'Je werkt in de werkplaats. Meet een montagelat voordat je die op maat maakt.',mass:'Je werkt in een autogarage. Je weegt moeren in een bakje om de materiaalvoorraad te controleren.',volume:'Je werkt in een autogarage. Meet schoon water af in een maatkan voor een werkplaatsklus.',area:'Je werkt in de werkplaats. Je controleert een rechthoekig werkvlak en de rand eromheen.',cube:'Je controleert de inhoud van een rechthoekige bak voor schoon water in de werkplaats.',materials:['de montagelat','de moeren','het schone water']},
 hbr:{role:'keuken- en horecamedewerker',place:'een professionele keuken',length:'Je werkt in een restaurant. Meet de buffettafel voordat je het materiaal op maat klaarzet.',mass:'Je werkt in de bakkerij. Weeg het meel in de mengkom af voordat je het deeg maakt.',volume:'Je werkt in de keuken. Meet melk af in een maatbeker voor de bereiding.',area:"Je richt een rechthoekig buffetvlak in. Je controleert de rand en het materiaal voor het hele vlak.",cube:'Je controleert hoeveel liter er in een rechthoekige voorraadbak voor de keuken past.',materials:['de buffettafel','het meel','de melk']},
 zw:{role:'medewerker van een woonzorgcentrum',place:'een woonzorgcentrum',length:'Je werkt in de linnenkamer van een woonzorgcentrum. Meet de plank voor de schone handdoeken voordat je de linnenkast indeelt.',mass:'Je werkt in de keuken van een woonzorgcentrum. Weeg de havermout in een kom af voor het ontbijt van de bewoners.',volume:'Je werkt in een woonzorgcentrum. Meet drinkwater af voor de waterkan die je voor de bewoners klaarzet.',area:'Je helpt de huiskamer van een woonzorgcentrum inrichten. Je meet de rechthoekige vloer en de rand eromheen.',cube:'Je controleert hoeveel water er in een rechthoekige afwasbak in de keuken van het woonzorgcentrum past.',materials:['de plank voor handdoeken','de havermout','het drinkwater']},
 eco:{role:'winkel- en magazijnmedewerker',place:'een winkel met een magazijn',length:'Je werkt in een winkel. Meet het winkelschap voordat je de nieuwe vakverdeling klaarzet.',mass:'Je werkt in het magazijn. Weeg een pakket op de pakketweegschaal om het juiste gewicht te noteren.',volume:'Je werkt in de winkel. Meet schoon water af voor een demonstratie met navulflessen.',area:'Je richt een rechthoekig winkelvlak in. Je controleert hoeveel randmateriaal en vloerbedekking nodig is.',cube:'Je controleert hoeveel liter water in een rechthoekige demonstratiebak voor het winkeldisplay past.',materials:['het winkelschap','het pakket','het water voor de demonstratie']}
};
export function measurementGroup(kind){
 if(/borderOrSurface|area|perimeter|coverage|formula|edge|Sides/i.test(kind))return 'area';
 if(kind==='boxLitres')return 'cube';
 if(/readJug|jugIntervals|Volume|volume|jug/.test(kind))return 'volume';
 if(/readDigital|readDial|tareScale|fillMass|mass|Mass|gram|^scale$/.test(kind))return 'mass';
 return 'length';
}
export function measurementContext(kind,sector){
 const group=measurementGroup(kind),s=settings[sector];
 let context=s[group];
 if(/^(ruler|readRuler|offsetRuler|smallConvert|smallCompare|smallDifference)$/.test(kind))context={
  groen:"Je werkt als hovenier. Controleer een kleine maat van het materiaal, zoals de breedte van een opsluitband, met een liniaal.",
  techniek:'Je werkt in de werkplaats. Controleer de breedte van een klein houten onderdeel met een liniaal.',
  hbr:'Je werkt in een restaurant. Controleer met een liniaal de maat van een klein onderdeel voor de buffettafel.',
  zw:'Je werkt in de linnenkamer van een woonzorgcentrum. Controleer met een liniaal een klein onderdeel voor de vakindeling.',
  eco:'Je werkt in een winkel. Controleer met een liniaal een onderdeel van de schapverdeler.'
 }[sector];
 if(sector==='eco'&&kind==='fillMass')context='Je stelt in het magazijn een proefpakket met een afgesproken gewicht aan artikelen samen. De lege doos is op nul gezet. Vul het pakket aan tot het doelgewicht.';
 if(kind==='tareScale')context+=" Het scherm toont de inhoud en de lege verpakking samen.";
 return {role:s.role,place:s.place,material:s.materials[{length:0,mass:1,volume:2,cube:2,area:0}[group]],
  context,photoKey:group==='area'?null:group==='cube'?'volume':group,measurementGroup:group};
}
export function measurementTask(kind,index,year){
 const i=index%8,advanced=year===2;
 const t=(question,facts,steps,answer,hint,model,result)=>({question,facts,steps,answer,hint,model,result,visual:null,explain:'Noteer de eenheid. Laat op het meetbeeld zien hoe je het antwoord controleert.'});
 if(['readRuler','readTape','offsetRuler','markLength'].includes(kind)){
  const value=kind==='readTape'?125+i*5:kind==='markLength'?60+i*10:8+i+(advanced?.4:0);
  const start=kind==='offsetRuler'?3:0,end=start+value;
  const model={kind:'measureRuler',start:0,max:kind==='readTape'||kind==='markLength'?200:20,minor:kind==='readTape'||kind==='markLength'?1:.1,major:kind==='readTape'||kind==='markLength'?20:1,unit:'cm',objectStart:start,objectEnd:kind==='markLength'?null:end};
  if(kind==='markLength')return t("Bij welke centimeterstreep teken je de maat op de bon af?",[f('Werkbon',num(value/100)+' m')],['1 m = 100 cm.',num(value/100)+' × 100 = '+value,'Meet vanaf 0 en zet de markering bij '+value+' cm.'],value+' cm','Zet meters eerst om naar centimeters. Begin bij de nulstreep.',model,value);
  if(kind==='offsetRuler')return t('Het voorwerp begint niet bij nul. Hoe lang is het? Geef je antwoord in cm.',[],['Beginpunt: '+start+' cm. Eindpunt: '+num(end)+' cm.',num(end)+' − '+start+' = '+num(value),'De lengte is '+num(value)+' cm.'],num(value)+' cm','Lees beide uiteinden af. Trek het beginpunt van het eindpunt af.',model,value);
  return t('Hoe lang is het voorwerp? Lees af in centimeters.',[],['Het begin ligt bij 0 cm.','Lees het streepje bij het rechteruiteinde: '+num(value)+' cm.'],num(value)+' cm','Wijs de nulstreep en het eindpunt aan. Tussen twee centimeterstrepen zitten tien millimeters.',model,value);
 }
 if(['readDigital','readDial','tareScale','fillMass'].includes(kind)){
  const value=kind==='readDial'?350+i*(advanced?75:50):kind==='fillMass'?150+i*50:375+i*50;
  const minor=advanced?25:50;
  const model={kind:kind==='readDial'?'measureDial':'measureDigital',value,unit:'g',max:1000,minor,major:250};
  if(kind==='readDial')return t('Hoeveel gram wijst de naald aan?',[],['Van 0 tot 250 g tel je '+(250/minor)+" gelijke stapjes.",'250 ÷ '+(250/minor)+' = '+minor,'Tel vanaf de dichtstbijzijnde grote streep door: '+value+' g.'],value+' g',"Tel de ruimtes tussen de streepjes. Elk klein stapje is "+minor+' g.',model,value);
  if(kind==='tareScale'){
   const empty=75+i*25,gross=value+empty;model.value=gross;
   return t('Het bakje staat op de weegschaal. Het scherm telt het bakje mee. Hoeveel gram weegt alleen de inhoud?',[f('Leeg bakje',empty+' g')],["Het scherm toont het bakje en de inhoud samen.",gross+' − '+empty+' = '+value,'De inhoud weegt '+value+' g. Zet de volgende keer eerst het lege bakje op de schaal en druk op tarra.'],value+' g inhoud',"Trek het gewicht van het lege bakje af van het gewicht op het scherm.",model,value);
  }
  if(kind==='fillMass'){
   const target=500+i*100;return t('Hoeveel gram moet je toevoegen om het doelgewicht te bereiken?',[f('Doel',num(target/1000)+' kg')],['Zet het doel om: '+num(target/1000)+' kg = '+target+' g.',target+' − '+value+' = '+(target-value),'Voeg '+(target-value)+" g toe en controleer het scherm."],(target-value)+' g toevoegen','Reken eerst het doel om naar gram. Trek daarna het afgewogen gewicht af.',model,target-value);
  }
  return t("Welk gewicht noteer je op de werkbon? Lees het scherm en schrijf de eenheid erbij.",[],['Lees de cijfers: '+value+'.','De eenheid op de weegschaal is g.','Noteer '+value+' g.'],value+' g','Lees eerst de eenheid naast de cijfers.',model,value);
 }
 if(kind==='readJug'||kind==='jugIntervals'){
  const value=(kind==='readJug'?350:375)+i*50,minor=kind==='readJug'?50:25;
  return t("Hoeveel milliliter zit er in de maatbeker? Kijk op ooghoogte.",[],['Tussen 250 en 500 ml zitten '+(250/minor)+" gelijke stapjes.",'250 ÷ '+(250/minor)+' = '+minor,"Lees de blauwe lijn: "+value+' ml.'],value+' ml',"Kijk recht tegen de maatbeker. Hoeveel is één stapje?",{kind:'measureJug',value,max:1000,minor,major:250,unit:'ml'},value);
 }
 if(kind==='borderOrSurface'){
  const length=4+i%4,width=2+i%3,edge=i%2===0,result=edge?2*(length+width):length*width;
  return t(edge?'Je plaatst materiaal langs alle vier de randen. Hoeveel meter is nodig?':'Je bedekt het hele rechthoekige vlak. Hoeveel vierkante meter is nodig?',[f('Lengte',length+' m'),f('Breedte',width+' m')],edge?['Wijs alle vier de randen aan.',length+' + '+width+' + '+length+' + '+width+' = '+result,'Bestel '+result+' m randmateriaal.']:['Wijs het hele vlak aan.',length+' × '+width+' = '+result,'Er is '+result+" m² materiaal nodig."],result+(edge?' m randmateriaal':" m² materiaal"),'Een rand meet je in m. Een vlak meet je in m².',{kind:'measureFloor',length,width,edge},result);
 }
 if(kind==='boxLitres'){
  const length=20+i*10,width=10,height=10,cm3=length*width*height,litres=cm3/1000;
  return t('Dit zijn de binnenmaten van een rechthoekige bak. Hoeveel liter past erin tot de bovenrand?',[f('Lengte',length+' cm'),f('Breedte',width+' cm'),f('Hoogte',height+' cm')],['Reken de inhoud met de drie binnenmaten.',length+' × '+width+' × '+height+' = '+num(cm3),num(cm3)+' cm³ ÷ 1.000 = '+num(litres)+' l'],num(litres)+' liter','Lengte × breedte × hoogte geeft cm³. 1.000 cm³ is 1 liter.',{kind:'measureBox',length,width,height},litres);
 }
 throw Error('Unknown measurement lesson '+kind);
}
export function measurementEntries(year){
 return measurementKinds.map(([kind,title,domain,week,day])=>{
  const example=measurementTask(kind,0,year),exercise=measurementTask(kind,1,year);
  return {id:'pro'+(year+2)+'-'+kind,year,week,day,phase:'Extra instructie',domain,kind,title,theme:'Nauwkeurig meten in je werk',
   goal:title+'.',studentGoal:'Ik kan '+({readRuler:'een liniaal nauwkeurig aflezen',readTape:'een rolmaat in centimeters aflezen',offsetRuler:'een lengte bepalen als het voorwerp niet bij nul begint',markLength:'een maat in meters omzetten en in centimeters aftekenen',readDigital:'een digitaal gewicht met de juiste eenheid noteren',readDial:'een analoge weegschaal met kleine streepjes aflezen',tareScale:'het gewicht van een bakje van het totale gewicht aftrekken',fillMass:'berekenen hoeveel gram ik nog moet toevoegen',readJug:'een maatbeker op ooghoogte aflezen',jugIntervals:'de waarde van kleine maatstreepjes bepalen',borderOrSurface:'kiezen tussen omtrek en oppervlakte en de maat berekenen',boxLitres:'met de binnenmaten berekenen hoeveel liter in een bak past'}[kind])+'.',
   strategy:{method:"Lees de eenheid. Wijs het beginpunt aan. Bepaal de waarde van één stapje of één vak. Lees nauwkeurig af of reken de maat op de bon uit. Controleer met het meetbeeld.",mistake:"Een leerling telt streepjes in plaats van stapjes, begint niet bij nul of vergeet de eenheid.",followup:kind==='boxLitres'?'Welke drie binnenmaten gebruik je en hoeveel cm³ is één liter?':kind==='borderOrSurface'?'Wijs aan wat je meet: de rand of het hele vlak. Welke eenheid hoort daarbij?':/Digital|tare|Mass/.test(kind)?"Welke eenheid staat op het scherm en wat weeg je mee?":'Hoeveel is één kleine stap? Wijs aan hoe je dat weet.',transfer:'Laat de leerling dezelfde handeling uitvoeren met een echt meetinstrument en de maat met eenheid noteren op een werkbon.'},
   prerequisites:'Herken nul en de eenheid. Begin zo nodig met hele centimeters, 100 gram of 100 milliliter.',example,exercise,practice:Array.from({length:5},(_,i)=>measurementTask(kind,i+2,year)),
   challenge:{question:'Controleer je antwoord op een tweede manier. Laat zien welke maat of berekening je gebruikt.',facts:[],answer:exercise.answer},
   contexts:Object.fromEntries(Object.keys(settings).map(sector=>[sector,measurementContext(kind,sector)])),source:'Aanvullende aflees- en meetlessen bij de schoolleerlijn.',schedule:[{year,week,day}]};
 });
}
