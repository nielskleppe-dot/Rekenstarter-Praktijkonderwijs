import {studentGoalFor,simplifyStudentTree} from "./student-language.mjs";
import {lessonProfile,moneyContexts} from "./lesson-profiles.mjs";
import {measurementEntries,measurementContext} from "./measurement-authoring.mjs";
import {buildTask} from "./arithmetic.mjs";

const number = value => Number(value.toFixed(6)).toLocaleString("nl-NL", {maximumFractionDigits: 6});
const money = cents => "€ " + (cents / 100).toLocaleString("nl-NL", {minimumFractionDigits: 2, maximumFractionDigits: 2});
const fact = (label, value) => ({label, value: String(value)});
const equation = (a, operator, b, result) => number(a) + " " + operator + " " + number(b) + " = " + number(result);
const clock = minutes => String(Math.floor(minutes / 60) % 24).padStart(2, "0") + "." + String(minutes % 60).padStart(2, "0");
const names = ["Maandag", "Dinsdag", "Woensdag"];

export const catalogDomains = [
  {id:"getallen", title:"Getallen", description:"Tellen, getallenlijnen, optellen en aftrekken onder elkaar, vermenigvuldigen en delen."},
  {id:"meten", title:"Meten", description:"Lengte, gewicht, inhoud, temperatuur en het metriek stelsel."},
  {id:"geldtijd", title:"Geld en tijd", description:"Prijzen, wisselgeld, budgetten, klokkijken en werkplanning."},
  {id:"verhoudingen", title:"Verhoudingen", description:"Halveren, breuken, verhoudingstabellen, procenten en korting."},
  {id:"ruimte", title:"Ruimte en meetkunde", description:"Routes, schaal, omtrek, oppervlakte en materiaal bestellen."},
  {id:"gegevens", title:"Verbanden en gegevens", description:"Turven, tabellen, diagrammen en beslissingen met gegevens."}
];

const yearPlans = [
 [
  ["count","count","countCheck"],["line","diff","diff"],["add","bridge","bridge"],["sub","sub","sub"],["multiply","divide","divide"],["count","refill","divide"],
  ["ruler","cm","fit"],["scale","massCompare","massRefill"],["jug","volumeCompare","volumeRefill"],["chooseLength","chooseMass","chooseVolume"],["temperature","temperatureDifference","temperatureRange"],["cmCompare","massCompare","volumeCompare"],
  ["priceRead","coins","coins"],["priceAddWhole","priceAdd","priceAdd"],["changeCount","changeCheck","change"],["clockHalf","clockFive","planning"],["duration","durationAcross","endTime"],["priceAdd","change","duration"],
  ["double","half","half"],["fractionPicture","quarter","quarter"],["perSet","sets","sets"],["ratioRead","ratioScale","ratioScale"],["percentPicture","percentPart","percentPart"],["half","sets","quarter"],
  ["gridStart","gridRoute","gridCompare"],["gridScale","gridDistance","gridLimit"],["perimeterRead","perimeter","perimeter"],["areaGrid","area","area"],["edgeOrArea","formulaChoose","areaOrEdge"],["gridDistance","perimeter","area"],
  ["tallyMake","tallyRead","tallyRead"],["tableRead","tableCompare","tableDifference"],["barRead","barDifference","barMinimum"],["tableBar","drawBar","checkBar"],["stockRead","stockDifference","stockOrder"],["priceAdd","fit","ratioScale"]
 ],
 [
  ["bridge","refill","need"],["round","estimate","estimateEnough"],["decimalEqual","decimalCompare","decimalLimit"],["bridge","stock","stockShortage"],["rest","pack","both"],["estimate","stock","pack"],
  ["decimalCm","cmCompare","decimalFit"],["gram","massCompare","massRefill"],["convertVolume","volumeAdd","volumeFit"],["smallConvert","smallCompare","smallDifference"],["marginAdd","marginFit","marginChoose"],["decimalFit","massRefill","volumeRoom"],
  ["unitCost","priceMultiply","priceMultiply"],["priceAdd","budget","budgetChoose"],["offerRead","offerTotal","offerCompare"],["sumMinutes","endTimeMulti","durationFit"],["startTime","startTimeMulti","startTimePrep"],["budget","offerCompare","startTimePrep"],
  ["doubleList","halfList","tripleList"],["ratioUnit","ratioViaOne","ratioViaOne"],["unitPrice","unitPriceCompare","unitPriceChoose"],["tenPercent","twentyPercent","reservePercent"],["discountRead","discount","discountFinal"],["ratioViaOne","unitPriceCompare","discountFinal"],
  ["scaleRead","scaleLength","scaleCheck"],["routeParts","routeScale","routeCompare"],["perimeter","perimeterOpen","perimeterOpen"],["halfSides","areaHalf","areaHalf"],["coverageRead","coverageRest","coveragePacks"],["scaleLength","perimeterOpen","coveragePacks"],
  ["tableUnit","tableDifference","stockTable"],["barScale","barDifference","barStock"],["lineRead","lineChange","lineMost"],["sumValues","average","averageDecision"],["selectData","deviation","dataDecision"],["marginFit","ratioViaOne","stockTable"]
 ]
];

const legacyTypes = new Set(["count","line","diff","add","bridge","sub","multiply","divide","refill","need","round","estimate","decimalEqual","decimalCompare","decimalLimit","stock","rest","pack","both","ruler","cm","decimalCm","fit","decimalFit","cmCompare","scale","gram","massCompare","massRefill"]);

function legacyNumbers(type, index, year) {
  const i = index % 8;
  const a = 27 + i * 3 + (year - 1) * 10;
  const b = 14 + i;
  const size = 3 + i % 4;
  const groups = 3 + i % 3;
  const cm = 120 + i * 5;
  const grams = 250 + i * 100;
  switch (type) {
    case "count": return [2 + i % 5, 2 + i % 7];
    case "line": case "diff": case "add": case "bridge": case "sub": case "estimate": return [a, b];
    case "round": return [a];
    case "multiply": return [groups, size];
    case "divide": return [groups * size, groups];
    case "refill": return [a, a + b];
    case "need": return [a, b, a + b + 9];
    case "decimalEqual": return [110 + i * 10];
    case "decimalCompare": return [120 + i * 5, 115 + i * 5];
    case "decimalLimit": return [140 + i * 10, 138 + i * 10, 145 + i * 10];
    case "stock": return [a, b, 9 + i];
    case "rest": case "pack": case "both": return [groups * size + 1, size];
    case "ruler": return [12 + i * 2];
    case "cm": case "decimalCm": return [cm];
    case "cmCompare": return [cm, cm + 8];
    case "fit": case "decimalFit": return [cm, cm + (i % 2 ? 7 : -9)];
    case "scale": case "gram": return [grams];
    case "massCompare": return [grams, grams + 50];
    case "massRefill": return [year === 1 ? 1000 : 1200, 350 + i * 50];
    default: throw new Error("Unknown legacy type " + type);
  }
}

function task(question, facts, steps, answer, hint, model = null, result = null) {
  return {question, facts, steps, answer, hint, visual:null, model, result,
    explain:"Welke tussenstap bewijst je antwoord? Controleer met een andere berekening of met het materiaal."};
}

