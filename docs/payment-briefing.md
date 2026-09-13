# TeamPayer – Briefing: Monetarisierung & Partnerschaft

> Kontextdokument für die Evaluation des Payment-Themas (Stand: Juli 2026).
> Zweck: (1) Monetarisierungsstrategie entwickeln, (2) Vorbereitung auf das Partnermeeting zur Anteilsverteilung.

---

## 1. Die App

**TeamPayer** (intern "fairshare-app") ist eine Kostenteilungs-App: Gruppen erfassen gemeinsame Ausgaben und splitten sie fair.

**Zielgruppe (breites Spektrum):**
- Kleine private Gruppen (Freunde, WGs, Reisen), die Ausgaben fair teilen wollen
- Vereine/Teams (Mannschaftskassen, Beiträge)
- Bis hin zu großen Unternehmen, die Projekte fair finanzieren wollen

**Produkt-Varianten** (separate Builds mit eigenen Bundle-IDs):
- TeamPayer (Standard, `com.teampayer.app`)
- TeamPayer School (`com.teampayer.school`)
- TeamPayer Teacher (`com.teampayer.teacher`)
- Student-Variante

**Tech-Stack:**
- Frontend/Backend: Next.js (App Router), gehostet auf Vercel (`teampayer.de`)
- Mobile: Capacitor (iOS + Android), WebView lädt die Remote-URL
- Auth: NextAuth (Apple, Google, Microsoft/Azure AD, E-Mail/Passwort), nativer Apple Sign-In via `@capacitor-community/apple-sign-in`
- Datenbank: Prisma (User, Accounts, ...)
- Push-/Local-Notifications integriert

**Status App Store:**
- Version 1.0.1, in Review-Schleife; letzter Rejection-Grund (Apple Login tat nichts) wurde behoben (`WKAppBoundDomains`-Fix)
- Apple hat im Review explizit gefragt: *"Does your app access any paid content?"* → aktuell: Nein, App ist kostenlos ohne Käufe. Die Antwort muss zur künftigen Monetarisierung konsistent bleiben.

---

## 2. Monetarisierungsoptionen

### Zentrale Randbedingung: Apple App Store Guidelines

- **Guideline 3.1.1:** Digitale Inhalte/Features (Premium-Funktionen, Abos) MÜSSEN über Apple In-App-Purchase laufen → 30 % Provision, bzw. **15 % im Small Business Program** (< 1 Mio. $ Umsatz/Jahr)
- **Guideline 3.1.3(e)/3.1.5:** Reale Leistungen und **Person-zu-Person-Zahlungen** dürfen (bzw. müssen) über externe Zahlungsdienstleister laufen (Stripe, PayPal) → **keine Apple-Provision**
- EU/DMA: Sonderregeln für externe Kauflinks in der EU (alternative Abwicklung möglich, Details volatil – aktuell recherchieren)
- Google Play: analoge Regeln (Service Fee 15/30 %, User Choice Billing in EU)

### Option A – Premium-Abo (Freemium + IAP)
- Basisfunktionen gratis; Pro-Features (z. B. unbegrenzte Gruppen, Statistiken, Export, Firmen-Features) per Auto-Renewable Subscription
- Muss über StoreKit/Google Play Billing laufen; **RevenueCat** als Abstraktionsschicht (guter Capacitor-Support)
- Provision: 15 % (Small Business Program) bis 30 %
- Vorteil: planbare, wiederkehrende Umsätze; einfach im Review
- Nachteil: Apple-Cut; Conversion von Gratis- zu Zahlnutzern typischerweise 2–5 %

### Option B – Transaktionsgebühren (extern, z. B. Stripe Connect)
- Wenn TeamPayer echtes Geld zwischen Personen bewegt (Beiträge einsammeln, Ausgleichzahlungen): Person-zu-Person → externe Abwicklung erlaubt, keine Apple-Provision
- Erlösmodell: kleine Gebühr pro Transaktion (fix oder prozentual)
- **Achtung Regulatorik (DE/EU):** Zahlungsabwicklung kann unter ZAG/PSD2 fallen. Mit Stripe Connect als lizenziertem Zahlungsdienstleister meist lösbar (Plattform-Modell), aber **rechtlich prüfen lassen**
- Vorteil: skaliert mit Nutzung, kein Apple-Cut
- Nachteil: technischer + rechtlicher Aufwand, Stripe-Gebühren (~1,5–2,9 % + Fixbetrag)

