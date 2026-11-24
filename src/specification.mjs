import { techniekSector } from "./techniek.mjs";

export const slots = [
  { key: "ma", name: "Maandag", short: "ma", offset: 0, phase: "Voordoen", label: "Kijk en denk", nudge: "Laat leerlingen eerst schatten. Doe daarna één aanpak hardop voor." },
  { key: "di", name: "Dinsdag", short: "di", offset: 1, phase: "Samen oefenen", label: "Probeer samen", nudge: "Haal de aanpak kort op en laat tweetallen één stap proberen." },
  { key: "do", name: "Donderdag", short: "do", offset: 3, phase: "Toepassen", label: "Pak de praktijkvraag aan", nudge: "Vraag om een antwoord en één zin over de berekening." }
];

export const defaultStarts = [
  "2026-10-26", "2026-11-02", "2026-11-09", "2026-11-16",
  "2026-11-23", "2026-11-30", "2026-12-07", "2026-12-14"
];

export const holidays = [
  { name: "Herfstvakantie", start: "2026-10-17", end: "2026-10-25" },
  { name: "Kerstvakantie", start: "2026-12-19", end: "2027-01-03" }
];

export const sourceWorkbook = "https://chatgpt.com/library?file_id=libfile_3c9be8bbe28c819196ae94c8f0e68b91&account_id=personal";
export const calendarSource = "https://www.rijksoverheid.nl/themas/onderwijs/schoolvakanties/overzicht-schoolvakanties-per-schooljaar/overzicht-schoolvakanties-2026-2027";

function work(material, scene, source) {
  return { material, scene, source };
}