export function createCatalogTask(kind, index, year) {
  const i = index % 8;
  const n = i + 1;
  if (legacyTypes.has(kind)) {
    const args = legacyNumbers(kind, index, year);
    const convertedLength=["cm","decimalCm","cmCompare","fit","decimalFit"].includes(kind);
    const convertedMass=["gram","massCompare","massRefill"].includes(kind);
    const model=convertedLength?{kind:"metric",row:"length",from:"m",to:"cm",value:args[0]/100}:
      convertedMass?{kind:"metric",row:"mass",from:"kg",to:"g",value:args[0]/1000}:
      ["add","sub","bridge"].includes(kind)?{kind:"column",a:args[0],b:args[1],add:kind!=="sub"}:null;
    return {...buildTask(kind,args),model};
  }
  if (kind === "countCheck") {
    const groups=2+i%5, loose=2+i%7, target=groups*10+loose+2;
    return buildTask("count",[groups,loose,target]);
  }
  if (kind === "estimateEnough") return buildTask("estimate",[37+i,46+i,90+2*i]);
  if (kind === "stockShortage") return buildTask("stock",[36+i,25+i,18+i,70+2*i]);

  if (["jug","convertVolume","volumeCompare","volumeRefill","volumeAdd","volumeFit","volumeRoom"].includes(kind)) {
    const ml=250+i*100, second=150+i*25, target=2000;
    const model={kind:"jug",amount:ml,capacity:1000,step:50};
    if (kind==="jug") return task("Lees de maatbeker af. Hoeveel ml is er afgemeten?",[],["Begin bij 0 ml. Lees de lijn bij de bovenkant van het water af.","De lijn bij de bovenkant van het water staat bij "+ml+" ml."],ml+" ml","Hoeveel is één stapje tussen de streepjes?",model,ml);
    if (kind==="convertVolume") return task("Hoeveel milliliter is dit?",[fact("Hoeveelheid",number(ml/1000)+" l")],["1 l = 1.000 ml",equation(ml/1000,"×",1000,ml)],ml+" ml","Een liter is duizend milliliter.",{kind:"metric",row:"volume",from:"l",to:"ml",value:ml/1000},ml);
    if (kind==="volumeCompare") return task("Welke hoeveelheid is groter?",[fact("A",number(ml/1000)+" l"),fact("B",(ml+100)+" ml")],[number(ml/1000)+" l = "+ml+" ml",ml+" ml < "+(ml+100)+" ml"],"B heeft 100 ml meer.","Schrijf beide hoeveelheden in ml.",{kind:"metric",row:"volume",from:"l",to:"ml",value:ml/1000},100);
    if (kind==="volumeRefill") return task("Hoeveel ml moet erbij om op 1 liter te komen?",[fact("Doel","1 l"),fact("Nu",(100+i*100)+" ml")],["1 l = 1.000 ml",equation(1000,"−",100+i*100,900-i*100)],(900-i*100)+" ml toevoegen.","Reken eerst het doel om naar ml.",{kind:"jug",amount:100+i*100,capacity:1000,step:100},900-i*100);
    if (kind==="volumeAdd") return task("Hoeveel ml is het samen?",[fact("A",number(ml/1000)+" l"),fact("B",second+" ml")],[number(ml/1000)+" l = "+ml+" ml",equation(ml,"+",second,ml+second)],(ml+second)+" ml samen.","Zet liters eerst om naar ml.",null,ml+second);
    if (kind==="volumeRoom") return task("Hoeveel ml kan er nog bij?",[fact("Kan",number(target/1000)+" l"),fact("Al gevuld",ml+" ml")],["2 l = 2.000 ml",equation(target,"−",ml,target-ml)],(target-ml)+" ml kan er nog bij.","Bereken de ruimte tussen de lijn bij de bovenkant van het water en de bovenste vulstreep.",null,target-ml);
    const sum=ml+second, capacity=i%2?sum-50:sum+100;
    return task("Past de totale hoeveelheid in de kan?",[fact("A",number(ml/1000)+" l"),fact("B",second+" ml"),fact("Kan",capacity+" ml")],[number(ml/1000)+" l = "+ml+" ml",equation(ml,"+",second,sum),sum+" ml "+(sum<=capacity?"≤":" >")+" "+capacity+" ml"],sum<=capacity?"Ja, er blijft 100 ml ruimte over.":"Nee, de kan is 50 ml te klein.","Zet eerst alles in dezelfde eenheid.",null,sum);
  }
  if (["chooseLength","chooseMass","chooseVolume"].includes(kind)) {
    const choices={
      chooseLength:[["een deurhoogte van ongeveer 2","m"],["een plank van ongeveer 1,5","m"],["een schroefdikte van ongeveer 3","mm"],["een korte stengel van ongeveer 20","cm"],["een gebouw van ongeveer 10","m"],["een klein zaadje van ongeveer 2","mm"],["een schapbreedte van ongeveer 120","cm"],["een hekje van ongeveer 90","cm"]],
      chooseMass:[["een pak meel van ongeveer 1","kg"],["een klein zakje van ongeveer 125","g"],["een volle pallet van ongeveer 500","kg"],["een paperclip van ongeveer 1","g"],["een emmer potgrond van ongeveer 5","kg"],["een klein pak meel van ongeveer 500","g"],["een pakje van ongeveer 250","g"],["een doos schroeven van ongeveer 2","kg"]],
      chooseVolume:[["een gieter van ongeveer 10","l"],["een klein flesje van ongeveer 250","ml"],["een kleine maatbeker van ongeveer 100","ml"],["een regenton van ongeveer 200","l"],["een geijkte pipet van 1","ml"],["een waterkan van ongeveer 2","l"],["een drinkbeker van ongeveer 200","ml"],["een tank van ongeveer 1.000","l"]]
    };
    const [object,unit]=choices[kind][i];
    const options=kind==="chooseLength"?"mm, cm of m":kind==="chooseMass"?"g of kg":"ml of l";
    const row=kind==="chooseLength"?"length":kind==="chooseMass"?"mass":"volume";
    return task("Je meet "+object+". Welke eenheid past, "+options+"?",[],["Vergelijk met een bekende maat die je al kent.","Kies "+unit+" voor deze hoeveelheid."],unit,"Vergelijk met een meterstok, kilopak of literpak.",{kind:"reference",row,unit,quantity:object.match(/\d[\d.,]*/)?.[0]},unit);
  }

  if (["temperature","temperatureDifference","temperatureRange"].includes(kind)) {
    const a=8+i*2,b=a+6;
    const facts=[fact("Meting A",a+" °C"),fact("Meting B",b+" °C")];
    const model={kind:"thermometer",value:a,max:30};
    if(kind==="temperature")return task("Welke temperatuur lees je af?",[],["Lees de waarde per streep af.","De vloeistof staat bij "+a+" °C."],a+" °C","Lees eerst de schaalverdeling.",model,a);
    if(kind==="temperatureDifference")return task("Hoeveel graden is meting B warmer?",facts,[equation(b,"−",a,6)],"6 °C warmer.","Vergelijk de temperaturen in dezelfde eenheid.",model,6);
    const lower=a-2,upper=a+3,value=i%2?upper+1:a;
    return task("Ligt de temperatuur binnen de afgesproken grenzen?",[fact("Minimum",lower+" °C"),fact("Maximum",upper+" °C"),fact("Meting",value+" °C")],["Vergelijk de meting met beide grenzen.",value+" °C "+(value<=upper?"ligt binnen":"ligt boven")+" de grenzen."],value<=upper?"Ja, de meting ligt binnen de grenzen.":"Nee, de meting is 1 °C boven de hoogste grens.","Controleer eerst de laagste grens en dan de hoogste grens.",{kind:"thermometer",value,max:30},value<=upper);
  }
  if (["smallConvert","smallCompare","smallDifference"].includes(kind)) {
    const mm=35+i*4,other=mm+6;
    const model={kind:"metric",row:"length",from:"cm",to:"mm",value:mm/10};
    if(kind==="smallConvert")return task("Hoeveel millimeter is de maat?",[fact("Lengte",number(mm/10)+" cm")],["1 cm = 10 mm",equation(mm/10,"×",10,mm)],mm+" mm","Een centimeter bestaat uit tien millimeters.",model,mm);
    if(kind==="smallCompare")return task("Welke maat is groter?",[fact("A",number(mm/10)+" cm"),fact("B",other+" mm")],[number(mm/10)+" cm = "+mm+" mm",other+" mm > "+mm+" mm"],"B is 6 mm groter.","Zet centimeters eerst om naar millimeters.",model,6);
    return task("Hoeveel millimeter verschilt het materiaal van de maat op de bon?",[fact("Nodig",number(mm/10)+" cm"),fact("Materiaal",other+" mm")],[number(mm/10)+" cm = "+mm+" mm",equation(other,"−",mm,6)],"Het materiaal is 6 mm te lang.","Vergelijk beide lengtes in mm.",model,6);
  }
  if (["marginAdd","marginFit","marginChoose"].includes(kind)) {
    const object=100+i*5,margin=5,needed=object+margin,available=needed+(i%2? -2:3);
    const facts=[fact("Voorwerp",object+" cm"),fact("Extra vrije ruimte",margin+" cm")];
    if(kind==="marginAdd")return task("Hoeveel ruimte heb je nodig?",facts,[equation(object,"+",margin,needed)],needed+" cm","Tel de gevraagde vrije ruimte bij het voorwerp op.",null,needed);
    if(kind==="marginChoose")return task("Welk voorwerp past met minstens 5 cm vrije ruimte?",[fact("Beschikbaar",needed+" cm"),fact("Voorwerp A",object+" cm"),fact("Voorwerp B",(object+2)+" cm")],[equation(object,"+",5,needed),equation(object+2,"+",5,needed+2)],"Voorwerp A past met 5 cm vrije ruimte.","Tel bij beide voorwerpen eerst de vrije ruimte op.",null,object);
    return task("Past het voorwerp met de gevraagde vrije ruimte?",[...facts,fact("Beschikbaar",number(available/100)+" m")],[equation(object,"+",margin,needed),number(available/100)+" m = "+available+" cm",available+" cm "+(available>=needed?"≥":"<")+" "+needed+" cm"],available>=needed?"Ja, er is genoeg vrije ruimte.":"Nee, er ontbreekt 2 cm.","Reken alle maten om naar cm en neem de vrije ruimte mee.",null,available>=needed);
  }
  const priceA=375+i*25,priceB=250+i*10,payment=2000;
  if (["priceRead","coins","priceAddWhole","priceAdd","changeCount","changeCheck","change","unitCost","priceMultiply","budget","budgetChoose","offerRead","offerTotal","offerCompare"].includes(kind)) {
    if(kind==="priceRead")return task("Lees de prijs in euro en cent.",[fact("Prijs",money(priceA))],[Math.floor(priceA/100)+" hele euro en "+(priceA%100)+" cent."],money(priceA),"De cijfers na de komma zijn de centen.",{kind:"price",cents:priceA},priceA);
    if(kind==="coins"){const value=200+50*(i%4)+20;return task("Betaal gepast. Welke munten kun je gebruiken?",[fact("Te betalen",money(value))],["Neem eerst € 2,00.", "Vul aan met "+(i%4)+" munten van 50 cent en één munt van 20 cent."],"€ 2,00 + "+(i%4)+" × € 0,50 + € 0,20 = "+money(value),"Begin met de grootste munt die past.",{kind:"price",cents:value},value);}
    if(kind==="unitCost"||kind==="priceMultiply"){const count=3+i%4;return task("Wat kost de bestelling?",[fact("Aantal",count),fact("Prijs per stuk",money(priceA))],[equation(count,"×",priceA/100,count*priceA/100)],money(count*priceA),"Vermenigvuldig het aantal met de prijs per stuk.",{kind:"table",head:["Aantal","Prijs per stuk"],rows:[[count,money(priceA)]]},count*priceA);}
    if(kind==="offerRead"||kind==="offerTotal"||kind==="offerCompare"){
      const first=priceA+priceB,shipping=150,second=first+75;
      const facts=[fact("Aanbieding A",money(first)),fact("Verzending A",money(shipping)),fact("Aanbieding B, met verzending",money(second))];
      if(kind==="offerRead")return task("Welke kosten tel je op bij aanbieding A?",facts,["De artikelen en de verzendkosten horen allebei bij A.",equation(first/100,"+",shipping/100,(first+shipping)/100)],money(first+shipping),"Neem ook de verzendkosten mee.",null,first+shipping);
      if(kind==="offerTotal")return task("Wat kost elke aanbieding in totaal?",facts,[equation(first/100,"+",shipping/100,(first+shipping)/100),"B kost met verzending "+money(second)+"."],"A "+money(first+shipping)+"; B "+money(second)+".","Reken beide aanbiedingen voor dezelfde bestelling uit.",null,first+shipping);
      return task("Welke aanbieding is goedkoper en hoeveel scheelt het?",facts,[equation(first/100,"+",shipping/100,(first+shipping)/100),equation((first+shipping)/100,"−",second/100,0.75)],"B is € 0,75 goedkoper.","Vergelijk beide prijzen met alle kosten erbij.",null,75);
    }
    const a=kind==="priceAddWhole"?(3+i)*100:priceA,b=kind==="priceAddWhole"?(2+i)*100:priceB,total=a+b;
    if(kind.startsWith("change")){
      const price=500+i*65,back=payment-price;
      return task(kind==="changeCount"?"Hoeveel krijg je terug? Tel door vanaf de prijs.":kind==="changeCheck"?"Klopt het wisselgeld? Controleer met optellen.":"Hoeveel wisselgeld geef je terug?",[fact("Prijs",money(price)),fact("Betaald",money(payment)),...(kind==="changeCheck"?[fact("Wisselgeld",money(back))]:[])],[equation(payment/100,"−",price/100,back/100),equation(price/100,"+",back/100,payment/100)],money(back)+" terug.","Bereken het verschil tussen betaald en de prijs.",{kind:"price",cents:price},back);
    }
    if(kind==="budgetChoose")return task("Welke keuze kun je met dit geld kopen?",[fact("Budget",money(total+100)),fact("Combinatie A",money(total)),fact("Combinatie B",money(total+150))],[equation((total+100)/100,"−",total/100,1)],"Combinatie A; er blijft € 1,00 over.","Vergelijk elke combinatie met hetzelfde budget.",null,total);
    if(kind==="budget")return task("Hoeveel geld houd je over?",[fact("Budget",money(payment)),fact("Kosten A",money(a)),fact("Kosten B",money(b))],[equation(a/100,"+",b/100,total/100),equation(payment/100,"−",total/100,(payment-total)/100)],money(payment-total)+" over.","Tel eerst de kosten op. Trek ze daarna af van het budget.",null,payment-total);
    return task("Wat is de prijs van alles samen?",[fact("Artikel A",money(a)),fact("Artikel B",money(b))],[equation(a/100,"+",b/100,total/100)],money(total),"Zet euro's onder euro's en centen onder centen.",{kind:"price",cents:a},total);
  }


  if (["clockHalf","clockFive","planning","duration","durationAcross","endTime","sumMinutes","endTimeMulti","durationFit","startTime","startTimeMulti","startTimePrep"].includes(kind)) {
    const start=kind==="durationAcross"?9*60+45:9*60+i*5;
    const duration=kind==='duration'?10+i*2:20+i*5,second=15,end=start+duration;
    if(kind==="clockHalf"||kind==="clockFive"||kind==="planning"){
      const at=kind==="clockHalf"?8*60+(i%4)*30:8*60+5*(i+1);
      const model={kind:"clock",minutes:at};
      if(kind==="planning")return task("Hoe laat begint de tweede taak?",[],["Lees de juiste rij in de planning.","De tweede taak begint om "+clock(at+30)+" uur."],clock(at+30)+" uur","Zoek eerst de tweede taak.",{kind:"table",head:["Taak","Begin"],rows:[["Klaarzetten",clock(at)],["Uitvoeren",clock(at+30)],["Opruimen",clock(at+60)]]},at+30);
      return task("Welke digitale tijd hoort bij deze klok?",[],["Lees eerst de kleine wijzer.","Lees daarna de minuten vanaf twaalf."],clock(at)+" uur","Kijk eerst naar het uur, daarna naar de minuten.",model,at);
    }
    if(kind.startsWith("startTime")){
      const finish=14*60+30,work=30+i*5,prep=kind==="startTimePrep"?10:0,extra=kind==="startTime"?0:20,total=work+prep+extra;
      return task("Hoe laat moet je beginnen om op tijd klaar te zijn?",[fact("Klaar om",clock(finish)+" uur"),fact("Taak",work+" minuten"),fact("Volgende taak",extra+" minuten"),fact("Voorbereiden",prep+" minuten")],[equation(work,"+",extra+prep,total),"Reken vanaf "+clock(finish)+" uur "+total+" minuten terug."],clock(finish-total)+" uur","Tel de minuten die je nodig hebt bij elkaar en werk terug vanaf de eindtijd.",{kind:"timeline",start:finish-total,end:finish},finish-total);
    }
    if(kind==="sumMinutes")return task("Hoeveel minuten duren de werkstappen samen?",[fact("Stap A",duration+" minuten"),fact("Stap B",second+" minuten")],[equation(duration,"+",second,duration+second)],(duration+second)+" minuten","Tel de duur van beide stappen op.",null,duration+second);
    if(kind==="durationFit"){
      const available=duration+second+(i%2? -5:10);
      return task("Passen de taken en het opruimen in de tijd die je hebt?",[fact("Taak",duration+" minuten"),fact("Volgende taak",second+" minuten"),fact("Opruimen","10 minuten"),fact("Beschikbaar",available+" minuten")],[equation(duration,"+",second,duration+second),equation(duration+second,"+",10,duration+second+10)],available>=duration+second+10?"Ja, alles past precies.":"Nee, er is 15 minuten te weinig.","Neem de opruimtijd mee.",null,available>=duration+second+10);
    }
    if(kind==="endTime"||kind==="endTimeMulti"){
      const total=duration+(kind==="endTimeMulti"?second:0);
      return task("Hoe laat ben je klaar?",[fact("Begin",clock(start)+" uur"),fact("Werkduur",total+" minuten")],["Tel vanaf "+clock(start)+" uur "+total+" minuten door.","De eindtijd is "+clock(start+total)+" uur."],clock(start+total)+" uur","Tel eerst tot het hele uur, daarna de minuten die overblijven.",{kind:"timeline",start,end:start+total},start+total);
    }
    return task("Hoeveel minuten werk je?",[fact("Begin",clock(start)+" uur"),fact("Eind",clock(end)+" uur")],["Tel minuten vanaf "+clock(start)+" tot "+clock(end)+".",duration+" minuten."],duration+" minuten","Een uur heeft 60 minuten. Tel zo nodig via het hele uur.",{kind:"timeline",start,end},duration);
  }

  if (["double","half","quarter","fractionPicture","perSet","sets","ratioRead","ratioScale","doubleList","halfList","tripleList","ratioUnit","ratioViaOne"].includes(kind)) {
    const per=6+i%4,groups=4,target=year===1?4:6,total=groups*per;
    if(["double","half","quarter","fractionPicture"].includes(kind)){
      const divisor=kind==="double"?0:kind==="half"?2:kind==="fractionPicture"?(i%2?4:2):4;
      const result=kind==="double"?total*2:total/divisor;
      const question=kind==="double"?"Hoeveel heb je voor twee keer zoveel nodig?":kind==="fractionPicture"?"Hoeveel stuks stelt het gekleurde deel van de voorraad voor?":"Hoeveel is "+(divisor===2?"de helft":"een kwart")+" van de voorraad?";
      return task(question,[fact("Voorraad",total+" stuks")],[equation(total,kind==="double"?"×":"÷",kind==="double"?2:divisor,result)],result+" stuks",kind==="double"?"Neem dezelfde hoeveelheid nog een keer.":"Verdeel de hoeveelheid in "+divisor+" gelijke delen.",{kind:"fraction",total,parts:kind==="fractionPicture"?4:divisor||2,filled:kind==="fractionPicture"&&divisor===2?2:1},result);
    }
    if(["doubleList","halfList","tripleList"].includes(kind)){
      const factor=kind==="doubleList"?2:kind==="halfList"?0.5:3;
      return task("Pas beide hoeveelheden aan voor "+(factor===0.5?"half zoveel":factor+" keer zoveel")+" sets.",[fact("Materiaal A",total+" stuks"),fact("Materiaal B",(total+8)+" stuks")],[equation(total,"×",factor,total*factor),equation(total+8,"×",factor,(total+8)*factor)],"A "+(total*factor)+" stuks; B "+((total+8)*factor)+" stuks.","Gebruik bij beide materialen dezelfde factor.",{kind:"ratio",head:["Materiaal","Oud","Nieuw"],rows:[["A",total,"?"],["B",total+8,"?"]]},[total*factor,(total+8)*factor]);
    }
    if(kind==="perSet"||kind==="ratioRead")return task("Hoeveel stuks horen bij één set?",[],[equation(total,"÷",groups,per)],per+" stuks per set.","Zoek de kolom voor één set.",{kind:"ratio",head:["Sets",1,4],rows:[["Materiaal (stuks)",per,total]]},per);
    if(kind==="sets"||kind==="ratioScale")return task("Hoeveel stuks zijn nodig voor "+target+" sets?",[fact("Per set",per+" stuks"),fact("Aantal sets",target)],[equation(target,"×",per,target*per)],(target*per)+" stuks","Vermenigvuldig het aantal sets met de hoeveelheid per set.",{kind:"ratio",head:["Sets",1,target],rows:[["Materiaal (stuks)",per,"?"]]},target*per);
    if(kind==="ratioUnit")return task("Hoeveel stuks horen bij één set?",[fact("Sets",groups),fact("Totaal",total+" stuks")],[equation(total,"÷",groups,per)],per+" stuks per set.","Deel de totale hoeveelheid door het aantal sets.",{kind:"ratio",head:["Sets",groups,1],rows:[["Materiaal (stuks)",total,"?"]]},per);
    return task("Je gaat van "+groups+" sets naar "+target+" sets. Hoeveel materiaal heb je nodig?",[fact("Voor "+groups+" sets",total+" stuks")],[equation(total,"÷",groups,per),equation(per,"×",target,per*target)],(per*target)+" stuks","Reken eerst naar één set en daarna naar het nieuwe aantal.",{kind:"ratio",head:["Sets",groups,1,target],rows:[["Materiaal (stuks)",total,"?","?"]]},per*target);
  }
  if (["percentPicture","percentPart","tenPercent","twentyPercent","reservePercent","discountRead","discount","discountFinal","unitPrice","unitPriceCompare","unitPriceChoose"].includes(kind)) {
    if(kind.startsWith("unitPrice")){
      const count=4+i%3,per=125+i*5,total=count*per,other=count+2,perOther=per-10;
      const facts=[fact("Pak A, aantal",count),fact("Pak A, prijs",money(total)),fact("Pak B, aantal",other),fact("Pak B, prijs",money(other*perOther))];
      if(kind==="unitPrice")return task("Wat kost één stuk uit pak A?",facts,[equation(total/100,"÷",count,per/100)],money(per)+" per stuk","Deel de pakprijs door het aantal stuks.",null,per);
      return task("Welke verpakking is voordeliger per stuk?",facts,[equation(total/100,"÷",count,per/100),equation(other*perOther/100,"÷",other,perOther/100)],"B is € 0,10 per stuk voordeliger.","Vergelijk prijzen voor één stuk.",null,10);
    }
    const percent=kind==="tenPercent"?10:kind==="percentPart"?(i%2?50:25):kind==="percentPicture"?50:20;
    const amount=kind.startsWith("discount")?2000+i*500:40+i*20;
    const value=amount*percent/100;
    if(kind==="percentPicture"){const filled=i%2?1:2;return task("Welk percentage van de voorraad is gekleurd?",[],["Het geheel bestaat uit vier gelijke delen.","Er zijn "+filled+" van de vier delen gekleurd."],(filled*25)+"%","Het hele plaatje is 100%.",{kind:"fraction",total:40+i*20,parts:4,filled},filled*25);}
    if(kind==="discountRead")return task("Van welk bedrag bereken je de korting?",[fact("Oorspronkelijke prijs",money(amount)),fact("Korting","20%")],["Neem de prijs zonder korting als geheel.","De korting is 20% van "+money(amount)+"."],money(amount),"Zoek de prijs vóór korting.",null,amount);
    if(kind==="discount"||kind==="discountFinal"){
      const steps=[equation(amount/100,"÷",10,amount/1000),equation(amount/1000,"×",2,value/100)];
      if(kind==="discountFinal")steps.push(equation(amount/100,"−",value/100,(amount-value)/100));
      return task(kind==="discount"?"Hoeveel euro korting krijg je?":"Wat betaal je na 20% korting?",[fact("Prijs",money(amount)),fact("Korting","20%")],steps,money(kind==="discount"?value:amount-value),"Bereken eerst 10%, verdubbel voor 20% en trek zo nodig de korting af.",{kind:"percent",percent:20},kind==="discount"?value:amount-value);
    }
    const percentSteps=percent===50?[equation(amount,"÷",2,value)]:percent===25?[equation(amount,"÷",4,value)]:percent===10?[equation(amount,"÷",10,value)]:[equation(amount,"÷",10,amount/10),equation(amount/10,"×",2,value)];
    return task("Hoeveel stuks is "+percent+"% van de voorraad?",[fact("Voorraad",amount+" stuks"),fact("Apart leggen",percent+"%")],percentSteps,value+" stuks","Gebruik voor 50% de helft, voor 25% een kwart, voor 10% delen door tien.",{kind:"percent",percent},value);
  }

  if (["gridStart","gridRoute","gridCompare","gridScale","gridDistance","gridLimit","scaleRead","scaleLength","scaleCheck","routeParts","routeScale","routeCompare"].includes(kind)) {
    const east=2+i%4,north=2+i%3,scale=kind.startsWith("scale")||kind.startsWith("route")?2:1;
    const distance=(east+north)*scale;
    const model={kind:"grid",east,north,scale};
    if(kind==="gridStart")return task("Je begint bij S. Naar welke kant ga je eerst om de getekende route te volgen?",[],["Wijs S aan.","Volg het eerste stuk naar rechts."],"Naar rechts.","Wijs het startpunt aan voordat je beweegt.",model,"rechts");
    if(kind==="gridScale"||kind==="scaleRead")return task("Hoeveel meter stelt één "+(kind==="scaleRead"?"centimeter":"vakje")+" voor?",[fact("Legenda","1 "+(kind==="scaleRead"?"cm":"vakje")+" = "+scale+" m")],["Lees de legenda bij de tekening.",scale+" meter per "+(kind==="scaleRead"?"centimeter":"vakje")+"."],scale+" m","Lees de eenheid in de legenda.",model,scale);
    if(kind==="scaleLength"||kind==="scaleCheck"){
      const drawing=3+i;
      return task("Op de tekening is het "+drawing+" cm. Hoeveel meter is dat in het echt?",[fact("Schaal","1 cm = 2 m")],[equation(drawing,"×",2,drawing*2)],drawing*2+" m","Vermenigvuldig met het aantal meters per centimeter.",model,drawing*2);
    }
    if(kind==="gridCompare"||kind==="routeCompare")return task("Route A volgt de getekende lijn. Route B is "+(distance+2*scale)+" m. Welke route is korter en hoeveel?",[fact("Legenda","1 vakje = "+scale+" m")],[equation(east+north,"×",scale,distance),equation(distance+2*scale,"−",distance,2*scale)],"Route A is "+(2*scale)+" m korter.","Tel de afgelegde vakjes. Vergelijk de afstanden in meters.",model,2*scale);
    if(kind==="gridLimit")return task("Je mag niet meer dan "+(distance-1)+" m lopen. Blijft de getekende route binnen die grens?",[],[equation(east,"+",north,east+north)],"Nee, de route is 1 m te lang.","Bereken eerst de hele afstand.",model,false);
    return task(kind==="routeParts"?"Hoeveel vakjes telt elk deel en hoeveel samen?":"Hoeveel meter is de hele route?",[fact("Legenda","1 vakje = "+scale+" m")],[equation(east,"+",north,east+north),equation(east+north,"×",scale,distance)],distance+" m","Tel de stukken naar rechts en omhoog. Gebruik daarna de legenda.",model,distance);
  }
  if (["perimeterRead","perimeter","perimeterOpen","areaGrid","area","edgeOrArea","formulaChoose","areaOrEdge","halfSides","areaHalf","coverageRead","coverageRest","coveragePacks"].includes(kind)) {
    const length=3+i%4+(kind==="areaHalf"||kind==="halfSides"?0.5:0),width=2+i%3,area=length*width,perimeter=2*(length+width),opening=1,coverage=4;
    const model={kind:"rectangle",length,width,unit:"m",grid:kind==="areaGrid",edge:kind.includes("perimeter")};
    const facts=[fact("Lengte",number(length)+" m"),fact("Breedte",width+" m")];
    if(kind==="edgeOrArea")return task("Je legt materiaal langs de buitenrand. Bereken je omtrek of oppervlakte?",facts,["Het materiaal ligt langs de rand.","Daarvoor bereken je de omtrek."],"Omtrek, met een eenheid in meter.","Wijs de rand aan en daarna het vlak.",model,"omtrek");
    if(kind==="formulaChoose")return task("Je bedekt het hele vlak. Welke berekening en eenheid gebruik je?",facts,["Oppervlakte = lengte × breedte.",equation(length,"×",width,area)],number(area)+" m²","Voor bedekken heb je vierkante meters nodig.",model,area);
    if(kind==="halfSides")return task("Lees de lengte en breedte af. Welke maat heeft een halve meter?",facts,[number(length)+" m bestaat uit "+Math.floor(length)+" m en 50 cm."],number(length)+" m","Een halve meter is 50 cm.",model,length);
    if(kind==="coverageRead")return task("Hoeveel vierkante meter bedekt één verpakking?",[fact("Dekking per verpakking",coverage+" m²")],["Lees de dekking op het etiket."],coverage+" m²","Zoek m² per verpakking.",model,coverage);
    if(kind==="coverageRest"||kind==="coveragePacks"){
      const full=Math.floor(area/coverage),rest=area-full*coverage,packs=Math.ceil(area/coverage);
      return task(kind==="coverageRest"?"Hoeveel verpakkingen gaan helemaal op en hoeveel m² moet je daarna nog bedekken?":"Hoeveel verpakkingen bestel je om het hele vlak te bedekken?",[...facts,fact("Per verpakking",coverage+" m²")],[equation(length,"×",width,area),equation(full,"×",coverage,full*coverage),equation(area,"−",full*coverage,rest)],kind==="coverageRest"?full+" hele verpakkingen; nog "+number(rest)+" m².":packs+" verpakkingen.","Bestel bij een stuk dat nog niet bedekt is een extra verpakking.",model,kind==="coverageRest"?[full,rest]:packs);
    }
    if(kind==="perimeterRead")return task("Hoe lang zijn de vier zijden samen?",facts,[equation(length,"+",width,length+width),equation(length+width,"×",2,perimeter)],perimeter+" m","Loop met je vinger één keer rond de rand.",model,perimeter);
    if(kind==="perimeter"||kind==="perimeterOpen"){
      const result=perimeter-(kind==="perimeterOpen"?opening:0);
      return task(kind==="perimeterOpen"?"Hoeveel meter randmateriaal is nodig met een doorgang van 1 m?":"Hoeveel meter materiaal is nodig langs de hele rand?",kind==="perimeterOpen"?[...facts,fact("Opening","1 m")]:facts,[equation(length,"+",width,length+width),equation(length+width,"×",2,perimeter),...(kind==="perimeterOpen"?[equation(perimeter,"−",opening,result)]:[])],result+" m","Tel alle zijden op. Trek alleen een afgesproken opening af.",model,result);
    }
    return task("Hoeveel vierkante meter moet je bedekken?",facts,[equation(length,"×",width,area)],area+" m²","Tel vierkante vakjes of gebruik lengte × breedte.",model,area);
  }


  const dataKinds=["tallyMake","tallyRead","tableRead","tableCompare","tableDifference","barRead","barDifference","barMinimum","tableBar","drawBar","checkBar","stockRead","stockDifference","stockOrder","tableUnit","stockTable","barScale","barStock","lineRead","lineChange","lineMost","sumValues","average","averageDecision","selectData","deviation","dataDecision"];
  if(dataKinds.includes(kind)){
    const values=[10+i*5,20+i*5,15+i*5],target=40+i*5,labels=["A","B","C"];
    const table={kind:"table",head:["Plek","Voorraad (stuks)","Nodig (stuks)"],rows:values.map((v,j)=>[labels[j],v,target])};
    const bars={kind:"bars",labels,values,step:5,unit:"stuks",title:"Voorraad per plek"};
    if(kind==="tallyMake"||kind==="tallyRead"){
      const total=12+i*3;
      return task(kind==="tallyMake"?"Noteer het aantal dat je hebt geteld met turfstreepjes.":"Hoeveel stuks geven de turfstreepjes aan?",kind==="tallyMake"?[fact("Geteld",total+" stuks")]:[],[equation(Math.floor(total/5),"×",5,Math.floor(total/5)*5),equation(Math.floor(total/5)*5,"+",total%5,total)],total+" stuks","Vier streepjes met een streep erdoor zijn samen vijf.",kind==="tallyRead"?{kind:"tally",total}:null,total);
    }
    if(kind.startsWith("line")){
      const measurements=[10+i,14+2*i,16+3*i],first=measurements[1]-measurements[0],second=measurements[2]-measurements[1];
      const model={kind:"lineChart",labels:names,values:measurements,unit:"stuks",title:"Voorraad per meetdag"};
      if(kind==="lineRead")return task("Welk aantal lees je op dinsdag af?",[],["Zoek dinsdag op de lijn onder de grafiek.","Lees het aantal bij het meetpunt af."],measurements[1]+" stuks","Ga vanaf de dag recht omhoog naar het meetpunt.",model,measurements[1]);
      if(kind==="lineChange")return task("Hoeveel stuks zijn er op dinsdag meer dan op maandag?",[],[equation(measurements[1],"−",measurements[0],first)],first+" stuks","Haal het eerste getal van het laatste getal af.",model,first);
      return task("Tussen welke dagen komen de meeste stuks erbij?",[],[equation(measurements[1],"−",measurements[0],first),equation(measurements[2],"−",measurements[1],second)],"Van maandag op dinsdag; "+first+" stuks.","Reken voor elke stap uit hoeveel erbij komt. Vergelijk de twee antwoorden.",model,first);
    }
    if(["sumValues","average","averageDecision"].includes(kind)){
      const measures=[12+3*i,18+3*i,24+3*i],sum=measures.reduce((a,b)=>a+b,0),mean=sum/3,goal=mean+2;
      const model={kind:"table",head:["Dag","Aantal (stuks)"],rows:names.map((name,j)=>[name,measures[j]])};
      if(kind==="sumValues")return task("Hoeveel stuks zijn er in de drie dagen samen klaar?",[],[equation(measures[0],"+",measures[1],measures[0]+measures[1]),equation(measures[0]+measures[1],"+",measures[2],sum)],sum+" stuks","Tel de drie dagtotalen op.",model,sum);
      return task(kind==="average"?"Hoeveel stuks zijn er gemiddeld per dag klaar?":"Het doel is gemiddeld "+goal+" stuks per dag. Is dat gehaald?",[],[equation(measures[0],"+",measures[1],measures[0]+measures[1]),equation(measures[0]+measures[1],"+",measures[2],sum),equation(sum,"÷",3,mean)],kind==="average"?mean+" stuks per dag":"Nee, gemiddeld "+mean+" stuks per dag, 2 onder het doel.","Tel alle waarden op en deel door het aantal meetdagen.",model,mean);
    }
    if(kind==="barScale")return task("Hoeveel stuks stelt één stap op de lijn links van de grafiek voor?",[],["Lees twee getallen naast elkaar op de as.","Het verschil tussen twee streepjes is 5 stuks."],"5 stuks","Vergelijk twee getallen naast elkaar op de schaal.",bars,5);
    if(kind==="barRead"||kind==="tableBar")return task("Hoeveel stuks staan op plek B?",[],["Zoek B.","Lees de hoogte af met de schaalverdeling."],values[1]+" stuks","Lees de waarde op de lijn links van de grafiek.",bars,values[1]);
    if(kind==="barDifference")return task("Hoeveel stuks verschillen plek A en B?",[],[equation(values[1],"−",values[0],10)],"10 stuks","Lees eerst beide staven af.",bars,10);
    if(kind==="barMinimum")return task("Welke plek heeft de kleinste voorraad?",[],["Vergelijk de drie staafhoogten.","A is de laagste staaf."],"Plek A.","Lees de aantallen van alle plekken af.",bars,values[0]);
    if(kind==="barStock")return task("Elke plek heeft "+target+" stuks nodig. Waar moet het meeste bij?",[],values.map(v=>equation(target,"−",v,target-v)),"Bij A, "+(target-values[0])+" stuks.","Bereken bij elke staaf het verschil met hetzelfde doel.",bars,target-values[0]);
    if(kind==="drawBar"||kind==="checkBar"){
      const model={...bars,missing:kind==="drawBar"?"C":null,values:kind==="checkBar"?[values[0],values[1],values[2]+5]:values,sourceValues:values};
      return task(kind==="drawBar"?"Teken de ontbrekende staaf C op de juiste hoogte.":"Vergelijk de staven met de tabel. Welke staaf klopt niet?",[],["C hoort bij "+values[2]+" stuks.","Gebruik de schaal van 5 stuks per stap."],kind==="drawBar"?"Staaf C moet tot "+values[2]+" stuks komen.":"C is 5 stuks te hoog.","Vergelijk de hoogte van de staaf met het getal in de tabel.",model,values[2]);
    }
    if(kind==="tableUnit")return task("In welke kolom staat hoeveel stuks nodig zijn?",[],["Lees de woorden boven de kolommen.","Gebruik de kolom Nodig (stuks)."],"Nodig, in stuks.","Lees ook wat tussen haakjes achter de woorden boven de kolom staat.",table,"stuks");
    if(["tableRead","stockRead","selectData"].includes(kind))return task("Hoeveel stuks zijn op plek B aanwezig?",[],["Zoek rij B.","Lees de waarde in de kolom Voorraad (stuks)."],values[1]+" stuks","Wijs eerst de rij en dan de juiste kolom aan.",table,values[1]);
    if(kind==="tableCompare")return task("Welke plek heeft meer voorraad, A of B?",[],["Vergelijk "+values[0]+" met "+values[1]+"."],"B heeft meer voorraad.","Lees beide getallen in dezelfde kolom.",table,values[1]);
    if(kind==="tableDifference")return task("Hoeveel stuks verschillen A en B?",[],[equation(values[1],"−",values[0],10)],"10 stuks","Lees de twee getallen. Haal het kleinste getal van het grootste af.",table,10);
    const gap=target-values[0];
    return task(kind==="dataDecision"?"Hoeveel stuks moet je op plek A bijvullen?":"Hoeveel stuks moeten op plek A worden aangevuld?",[],[equation(target,"−",values[0],gap)],"Vul A aan met "+gap+" stuks.","Kijk hoeveel stuks nodig zijn. Haal eraf wat er al ligt.",table,gap);
  }

  if(kind==="columnAdd"||kind==="columnSub"){
    const add=kind==="columnAdd",a=(year===1?38:138)+i*10,b=(add?17:29)+i,result=add?a+b:a-b;
    return task("Reken "+a+(add?" + ":" − ")+b+" onder elkaar uit.",[fact("Eerste aantal",a+" stuks"),fact("Tweede aantal",b+" stuks")],["Zet eenheden onder eenheden en tientallen onder tientallen.","Begin bij de eenheden. Neem een tiental mee of wissel één tiental als dat nodig is.",equation(a,add?"+":"−",b,result)],result+" stuks","Zet tientallen onder tientallen en eenheden onder eenheden.",{kind:"column",a,b,add},result);
  }
  throw new Error("No authored task for " + kind);
}

