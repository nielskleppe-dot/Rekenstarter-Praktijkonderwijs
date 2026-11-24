# Rekenstart · Praktijkassistent

Afgeschermde Rekenstart voor CSG Prins Maurits, herfst tot kerst 2026. Twee trajectjaren, acht weken, drie dagen per week en vijf sectoren. De 48 lessen bevatten de beroepsgerichte inhoud uit Library-versie 7 van `Rekenstart_Herfst_Kerst_2026.html` (6 november 2026): werkopdracht, rekenen/controleren en beslissen/terugmelden. Alle 720 fasevarianten gebruiken realistische werkplekbeelden, werkbonnen en twee kernvragen per dia. De gegevens op de bon zijn leidend; de beelden zijn gemarkeerde AI-illustraties. De oorspronkelijke toegangsrechten blijven behouden.

## Werkkaarten

Open **Werkkaarten** of kies **Maak een werkkaart** bij de voorbereiding van een les. De centrale component gebruikt het sjabloon `pm-werkkaart-2`: A4, vaste koppen, foto links en instructie rechts, taal- en rekendoelen, antwoordruimte en het exacte CSG Prins Maurits Praktijkonderwijs-logo rechtsboven. De vijf voorbeelden gebruiken de aangeleverde aardappelschijfjeswerkkaart als vormreferentie. De vier overige voorbeelden bevatten herkenbaar gemarkeerde oefengegevens.

Tekst, gegevens en foto's zijn bewerkbaar. DOCX/TXT/MD worden als brontekst ingelezen; de docent werkt die verder uit of vraagt een AI-voorstel. JSON behoudt de volledige werkkaartstructuur. Onleesbare of te grote bestanden worden gemeld. Eigen foto's zijn PNG/JPEG, maximaal 10 MB; de editor verkleint ze voor opslag. Geef geen leerlinggegevens op.

PDF is direct printbaar. Word bevat bewerkbare tekst, tabellen en losse afbeeldingen. De vijf basiskaarten zijn gecontroleerd als PDF en gerenderde Word-uitvoer: vier leerlingpagina's en een apart docentblad. Word kan op andere apparaten iets anders afbreken. Een onredelijk lange stap wordt gemeld en moet in twee stappen worden verdeeld.

**Opslaan** bewaart online per aangemelde gebruiker in D1. Iedere opslag schrijft een nieuwe versie met controle op gelijktijdige wijzigingen. Andere docenten kunnen elkaars kaarten niet lezen. In de zelfstandige HTML en lokale preview gebruikt de app IndexedDB op het apparaat; de interface benoemt dit. JSON-export maakt een overdraagbare kopie. Opgeslagen kaarten veranderen de centrale rekenplanning niet.

Het sjabloon heeft een versie. Voeg bij toekomstige wijzigingen een nieuwe renderer toe voor de nieuwe versie en behoud de bestaande renderer voor bewaarde kaarten. Verander `pm-werkkaart-2` niet stilzwijgend.

## Live AI

De Rekencoach en de Praktijkassistent gebruiken uitsluitend serververzoeken. Voor de Gemini-proef staat de Sites-runtime op `AI_PROVIDER=gemini`; het model is `gemini-3.5-flash-lite`. De eigenaar opent **Beheer → Gemini koppelen**, kiest een Google-project met Free tier zonder betaalde facturering, en voert de sleutel in het wachtwoordveld in. **Verbinden en testen** voert een echte korte Gemini-aanvraag uit. Alleen na een geslaagde test wordt de sleutel opgeslagen. De website kan de facturering van een Google-project niet zelf verifiëren; de eigenaar controleert dit in AI Studio. Er wordt nooit automatisch overgeschakeld naar een betaald model of OpenAI.

