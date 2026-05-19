import { Bot, Database, GitBranch, ShieldCheck } from "lucide-react";
import { ArchitectureDiagram } from "@/components/about/architecture-diagram";
import { Card } from "@/components/ui/card";

const items = [
  {
    title: "Project Idea",
    text: "SIMAP Agentic BI turns procurement data exploration into a conversational analysis workflow.",
    icon: Bot
  },
  {
    title: "Multi-Agent Architecture",
    text: "Specialized agents (trend, anomaly, benchmarking) collaborate through a central orchestrator.",
    icon: GitBranch
  },
  {
    title: "Supabase Integration",
    text: "Prepared for secure queries, aggregate RPCs, and scalable BI views on top of the archive table.",
    icon: Database
  },
  {
    title: "Human in the Loop",
    text: "Analysts validate AI findings, pin reliable widgets, and refine decision-ready dashboards.",
    icon: ShieldCheck
  }
];

export default function AboutPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">About SIMAP Agentic BI</h1>
      <div className="grid gap-3 md:grid-cols-2">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Card key={item.title} className="p-5">
              <div className="mb-2 inline-flex rounded-lg bg-primary/15 p-2 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <h2 className="text-lg font-medium">{item.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{item.text}</p>
            </Card>
          );
        })}
      </div>
      <ArchitectureDiagram />
    </section>
  );
}
