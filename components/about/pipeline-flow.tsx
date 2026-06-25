const STAGES = [
  {
    number: "01",
    title: "Planung",
    role: "Analytics Planner",
    model: "DeepSeek V4 Flash",
    description: "Die natürlichsprachige Frage wird einem erlaubten Analysetyp zugeordnet – Rangliste, Trend, Verfahrensvergleich oder Marktanalyse. Ausgeschlossen sind Themen ausserhalb der SIMAP-Beschaffung.",
    outputs: ["Analyseplan", "Intent", "Filter"]
  },
  {
    number: "02",
    title: "Guard",
    role: "SQL-Kompilierung & Guardrails",
    model: "Regelbasiert",
    description: "Der Analyseplan wird in parameterisiertes Read-only-SQL übersetzt. Ein SQL-Guard prüft Tabellen, Spalten, Limit und Verbotsklauseln – kein Freitext-SQL, keine Schreibzugriffe.",
    outputs: ["Validiertes SQL", "Parameter", "Limit"]
  },
  {
    number: "03",
    title: "Abfrage",
    role: "Supabase public.archive",
    model: "Postgres Read-only",
    description: "Die freigegebene Abfrage läuft gegen rund 200 000 Vergabeeinträge in Supabase. Geliefert werden aggregierte Ergebniszeilen, keine Rohdaten, mit festem Limit.",
    outputs: ["Aggregierte Zeilen", "Spalten"]
  },
  {
    number: "04",
    title: "Visualisierung",
    role: "Chart-Agent A & B",
    model: "DeepSeek + Gemini",
    description: "Zwei unabhängige Modelle visualisieren dieselben validierten Ergebnisse – eine managementorientierte Sicht und eine kreative Alternative. Konflikte im Diagrammtyp werden automatisch aufgelöst.",
    outputs: ["Zwei Diagramme", "Insights", "Caveat"]
  }
];

export function PipelineFlow() {
  return (
    <div className="flex flex-col gap-0">
      {STAGES.map((stage, index) => (
        <div key={stage.number} className="relative">
          <div className="grid gap-6 rounded-2xl border border-border/60 bg-card/40 p-6 md:grid-cols-[auto_1fr_auto] md:items-start">
            <div className="flex items-baseline gap-4">
              <span className="font-mono text-3xl font-semibold tracking-tight text-primary md:text-4xl">
                {stage.number}
              </span>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{stage.title}</h3>
                <p className="text-sm text-muted-foreground">{stage.role}</p>
              </div>
            </div>

            <p className="text-sm leading-7 text-muted-foreground md:max-w-xl">{stage.description}</p>

            <div className="flex flex-col gap-2 md:items-end">
              <span className="rounded-full border border-border/70 bg-background/50 px-3 py-1 font-mono text-xs text-foreground/80">
                {stage.model}
              </span>
              <div className="flex flex-wrap gap-1.5 md:justify-end">
                {stage.outputs.map((output) => (
                  <span key={output} className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] text-primary">
                    {output}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {index < STAGES.length - 1 ? (
            <div aria-hidden className="flex justify-center py-3">
              <div className="h-8 w-px bg-gradient-to-b from-border to-transparent" />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
