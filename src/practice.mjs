import { techniekBeelden, techniekPerFase } from "./techniek.mjs";

export const phaseLabels = { kennismaken:"Kennismaken", orienteren:"Oriënteren", vervolg:"Vervolgopdrachten" };

const workbook="https://chatgpt.com/library?file_id=libfile_3c9be8bbe28c819196ae94c8f0e68b91&account_id=personal";
const a1="https://chatgpt.com/library?file_id=libfile_d290e28205c48191abf0460ae7f4095c&account_id=personal";
const a2="https://chatgpt.com/library?file_id=libfile_9fa5935ef900819188f5fd566147a3b1&account_id=personal";
const bookA1="Kennismaken met Groen PRO Update 2026";
const bookA2="Oriëntatie leerlijn Groen PRO versie 2024";
const sampleSource="Startboekje of werkkaart koppelen";
const kE="Leerlijn Kennismaken met economie";
const oE="Leerlijn Oriëntatie · ECO";
const oZ="Leerlijn oriëntatie op zorg";
const oH="Leerlijn oriëntatie op HBR";

function work(task,material,scene,next,source,link=workbook,page=""){
  return {task,material,scene,next,source,link,page};
}
const tasks={
  kennismaken:{
    techniek:techniekPerFase.kennismaken,
    eco:[
      work("Slimme verkooptrucs","winkelartikelen","Je maakt een oefenverkooptafel klaar voor de eerste klanten.","Controleer de materialen op de verkooptafel en vertel aan je maatje wat je nog moet klaarzetten.",kE),
      work("Sale slinger maken","actiekaartjes","Je maakt met je klas een actieslinger voor de oefenwinkel.","Tel je eigen actiekaartjes en werk de voorraadlijst bij.",kE),
      work("Sale slinger maken","actiekaartjes","De actieslingers worden verdeeld over werktafels. Je zet voor iedere tafel materiaal klaar.","Verdeel jullie eigen kaartjes in gelijke porties en controleer één portie.",kE),
      work("Ontwerp je eigen bedrijf (ijsstokjes)","bouwmateriaal","Je bouwt een model van je eigen bedrijf. Je controleert de maat voordat je iets vastzet.","Pak een meetlat en meet een onderdeel van je eigen model vanaf de nul.",kE),
      work("Mystery shopper","oefenverpakkingen","Je onderzoekt producten voor een winkelopdracht. Je gebruikt een weegschaal om het gewicht te controleren.","Kies twee oefenproducten en noteer bij elk gewicht ook de eenheid.",kE)
    ],
    zw:[
      work("Wasgoed herkennen","handdoeken","Je maakt in de oefenwoning een linnenkast klaar voor de volgende groep.","Tel twee soorten handdoeken en vertel waar er meer van zijn.",sampleSource,""),
      work("Werkplek klaarzetten","werkdoekjes","Je zet werkdoekjes klaar voor leerlingen die de oefenwoning gaan opruimen.","Controleer hoeveel werkdoekjes er na je eigen opdracht over zijn.",sampleSource,""),
      work("Schoon linnengoed verdelen","washandjes","Je maakt op de eerste werkles bakken met schone washandjes klaar.","Maak twee gelijke bakken met het materiaal van jullie werkplek.",sampleSource,""),
      work("Opbergruimte bekijken","opbergmateriaal","Je ruimt voor het eerst samen een linnenkast in. Je meet welke bak op de plank past.","Meet de vrije plek in jullie kast vanaf de nul van het meetlint.",sampleSource,""),
      work("Wasgoed sorteren","oefenwasgoed","Je legt een bundel wasgoed klaar. Je zoekt uit hoe je het gewicht afleest.","Lees het gewicht van een oefenbundel af en noem de eenheid hardop.",sampleSource,"")
    ],
    hbr:[
      work("De keuken leren kennen","borden","Je maakt voor het eerst in de oefenkeuken een tafel klaar.","Tel bij je eigen tafel hoeveel borden er klaarstaan.",sampleSource,""),
      work("Werkplek klaarmaken","bekers","De eerste groep gasten gaat bijna zitten. Je helpt bekers klaarzetten.","Vergelijk de bekers die nodig zijn met de bekers op je eigen werktafel.",sampleSource,""),
      work("Tafel dekken","servetten","Je oefent het klaarzetten van gelijke sets voor de tafels.","Maak met het echte materiaal twee dezelfde tafelsets.",sampleSource,""),
      work("Werkruimte controleren","dienblad","Je leert waar je in de oefenkeuken veilig kunt werken. Je meet of het dienblad op de vrije plek past.","Meet het dienblad of de vrije plek met het meetlint.",sampleSource,""),
      work("Ingrediënten afwegen","oefeningrediënten","Je leert de keukenweegschaal gebruiken en zet ingrediënten voor de les klaar.","Weeg een oefenhoeveelheid en lees gram of kilogram af.",sampleSource,"")
    ],
    groen:[
      work("Werkkaart 3 · Stekken en oogsten","plantlabels","De volgende groep gaat stekken. Je legt plantlabels klaar waarop de naam en datum komen.","Tel de labels en de stekken van jullie eigen werkkaart en kijk of er genoeg labels zijn.",bookA1,a1,"p. 7–8"),
      work("Werkkaart 2 · Werken in de moestuin","plantpotjes","Je zet materiaal klaar voor het planten in de moestuin. Twee groepjes werken aan een eigen rij.","Vergelijk de echte werkvoorraad van twee groepjes voor het planten.",bookA1,a1,"p. 5–6"),
      work("Werkkaart 3 · Stekken en oogsten","stekpotjes","Je maakt met de klas nieuwe stekken. Iedere werktafel krijgt een set potjes.","Verdeel de potjes of labels voor de echte stekken over jullie werktafels.",bookA1,a1,"p. 7–8"),
      work("Werkkaart 2 · Werken in de moestuin","plantmateriaal","Voor het planten controleer je de afstand en de vrije ruimte in het bed.","Meet een echte plantafstand uit de werkkaart en noem de eenheid.",bookA1,a1,"p. 5–6"),
      work("Werkkaart 6 · Pizzawrap maken","kaas","Je helpt bij het afwegen van de gezamenlijke voorraad kaas. Daarna verdeel je de ingrediënten volgens de werkkaart.","Weeg voor je eigen pizzawrap de portie uit de werkkaart en lees het gewicht met de juiste eenheid af.",bookA1,a1,"p. 13–14")
    ]
  },
  orienteren:{
    techniek:techniekPerFase.orienteren,
    eco:[
      work("Product vergelijken","winkelartikelen","Voor een oefenverkoop kies je uit twee voorraadplekken in de winkel.","Noteer bij je echte productvergelijking een aantal en licht toe wat het verschil betekent.",oE),
      work("Recht cadeau inpakken","inpakdoosjes","Je zet inpakmateriaal klaar voor twee groepen klanten.","Tel de doosjes die voor jullie werkopdracht klaarstaan en controleer het totaal.",oE),
      work("Recht cadeau inpakken","cadeaudoosjes","In de oefenwinkel maak je setjes klaar om de volgende bestellingen in te pakken.","Maak met jullie echte voorraad een aantal gelijke sets en controleer wat er overblijft.",oE),
      work("Recht cadeau inpakken","inpakmateriaal","Je meet het werkblad en de strook inpakmateriaal voor de bestelling.","Meet de strook voor jouw cadeau voordat je knipt.",oE),
      work("Product vergelijken","productverpakkingen","Je onderzoekt welk product geschikt is voor de klant. Lees of meet het gewicht van de oefenverpakking.","Vergelijk de gewichten van twee echte verpakkingen in dezelfde eenheid.",oE)
    ],
    zw:[
      work("Wassen en drogen","handdoeken","De volgende groep heeft schone handdoeken nodig. Je mag één keer met de linnenkar naar de voorraad.","Vergelijk de voorraad bij jullie twee linnenplekken en zeg welke je eerst aanvult.",oZ),
      work("Klamvochtig afnemen","werkdoekjes","Twee groepjes maken een deel van de oefenwoning schoon. Jij beheert de werkdoekjes.","Tel bij je werkplek wat je hebt gebruikt en wat er nog is.",oZ),
      work("Wassen en strijken platgoed","handdoeken","Je vouwt het platgoed en zet voor iedere werkplek een gelijke stapel klaar.","Verdeel het eigen opgevouwen linnengoed over de werkplekken.",oZ),
      work("Wassen en strijken platgoed","opbergmateriaal","Je ruimt platgoed op. Meet de vrije ruimte om een passende mand of stapel te kiezen.","Meet de vrije plank van de kast voordat je het platgoed wegzet.",oZ),
      work("Wassen en drogen","oefenwasgoed","Je sorteert wasgoed. Weeg een oefenbundel om te weten hoeveel wasgoed je klaarzet.","Lees het gewicht van een echte oefenbundel af en vergelijk de eenheden.",oZ)
    ],
    hbr:[
      work("Tafeldekken","borden","De tafels worden straks gedekt. Je gaat één keer naar de uitgifte om borden te halen.","Tel bij je echte tafels hoeveel borden er liggen en controleer hoeveel nog nodig zijn.",oH),
      work("Voorbereiding werkplek","bekers","De gasten komen zo. Je regelt het materiaal voor twee werkplekken.","Vergelijk jullie echte werkvoorraad met de benodigdheden van de werkkaart.",oH),
      work("Tafeldekken","servetten","Je bereidt de tafels voor. Elke tafel krijgt dezelfde set servetten.","Maak met de echte materialen gelijke tafelsets en tel na.",oH),
      work("Voorbereiding werkplek","dienblad","Je maakt de uitgiftebalie klaar. Meet de vrije ruimte voor het dienblad.","Controleer met een meetlint welk blad op jullie uitgiftebalie past.",oH),
      work("Mise en place","oefeningrediënten","Voor de keukenles leg je de ingrediënten klaar. Je controleert de hoeveelheid op de weegschaal.","Weeg een ingrediënt voor je eigen werkopdracht en controleer de eenheid.",oH)
    ],
    groen:[
      work("Oriëntatie Plantenteelt","plantlabels","De volgende groep werkt in de kas. Er is plek voor één voorraadbak met plantlabels op de kweektafel.","Vergelijk twee aantallen uit jullie echte kasopdracht en vertel wat je moet klaarzetten.",bookA2,a2,"p. 44–47"),
      work("Oriëntatie Plantenteelt","plantpotjes","Je bereidt met twee groepjes een werkplek in de kas voor. Jij controleert het materiaal.","Werk met de echte materialen van de kasopdracht de voorraad bij.",bookA2,a2,"p. 44–47"),
      work("Oriëntatie Plantenteelt","stekpotjes","Voor de oriëntatie in de kas zet je even grote sets op de werktafels klaar.","Maak bij jullie eigen taak gelijke sets en controleer één werktafel.",bookA2,a2,"p. 44–47"),
      work("Oriëntatie Tuinaanleg en onderhoud","plantmateriaal","Je bekijkt een plek voor groenwerk. Controleer met de meetlat of het materiaal op de plek past.","Meet een echte maat uit jullie opdracht in de Groene Ruimte.",bookA2,a2,"p. 4–11"),
      work("Oriëntatie Levensmiddelenontwikkeling","oefeningrediënten","Je bereidt een werkplek voor bij levensmiddelenontwikkeling. Controleer het gewicht van de ingrediënten.", "Gebruik bij jullie eigen recept de aangegeven hoeveelheden en lees de eenheid hardop af.",bookA2,a2,"p. 54–64")
    ]
  },
  vervolg:{techniek:techniekPerFase.vervolg}
};

