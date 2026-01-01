# FairShare

**Der fairste Verteilungsschlüssel aller Zeiten**

FairShare ist eine Web-App für anonyme Bewertungen von Gruppenbeiträgen. Teams können nach gemeinsamen Sessions bewerten, welchen prozentualen Anteil einzelne Beteiligte ihrer Meinung nach an der gemeinsamen Leistung haben.

## 🚀 Features

- **Anonyme Bewertungen**: Teilnehmer bewerten anonym über Magic-Links
- **Flexible Bewertung**: Nicht alle Felder müssen ausgefüllt werden
- **Zwei Aggregationsmodi**: Fehlende Stimmen ignorieren oder als 0% zählen
- **Echtzeit-Fortschritt**: Organisatoren sehen live den Bewertungsfortschritt
- **Moderne UI**: Responsive Design mit TailwindCSS und shadcn/ui
- **CSV-Export**: Ergebnisse als CSV exportieren

## 🛠️ Tech Stack

- **Frontend**: Next.js 14, React, TypeScript
- **Styling**: TailwindCSS, shadcn/ui
- **Backend**: Next.js API Routes
- **Datenbank**: PostgreSQL mit Prisma ORM
- **Authentifizierung**: JWT Magic Links
- **Icons**: Lucide React

## 📋 Voraussetzungen

- Node.js 18+ 
- PostgreSQL Datenbank
- npm oder yarn

## ⚙️ Setup

### 1. Repository klonen

```bash
git clone <repository-url>
cd fairshare-app
```

### 2. Dependencies installieren

```bash
npm install
```

### 3. Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
# Datenbank
DATABASE_URL="postgresql://username:password@localhost:5432/fairshare"

# JWT Secret für Magic Links
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# App URL (für Magic Links)
APP_URL="http://localhost:3000"
```

### 4. Datenbank einrichten

```bash
# Datenbank migrieren
npx prisma migrate dev --name init

# Prisma Client generieren
npx prisma generate
```

### 5. Entwicklungsserver starten

```bash
npm run dev
```

Die App ist nun unter [http://localhost:3000](http://localhost:3000) erreichbar.

## 🗄️ Datenbank Schema

```prisma
model Session {
  id           String       @id @default(uuid())
  title        String
  date         DateTime
  mode         Mode         @default(IGNORE_MISSING)
  deadlineAt   DateTime?
  status       Status       @default(OPEN)
  participants Participant[]
  ballots      Ballot[]
  createdAt    DateTime     @default(now())
}

model Participant {
  id            String    @id @default(uuid())
  sessionId     String
  session       Session   @relation(fields: [sessionId], references: [id])
  displayName   String
  invitedEmail  String?
  inviteToken   String?   @unique
  hasSubmitted  Boolean   @default(false)
  ballots       Ballot[]
}

model Ballot {
  id           String       @id @default(uuid())
  sessionId    String
  session      Session      @relation(fields: [sessionId], references: [id])
  participantId String?
  participant  Participant? @relation(fields: [participantId], references: [id])
  tokenHash    String       @unique
  status       BallotStatus @default(DRAFT)
  votes        Vote[]
  note         String?
  submittedAt  DateTime?
  updatedAt    DateTime     @updatedAt
}

model Vote {
  id         String   @id @default(uuid())
  ballotId   String
  ballot     Ballot   @relation(fields: [ballotId], references: [id])
  personId   String
  percent    Float
}
```

## 🔄 Workflow

1. **Session erstellen**: Organisator erstellt Session mit Teilnehmerliste
2. **Einladungen versenden**: Magic-Links werden generiert und versendet
3. **Bewertungen abgeben**: Teilnehmer bewerten anonym über ihre Links
4. **Fortschritt verfolgen**: Organisator sieht Echtzeit-Fortschritt
5. **Session schließen**: Organisator schließt Session manuell oder automatisch
6. **Ergebnisse anzeigen**: Anonymisierte Ergebnisse mit Durchschnittswerten

## 🎯 API Endpoints

| Route | Methode | Beschreibung |
|-------|---------|--------------|
| `/api/sessions` | POST | Neue Session erstellen |
| `/api/sessions/:id` | GET | Session-Details abrufen |
| `/api/sessions/:id/close` | POST | Session schließen |
| `/api/vote/:token` | GET | Abstimmungsformular laden |
| `/api/vote/:token` | PUT | Abstimmung speichern (Draft) |
| `/api/vote/:token/submit` | POST | Abstimmung final absenden |
| `/api/sessions/:id/results` | GET | Ergebnisse abrufen |

## 🚀 Deployment

### Vercel + Supabase

1. **Supabase Projekt erstellen**:
   - Neue PostgreSQL Datenbank erstellen
   - `DATABASE_URL` aus Supabase kopieren

2. **Vercel Deployment**:
   ```bash
   npm install -g vercel
   vercel
   ```

3. **Umgebungsvariablen in Vercel setzen**:
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `APP_URL`

4. **Datenbank migrieren**:
   ```bash
   npx prisma migrate deploy
   ```

### Docker (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

## 🔒 Sicherheit

- **JWT Tokens**: Sichere Magic-Link Authentifizierung
- **Anonymität**: Keine Zuordnung von Stimmen zu Personen
- **Input Validation**: Alle Eingaben werden validiert
- **SQL Injection Schutz**: Prisma ORM verhindert SQL Injection

## 🧪 Testing

```bash
# Unit Tests (falls implementiert)
npm test

# E2E Tests (falls implementiert)
npm run test:e2e
```

## 📝 Lizenz

MIT License - siehe [LICENSE](LICENSE) Datei.

## 🤝 Contributing

1. Fork das Repository
2. Erstelle einen Feature Branch (`git checkout -b feature/amazing-feature`)
3. Committe deine Änderungen (`git commit -m 'Add amazing feature'`)
4. Push zum Branch (`git push origin feature/amazing-feature`)
5. Öffne einen Pull Request

## 📞 Support

Bei Fragen oder Problemen erstelle ein [Issue](https://github.com/your-repo/fairshare/issues) im Repository.
# fairshare