export const sectors = [
  { id: "eco", short: "ECO", name: "Economie", caption: "Winkel en logistiek", icon: "store", color: "#9b5722",
    measure: { object: "het winkeldisplay", place: "de vrije plek in het winkelschap" },
    weeks: [
      work("prijskaartjes", "Je controleert de voorraad prijskaartjes voor de winkel.", "ECO · Werk aan de Winkel · Vitrinekast op school inrichten"),
      work("artikelen", "Je vergelijkt de voorraad artikelen op twee winkelstellingen.", "ECO · Werk aan de Winkel · Vitrinekast op school inrichten"),
      work("actiekaartjes", "Je zet actiekaartjes klaar voor twee winkelgroepen.", "ECO · Kennismaken met economie · Sale slinger maken"),
      work("verpakkingen", "Je gebruikt verpakkingen om bestellingen klaar te zetten.", "ECO · Oriëntatie · Producten inpakken en versturen"),
      work("artikelen", "Je verdeelt artikelen in gelijke sets voor de winkel.", "ECO · Werk aan de Winkel · Vitrinekast op school inrichten"),
      work("productlabels", "Je telt en controleert productlabels bij een oefenlevering.", "ECO · Logistiek · Pakbon controleren"),
      work("winkeldisplay", "Je meet het winkeldisplay en de vrije plek in het winkelschap.", "ECO · Werk aan de Winkel · Vitrinekast op school inrichten"),
      work("een oefenpakket", "Je legt een oefenpakket op de weegschaal voordat het wordt verstuurd.", "ECO · Administratie · Brief maken, vouwen en wegen")
    ]
  },
  { id: "zw", short: "Z&W", name: "Zorg & Welzijn", caption: "Zorg en zelfstandig wonen", icon: "heart", color: "#7c4f93",
    measure: { object: "het opbergrek", place: "de vrije plek in de oefenwoning" },
    weeks: [
      work("washandjes", "Je controleert hoeveel washandjes in de linnenkast liggen.", "Zorg & Welzijn · Leerlijn Zorg · Voorraad textiel"),
      work("handdoeken", "Je vergelijkt de voorraad handdoeken op twee plekken in de oefenwoning.", "Zorg & Welzijn · Zelfstandig wonen · Wasgoed opbergen"),
      work("poetsdoeken", "Je zet poetsdoeken klaar voor twee werkplekken in de oefenwoning.", "Zorg & Welzijn · Zelfstandig wonen · Huishoudelijke taken"),
      work("schoonmaakdoekjes", "Tijdens het schoonmaken pak je doekjes uit de voorraad.", "Zorg & Welzijn · Zelfstandig wonen · Huishoudelijke taken"),
      work("washandjes", "Je verdeelt schone washandjes over gelijke bakken.", "Zorg & Welzijn · Leerlijn Zorg · Linnenvoorraad"),
      work("handdoeken", "Je controleert de linnenkast en vult die waar nodig aan.", "Zorg & Welzijn · Zelfstandig wonen · Wasgoed opbergen"),
      work("opbergrek", "Je meet het opbergrek en de vrije plek in de oefenwoning.", "Zorg & Welzijn · Zelfstandig wonen · Oefenwoning inrichten"),
      work("wasgoed", "Je weegt een partij schoon wasgoed voor een oefenopdracht.", "Zorg & Welzijn · Zelfstandig wonen · Wasgoed verzorgen")
    ]
  },
  { id: "hbr", short: "HBR", name: "HBR", caption: "Keuken en bediening", icon: "utensils", color: "#a23f3d",
    measure: { object: "de uitgifteplank", place: "de vrije plek op de uitgiftebalie" },
    weeks: [
      work("servetten", "Je telt de servetten voordat je tafels dekt.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("borden", "Je vergelijkt de voorraad borden op twee werkplekken in de keuken.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("bekers", "Je zet bekers klaar voor twee groepen gasten.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("lepels", "Je haalt lepels uit de voorraad om de werktafels klaar te maken.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("servetten", "Je verdeelt servetten gelijk over bakken voor de bediening.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("lepels", "Je controleert het aantal lepels en vult de voorraad aan.", "HBR · Oriëntatie op HBR · Tafeldekken"),
      work("uitgifteplank", "Je meet de uitgifteplank en de beschikbare plek op de uitgiftebalie.", "HBR · Oriëntatie op HBR · Werkplek inrichten"),
      work("deeg", "Je weegt deeg voordat je het verder verwerkt.", "HBR · Leerlijn Voeding · Ingrediënten afwegen")
    ]
  },
  { id: "groen", short: "Groen", name: "Groen", caption: "Plantenteelt en werkplaats", icon: "sprout", color: "#356f52",
    measure: { object: "de plantenbak", place: "de vrije plek op de kweektafel" },
    weeks: [
      work("stekpotjes", "Je controleert hoeveel stekpotjes klaarstaan op de kweektafel.", "Groen · Plantenteelt · PT03 Stekken en verzorgen"),
      work("plantlabels", "Je vergelijkt de voorraad plantlabels op twee kweektafels.", "Groen · Plantenteelt · PT01 Zaaien en labelen"),
      work("bloempotten", "Je zet bloempotten klaar voor twee groepen die gaan oppotten.", "Groen · Plantenteelt · PT02 Verspenen en oppotten"),
      work("zaaibakjes", "Je pakt zaaibakjes uit de voorraad om mee te werken.", "Groen · Plantenteelt · PT01 Zaaien en labelen"),
      work("plantenstekken", "Je verdeelt plantenstekken over gelijke bakken.", "Groen · Plantenteelt · PT03 Stekken en verzorgen"),
      work("bloempotten", "Je controleert de voorraad bloempotten voor de volgende oppotklus.", "Groen · Plantenteelt · PT02 Verspenen en oppotten"),
      work("plantenbak", "Je meet een plantenbak en de beschikbare plek op de kweektafel.", "Groen · Plantenteelt · PT05 Kleine teelt plannen en volgen"),
      work("potgrond", "Je weegt potgrond voor een oefenbak op de kweektafel.", "Groen · Plantenteelt · PT02 Verspenen en oppotten")
    ]
  },
  techniekSector
];

// Every row is shared by all sectors. It has the type, main numbers and check numbers.
export const examples = [
  [
    [["count",[3,0],[4,0]],["count",[3,6],[5,4]],["count",[4,7,45],[5,2,55]]],
    [["line",[26,41],[34,49]],["diff",[38,52],[37,54]],["diff",[46,32],[42,29]]],
    [["add",[24,13],[34,25]],["bridge",[38,17],[46,18]],["bridge",[26,18],[34,27]]],
    [["sub",[58,14],[67,25]],["sub",[63,27],[82,36]],["sub",[72,28],[64,19]]],
    [["multiply",[4,5],[3,6]],["divide",[24,4],[28,4]],["divide",[30,5],[35,5]]],
    [["count",[5,8],[6,3]],["refill",[39,60],[46,70]],["divide",[36,6],[42,6]]],
    [["ruler",[34],[27]],["cm",[120],[145]],["fit",[120,90],[120,125]]],
    [["scale",[375],[460]],["massCompare",[1000,850],[1000,1120]],["massRefill",[1000,640],[1000,725]]]
  ],
  [
    [["bridge",[37,28],[48,37]],["refill",[54,62],[58,73]],["need",[32,24,65],[47,22,80]]],
    [["round",[46],[73]],["estimate",[37,46],[58,26]],["estimate",[47,28,78],[36,47,85]]],
    [["decimalEqual",[150],[170]],["decimalCompare",[140,135],[125,130]],["decimalLimit",[140,138,145],[125,129,118]]],
    [["bridge",[42,18],[36,27]],["stock",[36,29,18],[41,26,19]],["stock",[40,25,32,36],[37,28,31,40]]],
    [["rest",[27,6],[29,6]],["pack",[31,8],[33,8]],["both",[29,5],[32,6]]],
    [["estimate",[58,26],[47,38]],["stock",[39,24,18],[48,26,17]],["pack",[38,6],[45,8]]],
    [["decimalCm",[125],[148]],["cmCompare",[135,128],[128,132]],["decimalFit",[145,118],[125,132]]],
    [["gram",[750],[1280]],["massCompare",[1250,1180],[1075,1120]],["massRefill",[1200,830],[1500,970]]]
  ]
];