const order=[0,0,1,1,2,2,3,4];
const photoGroups=["stock","stock","sets","sets","sets","sets","measure","weigh"];
const photoPositions={eco:"0% 0%",zw:"100% 0%",hbr:"0% 100%",groen:"100% 100%"};
const photoAlts={
  stock:{eco:"Twee voorraadbakken met winkelartikelen",zw:"Twee manden met handdoeken in een oefenwoning",hbr:"Twee groepen borden op een uitgiftebalie",groen:"Twee voorraadbakjes met plantlabels op een kweektafel"},
  sets:{eco:"Setjes winkelmaterialen op een werktafel",zw:"Linnengoed in aparte manden op de werktafel",hbr:"Gelijke tafelsets met servetten en bestek",groen:"Groepjes potjes en plantenstekken op de kweektafel"},
  measure:{eco:"Een meetlint op de werktafel van een oefenwinkel",zw:"Een meetlint langs de vrije plankruimte",hbr:"Een meetlint naast het dienblad op een werkblad",groen:"Een meetlint langs een kweektafel met een plantentray"},
  weigh:{eco:"Een oefenverpakking bij een weegschaal",zw:"Wasgoed bij een oefenweegschaal",hbr:"Een kom met ingrediënten op een weegschaal",groen:"Ingrediënten en kruiden bij een keukenweegschaal"}
};

