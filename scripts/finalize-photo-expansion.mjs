import {readFile,writeFile} from 'node:fs/promises';
const file=new URL('../assets/photo-bank/manifest.json',import.meta.url);
const bank=JSON.parse(await readFile(file,'utf8'));
const catalog=JSON.parse(await readFile(new URL('../src/catalog-data.json',import.meta.url),'utf8'));
const added=bank.images.filter(p=>p.batch==='meten-ruimte-300');
if(added.length!==300||added.some(p=>p.status!=='generated'))throw Error('Finish all three hundred commissioned photos before finalizing');
const massKinds=new Set(['scale','massCompare','massRefill','gram','readDigital','readDial','tareScale','fillMass']);
const volumeKinds=new Set(['jug','volumeCompare','volumeRefill','convertVolume','volumeAdd','volumeFit','volumeRoom','readJug','jugIntervals']);
const routeKinds=[...new Set(added.filter(p=>p.measurementGroup==='route').map(p=>p.kind))];
const routePlaces={groen:['de kwekerij','de kwekerij','een tuin','het tuincentrum','de kwekerij','het hoveniersbedrijf','een tuin in aanleg','de kwekerij','de kwekerij','een tuin met een werkschuur'],techniek:['de autogarage','de werkplaats','de werkplaats','het montagebedrijf','de werkplaats','de werkplaats','het montagebedrijf','de werkplaats','de werkplaats','de werkplaats'],zw:Array(10).fill('het woonzorgcentrum'),hbr:['het hotel','het restaurant','het restaurant','de restaurantkeuken','het restaurant','het restaurant','een feestzaal','het restaurant','het cateringbedrijf','het restaurant'],eco:['het magazijn','de winkel','de winkel','het magazijn','het magazijn','de winkel','het magazijn','het magazijn','de winkel','het magazijn']};
for(const p of added){
 const old=p.place;
 if(massKinds.has(p.kind))p.place={groen:'de dierenopvang',techniek:'de autogarage',zw:'de keuken van het woonzorgcentrum',hbr:'de bakkerij',eco:'het magazijn'}[p.sector];
 else if(volumeKinds.has(p.kind))p.place={groen:'de kwekerij',techniek:'de werkplaats',zw:'de keuken van het woonzorgcentrum',hbr:'de restaurantkeuken',eco:'de winkel'}[p.sector];
 else if(p.measurementGroup==='route')p.place=routePlaces[p.sector][routeKinds.indexOf(p.kind)];
 else if(p.measurementGroup==='area'){
  if(p.sector==='groen')p.place='een tuin in aanleg';
  if(['zw','hbr','eco'].includes(p.sector))p.role='facilitair medewerker';
 }else if(p.sector==='hbr'&&/chocolade|deeg|bakvorm/.test(p.material))p.place='de bakkerij';
 else if(p.sector==='groen'&&/plantclip|druppelslang|plantenrek/.test(p.material))p.place='de kwekerij';
 p.context=p.context.replace('Je werkt in '+old+'.','Je werkt in '+p.place+'.');
 p.alt=p.alt.replace(' in '+old,' in '+p.place);
 if(p.sector==='eco'&&['massRefill','fillMass'].includes(p.kind)){
  p.place='de winkel';p.material='losse noten';p.role='winkelmedewerker';
  p.context='Je werkt in de winkel. Een klant koopt losse noten. Je weegt de noten en vult aan tot het gewicht op de werkbon.';
  p.alt='Een winkelmedewerker vult losse noten aan op een weegschaal in de winkel';
 }
 const simpleNames={'een kunststof afstandhouder':'een klein kunststof blokje','een metalen busje':'een klein metalen buisje','een houten montageblokje':'een houten blokje','een verpakkingsblokje':'een blokje voor de verpakking','een meubelbeschermer':'een beschermblokje','een antislip werkvlak':'een vloer met rubbermatten','een antislip vloer':'een vloer met rubbermatten'};
 if(simpleNames[p.material]){const name=p.material;p.material=simpleNames[name];p.alt=p.alt.replace(name,p.material);}
 if(p.kind==='borderOrSurface')p.context='Je werkt in '+p.place+'. Kijk of je langs de rand werkt of het hele vlak bedekt. Gebruik de maten op de werkbon.';
 if(/^coverage/.test(p.kind))p.context='Je werkt in '+p.place+'. Je bestelt materiaal om het hele vlak te bedekken. Bekijk op de werkbon hoeveel m² je met één pak kunt bedekken.';
}
// These twenty remaining kinds share the same physical task/material with an
// existing photo. Retain each lesson's own maths and write a matching short case.
const aliases={priceRead:['priceAdd','Je leest het bedrag op het prijskaartje.'],priceAddWhole:['priceAdd','Je telt de prijzen op de bon bij elkaar.'],changeCount:['change','Je telt door vanaf de prijs om het wisselgeld te controleren.'],changeCheck:['change','Je controleert of het wisselgeld klopt.'],unitCost:['priceMultiply','Je rekent uit wat de hele bestelling kost.'],budgetChoose:['budget','Je kiest wat je met het beschikbare geld kunt kopen.'],offerRead:['offerCompare','Je leest wat er in de aanbieding zit en wat het kost.'],offerTotal:['offerCompare','Je rekent uit wat de aanbieding samen kost.'],unitPrice:['offerCompare','Je berekent de prijs per stuk.'],unitPriceChoose:['offerCompare','Je kiest de verpakking met de laagste prijs per stuk.'],discountRead:['discountFinal','Je zoekt uit van welk bedrag je de korting berekent.'],discount:['discountFinal','Je rekent uit hoeveel euro korting je krijgt.'],planning:['duration','Je leest de begin- en eindtijd op de werkplanning.'],durationAcross:['duration','Je rekent uit hoelang de werktaak duurt.'],endTime:['duration','Je berekent hoe laat de werktaak klaar is.'],sumMinutes:['startTimePrep','Je telt de werktijden van de stappen bij elkaar.'],endTimeMulti:['startTimePrep','Je berekent hoe laat alle werktaken klaar zijn.'],durationFit:['startTimePrep','Je controleert of de taken passen in de tijd die je hebt.'],startTime:['startTimePrep','Je berekent wanneer je met de werktaak moet beginnen.'],startTimeMulti:['startTimePrep','Je plant wanneer je moet beginnen om alle stappen op tijd af te krijgen.']};
for(const p of bank.images){p.compatibleKinds=[p.kind];p.contextByKind={};}
for(const [kind,[source,action]]of Object.entries(aliases))for(const sector of ['groen','techniek','zw','hbr','eco']){
 const p=bank.images.find(p=>p.kind===source&&p.sector===sector);if(!p)throw Error('Missing compatible case '+source+':'+sector);
 p.compatibleKinds.push(kind);p.contextByKind[kind]='Je werkt in '+p.place+'. '+action;
}
for(const p of bank.images){
 const matches=catalog.entries.filter(l=>p.compatibleKinds.includes(l.kind));
 p.lessonIds=matches.map(l=>l.id);p.weeks=[...new Set(matches.map(l=>'PrO '+(l.year+2)+' · week '+l.week))];
}
bank.generated=bank.images.filter(p=>p.status==='generated').length;
bank.expansion={batch:'meten-ruimte-300',count:300,lessonKinds:60,sectors:5,compatibleAdditionalKinds:Object.keys(aliases).length,review:'Per afbeelding beoordeeld op voorwerp, werkhandeling, sector en gebruik naast het nauwkeurige rekenbeeld.'};
await writeFile(file,JSON.stringify(bank,null,2)+'\n');
const jobsFile=new URL('../assets/photo-bank/expansion-jobs.json',import.meta.url),jobs=JSON.parse(await readFile(jobsFile,'utf8'));
for(const j of jobs)j.status='generated';await writeFile(jobsFile,JSON.stringify(jobs,null,2)+'\n');
console.log(JSON.stringify({photos:bank.generated,new:added.length,lessonKindsWithPhotos:new Set(bank.images.flatMap(p=>p.compatibleKinds)).size,reusedForAdditionalKinds:Object.keys(aliases).length}));
