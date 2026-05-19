# SIMAP Explorer – Projektauftrag für Cursor-Agenten

Dieses Dokument beschreibt den Projektauftrag und die technischen Leitplanken. Agenten sollen es für Kontext bei Arbeit an diesem Repository verwenden.

## Ziel

Baue eine interaktive Next.js-Website zur Analyse von Schweizer öffentlichen Ausschreibungen (SIMAP-Daten) aus Supabase. Die Website dient als BI-Projekt für ein Hochschulmodul und wird auf Vercel deployed.

## Datenbankschema (Supabase, Tabelle: `public.archive`)

Die wichtigsten Spalten:

| Spalte | Typ | Bedeutung |
|--------|-----|-----------|
| `publication_date` | date | Datum der Ausschreibung |
| `canton` | varchar | Kanton des Auftraggebers |
| `award_amount` | numeric | Vergabebetrag in CHF |
| `winner_name` | text | Name des Gewinners |
| `winner_canton` | varchar | Kanton des Gewinners |
| `proc_office_name_de` | text | Name der Vergabestelle |
| `cpv_code_main` | varchar | Hauptbranche (CPV-Code) |
| `order_type` | varchar | Art des Auftrags |
| `process_type` | varchar | Vergabeverfahren |
| `number_of_submissions` | integer | Anzahl Angebote |
| `pub_type` | varchar | Publikationstyp |
| `title_de` | text | Titel der Ausschreibung |
| `city` | text | Stadt |
| `award_decision_date` | date | Datum Zuschlag |

Etwa 200'000 Einträge vorhanden.

## Tech Stack

- Next.js 14 (App Router)
- Supabase JS Client (`@supabase/supabase-js`)
- Recharts für Diagramme
- Tailwind CSS für Styling
- Deployment auf Vercel

## Projektstruktur

```
simap-explorer/
├── app/
│   ├── page.js                  # Landing Page mit KPI-Übersicht
│   ├── dashboard/page.js       # Haupt-Dashboard
│   ├── trends/page.js          # Zeitreihen & Trends
│   └── markt/page.js           # Marktkonzentration
├── components/
│   ├── KPICard.jsx             # Kennzahl-Karte
│   ├── TrendChart.jsx          # Liniendiagramm Zeitreihe
│   ├── CantonBarChart.jsx      # Balkendiagramm nach Kanton
│   ├── TopWinnersTable.jsx     # Tabelle Top-Gewinner
│   └── FilterBar.jsx           # Filter (Jahr, Kanton, CPV)
├── lib/
│   └── supabase.js             # Supabase Client
└── .env.local                  # Keys (nicht committen!)
```

## Seiten im Detail

### 1. Landing Page (`/`)

- Hero mit Titel „SIMAP Explorer“
- 4 KPI-Cards: Gesamtanzahl Aufträge, Gesamtvolumen CHF, Anzahl Kantone, durchschnittlicher Auftragswert
- Kurze Beschreibung, was die App macht

### 2. Dashboard (`/dashboard`)

- FilterBar oben: Jahr (2015–2024), Kanton, Auftragsart
- Balkendiagramm: Top 10 Kantone nach Vergabevolumen
- Balkendiagramm: Top 10 Gewinner nach Anzahl Aufträge
- Tabelle: Neueste Vergaben (letzte 20 Einträge)

### 3. Trends (`/trends`)

- Liniendiagramm: Anzahl Ausschreibungen pro Monat über Zeit
- Liniendiagramm: Vergabevolumen pro Quartal
- Filter: Kanton wählbar für Vergleiche

### 4. Markt (`/markt`)

- Balkendiagramm: Durchschnittliche Anzahl Angebote pro Vergabeverfahren (`process_type`)
- Top 10 aktivste Vergabestellen (`proc_office_name_de`)
- Anteil Aufträge mit nur 1 Angebot (Wettbewerbsindikator)

## Wichtige Implementierungshinweise

- Supabase-Abfragen immer mit `.limit()` (max. 1000); für Aggregate RPC-Funktionen oder gruppierte Queries nutzen
- `award_amount` kann `null` sein – bei Bedarf filtern mit `.not('award_amount', 'is', null)`
- Alle Geldbeträge in CHF im Schweizer Format formatieren
- Loading-States für alle Daten-Komponenten einbauen
- Mobile-responsive mit Tailwind

## `.env.local` Struktur

```
NEXT_PUBLIC_SUPABASE_URL=deine-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-key
```

## Empfohlene Reihenfolge

1. `lib/supabase.js` erstellen
2. Landing Page mit den 4 KPIs
3. Dann Seite für Seite aufbauen
