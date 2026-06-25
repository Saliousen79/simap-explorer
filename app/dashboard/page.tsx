"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import GridLayout, { Layout } from "react-grid-layout";
import { LayoutDashboard, Trash2, X } from "lucide-react";
import { ChartRenderer } from "@/components/charts/ChartRenderer";
import { ChartDownloadButtons } from "@/components/charts/ChartDownloadButtons";
import { Button } from "@/components/ui/button";
import { buttonVariants } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { clearPinnedCharts, getPinnedCharts, removePinnedChart } from "@/components/dashboard/PinChartButton";
import { PinnedChart } from "@/lib/agents/types";
import "react-grid-layout/css/styles.css";

function defaultLayout(charts: PinnedChart[]): Layout[] {
  return charts.map((chart, index) => ({
    i: chart.id,
    x: (index % 2) * 6,
    y: Math.floor(index / 2) * 10,
    w: 6,
    h: 10,
    minW: 4,
    minH: 8
  }));
}

function PinnedChartCard({ chart }: { chart: PinnedChart }) {
  const chartRef = useRef<HTMLDivElement>(null);
  return (
    <Card className="flex h-full min-w-0 flex-col overflow-hidden p-4">
      <div className="drag-handle mb-3 flex cursor-move items-start justify-between gap-3">
        <div>
          <h2 className="font-semibold">{chart.title}</h2>
          <p className="text-xs text-muted-foreground">{chart.modelLabel} · {new Date(chart.createdAt).toLocaleDateString("de-CH")}</p>
        </div>
        <Button size="sm" variant="ghost" onClick={() => removePinnedChart(chart.id)} aria-label="Analyse entfernen">
          <X className="h-4 w-4" />
        </Button>
      </div>
      <div ref={chartRef} className="min-h-0 min-w-0 flex-1"><ChartRenderer chart={chart} /></div>
      <div className="mt-3 space-y-2 text-xs text-muted-foreground">
        <p className="font-medium text-foreground/80">{chart.question}</p>
        {chart.insights.slice(0, 2).map((insight) => <p key={insight}>• {insight}</p>)}
        <ChartDownloadButtons chart={chart} containerRef={chartRef} />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [pinnedCharts, setPinnedCharts] = useState<PinnedChart[]>([]);
  const [layout, setLayout] = useState<Layout[]>([]);
  const [width, setWidth] = useState(1000);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sync = () => {
      const charts = getPinnedCharts();
      const defaults = defaultLayout(charts);
      setPinnedCharts(charts);
      setLayout((previous) => charts.map((chart, index) =>
        previous.find((item) => item.i === chart.id) ?? defaults[index]
      ));
    };
    sync();
    window.addEventListener("simap-pinned-charts-updated", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("simap-pinned-charts-updated", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)));
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Mein Analyse-Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Ausgewählte Agentenanalysen lassen sich verschieben und skalieren.</p>
        </div>
        {pinnedCharts.length ? (
          <Button variant="outline" size="sm" onClick={clearPinnedCharts}>
            <Trash2 className="mr-2 h-4 w-4" /> Alle entfernen
          </Button>
        ) : null}
      </div>

      <div ref={containerRef}>
        {!pinnedCharts.length ? (
          <Card className="flex min-h-[360px] flex-col items-center justify-center gap-4 p-8 text-center">
            <span className="rounded-2xl bg-primary/10 p-4 text-primary"><LayoutDashboard className="h-7 w-7" /></span>
            <div>
              <h2 className="font-semibold">Noch keine Analysen angeheftet</h2>
              <p className="mt-1 max-w-md text-sm text-muted-foreground">Stelle im Chat eine Frage, vergleiche DeepSeek und Gemini und hefte die bessere Visualisierung hier an.</p>
            </div>
            <Link href="/" className={buttonVariants()}>Analyse starten</Link>
          </Card>
        ) : (
          <GridLayout
            className="layout"
            cols={12}
            width={width}
            rowHeight={32}
            layout={layout}
            onLayoutChange={setLayout}
            draggableHandle=".drag-handle"
          >
            {pinnedCharts.map((chart) => (
              <div key={chart.id}>
                <PinnedChartCard chart={chart} />
              </div>
            ))}
          </GridLayout>
        )}
      </div>
    </section>
  );
}
