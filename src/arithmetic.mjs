const digits = new Intl.NumberFormat("nl-NL", { useGrouping: "always", maximumFractionDigits: 0 });
const n = value => digits.format(value);
const items = value => n(value) + " stuks";
const grams = value => n(value) + " g";
const cm = value => n(value) + " cm";
const m = value => Math.floor(value / 100) + "," + String(value % 100).padStart(2, "0");
const decimal = value => m(value).replace(/0+$/, "").replace(/,$/, "");
const meters = value => decimal(value) + " m";
const mixed = value => Math.floor(value / 100) + " m " + (value % 100) + " cm";
const kg = value => String(value / 1000).replace(".", ",") + " kg";
const round = value => Math.round(value / 10) * 10;
const card = (label, value) => ({ label, value: String(value) });
const eq = (a, op, b, c) => n(a) + " " + op + " " + n(b) + " = " + n(c);

function task(verb, question, facts, steps, answer, hint, visual = null, explain = "Hoe weet je dat jouw antwoord klopt?") {
  return { verb, question, facts, steps, answer, hint, visual, explain };
}

function compare(a, b) {
  return a === b ? "=" : a > b ? ">" : "<";
}

function bridge([a, b]) {
  const gap = (10 - a % 10) % 10;
  const sum = a + b;
  const steps = gap && gap < b
    ? [eq(a, "+", gap, a + gap), eq(a + gap, "+", b - gap, sum)]
    : [eq(a, "+", b, sum)];
  return task("bij elkaar tellen", "Hoeveel stuks heb je samen?", [
    card("Eerste groep", items(a)), card("Tweede groep", items(b))
  ], steps, items(sum), "Hoeveel moet je erbij doen om bij het volgende tiental te komen?", null, "Waarom is rekenen via een tiental handig?");
}

function measureFit([available, object], format) {
  const gap = Math.abs(available - object);
  const fits = available >= object;
  const steps = [format(available) + " = " + cm(available),
    (fits ? cm(available) + " − " + cm(object) : cm(object) + " − " + cm(available)) + " = " + cm(gap)];
  return task("passen en meten", "Past het voorwerp? Hoeveel centimeter blijft er vrij of kom je tekort?", [
    card("Vrije plek", format(available)), card("Voorwerp", cm(object))
  ], steps, (fits ? "Het past. " + cm(gap) + " vrij." : "Het past niet. " + cm(gap) + " tekort."),
  "Zet de vrije maat eerst in centimeters. Vergelijk de twee getallen.", { type: "fit", available, object }, "Waarom zet je de maten eerst in dezelfde eenheid?");
}

function massCompare([a,b]) {
  return task("gewichten vergelijken", "Welke hoeveelheid weegt meer, of zijn ze even zwaar?", [
    card("Hoeveelheid A", kg(a)), card("Hoeveelheid B", grams(b))
  ], [kg(a) + " = " + grams(a), grams(a) + " " + compare(a,b) + " " + grams(b)],
  a === b ? "Even zwaar." : (a > b ? "Hoeveelheid A" : "Hoeveelheid B") + " weegt meer.",
  "Eén kilogram is 1.000 gram. Zet A om in gram.", null, "Hoe zie je aan de twee getallen welke hoeveelheid zwaarder is?");
}

