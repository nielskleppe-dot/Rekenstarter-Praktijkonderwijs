export const techniekSector = {
  id: "techniek",
  short: "Techniek",
  name: "Techniek",
  caption: "Werkplaats en montage",
  icon: "wrench",
  color: "#385d83",
  measure: { object: "de plank", place: "de opening in het materialenrek" }
};

const rekenkaart = "https://chatgpt.com/library?file_id=libfile_331ce939386481919325241d27ff73d3&account_id=personal";
const meetbron = "Twee rekenkaarten lengte meten CONCEPT · Past deze plank?";
const kennismaken = "Kennismakingsboekje Techniek koppelen";
const orienteren = "Oriëntatiewerkkaart Techniek koppelen";
const vervolg = "Vervolgwerkkaart Techniek koppelen";

function werk(task, material, scene, next, source, link = "", page = "") {
  return { task, material, scene, next, source, link, page };
}

export const techniekPerFase = {
  kennismaken: [
    werk("Bevestigingsmateriaal herkennen", "bouten",
      "Op de werkbank staan twee voorraadbakken met dezelfde soort bouten. Je zoekt uit hoeveel bouten er klaarstaan.",
      "Pak twee bakken uit het lokaal. Wijs de bouten aan, controleer de aantallen en vertel aan je maatje wat je ziet.", kennismaken),
    werk("Onderdelen sorteren", "sluitringen",
      "Twee groepjes gaan monteren. Je legt de platte metalen ringen bij de juiste werkbank en brengt de overgebleven ringen terug.",
      "Wijs een sluitring aan. Tel hoeveel ringen je nodig hebt voor jullie opdracht en controleer de rest.", kennismaken),
    werk("Montagesetjes klaarleggen", "bouten",
      "Elke werkbank krijgt een bakje met bouten voor een oefenwerkstuk. De setjes moeten even groot zijn.",
      "Leg met je maatje de bouten voor jullie werkstuk klaar. Vergelijk de bakjes met elkaar.", kennismaken),
    werk("Een plank meten", "plank",
      "Je krijgt een rolmaat en een plank voor het materialenrek. Begin met meten bij de nul.",
      "Meet samen een plank of de opening in het rek. Zeg het getal én de eenheid hardop.", meetbron, rekenkaart, "p. 1"),
    werk("De werkplaatsweegschaal gebruiken", "bevestigingsmateriaal",
      "Je wilt weten hoe zwaar een zakje bouten is. Controleer of de lege weegschaal op nul staat.",
      "Weeg een zakje materiaal. Laat je maatje het getal en de eenheid aanwijzen.", kennismaken)
  ],
  orienteren: [
    werk("Een montageklus voorbereiden", "bouten",
      "Je maatje heeft bouten nodig voor een werkstuk. In het magazijn staan twee bakken met dezelfde bouten. Je controleert waar je voldoende voorraad vindt.",
      "Vergelijk de inhoud van twee bakken en leg uit uit welke bak je jullie materiaal kunt halen.", orienteren),
    werk("Montagevoorraad bijhouden", "sluitringen",
      "Twee werkbanken gebruiken dezelfde maat sluitring. Aan het begin van de klus controleer je de voorraad en kijk je wat je moet klaarzetten.",
      "Controleer voor jullie werkstuk hoeveel sluitringen je uit de voorraad pakt en wat er overblijft.", orienteren),
    werk("Onderdelen per werkstuk klaarleggen", "bouten",
      "De klas maakt meerdere gelijke werkstukken. Voor elk werkstuk leg je evenveel bouten klaar in een apart bakje.",
      "Maak de setjes voor jullie opdracht. Laat een ander groepje één set en de restvoorraad controleren.", orienteren),
    werk("Past deze plank?", "plank",
      "Er ontbreekt een plank in het materialenrek. Meet de plank en de opening om te bepalen of hij past.",
      "Vergelijk de maten in dezelfde eenheid en vertel hoeveel ruimte er overblijft of tekort is.", meetbron, rekenkaart, "p. 1"),
    werk("Bevestigingsmateriaal afwegen", "bevestigingsmateriaal",
      "Voor een oefenklus maak je een zakje materiaal klaar. Je weegt het en vergelijkt de uitkomst met de afgesproken hoeveelheid.",
      "Weeg het materiaal voor jullie opdracht. Noteer de massa en controleer of de weegschaal gram of kilogram aangeeft.", orienteren)
  ],
  vervolg: [
    werk("Voorraad voor werkstukken controleren", "bouten",
      "Morgen werken twee groepen aan werkstukken met dezelfde bouten. Je controleert de voorraad zodat beide groepen meteen kunnen beginnen.",
      "Noteer de aantallen van de twee bakken en vertel welke voorraad je voor de klus kunt gebruiken.", vervolg),
    werk("De montagevoorraad aanvullen", "sluitringen",
      "Aan het eind van de les kijk je hoeveel sluitringen er zijn gebruikt. Zo weet de volgende groep wat er nog beschikbaar is.",
      "Tel de restvoorraad. Leg uit hoeveel sluitringen je moet bijleggen om de afgesproken voorraad aan te vullen.", vervolg),
    werk("Montagesets voor een bestelling maken", "bouten",
      "Een andere klas heeft gelijke montagesets nodig. Jij legt voor ieder werkstuk dezelfde bouten klaar en houdt bij wat je overhoudt.",
      "Maak en controleer de sets voor jullie werkstukken. Noteer hoeveel complete sets en losse bouten er zijn.", vervolg),
    werk("De maat van de plank controleren", "plank",
      "Een collega heeft de opening van het materialenrek opgemeten. Jij meet de plank en controleert de maten voordat je iets aftekent.",
      "Meet de opening en de plank opnieuw. Noteer je beslissing en de maat waarmee je die uitlegt.", meetbron, rekenkaart, "p. 1"),
    werk("Een materiaalpakket wegen", "bevestigingsmateriaal",
      "Voor de volgende klas maak je een materiaalpakket klaar. Op het voorraadbriefje moet staan hoeveel het materiaal weegt.",
      "Weeg het pakket en zet de massa met eenheid op het briefje. Laat je maatje de waarde controleren.", vervolg)
  ]
};

export const techniekBeelden = {
  stock: { group: "techniek", position: "0% 0%", alt: "Twee bakken met bouten op een werkbank" },
  sets: { group: "techniek", position: "100% 0%", alt: "Bouten, moeren en sluitringen in aparte vakjes op een werkbank" },
  measure: { group: "techniek", position: "0% 100%", alt: "Een rolmaat langs een houten plank op de werkbank" },
  weigh: { group: "techniek", position: "100% 100%", alt: "Een zakje bevestigingsmateriaal op een digitale werkplaatsweegschaal" }
};