const situations={
  count:["Maak de telling klaar voor de werkvoorraad.","Er zijn volle groepjes en losse stuks. Noteer één totaal.","Controleer de telling voordat de volgende groep verdergaat."],
  line:["Bekijk de twee aantallen voordat je materiaal gaat halen."],
  diff:["Kies welke voorraad het grootst is.","Je collega vraagt hoeveel stuks de twee voorraden verschillen.","Je haalt materiaal op bij één voorraadplek. Kies de plek waar je de meeste stuks kunt halen."],
  add:["Maak één voorraadlijst voor de twee groepen."],
  bridge:["De materialen van twee groepen moeten samen klaarstaan.","Op het werkbriefje staan twee aantallen. Reken uit wat samen klaar moet liggen.","Maak één totaaltelling voordat je beide groepen hun materiaal geeft."],
  sub:["Schrijf op hoeveel materiaal je na gebruik terugzet."],
  multiply:["Maak één lijst van alle gelijke groepjes."],
  divide:["Zorg dat iedere bak precies evenveel krijgt."],
  refill:["Bereken hoeveel je nog uit de voorraad moet halen."],
  need:["Controleer samen of het materiaal genoeg is voor de hele opdracht."],
  round:["Geef je collega een snelle schatting van de voorraad."],
  estimate:["Schat voor het klaarzetten en controleer het daarna met de precieze aantallen."],
  decimalEqual:["Twee collega’s hebben dezelfde maat opgeschreven. Controleer de notatie."],
  decimalCompare:["Je moet de grootste maat aanwijzen op het werkbriefje."],
  decimalLimit:["Er is een maximummaat afgesproken. Kies het onderdeel dat binnen die maat past."],
  stock:["Werk de voorraadlijst bij na levering en gebruik."],
  rest:["Maak volle bakken en noteer wat nog los over is."],
  pack:["Zorg dat alle stuks in één keer ingepakt mee kunnen."],
  both:["Vertel hoeveel bakken vol zijn en hoeveel er totaal mee moeten."],
  ruler:["Kijk vanaf welk punt de meting begint."],
  cm:["Noteer de maat in centimeters op het werkbriefje."],
  decimalCm:["Noteer de maat in centimeters op het werkbriefje."],
  cmCompare:["Gebruik één maateenheid om te kiezen welke maat groter is."],
  fit:["Controleer de vrije ruimte voordat je het materiaal verplaatst."],
  decimalFit:["Controleer de vrije ruimte voordat je het materiaal verplaatst."],
  scale:["Vertel aan je collega welk getal en welke eenheid op de schaal staan."],
  gram:["Noteer het gewicht in gram op het werkbriefje."],
  massCompare:["Vergelijk de twee hoeveelheden met dezelfde eenheid."],
  massRefill:["Controleer hoeveel je nog moet toevoegen om op het afgesproken oefengewicht te komen."]
};

