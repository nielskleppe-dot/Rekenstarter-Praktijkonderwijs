# Meetlessen en visuele instructie

De vrije leskeuze en de vooraf geplande tweejarige lijn blijven naast elkaar bestaan. De knop Metrieklessen verdwijnt uit de bovenbalk en van Start. De bestaande metrieklessen staan in Lessen. Een oud adres `#metrieklessen` opent Lessen met het domein Meten.

## Didactische presentatie

1. Eén gecentreerd ik-kan-doel, een passend beeld en een vraag om voorkennis te activeren.
2. De docent doet één voorbeeld voor, onthult de berekening per stap en controleert begrip.
3. Leerlingen denken eerst zelf, tonen tegelijk hun antwoord en bespreken de aanpak. Hints en uitdaging blijven ingeklapt. De docent opent het antwoord bewust.
4. Vijf optionele oefenopgaven, afzonderlijke antwoorden en de verwijzing naar Numo.

Bij twijfel gebruikt de docent extra uitleg en concreet materiaal. De docentkaart beschrijft de handeling, een controle en de transfer naar het werk. Een korte rekenstarter vervangt geen volledige zelfstandige verwerking.

## Nieuwe meetlessen

Elke les bestaat voor PrO 3 en PrO 4: 24 aanvullende lessen met vijf sectorcontexten. De analoge schaal in PrO 4 heeft kleinere intervallen. Alle bestaande 216 geplande lessen, vier cijferlessen en 24 metrieklessen blijven beschikbaar.

| Les | Lesweek | Dag |
| --- | --- | --- |
| Een liniaal aflezen | 7 | maandag |
| Een rolmaat aflezen | 7 | dinsdag |
| Meten vanaf een ander beginpunt | 7 | donderdag |
| Een maat nauwkeurig aftekenen | 10 | maandag |
| Een digitale weegschaal aflezen | 8 | maandag |
| Een analoge weegschaal aflezen | 8 | dinsdag |
| Wegen met een bakje: tarra | 8 | donderdag |
| Afwegen tot het doelgewicht | 12 | dinsdag |
| Een maatbeker op ooghoogte aflezen | 9 | maandag |
| Kleine maatstreepjes aflezen | 9 | dinsdag |
| Een rand meten of een vlak bedekken | 29 | maandag |
| Hoeveel liter past in een bak? | 30 | donderdag |

Dit zijn extra instructiemogelijkheden bij die week, geen vervanging van het vaste lesmoment. De eigen achtweekse metriekreeks behoudt haar weeknummering.

## Sectoren en beeldkeuze

| Sector | Lengte | Gewicht | Inhoud |
| --- | --- | --- | --- |
| Groen | straatwerk en opsluitband | voer in de dierenverzorging | water voor een gieter |
| Techniek | montagelat in de werkplaats | moeren in de garage | schoon water voor een werkplaatsklus |
| HBR | buffettafel | meel in de bakkerij | melk in de keuken |
| Zorg en welzijn | plank in de linnenkamer | havermout voor het ontbijt | drinkwater voor bewoners |
| Economie | winkelschap | pakket in het magazijn | water voor een winkeldemonstratie |

Vijftien fotorealistische AI-beelden zijn lokaal ingebouwd. De foto's tonen de beroepssituatie; de bijbehorende SVG-meetbeelden dragen de exacte getallen. Oude starters behouden hun bestaande materiaalbeeld als een nieuwe foto een ander voorwerp zou tonen. De voorbeelden met tarra gebruiken in Economie een doos.

## Exact aflezen

De weegschaal, wijzerplaat, meetlat, maatbeker, thermometer en maatplannen worden uit dezelfde lesgegevens getekend als de antwoorden. Verdeling, vloeistoflijn en wijzerpositie zijn berekend. Er worden geen door AI getekende cijfers gebruikt om leerlingen te laten aflezen. Ook oefenopgaven met een meetinstrument kunnen worden vergroot. Vergroten bewaart de open les, sector en voortgang.

De oude les Een kubus in lagen is vervangen door een bak met zichtbare binnenmaten. De relatie is concreet: lengte × breedte × hoogte geeft cm³; 1.000 cm³ is 1 liter. Vierkante en kubieke eenheden behouden hun eigen factoren 100 en 1.000 op de PM-rekenkaart.

## Controle

`scripts/test-measurements.mjs` controleert de meetopgaven op acht getalvarianten, unieke sectorbeelden, gerenderde dia's, zichtbaarheid van antwoorden, vergroten zonder verlies van lesvoortgang en de routes naar de lesbibliotheek. De bestaande tests controleren de gehele bibliotheek, 720 oude sectorvarianten, planning, rekenstappen, werkkaarten en AI-instellingen. De build bevat alle foto's en werkt zonder externe beeldverzoeken.
