import Link from "next/link";
import { Card } from "@/components/ui/card";
import { PipelineFlow } from "@/components/about/pipeline-flow";

const DATA_FIELDS = [
  ["Publikationsdatum", "Datum der Ausschreibung"],
  ["Kanton / Stadt", "Geografische Einordnung des Auftraggebers"],
  ["Vergabebetrag", "Zuschlagssumme in CHF"],
  ["Gewinner & Kanton", "Empfängerunternehmen und Standort"],
  ["Vergabestelle", "proc_office_name_de"],
  ["CPV-Code", "Branchenklassifikation"],
  ["Auftrags- & Verfahrenstyp", "Art und Modus der Vergabe"],
  ["Anzahl Angebote", "Wettbewerbsindikator"]
];

const PRINCIPLES = [
  {
    title: "Natürliche Sprache statt SQL",
    body: "Nutzer formulieren Fragen in Deutsch. Der Planner übersetzt sie in einen validierten Analyseplan, nicht in freie Datenbankzugriffe."
  },
  {
    title: "Guardrails durchgehend",
    body: "Prompt-Guard, SQL-Guard und Kantonsprüfung arbeiten auf jeder Stufe. Freitext-SQL und Schreibzugriffe sind strukturell ausgeschlossen."
  },
  {
    title: "Zwei Perspektiven",
    body: "DeepSeek und Gemini visualisieren dieselben Ergebnisse unabhängig voneinander. Die Gegenüberstellung macht den Modellauswahl-Vergleich sichtbar."
  },
  {
    title: "Erklärbare Ergebnisse",
    body: "Jede Antwort enthält Plan, SQL, Daten, zwei Diagramme, Insights und ein Caveat. Relevante Resultate lassen sich an das Dashboard anheften."
  }
];

