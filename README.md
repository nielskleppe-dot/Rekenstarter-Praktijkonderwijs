# Rekenstarter Praktijkonderwijs

Beroepsgerichte rekenlessen voor CSG Prins Maurits, geschikt gemaakt voor Netlify.

- Vijf sectoren: Groen, Techniek, Zorg & Welzijn, HBR en Economie.
- Vier dia's per les: beroepsgesprek, klassenvraag, samen oefenen en optioneel extra oefenen.
- Schooljaren 2026/2027 en 2027/2028.
- Vrij aanklikbare lessen en een gezamenlijke weekplanning.
- 797 passende beroepsfoto's, met afwisseling tussen opeenvolgende lesdagen.
- Docenteninlog, persoonlijke werkkaarten en Gemini via Netlify.

## Starten

Koppel deze repository aan Netlify. Het bestand netlify.toml legt de buildinstellingen vast. Volg daarna [de korte handleiding](docs/Netlify_starten.md) voor de docenteninlog, beheerder en AI.

De bestanden zijn voorbereid voor publicatie. De echte Netlify-omgeving, accounts en AI-sleutel worden bij Netlify ingesteld. Eerder opgeslagen persoonlijke werkkaarten en planningswijzigingen van de oude website vragen een aparte gegevensoverdracht.

De originele afbeeldingen zijn verliesvrij opgenomen in asset-packs en worden tijdens de build automatisch uitgepakt en gecontroleerd.

## Lokaal controleren

    npm ci
    npm run build:netlify
    npm run test:netlify

GitHub bewaart de projectbestanden. Netlify verzorgt de website en rekent het gebruik af volgens het gekozen abonnement.
