import fs from 'node:fs';
const p='src/lesson-data.json',d=JSON.parse(fs.readFileSync(p));
const choices={
 count:['Volle groepjes tellen en daarna de losse stuks erbij.','Alleen het aantal groepjes tellen.','De losse stuks overslaan.'],
 line:['De nul en de schaal bekijken voordat ik de getallen plaats.','De twee getallen op dezelfde plek zetten.','Alleen het laatste cijfer van ieder getal gebruiken.'],
 diff:['De kleinste voorraad van de grootste aftrekken.','De twee voorraden bij elkaar optellen.','De grootste voorraad verdubbelen.'],
 add:['De twee deelbestellingen bij elkaar optellen.','De tweede bestelling van de eerste aftrekken.','Alleen de grootste bestelling tellen.'],
 bridge:['De beginvoorraad en de levering bij elkaar optellen.','De levering van de beginvoorraad aftrekken.','Alleen de beginvoorraad gebruiken.'],
 sub:['De uitgegeven stuks van de beginvoorraad aftrekken.','De uitgegeven stuks bij de beginvoorraad optellen.','Alleen het uitgegeven aantal noemen.'],
 refill:['Het beschikbare aantal van het benodigde aantal aftrekken.','Beide aantallen bij elkaar optellen.','Het benodigde aantal als tekort noemen.'],
 need:['Eerst beide voorraden optellen, daarna met de aanvraag vergelijken.','Alleen voorraadplek A met de aanvraag vergelijken.','De aanvraag bij beide voorraden optellen.'],
 multiply:['Het aantal groepjes vermenigvuldigen met de inhoud per groepje.','Het aantal groepjes optellen bij de inhoud van één groepje.','Alleen de inhoud van één groepje tellen.'],
 divide:['Het totaal gelijk verdelen over het opgegeven aantal bakken.','Het aantal bakken bij het totaal optellen.','Het totaal in elke bak leggen.'],
 round:['Het getal afronden naar het dichtstbijzijnde tiental.','Altijd naar het laagste tiental afronden.','Altijd naar het hoogste tiental afronden.'],
 estimate:['Eerst afronden voor een schatting, daarna precies narekenen.','De schatting altijd als exacte voorraad noteren.','Eén voorraadplek overslaan.'],
 stock:['De levering erbij tellen en het verbruik eraf halen.','De levering én het verbruik erbij tellen.','De levering én het verbruik eraf halen.'],
 rest:['Zoveel mogelijk volle bakken maken en de rest apart tellen.','Alle losse stuks vergeten.','De inhoud per bak bij het totaal optellen.'],
 pack:['Ook voor de overgebleven stuks een bak meetellen.','Alleen volle bakken meetellen, ook als er stuks over zijn.','De inhoud van één bak bij het totaal optellen.'],
 both:['Volle bakken en alle benodigde bakken apart bepalen.','Volle bakken altijd gelijkstellen aan benodigde bakken.','De rest wegdenken.'],
 ruler:['De nul bij het begin leggen en het uiteinde aflezen.','Bij de rand van de meetlat beginnen, ook als de nul verderop staat.','Alleen het grootste getal op de meetlat aflezen.'],
 cm:['Iedere hele meter omrekenen naar 100 cm.','Iedere hele meter omrekenen naar 10 cm.','Meters en centimeters zonder omrekenen optellen.'],
 decimalCm:['Het aantal meters met 100 vermenigvuldigen.','Het aantal meters door 100 delen.','Alleen de eenheid m in cm veranderen.'],
 decimalEqual:['Beide lengtes in dezelfde eenheid schrijven.','De maat met de meeste cijfers altijd langer noemen.','De komma weglaten.'],
 decimalCompare:['De cijfers op dezelfde plaatswaarde vergelijken.','Alleen het laatste cijfer vergelijken.','De maat met de meeste decimalen altijd groter noemen.'],
 cmCompare:['Eerst beide lengtes in centimeters schrijven.','Alleen naar het grootste geschreven getal kijken.','De eenheden negeren.'],
 decimalLimit:['Iedere optie apart met de maximummaat vergelijken.','Altijd de grootste optie kiezen.','De twee opties bij elkaar optellen.'],
 fit:['Eerst dezelfde eenheid gebruiken en daarna de breedtes vergelijken.','Alleen naar de getallen kijken en de eenheden overslaan.','De breedte van het voorwerp bij de vrije ruimte optellen.'],
 decimalFit:['Eerst dezelfde eenheid gebruiken en daarna de breedtes vergelijken.','Alleen naar de getallen kijken en de eenheden overslaan.','De breedte van het voorwerp bij de vrije ruimte optellen.'],
 scale:['Het getal én de gewichtseenheid aflezen.','Alleen het getal noemen.','Het gewicht schatten zonder naar de schaal te kijken.'],
 gram:['Het aantal kilogram met 1.000 vermenigvuldigen.','Het aantal kilogram door 1.000 delen.','Alleen kg in g veranderen.'],
 massCompare:['Beide gewichten eerst in gram schrijven.','Alleen het grootste geschreven getal kiezen.','De eenheden negeren.'],
 massRefill:['Het doel naar gram omrekenen en het huidige gewicht ervan aftrekken.','Gram direct van kilogram aftrekken zonder omrekenen.','Het huidige gewicht bij het doelgewicht optellen.']
};
let n=0;
for(const y of d.years)for(const week of y)for(const l of week.lessons){
 const a=choices[l.type];if(!a)throw Error(l.type);const offset=n%3;
 const options=a.map((_,i)=>a[(i+offset)%3]);const answer=String.fromCharCode(65+(3-offset)%3);
 l.interaction={question:l.goal+' Welke aanpak kies je?',options,answer,reason:a[0],
  firstLabel:'Kies zelf · 15 seconden',firstInstruction:'Denk eerst zelf. Laat daarna tegelijk A, B of C zien.',
  middleLabel:n%2?'Vergelijk met je buur · 30 seconden':'Onderzoek samen · 30 seconden',middleQuestion:n%2?'Vergelijk jullie tussenstappen. Wijs aan waar jullie dezelfde aanpak gebruiken.':l.teaching.discuss,
  lastLabel:'Werk als collega’s · 45 seconden',lastInstruction:'A: geef de uitkomst en een werkinstructie. B: controleer getal, eenheid en actie.'};
 l.teaching.interactiveRoutine='Dia 1: geef 15 seconden denktijd; laat iedereen tegelijk kiezen en vraag pas daarna één toelichting. Antwoord '+answer+': '+a[0]+' Dia 2: laat eerst 30 seconden overleggen over de aanpak; vraag welk gegeven of welke stap het antwoord ondersteunt. Dia 3: laat A terugmelden en B controleren. Houd het rekendoel gelijk; geef steun waar nodig.';
 n++;
}
fs.writeFileSync(p,JSON.stringify(d,null,2));console.log('Interaction added to '+n+' lessons.');
