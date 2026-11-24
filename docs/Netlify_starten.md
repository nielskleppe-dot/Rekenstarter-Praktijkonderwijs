# Rekenstart op Netlify

Deze versie is gebaseerd op de gepubliceerde Rekenstart, versie 37 van 23 november 2026. De lessen, rekenvragen, vier dia's, sectoren, beide schooljaren en 797 beroepsfoto's zijn behouden.

## Website koppelen

1. Open Netlify en kies **Add new project → Import a Git repository → GitHub**.
2. Selecteer **nielskleppe-dot/Rekenstarter-Praktijkonderwijs**.
3. Laat Netlify het bestand `netlify.toml` gebruiken. Build command: `npm run build:netlify`. Publish directory: `dist`. Node: 22.
4. Publiceer de website. Netlify bouwt de lessen en zet de afbeeldingen automatisch klaar.

De gewone lessen zijn te bekijken zonder docentenaccount. Centraal beheer, persoonlijke werkkaarten en de praktijkassistent gebruiken de volgende inrichting.

## Docenteninlog en beheerder

1. Open **Identity** in het Netlify-project en kies **Enable Identity**.
2. Zet registratie op **Invite only**.
3. Nodig eerst jezelf uit en activeer je account via de e-mail. Je kunt op de inlogpagina een wachtwoord kiezen.
4. Geef je eigen account de rol **admin** in de Identity-gebruikersinstellingen. Je kunt ook jouw eigen e-mailadres vastleggen als Netlify-omgevingsvariabele `REKENSTART_ADMIN_EMAIL` en opnieuw publiceren.
5. Nodig daarna de collega's uit. Zij krijgen persoonlijke werkkaarten en toegang tot de praktijkassistent. Alleen de beheerder wijzigt de gezamenlijke planning en AI-koppeling.

De eerste bezoeker of de eerste docent wordt niet automatisch beheerder. Alleen de gecontroleerde beheerdersrol of het ingestelde beheerdersadres geeft beheerrechten.

## Database

Dit project gebruikt `@netlify/database` en bevat de PostgreSQL-migratie onder `netlify/database/migrations`. Netlify kan de database bij het publiceren automatisch aanmaken en de migratie uitvoeren. Controleer de status onder **Data & Storage → Database**. Netlify rekent databasegebruik af met credits; de voorwaarden van je Netlify-abonnement gelden.

De nieuwe opslag begint met de meegeleverde standaardplanning. Persoonlijke werkkaarten en eerder centraal opgeslagen wijzigingen van de oude website zijn niet in deze GitHub-bestanden opgenomen. Die gegevens moeten apart en met de juiste eigenaarstoewijzing worden overgezet. De oude website blijft beschikbaar.

## Gemini instellen

1. Voeg in Netlify onder de omgevingsvariabelen `AI_PROVIDER` toe met waarde `gemini`.
2. Voeg `AI_CONNECTION_SECRET` toe: een willekeurige reeks van 64 hexadecimale tekens. Genereer deze bijvoorbeeld lokaal met:

   `node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"`

3. Bewaar deze waarde uitsluitend bij Netlify, zodat de opgeslagen Google-sleutel versleuteld blijft. Stel runtimevariabelen in voor Functions en publiceer opnieuw.
4. Log op de nieuwe website in als beheerder. Kies **Beheer → Gemini koppelen** en gebruik de bestaande Google-sleutel. De website controleert de verbinding voordat deze wordt opgeslagen.

Een alternatief voor stap 2–4 is `GEMINI_API_KEY` rechtstreeks als runtimevariabele bij Netlify instellen. De sleutel staat dan niet in de browser of de projectbestanden.

## Afbeeldingen en volgende wijzigingen

De grote verzameling originele beeldbestanden staat verdeeld over gecontroleerde archiefdelen in `asset-packs`. De build zet ze automatisch terug onder `assets`; elk bestand wordt op zijn oorspronkelijke SHA-256 gecontroleerd. Dit houdt de eerste overdracht naar GitHub beheersbaar.

Voor ontwikkeling:

```
npm ci
node scripts/restore-assets.mjs
npm run build:netlify
npm run test:netlify
```

Wie oorspronkelijke beeldbestanden toevoegt of wijzigt, werkt daarna de beeldmanifesten bij en voert `npm run pack:assets` uit. Neem de nieuwe archiefdelen mee in dezelfde Git-commit. Bewaar API-sleutels buiten GitHub.

Na een wijziging op de gekoppelde hoofdbranch bouwt en publiceert Netlify de website opnieuw. Alleen wijzigingen bespreken in een chat wijzigt de GitHub-bestanden niet automatisch.

## Gecontroleerd

- PostgreSQL: bestaande SQL-query's, transacties, versieconflicten, rechten per docent en AI-quota.
- Netlify API: gecontroleerde inlog, beheerrechten, gedeelde planning en persoonlijke werkkaarten.
- Export: alle 797 beroepsfoto's, exacte lesinhoud, meetbeelden en de Node 22-functie.
- Google-antwoorden in de automatische tests zijn gesimuleerd. De echte verbinding controleer je na het instellen op Netlify.

Deze overdracht publiceert de bestaande ChatGPT-website niet opnieuw en schakelt die website niet uit.
