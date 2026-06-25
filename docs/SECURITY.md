# Security

Umgang mit Secrets und Zugangsdaten im SIMAP Explorer. Dieses Dokument
beschreibt, was öffentlich ist, was privat bleibt und wie rotiert wird.

## Grundsatz

Echte Secrets stehen **niemals** im Repository. Sie leben nur in zwei Orten:

1. **Lokal** in `.env.local` (wird über `.gitignore` ignoriert und nie committet).
2. **Auf Vercel** in den Project Environment Variables (server-side, verschlüsselt abgelegt).

Im Repo selbst steht nur `.env.example` mit Platzhaltern (`YOUR_...`,
`PROJECT_REF`, `change-me`). Der Code liest alle Werte zur Laufzeit über
`process.env` – nichts ist hartcodiert.

## Übersicht der Variablen

| Variable | Sichtbarkeit | Rotieren bei Exposition? |
|----------|--------------|--------------------------|
| `DATABASE_READONLY_URL` | **privat** (DB-Verbindung mit Passwort) | ja |
| `OPENROUTER_API_KEY` | **privat** (LLM-Zugang, kostenpflichtig) | ja – dringend |
| `APP_LOGIN_USERNAME` / `APP_LOGIN_PASSWORD` | **privat** (Login-Gate) | ja |
| `NEXT_PUBLIC_SUPABASE_URL` | öffentlich (im Client sichtbar) | nein |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | **öffentlich by design** (Supabase Pub-Key, Row-Level-Security schützt) | nein |

`NEXT_PUBLIC_*`-Variablen sind bewusst öffentlich – sie sind im Browser sichtbar.
Supabase schützt die Daten über Row-Level-Security-Policies, nicht über den
Anon-Key. Der Anon-Key allein gewährt keinen Zugriff auf nicht freigegebene Daten.

## Sicherheitsebenen der Pipeline

Die Pipeline schützt Daten auf mehreren Ebenen (Defense in Depth):

1. **Prompt-Guard** (`lib/security/prompt-guard.ts`) – blockiert Prompt-Injection
   und Themaverfehlungen vor der Planung.
2. **SQL-Guard** (`lib/security/sql-guard.ts`) – erlaubt nur `SELECT` auf
   `public.archive` / `public.projects`, keine Schreibbefehle, `LIMIT ≤ 1000`,
   Allowlist für Spalten, parameterisierte Queries (Bind-Variablen gegen
   SQL-Injection).
3. **Read-only-DB-Role** – `DATABASE_READONLY_URL` zeigt auf eine
   Supabase-Role mit ausschliesslich Lesezugriff. Selbst bei einer
   SQL-Guard-Lücke könnte die Datenbank nicht geschrieben werden.
4. **Kantons-Konsistenz** – erwähnte Kantone in der Frage müssen mit der
   Kartenauswahl übereinstimmen (`FILTER_CONFLICT`).

## Rotations-Checkliste

Wenn ein privater Secret versehentlich exponiert wurde (z. B. im Chat, in
einem Screenshot oder versehentlich committet):

1. **OpenRouter-API-Key** – im OpenRouter-Dashboard löschen, neuen Key erzeugen,
   in `.env.local` und in den Vercel-Env-Vars ersetzen.
2. **DB-Passwort** – in Supabase neues Passwort für die Reader-Role setzen,
   `DATABASE_READONLY_URL` in `.env.local` und Vercel aktualisieren.
3. **Login-Passwort** – neuen Wert für `APP_LOGIN_PASSWORD` vergeben,
   in `.env.local` und Vercel eintragen.
4. **Vercel neu deployen**, damit die neuen Env-Vars greifen.

Falls ein Secret versehentlich in die Git-Historie geriet: nur Löschen aus dem
aktuellen Stand reicht **nicht** – der Wert bleibt im Verlauf. In diesem Fall
rotieren (Schritt 1–3) und ggf. die Historie bereinigen (`git filter-repo`).

## Was nicht ins Repo gehört

`.gitignore` ignoriert unter anderem:

- `.env` und `.env*.local`
- `node_modules`, `.next`, Build-Artefakte
- OS-/IDE-Metadaten (`.DS_Store`, `.vscode`, `.idea`)

Vor jedem Commit prüfen, dass keine Datei mit echten Werten hinzugefügt wird.
