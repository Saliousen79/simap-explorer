"use client";

import { AlertTriangle, CheckCircle2, Circle, Clock3, Loader2, XCircle } from "lucide-react";
import { useRef } from "react";
import ReactMarkdown from "react-markdown";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { ChartDownloadButtons } from "@/components/charts/ChartDownloadButtons";
import { PinChartButton } from "@/components/dashboard/PinChartButton";
import { Card } from "@/components/ui/card";
import { AgentWorkflowState, ChartAgentResult } from "@/lib/agents/types";

function StageIcon({ status }: { status: "pending" | "running" | "complete" | "error" }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "complete") return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error") return <XCircle className="h-4 w-4 text-red-400" />;
  return <Circle className="h-4 w-4 text-muted-foreground/50" />;
}

function ChartChoice({
  label,
  chart,
  question,
  sql,
  source
}: {
  label: string;
  chart: ChartAgentResult;
  question: string;
  sql: string;
  source: "openrouter" | "fallback";
}) {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartHeight = chart.chartType === "bar" && chart.data.length > 8
    ? Math.min(460, Math.max(260, chart.data.length * 28))
    : 260;

  return (
    <Card className="space-y-4 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              {label}
            </span>
            <span className="rounded-full border border-border bg-muted/60 px-2.5 py-1 text-[11px] font-medium text-foreground/90">
              {chart.modelLabel}
            </span>
          </div>
          <h3 className="text-base font-semibold text-foreground">{chart.title}</h3>
        </div>
        <span className="flex items-center gap-1 rounded-full border border-border px-2 py-1 text-[11px] text-muted-foreground">
          <Clock3 className="h-3 w-3" /> {chart.latencyMs} ms
        </span>
      </div>
      <div ref={chartRef} className="min-w-0" style={{ height: chartHeight }}>
        <ChartRenderer chart={chart} />
      </div>
      <div className="space-y-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/90">Kurzfazit</p>
        <ul className="list-disc space-y-1 pl-4">
          {chart.insights.slice(0, 2).map((insight) => <li key={insight}><ReactMarkdown>{insight}</ReactMarkdown></li>)}
        </ul>
        <div className="rounded-lg border border-amber-400/20 bg-amber-400/5 p-2 text-amber-100/80">
          <ReactMarkdown>{chart.caveat}</ReactMarkdown>
        </div>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <ChartDownloadButtons chart={chart} containerRef={chartRef} />
        <PinChartButton chart={chart} question={question} sql={sql} plannerSource={source} />
      </div>
    </Card>
  );
}

export function AgentResult({ workflow }: { workflow: AgentWorkflowState }) {
  const result = workflow.result;
  const question = workflow.question ?? result?.userMessage ?? "SIMAP-Analyse";
  const sql = workflow.sql ?? result?.sql ?? "";
  const source = workflow.source ?? result?.source ?? "fallback";
  const chartA = workflow.chartA ?? result?.chartA;
  const chartB = workflow.chartB ?? result?.chartB;

  return (
    <div className="w-full space-y-4 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm">
      <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {workflow.stages.map((stage) => (
          <div key={stage.id} className="rounded-xl border border-border/60 bg-card/40 p-3">
            <div className="flex items-center gap-2">
              <StageIcon status={stage.status} />
              <span className="text-xs font-medium">{stage.label}</span>
            </div>
            {stage.detail ? <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{stage.detail}</p> : null}
          </div>
        ))}
      </div>

      {workflow.error ? (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-red-100" role="alert">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="text-xs font-semibold">{workflow.error.code}</p>
              <p className="mt-1 text-sm">{workflow.error.message}</p>
              {workflow.error.suggestions.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-red-100/80">{workflow.error.suggestions.map((suggestion) => <li key={suggestion}>{suggestion}</li>)}</ul> : null}
            </div>
          </div>
        </div>
      ) : null}

      {workflow.plan ? (
        <div>
          <h2 className="mb-2 text-sm font-semibold">Analyseplan</h2>
          <ol className="list-decimal space-y-1 pl-5 text-xs text-muted-foreground">
            {workflow.plan.map((step) => <li key={step}>{step}</li>)}
          </ol>
        </div>
      ) : null}

      {sql ? (
        <details className="rounded-xl border border-border/70 bg-card/50 p-3">
          <summary className="cursor-pointer text-xs font-medium text-foreground">
            Kompiliertes Read-only-SQL · {source === "openrouter" ? "LLM-Analyseplan" : "Regel-Fallback"}
          </summary>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap text-xs text-muted-foreground">{sql}</pre>
          {workflow.reason ? <p className="mt-3 text-xs text-muted-foreground">{workflow.reason}</p> : null}
          {workflow.rowCount !== undefined ? <p className="mt-2 text-xs text-primary">{workflow.rowCount} Ergebniszeilen</p> : null}
        </details>
      ) : null}

      {chartA || chartB ? (
        <div className="grid gap-3 xl:grid-cols-2">
          {chartA ? <ChartChoice label="Variante A" chart={chartA} question={question} sql={sql} source={source} /> : null}
          {chartB ? <ChartChoice label="Variante B" chart={chartB} question={question} sql={sql} source={source} /> : null}
        </div>
      ) : null}

      {result ? <p className="text-right text-[11px] text-muted-foreground">Gesamtdauer: {result.totalLatencyMs} ms</p> : null}
    </div>
  );
}