export default function DokumentationPage() {
  return (
    <section className="mx-auto max-w-5xl space-y-16">
      <header className="space-y-4">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
          FHNW · Business Intelligence
        </p>
        <h1 className="text-4xl font-semibold tracking-tight md:text-5xl">Dokumentation</h1>
        <p className="max-w-2xl text-base leading-7 text-muted-foreground">
          SIMAP Explorer ist ein interaktives Analyseprojekt von Saliou Dieng für das Modul
          Business Intelligence an der FHNW Olten bei Professor Dr. Manuel Renold. Datenquelle ist
          die öffentliche Beschaffungsplattform{" "}
          <a
            href="https://www.simap.ch"
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline underline-offset-4 decoration-border hover:text-primary"
          >
            simap.ch
          </a>
          .
        </p>
      </header>

      <section className="space-y-6">
        <div className="flex items-end justify-between border-b border-border pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Die Pipeline</h2>
          <p className="hidden text-sm text-muted-foreground sm:block">Vier Stufen, eine Frage</p>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Jede Nutzerfrage durchläuft eine feste Pipeline aus Planung, Guard, Abfrage und
          Visualisierung. Die Stufen bauen aufeinander auf und sind das Herzstück des Projekts:
          sie trennen Verstehen, Absichern, Auswerten und Darstellen sauber voneinander.
        </p>
        <PipelineFlow />
      </section>

      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">API &amp; Agenten-Kommunikation</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Die Pipeline läuft serverseitig über <span className="font-mono text-foreground">POST /api/agent/chat</span>.
          Die Antwort wird als NDJSON-Stream geliefert – ein JSON-Objekt pro Zeile –, damit die
          Oberfläche jede Stufe live anzeigen kann (<span className="font-mono text-foreground">stage</span>,
          <span className="font-mono text-foreground"> plan</span>,
          <span className="font-mono text-foreground"> sql</span>,
          <span className="font-mono text-foreground"> data</span>,
          <span className="font-mono text-foreground"> candidate</span>,
          <span className="font-mono text-foreground"> complete</span>).
        </p>
        <div className="rounded-2xl border border-border/60 bg-card/40 p-6">
          <h3 className="text-base font-semibold text-foreground">Data-flow statt Konversation</h3>
          <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground">
            Die Agenten führen kein LLM-zu-LLM-Gespräch. Jede Stufe erzeugt ein validiertes JSON-Objekt,
            das die nächste als Eingabe erhält. So bleibt jeder Schritt deterministisch, testbar und
            abschirmbar – ein Agent kann dem nächsten keine Anweisungen einschleusen, weil die
            Übergänge nur Daten enthalten.
          </p>
          <pre className="mt-4 overflow-x-auto rounded-xl bg-background/60 p-4 font-mono text-xs leading-6 text-muted-foreground">{`Nutzerfrage
   │  JSON: { message, selectedCantons }
   ▼
Planner (DeepSeek)  ──►  Analyseplan (JSON-Schema)
   ▼
SQL-Compiler  ──►  validiertes SQL + Bind-Parameter
   ▼
Supabase  ──►  Ergebniszeilen (JSON)
   ▼
Chart-Agent A (DeepSeek)  ┐  parallel, identische Eingabe,
Chart-Agent B (Gemini)    ┘  ohne Kenntnis voneinander
   ▼
zwei Chart-Konfigurationen → Dashboard`}</pre>
        </div>
        <ul className="max-w-2xl space-y-2 text-sm leading-7 text-muted-foreground">
          <li className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><span className="text-foreground">Strukturierte Antworten:</span> alle LLM-Aufrufe erzwingen JSON via <span className="font-mono text-foreground">json_schema</span> – kein Freitext, kein Code.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><span className="text-foreground">Unabhängige Agenten:</span> die beiden Chart-Agenten arbeiten parallel mit identischer Eingabe; fällt eines aus, übernimmt ein lokaler Fallback.</span>
          </li>
          <li className="flex gap-3">
            <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
            <span><span className="text-foreground">Orchestrierung an einem Ort:</span> <span className="font-mono text-foreground">lib/agents/pipeline.ts</span> steuert die Reihenfolge, die API-Route ist nur ein schlanker Streaming-Wrapper.</span>
          </li>
        </ul>
      </section>

      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Datenbasis</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Die Daten liegen in Supabase in der Tabelle <span className="font-mono text-foreground">public.archive</span>{" "}
          und umfassen rund 200 000 Einträge aus der Schweizer öffentlichen Beschaffung. Acht
          Felder tragen den Grossteil aller Auswertungen.
        </p>
        <Card className="overflow-hidden border-border/60 bg-card/40">
          <table className="w-full text-left text-sm">
            <tbody>
              {DATA_FIELDS.map(([field, meaning]) => (
                <tr key={field} className="border-b border-border/40 last:border-0">
                  <td className="w-1/3 px-5 py-3 font-medium text-foreground">{field}</td>
                  <td className="px-5 py-3 text-muted-foreground">{meaning}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </section>

      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Gestaltungsprinzipien</h2>
        </div>
        <div className="grid gap-px overflow-hidden rounded-2xl border border-border/60 bg-border/60 md:grid-cols-2">
          {PRINCIPLES.map((principle) => (
            <div key={principle.title} className="bg-card/40 p-6">
              <h3 className="text-base font-semibold text-foreground">{principle.title}</h3>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">{principle.body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <div className="border-b border-border pb-3">
          <h2 className="text-2xl font-semibold tracking-tight">Business Use Case</h2>
        </div>
        <p className="max-w-2xl text-sm leading-7 text-muted-foreground">
          Unternehmen erkennen Marktchancen in der öffentlichen Beschaffung, beobachten Wettbewerber
          und analysieren regionale Vergabemuster. Vertriebsteams sehen, welche Kantone, Branchen und
          Vergabestellen besonders aktiv sind; BI-Teams erkennen Konzentrationen, Trends und
          Markteintrittschancen. Das Projekt zeigt Business Intelligence praktisch: Daten werden
          gesammelt, strukturiert, analysiert, visualisiert und in Entscheidungen übersetzt.
        </p>
      </section>

      <footer className="flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="font-mono text-xs text-muted-foreground">Saliou Dieng · FHNW Olten</p>
        <Link
          href="/"
          className="inline-flex w-fit rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition hover:brightness-110"
        >
          Zur Analyse
        </Link>
      </footer>
    </section>
  );
}