const legacyTitles={
 count:"Tientallen en losse stuks tellen",countCheck:"Een telling controleren",line:"Getallen op een getallenlijn",diff:"Het verschil tussen aantallen",add:"Optellen met tientallen en eenheden",bridge:"Optellen over het tiental",sub:"Aftrekken in stappen",multiply:"Vermenigvuldigen met gelijke groepen",divide:"Eerlijk verdelen",refill:"Aanvullen tot een doel",need:"Een tekort berekenen",round:"Afronden op tientallen",estimate:"Schatten en precies rekenen",estimateEnough:"Met een schatting de voorraad controleren",decimalEqual:"Kommagetallen met dezelfde waarde",decimalCompare:"Kommagetallen vergelijken",decimalLimit:"Een maat binnen de grens kiezen",stock:"Voorraad na levering en gebruik",stockShortage:"Voorraad en tekort berekenen",rest:"Delen met een rest",pack:"Verpakkingen met een rest",both:"Volle verpakkingen en nodige verpakkingen",ruler:"Een liniaal vanaf nul aflezen",cm:"Meter en centimeter omrekenen",decimalCm:"Meters met een komma naar centimeters",fit:"Past het materiaal?",decimalFit:"Omrekenen en een pasmaat controleren",cmCompare:"Lengtes in dezelfde eenheid vergelijken",scale:"Een weegschaal aflezen",gram:"Kilogram naar gram",massCompare:"Gewichten vergelijken",massRefill:"Aanvullen tot het gewicht dat je nodig hebt",columnAdd:"Optellen onder elkaar",columnSub:"Aftrekken onder elkaar"
};

