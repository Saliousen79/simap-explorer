"use client";

import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { PinChartButton } from "@/components/dashboard/PinChartButton";
import { Card } from "@/components/ui/card";
import { AgentChatResponse, ChartAgentResult } from "@/lib/agents/types";

function ChartChoice({ label, chart }: { label: string; chart: ChartAgentResult }) {
  return (
    <Card className="space-y-3 p-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-primary">{label}</p>
        <h3 className="text-sm font-semibold text-foreground">{chart.title}</h3>
      </div>
      <div className="h-[220px]">
        <ChartRenderer chart={chart} />
      </div>
      <p className="text-xs text-muted-foreground">{chart.description}</p>
      <p className="text-xs text-muted-foreground">
        <span className="font-medium text-foreground/80">Warum interessant: </span>
        {chart.whyInteresting}
      </p>
      <PinChartButton chart={chart} />
    </Card>
  );
}

export function AgentResult({ result }: { result: AgentChatResponse }) {
  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
      <div>
        <h2 className="mb-2 text-sm font-semibold">Plan</h2>
        <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
          {result.plan.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </div>

      <details className="rounded-xl border border-border/70 bg-card/50 p-3">
        <summary className="cursor-pointer text-xs font-medium text-foreground">Generated SQL</summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">{result.sql}</pre>
        <p className="mt-3 text-xs text-muted-foreground">{result.reason}</p>
      </details>

      <div className="grid gap-3 lg:grid-cols-2">
        <ChartChoice label="Chart Agent A" chart={result.chartA} />
        <ChartChoice label="Chart Agent B" chart={result.chartB} />
      </div>
    </div>
  );
}

