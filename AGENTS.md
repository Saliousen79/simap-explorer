# AGENTS.md – Projektauftrag für Cursor-Agenten

Kontextdokument für KI-Agenten, die an diesem Repository arbeiten. Beschreibt
Ziel, Pipeline, Struktur und die technischen Leitplanken.

## Ziel

Interaktive Next.js-Website zur Analyse Schweizer öffentlicher Ausschreibungen
(SIMAP-Daten) aus Supabase. Konversationelles BI-Projekt für ein Hochschulmodul,
deployed auf Vercel.

## Die Pipeline (Herzstück)

Jede Nutzerfrage durchläuft vier Stufen (siehe `README.md` und `/dokumentation`):

1. **Planung** – `lib/agents/openrouter-sql-agent.ts` ordnet die Frage einem
   erlaubten Analysetyp zu und erstellt einen validierten Analyseplan.
2. **Guard** – `lib/agents/analytics-query-compiler.ts` + `lib/security/sql-guard.ts`
   kompilieren parameterisiertes Read-only-SQL und prüfen Tabellen, Spalten, Limit.
3. **Abfrage** – `lib/db/readonly-postgres.ts` führt die Query gegen
   `public.archive` aus (Read-only-Role, festes Limit).
4. **Visualisierung** – `lib/agents/openrouter-chart-agent.ts` erzeugt mit zwei
   Modellen (DeepSeek, Gemini) unabhängige Chart-Konfigurationen; lokale Fallbacks
   in `chart-agent-a.ts` / `chart-agent-b.ts`.

Guardrails sind auf jeder Stufe aktiv (`lib/security/prompt-guard.ts`).

## Datenbankschema (Supabase, `public.archive`)

Wichtigste Spalten:

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

Etwa 200 000 Einträge.

## Projektstruktur

Siehe `README.md` für die vollständige Strukturübersicht. Kurz:

- `app/` – Next.js App Router: Seiten (`/`, `/dashboard`, `/dokumentation`,
  `/login`) und API-Routen (`/api/agent/chat`, `/api/login`).
- `components/` – UI in `ui/`, domänenspezifisch in `chat/`, `charts/`,
  `dashboard/`, `about/`, `layout/`.
- `lib/agents/` – Pipeline-Logik · `lib/security/` – Guardrails ·
  `lib/db/` – DB-Zugriff · `lib/ai/` – OpenRouter-Client · `lib/config/` – Kantone/Schema.
- `hooks/use-agent-chat.ts` – Client-State für das Streaming der Pipeline.
- `tests/` – Guardrail-Tests · `docs/wireframes/` – archivierte Entwürfe.

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS · Recharts ·
Supabase/Postgres · OpenRouter (DeepSeek, Gemini) · Vercel.

## Wichtige Implementierungshinweise

- Supabase-Abfragen immer mit `.limit()` (max. 1000); für Aggregate RPC oder
  gruppierte Queries nutzen.
- `award_amount` kann `null` sein – bei Bedarf mit
  `.not('award_amount', 'is', null)` filtern.
- Geldbeträge in CHF im Schweizer Format ausgeben (`de-CH`).
- Loading-States für alle datenbasierten Komponenten einbauen.
- Mobile-responsive mit Tailwind.
- Environment-Variablen sind **serverseitig** – niemals `NEXT_PUBLIC_` für
  Secrets verwenden. `.env*.local` wird nicht committet.

## .env.local

```
DATABASE_READONLY_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
OPENROUTER_API_KEY=...
OPENROUTER_SQL_MODEL=deepseek/deepseek-v4-flash
OPENROUTER_CHART_MODEL_A=deepseek/deepseek-v4-flash
OPENROUTER_CHART_MODEL_B=google/gemini-3.1-flash-lite
APP_LOGIN_USERNAME=...
APP_LOGIN_PASSWORD=...
```