const studentGoal = (goal,kind) => studentGoalFor(kind);

function strategyFor(domain, kind) {
  const p=lessonProfile(kind);
  return {method:p.method,mistake:p.mistake,followup:p.check,transfer:'Laat de leerling deze rekenstap gebruiken bij een echte werkbon, planning of meetopdracht.'};
}

const photoWeek={getallen:1,meten:7,geldtijd:1,verhoudingen:5,ruimte:7,gegevens:1};
function contextsFor(data,year,domain,kind,day,lessonWeek=1) {
  const measured=/mass|gram|scale|Mass|weight/.test(kind)?"mass":/Volume|volume|jug/.test(kind)?"volume":null;
  const varied=["getallen","geldtijd","verhoudingen","gegevens"].includes(domain)?1+(lessonWeek+day-1)%6:photoWeek[domain];
  const week=measured==="mass"?8:varied;
  const lookup=data.years[year-1][week-1].lessons[day];
  return Object.fromEntries(data.sectors.map(sector=>{
    const variant=lookup.byPhase.orienteren[sector.id],w=variant.workplace;
    const actions={
      getallen:"Je controleert een levering en geeft door wat je collega kan klaarzetten.",
      meten:"Je controleert de maat op de bon voordat je het materiaal gebruikt.",
      geldtijd:"Je collega vraagt je de gegevens op deze bon te controleren.",
      verhoudingen:"De bestelling verandert. Pas de hoeveelheid aan voor het gevraagde aantal sets.",
      ruimte:"Je controleert de maten en hoeveel materiaal je nodig hebt voor de klus.",
      gegevens:/^tally/.test(kind)?"Je telt de spullen. Gebruik de turfstreepjes op de lijst.":/^line/.test(kind)?"Je collega heeft de voorraad op drie dagen geteld. Bekijk de grafiek.":/average|sumValues/.test(kind)?"Je kijkt hoeveel spullen er per dag klaar zijn. Bekijk de tabel.":/^(bar|tableBar|drawBar|checkBar)/.test(kind)?"Je collega heeft de aantallen in een grafiek gezet. Bekijk de staven.":"Bekijk de aantallen op de lijst. Hoeveel ligt er? Hoeveel heb je nodig?"
    };
    return [sector.id,{role:w.role,place:w.place,material:variant.material,photoLesson:lookup.id,
      context:"Je werkt als "+w.role+" in "+w.place+". "+actions[domain],
      ...(domain==="meten"&&!/^temperature/.test(kind)?measurementContext(kind,sector.id):{})}];
  }));
}

