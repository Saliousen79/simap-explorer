# simap-explorer

## 3-Agent BI Workflow

This project contains a simple agentic BI workflow for SIMAP data:

- `PlannerSQLAgent` receives the user prompt, creates a short plan, and writes one read-only PostgreSQL `SELECT` query.
- `SQL Guard` validates that the generated SQL stays read-only and only targets the configured SIMAP table and columns.
- Supabase/Postgres executes the query through `DATABASE_READONLY_URL`, which should point to the read-only database user.
- `ChartAgentA` and `ChartAgentB` receive the same SQL result and create two different chart configuration alternatives.
- The user chooses which chart to keep and pins it to the dashboard. This is the human-in-the-loop step.

```mermaid
flowchart LR
  A[User Prompt] --> B[PlannerSQLAgent]
  B --> C[SQL Guard]
  C --> D[Read-only Supabase Query]
  D --> E[ChartAgentA + ChartAgentB]
  E --> F[User selects chart]
  F --> G[Dashboard]
```

The workflow reads only from `public.archive` and `public.projects`. Configure the
dedicated read-only PostgreSQL role in `.env.local`:

```env
DATABASE_READONLY_URL=postgresql://simap_app_reader.PROJECT_REF:PASSWORD@POOLER_HOST:5432/postgres
```

Never expose this value through a `NEXT_PUBLIC_` environment variable.

## OpenRouter agents

Copy the OpenRouter variables from `.env.example` to `.env.local`. The API key
must remain server-side. DeepSeek generates the SQL plan and competes with
Gemini on the same aggregated query result. Both chart agents return validated
JSON configurations and short data insights; they never return executable UI
code.

## Vercel login gate

Set these server-side environment variables on Vercel to protect the app with a
simple password screen:

```env
APP_LOGIN_USERNAME=your-login-name
APP_LOGIN_PASSWORD=your-shared-password
```

When either variable is missing, the login gate is disabled for local
development. The session cookie stores only a SHA-256 token derived from these
server-side values. Do not prefix these variables with `NEXT_PUBLIC_`.