const methods = {
  count([groups, loose, target]) {
    const total = groups * 10 + loose;
    const answer = target === undefined ? items(total) : items(total) + (total === target ? ". De lijst klopt." : ". Dat zijn " + n(Math.abs(total - target)) + " stuks " + (total > target ? "meer" : "minder") + " dan op de lijst.");
    const steps = [eq(groups,"×",10,groups*10)];
    if (loose) steps.push(eq(groups*10,"+",loose,total));
    if (target !== undefined && total !== target) steps.push(eq(Math.max(total,target),"−",Math.min(total,target),Math.abs(total-target)));
    return task("tellen", target === undefined ? "Hoeveel stuks tel je in de volle groepjes en losse stuks samen?" : "Hoeveel stuks tel je? Klopt de telling met de lijst?",
      target === undefined ? [] : [card("Op de lijst", items(target))], steps, answer,
      "Tel eerst 10, 20, 30 … Tel de losse stuks daarna verder.", { type:"groups", groups, size:10, loose }, "Hoeveel hoef je te tellen als je één vol groepje ziet?");
  },
  line([a,b]) {
    const end = Math.ceil(Math.max(a,b)/10)*10;
    return task("op de getallenlijn zetten", "Waar liggen beide aantallen ongeveer op de getallenlijn? Welk aantal ligt het verst naar rechts?",
      [card("Plek A", items(a)), card("Plek B", items(b))], [
        n(a)+" ligt tussen "+n(Math.floor(a/10)*10)+" en "+n(Math.ceil(a/10)*10)+".",
        n(b)+" ligt tussen "+n(Math.floor(b/10)*10)+" en "+n(Math.ceil(b/10)*10)+".",
        n(Math.max(a,b))+" is het grootste aantal."
      ], n(Math.max(a,b))+" ligt het verst naar rechts.", "Zoek voor elk getal eerst de twee tientallen eromheen.", { type:"line", start:0, end, step:10 }, "Hoe helpt de getallenlijn je bij het vergelijken?");
  },
  diff([a,b]) {
    const high = Math.max(a,b), low = Math.min(a,b);
    const from = a>b?"A":"B";
    return task("vergelijken", "Waar zijn er meer? Hoeveel stuks is het verschil?",
      [card("Plek A", items(a)),card("Plek B", items(b))], [
        n(high)+" is groter dan "+n(low)+".", eq(high,"−",low,high-low)
      ], "Op plek "+from+" zijn er "+n(high-low)+" stuks meer.", "Wijs eerst het grootste aantal aan. Haal daarna het kleinste aantal daarvan af.", null, "Kun je het verschil ook vinden door door te tellen?");
  },
  add([a,b]) {
    const tens = Math.floor(a/10)*10, moreTens = Math.floor(b/10)*10;
    return task("bij elkaar tellen", "Hoeveel stuks zet je in totaal klaar?", [
      card("Groep A", items(a)),card("Groep B", items(b))
    ], [eq(tens,"+",moreTens,tens+moreTens),eq(a%10,"+",b%10,a%10+b%10),eq(tens+moreTens,"+",a%10+b%10,a+b)],
    items(a+b), "Splits elk getal in tientallen en losse stuks.", null, "Welke cijfers vertellen je hoeveel tientallen er zijn?");
  },
  bridge,
  sub([a,b]) {
    const tens = Math.floor(b/10)*10;
    return task("overhouden", "Hoeveel stuks blijven er over na gebruik?", [
      card("In de voorraad", items(a)),card("Je gebruikt", items(b))
    ], [eq(a,"−",tens,a-tens),eq(a-tens,"−",b%10,a-b)], items(a-b),
    "Haal eerst de tientallen weg. Haal daarna de losse stuks weg.", null, "Hoe controleer je het antwoord met een optelsom?");
  },
  multiply([groups,size]) {
    return task("in gelijke groepen tellen", "Hoeveel stuks tel je in alle groepjes samen? Noem ook de keersom.", [
      card("Aantal groepjes", groups),card("Per groepje", items(size))
    ], [Array(groups).fill(n(size)).join(" + ")+" = "+n(groups*size),eq(groups,"×",size,groups*size)],
    items(groups*size), "Tel in sprongen. Elk groepje is even groot.", { type:"groups", groups, size, loose:0 }, "Wat vertelt het eerste getal van de keersom?");
  },
  divide([total,groups]) {
    const per = total/groups;
    return task("verdelen", "Verdeel alle stuks eerlijk. Hoeveel komen er in elke bak?", [
      card("Totaal", items(total)),card("Aantal bakken", groups)
    ], [eq(total,"÷",groups,per),"Controleer met "+eq(groups,"×",per,total)+"."],
    n(per)+" stuks per bak.", "Maak even grote groepjes. Zoek hoeveel keer het aantal bakken in het totaal past.", { type:"trays", count:groups }, "Hoe controleer je of elke bak evenveel krijgt?");
  },
  refill([stock,target]) {
    const missing = target-stock;
    return task("aanvullen", "Hoeveel stuks moet je aanvullen tot het aantal dat je nodig hebt?", [
      card("Je hebt", items(stock)),card("Je hebt nodig", items(target))
    ], [eq(target,"−",stock,missing)], items(missing)+" aanvullen.",
    "Het aantal dat je nodig hebt is je doel. Hoeveel ontbreekt er nog?", null, "Hoe controleer je dat je na het aanvullen precies genoeg hebt?");
  },
  need([a,b,target]) {
    const total = a+b, gap = target-total;
    return task("klaarzetten", "Zijn er genoeg stuks voor de werktaak? Hoeveel moet je zo nodig aanvullen?", [
      card("Plek A", items(a)),card("Plek B", items(b)),card("Benodigd", items(target))
    ], [eq(a,"+",b,total),eq(target,"−",total,gap)], items(gap)+" aanvullen.",
    "Tel eerst op wat er is. Vergelijk het totaal daarna met wat je nodig hebt.", null, "Waarom tel je de twee voorraden eerst bij elkaar op?");
  },
  round([a]) {
    const low=Math.floor(a/10)*10,high=low+10;
    return task("op tientallen afronden", "Tussen welke tientallen ligt het aantal? Rond af op het dichtstbijzijnde tiental.",
      [card("Geteld", items(a))], [n(a)+" ligt tussen "+n(low)+" en "+n(high)+".",
        "De afstanden zijn "+n(a-low)+" en "+n(high-a)+".", "Het dichtstbijzijnde tiental is "+n(round(a))+"."],
      "Ongeveer "+items(round(a))+".", "Tel vanaf het getal naar beide tientallen. Welke afstand is korter?",
      { type:"line", start:low, end:high, step:1, point:a }, "Hoe kun je aan de getallenlijn zien welk tiental dichterbij ligt?");
  },
  estimate([a,b,target]) {
    const approx = round(a)+round(b), total = a+b;
    const shortage = target === undefined ? 0 : target-total;
    const steps = [n(a)+" ≈ "+n(round(a))+" en "+n(b)+" ≈ "+n(round(b)), "Schatting "+eq(round(a),"+",round(b),approx), "Precies "+eq(a,"+",b,total)];
    const question = target === undefined ? "Rond beide aantallen af op tientallen. Wat is je schatting en wat is het precieze totaal?"
      : "Schat of je genoeg hebt. Reken daarna precies uit of je het aantal dat je nodig hebt haalt.";
    const facts = [card("Eerste hoeveelheid", items(a)),card("Tweede hoeveelheid", items(b))];
    if (target !== undefined) {
      facts.push(card("Benodigd", items(target)));
      steps[2] += ". "+eq(target,"−",total,shortage)+" tekort.";
    }
    return task("schatten en controleren", question, facts, steps, "Geschat "+n(approx)+", precies "+n(total)+ (target === undefined ? " stuks." : " stuks. "+n(shortage)+" tekort."),
      "Maak beide getallen eerst rond op tientallen. Reken met de oorspronkelijke aantallen voor de controle.", null, "Waarom is de precieze berekening belangrijk als je schatting dicht bij het doel ligt?");
  },
  decimalEqual([a]) {
    return task("kommagetallen lezen", "Zijn deze twee maten even lang? Leg uit hoe je dat ziet.", [
      card("Maat A", meters(a)),card("Maat B", m(a)+" m")
    ], [meters(a)+" = "+m(a)+" m","Een nul achteraan bij de decimalen verandert de waarde niet."],
    "Beide maten zijn "+cm(a)+".", "Zet beide maten op dezelfde getallenlijn. Waar liggen ze?",
    { type:"decimal", a, b:a }, "Wat verandert er aan de lengte als je achteraan een nul schrijft?");
  },
  decimalCompare([a,b]) {
    return task("kommagetallen vergelijken", "Welke maat is het grootst?", [
      card("Maat A", meters(a)),card("Maat B", meters(b))
    ], [meters(a)+" = "+m(a)+" m en "+meters(b)+" = "+m(b)+" m",m(a)+" m "+compare(a,b)+" "+m(b)+" m"],
    "Maat "+(a>b?"A":"B")+" is het grootst.", "Schrijf beide maten met twee cijfers achter de komma.",
    { type:"decimal", a, b }, "Waarom helpt een nul achteraan bij het vergelijken?");
  },
  decimalLimit([limit,a,b]) {
    const choice = a<=limit?"A":"B";
    return task("een passende maat kiezen", "Welke maat past binnen de opgegeven maximummaat?", [
      card("Maximum", meters(limit)),card("Maat A", meters(a)),card("Maat B", meters(b))
    ], [m(a)+" m "+compare(a,limit)+" "+m(limit)+" m",m(b)+" m "+compare(b,limit)+" "+m(limit)+" m"],
    "Maat "+choice+" past.", "Vergelijk elke maat apart met het maximum. Zet de cijfers netjes onder elkaar.", null, "Hoe weet je dat jouw keuze binnen de maximummaat valt?");
  },
  stock([a,b,c,target]) {
    const added = a+b, left=added-c;
    const facts = [card("Beginvoorraad",items(a)),card("Er komt bij",items(b)),card("Gebruikt",items(c))];
    const steps=[eq(a,"+",b,added),eq(added,"−",c,left)];
    const need = target !== undefined;
    if(need) {
      facts.push(card("Aantal dat je nodig hebt",items(target)));
      steps.push(eq(target,"−",left,target-left)+" tekort.");
    }
    return task("voorraad bijwerken", need ? "Wat is de eindvoorraad en hoeveel moet je aanvullen?" : "Hoeveel stuks blijven over na levering en gebruik?",
      facts, steps, items(left)+" over."+ (need ? " Vul "+items(target-left)+" aan." : ""),
      "Werk op volgorde. Schrijf de voorraad na de levering apart op.", null, "Bij welke stap tel je erbij en bij welke stap haal je eraf?");
  },
  rest(values) { return withRemainder(values,"rest"); },
  pack(values) { return withRemainder(values,"pack"); },
  both(values) { return withRemainder(values,"both"); },
  ruler([a]) {
    return task("meten", "Leg de nul bij het begin. Welke lengte lees je af bij het uiteinde?", [],
      ["De linkerkant ligt bij 0 cm.","Het uiteinde wijst naar "+cm(a)+"."], cm(a),
      "Wijs eerst de nul aan. Volg dan het voorwerp tot aan het streepje aan de andere kant.",
      {type:"ruler",length:a,end:Math.ceil(a/10)*10}, "Waarom begin je bij de nul op de meetlat?");
  },
  cm([a]) { return convertLength(a,mixed(a)); },
  decimalCm([a]) { return task("omrekenen naar centimeters", "Hoeveel centimeter is deze lengte?", [card("Lengte",m(a)+" m")], ["1 m = 100 cm",m(a)+" × 100 = "+n(a)],cm(a),"Vermenigvuldig het aantal meters met 100.",null,"Waarom verschuift de komma bij vermenigvuldigen met 100?"); },
  fit(values) { return measureFit(values,mixed); },
  decimalFit(values) { return measureFit(values,value=>m(value)+" m"); },
  cmCompare([a,b]) {
    return task("lengtes vergelijken", "Welke lengte is het grootst?", [card("Lengte A",m(a)+" m"),card("Lengte B",cm(b))], [
      m(a)+" m = "+cm(a),cm(a)+" "+compare(a,b)+" "+cm(b)
    ], "Lengte "+(a>b?"A":"B")+" is het grootst.", "Maak van de meters eerst centimeters.", null,
    "Welke eenheid gebruik je om de maten te vergelijken?");
  },
  scale([a]) {
    return task("afwegen", "Welk gewicht lees je op de weegschaal? Noem ook de eenheid.", [],
      ["Op het scherm staat "+n(a)+".","De letter g staat voor gram."], grams(a),
      "Zoek het getal op het scherm en kijk welke eenheid erachter staat.", {type:"scale",grams:grams(a)}, "Waar zie je aan of het gram of kilogram is?");
  },
  massCompare,
  gram([a]) {
    return task("kilogram omrekenen", "Hoeveel gram is dit?", [card("Op de weegschaal",kg(a))], [
      "1 kg = 1.000 g",kg(a)+" = "+grams(a)
    ], grams(a), "Vermenigvuldig het aantal kilogram met 1.000.", null, "Hoeveel gram is een tiende kilogram?");
  },
  massRefill([target,actual]) {
    return task("aanvullen tot het gewicht", "Hoeveel gram moet je nog toevoegen?", [
      card("Doelgewicht",kg(target)),card("Nu op de weegschaal",grams(actual))
    ], [kg(target)+" = "+grams(target),grams(target)+" − "+grams(actual)+" = "+grams(target-actual)],
    grams(target-actual)+" toevoegen.", "Zet eerst het doelgewicht in gram. Bereken daarna het verschil.", null,
    "Hoe controleer je met optellen dat je precies op het doelgewicht komt?");
  }
};

