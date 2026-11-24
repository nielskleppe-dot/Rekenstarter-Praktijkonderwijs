# Beeld en instructie horen bij de les

De lesbibliotheek gebruikt een eigen onderwijsprofiel voor ieder lesonderwerp. `src/lesson-profiles.mjs` legt vast welk beeld, welke uitleg, welke controlevraag en welke verwachte denkfout bij de les horen. Nieuwe onderwerpen zonder profiel worden niet stilzwijgend ingevuld met een algemene tekst uit het rekendomein.

## Voorbeelden

| Les | Beeld | Controle van begrip |
| --- | --- | --- |
| Betalen met munten | Herkenbare muntfoto’s en het te betalen bedrag | Zijn de munten samen precies de prijs? |
| Hele euro optellen | Twee prijsregels op een bon | Heb je beide bedragen meegeteld? |
| Euro en cent optellen | De prijzen met centen op een bon | Wat doe je bij honderd cent? |
| Klokkijken | Een klok met de juiste wijzerstand | Welke wijzer geeft het uur aan? |
| Werktijd uitrekenen | De begin- en eindtijd | Hoeveel minuten zitten ertussen? |
| Optellen via een tiental | De getallenlijn en zichtbare sprongen per rekenstap | Hoeveel moet erbij tot het tiental? |
| Tabellen en grafieken | De tabel of grafiek die bij de opdracht hoort | Welke rij, kolom of schaalstap lees je? |

Een les over prijzen krijgt geen vraag over minuten. Een les over munten krijgt geen willekeurige materiaalafbeelding uit de sector. De oude keuze op basis van een andere lesweek wordt niet meer gebruikt voor de beelden in de bibliotheek.

## Beroepspraktijk

Geldlessen gebruiken eigen situaties voor de boerderijwinkel, garagebalie, koffiebar, het winkeltje in een woonzorgcentrum en de winkelkassa. Vijf zelf gemaakte fotorealistische beelden tonen deze werkomgevingen. Ze ondersteunen de context; de precieze bedragen staan op de werkbon.

De muntfoto’s komen van de Europese Centrale Bank. De beelden en hun bronverwijzing zijn lokaal opgeslagen in `assets/coins`. De les toont de waarden apart en leesbaar. Via ‘Bekijk alle munten’ of ‘Vergroot de munten’ opent een groot overzicht. Er wordt niet vertrouwd op AI-gegenereerde muntgravures of getallen.

Meetlessen behouden hun exact getekende instrumenten. Getallen, grafieken, maten en rekensprongen worden afgeleid uit de gegevens van de concrete opdracht. Onbekende begin- en eindtijden blijven verborgen tot de docent het antwoord toont. Bij een lesdoel is het rekenbeeld leidend; een beroepsfoto krijgt geen voorrang boven een beeld dat het leerdoel uitlegt.

## Controles

`scripts/test-lesson-fit.mjs` controleert alle bibliotheeklessen en sectoren op lesgerichte beelden. Daarnaast controleert het de twee gemelde voorbeelden: munten bij PrO 3, week 13, dinsdag en hele prijzen optellen bij PrO 3, week 14, maandag. Geld- en tijdvragen worden apart gecontroleerd en onbekende tijden mogen niet vooraf zichtbaar zijn. De overige tests controleren berekeningen, presentaties, sectorwissels, planning, werkkaarten en de AI-koppeling.