export function buildCatalog(data,photoBank=[]) {
  const photosByKind=new Map(photoBank.filter(photo=>photo.status==='generated').flatMap(photo=>(photo.compatibleKinds||[photo.kind]).map(kind=>[kind+':'+photo.sector,photo])));
  const entries=[];
  for(const [yearIndex,weeks] of data.curriculum.entries()){
    const year=yearIndex+1;
    for(const row of weeks){
      const weekDomain=catalogDomains[Math.floor((row.week-1)/6)].id;
      row.goals.forEach((goal,day)=>{
        const kind=yearPlans[yearIndex][row.week-1][day];
        const domain=row.week===36?({priceAdd:"geldtijd",fit:"meten",marginFit:"meten",ratioScale:"verhoudingen",ratioViaOne:"verhoudingen"}[kind]||weekDomain):weekDomain;
        const seed=(row.week+day)%8;
        const example=createCatalogTask(kind,seed,year);
        const exercise=createCatalogTask(kind,seed+1,year);
        const practice=Array.from({length:5},(_,i)=>createCatalogTask(kind,seed+i+2,year));
        const id="pro"+(year+2)+"-w"+String(row.week).padStart(2,"0")+"-"+["ma","di","do"][day];
        const title=legacyTitles[kind]||row.theme+" · "+["Begrijpen","Oefenen","Toepassen"][day];
        const strategy=strategyFor(domain,kind);
        const advanced=createCatalogTask(kind,seed+7,year);
        entries.push({id,year,week:row.week,day:["ma","di","do"][day],phase:["Begrijpen","Oefenen","Toepassen"][day],
          domain,kind,title,theme:row.theme,goal:studentGoal(goal,kind),studentGoal:studentGoal(goal,kind),strategy,
          prerequisites:"Lees de gegevens en eenheden. Gebruik concreet materiaal als de eerste rekenstap nog lastig is.",
          example,exercise,practice,challenge:{question:advanced.question,facts:advanced.facts,answer:advanced.answer},
          contexts:contextsFor(data,year,domain,kind,day,row.week),
          source:"Bestaande tweejarige schoolleerlijn; beroepsopgaven zijn nieuw uitgewerkt.",
          schedule:[{year,week:row.week,day:["ma","di","do"][day]}]});
      });
    }
    for(const [kind,week,day] of [["columnAdd",3,"ma"],["columnSub",4,"ma"]]){
      const title=legacyTitles[kind];
      entries.push({id:"pro"+(year+2)+"-"+kind,year,week:year===1?week:(kind==="columnAdd"?1:4),day,phase:"Extra instructie",domain:"getallen",kind,title,theme:title,
        goal:studentGoal("",kind),studentGoal:studentGoal("",kind),strategy:strategyFor("getallen",kind),
        prerequisites:"Herken eenheden en tientallen. Oefen eerst met materiaal als plaatswaarde nog onzeker is.",
        example:createCatalogTask(kind,0,year),exercise:createCatalogTask(kind,1,year),
        practice:Array.from({length:5},(_,i)=>createCatalogTask(kind,i+2,year)),
        challenge:{question:"Controleer de uitkomst met de omgekeerde bewerking. Leg uit waarom dit een controle is.",facts:[],answer:createCatalogTask(kind,1,year).answer},
        contexts:contextsFor(data,year,"getallen",kind,0),
        source:"Extra instructieles bij de schoolleerlijn.",
        schedule:[{year,week:year===1?week:(kind==="columnAdd"?1:4),day}]});
    }
  }
  entries.push(...measurementEntries(1),...measurementEntries(2));
  for(const lesson of entries){
    lesson.studentGoal=studentGoalFor(lesson.kind);lesson.goal=lesson.studentGoal;
    const profile=lessonProfile(lesson.kind);
    lesson.visualTopic=profile.visual;
    if(/^choose/.test(lesson.kind))for(const context of Object.values(lesson.contexts))context.photoKey=null;
    lesson.strategy={...lesson.strategy,method:profile.method,followup:profile.check,mistake:profile.mistake};
    if(profile.visual==='money'||profile.visual==='coins'){
      for(const [sector,context]of Object.entries(lesson.contexts))lesson.contexts[sector]={...context,...moneyContexts[sector],photoKey:null,measurementGroup:null};
      lesson.strategy.transfer='Laat de leerling een echte prijskaart of kassabon gebruiken en het bedrag controleren.';
    }else if(profile.visual==='clock'||profile.visual==='time'){
      for(const context of Object.values(lesson.contexts))context.context='Je werkt in '+context.place+'. Je collega vraagt je de werktijden op de planning te controleren.';
      lesson.strategy.transfer='Laat de leerling de begin- of eindtijd van een echte werktaak op de planning zetten.';
    }
  }
  for(const lesson of entries)for(const [sector,context]of Object.entries(lesson.contexts)){
    const photo=photosByKind.get(lesson.kind+':'+sector);
    if(photo)lesson.contexts[sector]={...context,role:photo.role,place:photo.place,material:photo.material,context:photo.contextByKind?.[lesson.kind]||photo.context,photoKey:null,measurementGroup:photo.measurementGroup??null,photoBankId:photo.id};
  }
  return simplifyStudentTree({version:5,domains:catalogDomains,entries});
}

