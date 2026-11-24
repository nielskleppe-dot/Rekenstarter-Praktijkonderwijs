const reminders={
  count:"Wijs eerst de volle groepjes aan. Tel daarna de losse stuks.",
  line:"Wijs de tientallen aan waar elk aantal tussen hoort.",
  diff:"Kies de grootste hoeveelheid. Bepaal daarna hoeveel stuks het verschil is.",
  add:"Zet de tientallen en de losse stuks apart.",
  bridge:"Maak eerst het volgende tiental. Tel daarna op wat er nog over is.",
  sub:"Haal eerst tientallen en daarna losse stuks weg.",
  multiply:"Wijs één groepje aan en kijk hoe vaak het voorkomt.",
  divide:"Verdeel zo dat ieder groepje even groot wordt.",
  refill:"Wijs het aantal dat je hebt en het aantal dat je nodig hebt aan.",
  need:"Tel eerst samen hoeveel er is. Vergelijk het totaal met het benodigde aantal.",
  round:"Kijk tussen welke twee tientallen het aantal ligt.",
  estimate:"Rond eerst af. Gebruik voor de precieze controle de oorspronkelijke aantallen.",
  decimalEqual:"Vergelijk de cijfers op dezelfde plaats achter de komma.",
  decimalCompare:"Zet de getallen netjes onder elkaar voordat je vergelijkt.",
  decimalLimit:"Vergelijk elke maat apart met de maximummaat.",
  stock:"Werk op volgorde. Schrijf de nieuwe voorraad na iedere stap op.",
  rest:"Zoek eerst hoeveel verpakkingen vol raken.",
  pack:"Bekijk ook de stuks die na de volle bakken nog los liggen.",
  both:"Bepaal eerst hoeveel bakken vol zijn en wat er dan overblijft.",
  ruler:"Zet het begin van het voorwerp bij de nul.",
  cm:"Een hele meter is 100 centimeter.",
  decimalCm:"Een meter is 100 centimeter. Vermenigvuldig het aantal meters met 100.",
  cmCompare:"Schrijf beide lengtes eerst in centimeter.",
  fit:"Zet de maten in dezelfde eenheid en vergelijk de beschikbare ruimte met het voorwerp.",
  decimalFit:"Zet de maten in dezelfde eenheid en vergelijk de beschikbare ruimte met het voorwerp.",
  scale:"Lees eerst het getal en wijs daarna de eenheid aan.",
  gram:"Een kilogram is 1.000 gram.",
  massCompare:"Schrijf beide gewichten eerst in gram.",
  massRefill:"Zet het gewenste gewicht eerst om in gram."
};

