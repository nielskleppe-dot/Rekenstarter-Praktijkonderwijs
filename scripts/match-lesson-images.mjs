import fs from 'node:fs';
const file='src/lesson-data.json',d=JSON.parse(fs.readFileSync(file));
const materials={
eco:['blikken soep','cadeauzakjes','dozen koek','een presentatierek','een presentatiestrook','flessen sap','ongezouten noten','pakken koffie','prijskaartjes','rollen plakband','verzendzakken','winkelartikelen'],
zw:['bekers','bordjes','een kastplank','een lage opbergkast','handdoeken','havermout','kussenslopen','servetten','slabben','theezakjes','washandjes'],
hbr:['bloem','borden','broodjes','broodmandjes','dessertlepels','een buffetmodule','een tafelloper','glazen','koffiekopjes','menukaarten','onderzetters','servetten'],
groen:['aardbeienplanten','bamboestokken','bloemstelen','droge bonen','een plantenbak','een randstuk','jonge planten','klinkers','plantlabels','stekpotjes','voerbakjes','zakjes zaad'],
techniek:['bevestigingsclips','bouten','een afwerkstrip','een gereedschapskast','kabelbinders','metalen sluitringen','moeren','schroeven','schuurvellen','sluitringen','verbindingshoekjes']
};
let n=0;
for(const year of d.years)for(const week of year)for(const l of week.lessons){
 for(const variants of Object.values(l.byPhase))for(const [sector,v]of Object.entries(variants)){
  const index=materials[sector].indexOf(v.material);if(index<0)throw Error('Missing photo '+sector+' '+v.material);
  v.workplace.lessonImage={group:'lesson-'+sector,index,columns:4,rows:3,alt:'Realistische illustratie: '+v.material+' bij deze beroepsopdracht. Gebruik voor exacte aantallen en maten de werkbon.'};
  if(sector==='groen'){
   const place={'aardbeienplanten':['medewerker plantenteelt','een boerderij met plantenteelt',3],'bamboestokken':['medewerker plantenteelt','een kwekerij',3],'bloemstelen':['medewerker bloem','een bloemenwinkel',3],'droge bonen':['medewerker boerderijwinkel','een boerderijwinkel',3],'een plantenbak':['medewerker tuinaanleg','een hoveniersbedrijf',4],'een randstuk':['medewerker bestrating','een bestratingsbedrijf',4],'jonge planten':['medewerker plantenteelt','een boerderij met plantenteelt',3],'klinkers':['medewerker bestrating','een bestratingsbedrijf',4],'plantlabels':['medewerker plantenteelt','een kwekerij',3],'stekpotjes':['medewerker plantenteelt','een kwekerij',3],'voerbakjes':['medewerker dierverzorging','een dierenverzorgingsbedrijf',3],'zakjes zaad':['winkelmedewerker','een boerderijwinkel',3]}[v.material];
   v.workplace.role=place[0];v.workplace.place=place[1];v.workplace.panel=place[2];v.workplace.recipient='je collega';
   v.workplace.firstQuestion='Wat moet je voor je collega over '+v.material+' uitzoeken?';
  }n++;
 }
 for(const sector of d.sectors)l.variants[sector.id]=structuredClone(l.byPhase[l.variants[sector.id].phase][sector.id]);
}
for(const sector of Object.keys(materials))d.images['lesson-'+sector]='data:image/webp;base64,'+fs.readFileSync('assets/lesson-'+sector+'.webp').toString('base64');
fs.writeFileSync(file,JSON.stringify(d,null,2));
console.log('Exact material-to-image mappings for '+n+' phase variants.');

