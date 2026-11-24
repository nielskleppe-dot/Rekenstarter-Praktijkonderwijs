import fs from 'node:fs';
const p='src/lesson-data.json',d=JSON.parse(fs.readFileSync(p));
function prompts(t,kind){
 const values=t.facts.map(f=>f.value),a=values[0],b=values[1];
 const map={
 count:['Tel de volle groepjes.','Tel de losse stuks erbij. Noteer het totaal.'],
 line:['Wijs '+a+' aan op getallenlijn A.','Wijs '+b+' aan op getallenlijn B.','Welk getal ligt verder naar rechts?'],
 diff:['Welke voorraad is het grootst?','Bereken hoeveel stuks de voorraden verschillen.'],
 add:['Tel de twee deelbestellingen bij elkaar op.','Noteer het totale aantal met de eenheid.'],
 bridge:['Tel '+a+' en '+b+' bij elkaar op.','Laat één tussenstap zien.'],
 sub:['Hoeveel stuks zijn uitgegeven?','Bereken de voorraad die na het uitgeven overblijft.'],
 refill:['Vergelijk de beschikbare voorraad met het benodigde aantal.','Bereken hoeveel stuks je moet aanvullen.'],
 need:['Tel de voorraad van plek A en plek B bij elkaar op.','Bereken hoeveel stuks nog ontbreken voor de opdracht.'],
 multiply:['Welke keersom hoort bij de groepjes?','Bereken het totale aantal stuks.'],
 divide:['Verdeel het totaal eerlijk over de bakken.','Noteer hoeveel stuks er in iedere bak komen.'],
 round:['Tussen welke twee tientallen ligt '+a+'?','Rond af op het dichtstbijzijnde tiental.'],
 estimate:['Rond de twee voorraadaantallen af op tientallen.','Bereken daarmee een schatting van het totaal.','Bereken het totaal precies.'+(values.length>2?' Vergelijk dit met het benodigde aantal.':'')],
 stock:['Bereken de voorraad na de levering.','Trek de uitgegeven stuks ervan af.'+(values.length>3?' Bereken daarna hoeveel je moet aanvullen.':'')],
 rest:['Hoeveel bakken kun je helemaal vullen?','Hoeveel losse stuks blijven over?'],
 pack:['Hoeveel volle bakken kun je vullen?','Hoeveel bakken heb je nodig als alle stuks mee moeten?'],
 both:['Hoeveel bakken zijn helemaal vol?','Hoeveel bakken zijn in totaal nodig om alles mee te nemen?'],
 ruler:['Wijs de nul en het uiteinde van het voorwerp aan.','Lees de lengte af in centimeters.'],
 cm:['Hoeveel centimeter zijn de hele meters?','Tel de losse centimeters erbij. Noteer de totale lengte.'],
 decimalCm:['Reken '+a+' om naar centimeters.','Noteer de uitkomst met de eenheid cm.'],
 decimalEqual:['Schrijf beide lengtes in centimeters.','Zijn de lengtes gelijk?'],
 decimalCompare:['Schrijf beide maten met twee cijfers achter de komma.','Welke maat is het grootst?'],
 cmCompare:['Zet beide lengtes om naar centimeters.','Welke lengte is het grootst?'],
 decimalLimit:['Vergelijk optie A met de maximale breedte.','Vergelijk optie B met de maximale breedte.','Welke optie past binnen het maximum?'],
 fit:['Zet de vrije breedte om naar centimeters.','Bereken hoeveel centimeter vrij blijft of ontbreekt.','Past het voorwerp volgens deze breedtematen?'],
 decimalFit:['Zet de vrije breedte om naar centimeters.','Bereken hoeveel centimeter vrij blijft of ontbreekt.','Past het voorwerp volgens deze breedtematen?'],
 scale:['Lees het getal op de weegschaal af.','Welke eenheid staat erbij?'],
 gram:['Reken '+a+' om naar gram.','Noteer de uitkomst met de eenheid g.'],
 massCompare:['Zet beide gewichten om naar gram.','Welke hoeveelheid is zwaarder, of zijn ze even zwaar?'],
 massRefill:['Zet het doelgewicht om naar gram.','Bereken hoeveel gram je nog moet toevoegen.']
 };
 if(!map[kind])throw Error(kind);
 if(kind==='count'&&t.facts.length)map.count.push('Vergelijk jouw telling met het aantal op de lijst. Klopt de lijst?');
 return map[kind];
}
let lessons=0;
for(const year of d.years)for(const week of year)for(const l of week.lessons){
 for(const t of [l.main,l.check])t.prompts=prompts(t,l.type);
 l.teaching.modelSpeech='Ik lees eerst de werkbon. Ik zoek uit wat ik moet berekenen. '+l.teaching.explanation+' Mijn rekenstappen zijn: '+l.main.steps.join(' Daarna: ')+'. Mijn antwoord is: '+l.main.answer+' Ik controleer of dit antwoord past bij de vraag op de werkbon.';
 l.teaching.routine='Ik: doe de hoofdopgave hardop voor. Samen: laat leerlingen dezelfde stappen aanwijzen en één stap toelichten. Jij: laat iedere leerling de tweede werkbon zelfstandig oplossen. Geef de steunvraag alleen als dat nodig is.';
 l.teaching.pacing=[{time:'1–2 min',label:'Dia 1 · Begrijp de opdracht',text:'Noem het rekendoel. Lees samen de werkbon. Toon de vragen één voor één. Controleer of leerlingen de gegevens en de gevraagde uitkomst begrijpen.'},{time:'2–3 min',label:'Dia 2 · Voordoen en samen oefenen',text:'Open het docentvoorbeeld. Denk hardop bij de rekenstappen. Laat leerlingen één stap aanwijzen of uitleggen. Toon de uitwerking na het bespreken.'},{time:'2–3 min',label:'Dia 3 · Zelf doen en controleren',text:'Laat leerlingen de tweede bon zelfstandig oplossen. Toon één vraag per keer. Laat daarna de uitkomst met eenheid en werkbeslissing terugmelden.'}];
 if(l.id==='2-1-do')l.teaching.pacing[2].text+=' De voorraad blijft 47 + 22; alleen het benodigde aantal verandert van 80 naar 86. Er is nog niets aangevuld.';
 for(const variants of Object.values(l.byPhase))for(const v of Object.values(variants)){
  v.workplace.firstQuestion='Lees de werkopdracht. Wat moet je uitzoeken?';
  v.workplace.readQuestion='Wijs op de werkbon de gegevens aan die je daarvoor nodig hebt.';
 }
 for(const s of d.sectors)l.variants[s.id]=structuredClone(l.byPhase[l.variants[s.id].phase][s.id]);
 lessons++;
}
fs.writeFileSync(p,JSON.stringify(d,null,2));console.log('Sharpened '+lessons+' lessons and 96 worked/independent tasks.');