### Option C – B2B-Lizenzen (außerhalb des App Stores)
- Vereine/Unternehmen zahlen pro Team/Organisation/Jahr, Abschluss über die Website
- Kein Apple-Cut, solange die App (außerhalb der EU-Sonderregeln) nicht in-app auf den Kauf verlinkt
- Passt gut zur Unternehmens-Zielgruppe und zu den Varianten (School/Teacher)
- Vertrieb, Rechnungsstellung, Support laufen komplett über uns

### Option D – Kombination (empfohlener Prüfkandidat)
- B2C: Freemium + Pro-Abo via IAP (Option A)
- Geldbewegungen: Transaktionsgebühr über Stripe (Option B)
- B2B: Lizenzen über Website (Option C)
- Staffelung nach Segment: private Gruppen → Freemium; Vereine → Pro/Transaktionsgebühr; Unternehmen → B2B-Lizenz

### Offene Fragen zur Monetarisierung
1. Bewegt die App tatsächlich Geld (Zahlungsabwicklung) oder trackt sie nur Schulden? → entscheidet über Option B
2. Welche Features eignen sich als Pro-Features, ohne die Kern-UX zu beschneiden?
3. Preispunkte: Was zahlen Vergleichs-Apps? (Splitwise Pro ~5 €/Monat; Spond, Vereinsplaner etc. für Vereine)
4. Android-Strategie: gleiche Modelle für Google Play?
5. Auswirkung auf App-Review: IAP-Einführung erfordert neue Review inkl. IAP-Prüfung

---

## 3. Partnerschaft: Anteile fair regeln (Meeting am Montag)

**Ausgangslage:** App wurde gemeinsam mit einem Partnerunternehmen entwickelt. Beide Seiten wollen Erlöse fair über Anteile regeln; Modell noch offen.

### Vorab klären (eigene Position)
- Wer hat was eingebracht? (Idee, Code, Design, Infrastruktur, Kapital, Marktzugang/Kunden, Marke/Domain)
- Wer trägt künftig welche Rolle? (Entwicklung, Betrieb, Vertrieb, Support, Finanzierung laufender Kosten: Vercel, Apple/Google Developer, Stripe, DB)
- Wem gehört aktuell die IP? (Code-Repository, Marke "TeamPayer", Domain teampayer.de, Apple-Developer-Account/Team-ID)

### Mögliche Modelle
1. **Gemeinsame Gesellschaft (z. B. GmbH/UG):** Anteile nach Beitrag; sauberste Lösung bei ernsthafter Kommerzialisierung. IP wird in die Gesellschaft eingebracht
2. **Revenue-Share-Vertrag:** kein gemeinsames Unternehmen; vertraglich fixierte Erlösaufteilung (z. B. X/Y % nach Abzug direkter Kosten). Schneller, aber weniger robust bei Wachstum/Exit
3. **Lizenzmodell:** eine Partei hält die IP, die andere erhält Lizenz/Provision (z. B. Vertriebspartner-Modell)

### Verhandlungspunkte für Montag
- **Bewertung der bisherigen Beiträge** (Entwicklungszeit, Kapital, Infrastruktur) – ggf. "Slicing Pie"-Ansatz als faire Rechengrundlage
- **Zukünftige Pflichten** an Anteile koppeln (Vesting: Anteile wachsen mit fortlaufender Mitarbeit, statt fixer Zuteilung für Vergangenes)
- **Entscheidungsrechte** (wer entscheidet über Preise, Features, Exit?)
- **Kostenverteilung** laufender Betrieb
- **Exit-/Trennungsklauseln** (was passiert, wenn eine Partei aussteigt? Buy-out-Regelung)
- **IP-Übertragung** klar regeln (Code, Marke, Accounts)

### Empfehlung zur Vorbereitung
- Eigene Beiträge (Stunden, Kosten, Assets) vor dem Meeting auflisten und grob bewerten
- Zielkorridor für die eigene Beteiligung definieren (Wunsch / akzeptabel / Walk-away)
- Keine finale Zusage im Meeting – Ergebnis als Absichtserklärung festhalten, dann rechtlich prüfen lassen (Steuerberater + Anwalt für Gesellschaftsrecht)

---

## 4. Aufgaben für die Evaluation (Claude-Projekt)

1. Monetarisierungsoptionen A–D gegen Zielgruppensegmente bewerten (Matrix: Umsatzpotenzial, Aufwand, Risiko, Guideline-Konformität)
2. Wettbewerbsanalyse: Splitwise, Tricount, Settle Up, Spond, Vereinsplaner – Preise & Modelle
3. Regulatorik-Check Option B (ZAG/PSD2, Stripe Connect Plattform-Modell)
4. Preismodell-Entwurf (Free/Pro/Business-Tiers mit Preispunkten)
5. Gesellschafts-/Anteilsmodelle vergleichen und Verhandlungsstrategie für Montag schärfen