const reasoning={
  count:"Een leerling telt alleen de volle groepjes. Hoe controleer je of alle stuks zijn meegeteld?",
  line:"Een leerling kijkt alleen naar de losse cijfers. Hoe gebruik je de tientallen op de getallenlijn?",
  add:"Welke getallen tel je bij elkaar op om te weten wat er in totaal klaarligt?",
  bridge:"Je kunt via een tiental rekenen. Welke sprong maak je eerst en hoeveel moet daarna nog erbij?",
  sub:"Een leerling telt wat gebruikt is bij de voorraad op. Welke berekening past hier?",
  multiply:"Hoe zie je aan de groepjes welke keersom je nodig hebt?",
  divide:"Hoe controleer je dat in iedere bak evenveel zit?",
  refill:"Een leerling geeft het totale aantal dat nodig is als antwoord. Welke informatie gebruik je nog?",
  need:"Welke twee voorraden moet je eerst samen bekijken voordat je een beslissing neemt?",
  round:"Hoe zie je welk tiental het dichtstbij ligt?",
  estimate:"Welke berekening vertelt je precies hoeveel stuks er zijn? Leg uit hoe je dat weet.",
  decimalEqual:"Verandert de lengte als je achter de decimalen een nul schrijft? Wijs het aan op de getallenlijn.",
  decimalCompare:"Een leerling vergelijkt alleen het laatste cijfer. Hoe vergelijk je de hele maat?",
  decimalLimit:"Hoe bewijs je dat jouw keuze binnen de maximummaat valt?",
  stock:"Een leerling telt het gebruikte materiaal bij de voorraad op. Welke stap moet anders?",
  rest:"Hoe controleer je hoeveel stuks na het vullen van de bakken nog over zijn?",
  pack:"Een leerling telt alleen de volle bakken. Waar laat je de laatste stuks?",
  both:"Wanneer is het aantal benodigde bakken groter dan het aantal volle bakken?",
  ruler:"Een leerling begint bij de rand van de meetlat. Waar hoort het begin van het voorwerp?",
  cm:"Een leerling telt het aantal meters meteen op bij het aantal centimeters. Welke stap ontbreekt?",
  decimalCm:"Een leerling leest het getal in meters af als centimeters. Hoe reken je om?",
  cmCompare:"Een leerling kiest het grootste getal. Waarom moet je eerst naar de eenheden kijken?",
  fit:"Een leerling vergelijkt de twee maten meteen. Welke stap heb je eerst nodig?",
  decimalFit:"Een leerling vergelijkt de twee maten meteen. Welke stap heb je eerst nodig?",
  scale:"Een leerling noemt alleen het getal. Welke informatie is nodig om het gewicht door te geven?",
  gram:"Hoe leg je met 1 kg = 1.000 g uit hoeveel gram het is?",
  massCompare:"Een leerling kiest het grootste getal. Hoe zorg je dat de gewichten vergelijkbaar zijn?",
  massRefill:"Een leerling trekt het aantal gram direct van het aantal kilogram af. Welke stap ontbreekt?"
};

export function enrichMath(kind,numbers,task){
  if(kind!=="diff") return task;
  const [a,b]=numbers;
  const high=Math.max(a,b),low=Math.min(a,b),tens=Math.floor(low/10)*10,ones=low%10;
  return {...task,
    steps:[high+" is groter dan "+low+".",
      high+" − "+tens+" = "+(high-tens),
      (high-tens)+" − "+ones+" = "+(high-low)+". Dus "+high+" − "+low+" = "+(high-low)+"."],
    hint:"Splits "+low+" in "+tens+" en "+ones+". Haal eerst de tientallen weg."
  };
}

export function makeDidactics(kind,numbers,slot,math){
  const recall=reminders[kind];
  if(!recall)throw Error("Missing teaching routine for "+kind);
  const [a,b]=numbers;
  const high=Math.max(a,b),low=Math.min(a,b);
  const tens=Math.floor(low/10)*10;
  const discuss=kind==="diff"
    ? "Een leerling rekent "+high+" − "+tens+" = "+(high-tens)+" en stopt. Welke stap mist er?"
    : reasoning[kind];
  const think={
    ma:"Wijs aan wat je ziet. Schat het antwoord voordat de docent één stap voordoet.",
    di:"Werk in tweetallen. "+recall+" Leg elkaar één tussenstap uit.",
    do:"Kies eerst zelf. Noteer je antwoord en één tussenstap."
  }[slot.key];
  return {
    recall,think,discuss,
    pacing:[
      {time:"½ min",label:"Startvraag",text:slot.key==="ma"?"Wat zie je op de werkplek? Welke gegevens heb je nodig?":"Wat moet jij na het rekenen op de werkplek beslissen?"},
      {time:"1½–2 min",label:slot.phase,text:slot.key==="ma"?recall+" Denk hardop bij de eerste stap.":think},
      {time:"1–2 min",label:"Bespreek",text:discuss},
      {time:"1 min",label:"Individuele check",text:"Laat ieder een keuze of antwoord en één tussenstap noteren. Kijk welke aanpak ze gebruiken."}
    ],
    support:math.hint,deepening:math.explain
  };
}
