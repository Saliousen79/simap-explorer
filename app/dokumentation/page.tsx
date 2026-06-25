import Link from "next/link";
import { BarChart3, Bot, BriefcaseBusiness, Database, FileText, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";

const sections = [
  {
    title: "Datenbasis",
    icon: Database,
    text: "Das Projekt arbeitet mit öffentlichen Ausschreibungs- und Vergabedaten von simap.ch. Die Daten liegen in Supabase in der Tabelle public.archive und umfassen rund 200.000 Einträge aus der Schweizer Beschaffung.",
    points: [
      "Zentrale Felder sind Publikationsdatum, Kanton, Vergabebetrag, Gewinner, Vergabestelle, CPV-Code, Auftragsart und Verfahren.",
      "Geldwerte werden als numerische CHF-Beträge verarbeitet; fehlende award_amount-Werte werden je nach Analyse ausgeschlossen.",
      "Kantone, Datumsfelder und Textspalten werden für Filter, Gruppierungen und Dashboard-Auswertungen vereinheitlicht genutzt."
    ]
  },
  {
    title: "Aufbereitung",
    icon: FileText,
    text: "Die Rohdaten werden nicht direkt frei durchsucht, sondern über freigegebene Analysepfade abgefragt. Dadurch bleiben die Abfragen kontrollierbar, reproduzierbar und für BI-Auswertungen geeignet.",
    points: [
      "Supabase-Abfragen nutzen feste Tabellen, erlaubte Spalten und Limits.",
      "Der Chat übersetzt Nutzerfragen in validierte Analysepläne statt in beliebige Datenbankzugriffe.",
      "Ergebnisse werden als Diagramme, CSV-Export und anheftbare Dashboard-Widgets aufbereitet."
    ]
  },
  {
    title: "Projektidee",
    icon: BarChart3,
    text: "SIMAP Explorer verbindet ein klassisches BI-Dashboard mit einem Chatbot. Nutzer müssen keine SQL-Abfragen schreiben, sondern können Fragen zur öffentlichen Beschaffung natürlich formulieren.",
    points: [
      "Die Kantonsauswahl begrenzt jede Analyse auf den gewünschten geografischen Bereich.",
      "Der Chat liefert erklärbare Auswertungen mit Diagrammen und kurzen Interpretationen.",
      "Relevante Resultate können an das Dashboard angeheftet und später verglichen werden."
    ]
  },
  {
    title: "Chatbot und LLM-Agenten",
    icon: Bot,
    text: "Der Chatbot fungiert als Oberfläche für einen Agenten-Workflow. Die LLM-Komponente versteht die Frage, erstellt einen Analyseplan und wählt einen passenden Auswertungstyp.",
    points: [
      "Ein Guardrail prüft, ob die Anfrage zu den erlaubten SIMAP-Analysen passt.",
      "Der Query-Agent erzeugt nur freigegebene, limitierte Datenbankabfragen.",
      "Die Antwort-Komponente kombiniert Daten, Visualisierung, Kurzfazit und Exportoptionen."
    ]
  },
  {
    title: "Business Use Case",
    icon: BriefcaseBusiness,
    text: "Unternehmen können mit dem Produkt Marktchancen in der öffentlichen Beschaffung erkennen, Wettbewerber beobachten und regionale Vergabemuster analysieren.",
    points: [
      "Vertriebsteams sehen, welche Kantone, Branchen und Vergabestellen besonders aktiv sind.",
      "Management und BI-Teams erkennen Konzentrationen, Trends und potenzielle Markteintrittschancen.",
      "Das Projekt zeigt Business Intelligence praktisch: Daten werden gesammelt, strukturiert, analysiert, visualisiert und in Entscheidungen übersetzt."
    ]
  }
];

export default function DokumentationPage() {
  return (
    <section className="mx-auto max-w-6xl space-y-6">
      <div className="rounded-3xl border border-border/70 bg-card/55 p-6 shadow-xl shadow-black/20 md:p-8">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
          <GraduationCap className="h-4 w-4" />
          FHNW Business Intelligence Projekt
        </div>
        <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">Dokumentation</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground md:text-lg">
          SIMAP Explorer ist ein interaktives Analyseprojekt von <span className="font-medium text-foreground">Saliou Dieng</span> für das Modul Business Intelligence an der FHNW Olten bei Professor Dr. Manuel Renold.
        </p>
        <p className="mt-3 text-sm text-muted-foreground">
          Datenquelle:{" "}
          <a href="https://www.simap.ch" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">
            simap.ch
          </a>
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {sections.map((section) => {
          const Icon = section.icon;
          return (
            <Card key={section.title} className="border-border/70 bg-card/55 p-5">
              <div className="mb-3 inline-flex rounded-xl bg-primary/15 p-2 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-xl font-semibold">{section.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{section.text}</p>
              <ul className="mt-4 space-y-2 text-sm leading-6 text-muted-foreground">
                {section.points.map((point) => (
                  <li key={point} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    <span>{point}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      <Card className="border-border/70 bg-card/55 p-5">
        <h2 className="text-xl font-semibold">Systemstruktur</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {["Next.js Oberfläche", "Chatbot + Guardrails", "LLM Query-Agent", "Supabase public.archive"].map((item) => (
            <div key={item} className="rounded-2xl border border-border/70 bg-background/40 p-4 text-sm text-muted-foreground">
              {item}
            </div>
          ))}
        </div>
        <div className="mt-5">
          <Link href="/" className="inline-flex rounded-full bg-primary px-5 py-2 text-sm font-medium text-primary-foreground transition hover:brightness-110">
            Zur Analyse starten
          </Link>
        </div>
      </Card>
    </section>
  );
}