function applyQuestion(kind,material,question){
  if(kind==="diff")return "Bij welke plek zijn er meer "+material+"? Hoeveel stuks scheelt het?";
  if(kind==="line")return "Zet de twee aantallen op de getallenlijn. Welk aantal is het grootst?";
  return question;
}

export function makeVariants(sectors,weekIndex,dayIndex,kind,math){
  const selected=order[weekIndex];
  const group=photoGroups[weekIndex];
  const sentences=situations[kind];
  if(!sentences)throw Error("Missing authentic situation for "+kind);
  return Object.fromEntries(Object.keys(phaseLabels).map(phase=>[
    phase,Object.fromEntries(sectors.map(sector=>{
      const phaseTask=tasks[phase]?.[sector.id]?.[selected];
      const baseline=sector.weeks?.[weekIndex];
      const task=phaseTask ?? work(baseline.source.split(" · ").at(-1),baseline.material,baseline.scene,
        "Gebruik de rekenstap bij het materiaal van jullie huidige werkkaart.",baseline.source);
      const scenario=sentences[dayIndex]??sentences[0];
      const title=sector.id==="techniek"&&group==="measure"
        ? task.task
        : task.material[0].toUpperCase()+task.material.slice(1)+" "+math.verb;
      return [sector.id,{
        ...task,title,context:task.scene+" "+scenario,
        question:applyQuestion(kind,task.material,math.question),phase,
        image:sector.id==="techniek"
          ? techniekBeelden[group]
          : {group,position:photoPositions[sector.id],alt:photoAlts[group][sector.id]}
      }];
    }))
  ]));
}
