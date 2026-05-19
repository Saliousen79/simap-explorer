import { Card } from "@/components/ui/card";

const blocks = [
  "Client UI (Next.js 15)",
  "Agent Orchestrator (future)",
  "Analytics Tool Layer",
  "Supabase Data + RPC"
];

export function ArchitectureDiagram() {
  return (
    <Card className="p-6">
      <h3 className="mb-4 text-lg font-semibold">System Architecture</h3>
      <div className="grid gap-3 md:grid-cols-4">
        {blocks.map((block) => (
          <div key={block} className="rounded-xl border border-border bg-muted/20 p-4 text-sm">
            {block}
          </div>
        ))}
      </div>
    </Card>
  );
}