`AI_CONNECTION_SECRET` is een willekeurige sleutel van 32 bytes, als 64 kleine hextekens in een geheime Sites-runtimevariabele. De Google-sleutel staat AES-GCM-versleuteld in D1, met een unieke IV en de eigenaar als geauthenticeerde aanvullende data. Houd het runtimegeheim gelijk bij volgende deployments, anders moet de eigenaar opnieuw koppelen. Geen sleutels in broncode, logs, exports of browseropslag. Alleen de eigenaar van de bestaande centrale planning mag de koppeling lezen of aanpassen. Het formulier bewaart geen sleutel bij een mislukte test en beschermt tegen gelijktijdige wijzigingen. Eventueel kan `GEMINI_API_KEY` rechtstreeks als Sites-runtimegeheim worden beheerd; het formulier kan die sleutel niet wijzigen.

De bestaande OpenAI-adapter is behouden voor expliciete toekomstige configuratie met `AI_PROVIDER=openai`, maar wordt tijdens de Gemini-proef niet aangeroepen. De kaarteditor, voorbeelden, vaste hulp, opslag en exports werken zonder AI. De lokale preview bevat geen live sleutels of gebruikersidentiteit; koppelen kan alleen op de aangemelde online site.

AI-kaarten worden via een vast schema gevalideerd en pas na de keuze **Voorstel overnemen** toegepast. Nieuwe of veranderde stappen krijgen geen oude foto zonder passende titel. De centrale planning wordt niet door AI gewijzigd. De limiet is tien AI-verzoeken per gebruiker per uur, gedeeld met de Rekencoach. Een ontbrekend API-tegoed, een tijdelijk te hoge vraagdruk en onjuiste toegangsinstellingen leveren afzonderlijke meldingen op.

De Gemini-code is gecontroleerd met gesimuleerde providerantwoorden voor chat, werkkaart en Rekencoach, inclusief rechten, encryptie, onvolledige antwoorden en limietfouten. De live verbindingstest gebeurt via het formulier; pas na een geslaagde test wordt Gemini als verbonden getoond. Op 6 november 2026 bevestigden de productielogs twee Google 503-antwoorden met UNAVAILABLE voor gemini-3.8-flash. De proef gebruikt daarom nu gemini-3.5-flash-lite, dat volgens de Google-modeldocumentatie gestructureerde uitvoer en Free tier ondersteunt. De werking met een echte sleutel moet opnieuw via het formulier worden bevestigd. Er zijn geen betaalinstellingen gewijzigd.

Gemini-fouten worden onderscheiden naar sleutel, rechten, gratis toegang, aanvraagformaat, quota, model en tijdelijke storing. Google 500/502/503 krijgt maximaal één herpoging binnen hetzelfde totale tijdsbudget van 55 seconden; quota- en betaalmeldingen niet. Logs bevatten alleen een willekeurige foutreferentie, model, HTTP-status, bekende foutcodes en foutcategorie. Ruwe providerteksten, sleutels en vragen worden nooit gelogd. Na een mislukte verbindingstest blijft de sleutel uitsluitend in het wachtwoordveld van het open venster staan; na succes of sluiten wordt het veld gewist. Een mislukte test bewaart geen sleutel op de server.

## Ontwikkelen en controleren

```sh
node scripts/build.mjs
npm test
node scripts/validate-artifact.mjs
sites-preview start /workspace/sites/rekenstart-praktijkassistent
```

Een zelfstandige HTML maken:

```sh
node scripts/build.mjs --offline Rekenstart_Herfst_Kerst_2026.html
```

`src/lesson-data.json` bevat de actuele lesinhoud. `src/card-core.js` valideert werkkaarten; `src/card-print.js` bepaalt preview/PDF/Word; `src/workcards.js` verzorgt de editor. De Worker gebruikt D1-binding `DB`; migraties staan in `drizzle`. De afgeschermde Sites-omgeving levert de gebruikersidentiteit. De eigenaar van de bestaande centrale planning blijft de beheerder.

Exportbibliotheken zijn lokaal gebundeld in `vendor`; er worden geen externe scripts geladen. Licenties staan ernaast. Het logo is het aangeleverde PNG waarvan alleen transparante buitenmarge is verwijderd. Foto-illustraties en broninformatie staan in `src/card-assets.json` en bij de docentnotities.