function convertLength(value,label) {
  const whole = Math.floor(value/100)*100;
  return task("omrekenen naar centimeters", "Hoeveel centimeter is deze lengte?", [card("Lengte",label)], [
    "1 m = 100 cm",eq(whole,"+",value%100,value)+" cm"
  ], cm(value), "Elke hele meter is 100 centimeter. Tel de losse centimeters erbij.",
  null, "Waarom kun je 20 cm bij 100 cm optellen?");
}

function withRemainder([total,size], mode) {
  const full = Math.floor(total/size), rest = total%size, needed = Math.ceil(total/size);
  const steps=[eq(full,"×",size,full*size),eq(total,"−",full*size,rest)+" stuks over."];
  const questions={
    rest:"Hoeveel volle bakken maak je? Hoeveel stuks blijven over?",
    pack:"Hoeveel bakken zijn nodig als alle stuks mee moeten?",
    both:"Hoeveel bakken worden vol? Hoeveel bakken zijn nodig als alle stuks mee moeten?"
  };
  const answers = {rest:full+" volle bakken en "+items(rest)+" over.",pack:needed+" bakken nodig.",both:full+" volle bakken. In totaal "+needed+" bakken nodig."};
  if(mode!=="rest") steps.push("Voor de rest gebruik je nog één bak. Samen "+needed+" bakken.");
  return task("inpakken met een rest", questions[mode], [card("Totaal",items(total)),card("Per volle bak",items(size))], steps, answers[mode],
    "Maak zoveel mogelijk volle bakken. Kijk wat er met de laatste stuks moet gebeuren.", null, "Waarom heb je soms een extra bak nodig?");
}

export function buildTask(type,numbers) {
  const method=methods[type];
  if (!method) throw Error("Unknown math type "+type);
  const result=method(numbers);
  if (!result.answer || !result.question || !result.steps.length || result.steps.length>3) throw Error("Incomplete worked example "+type);
  return result;
}
