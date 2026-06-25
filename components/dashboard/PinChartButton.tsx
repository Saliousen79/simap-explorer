"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ChartAgentResult, PinnedChart, PlannerSource } from "@/lib/agents/types";

const STORAGE_KEY = "simap-pinned-analyses-v2";

function writePinnedCharts(charts: PinnedChart[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(charts));
  window.dispatchEvent(new Event("simap-pinned-charts-updated"));
}

export function getPinnedCharts(): PinnedChart[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as unknown;
    return Array.isArray(value) ? value.filter((chart): chart is PinnedChart => Boolean(chart && typeof chart === "object" && "id" in chart)) : [];
  } catch {
    return [];
  }
}

export function removePinnedChart(id: string) {
  writePinnedCharts(getPinnedCharts().filter((chart) => chart.id !== id));
}

export function clearPinnedCharts() {
  writePinnedCharts([]);
}

export function PinChartButton({
  chart,
  question,
  sql,
  plannerSource
}: {
  chart: ChartAgentResult;
  question: string;
  sql: string;
  plannerSource: PlannerSource;
}) {
  const router = useRouter();
  const [isPinned, setIsPinned] = useState(false);

  const onPin = () => {
    const pinnedChart: PinnedChart = {
      ...chart,
      id: crypto.randomUUID(),
      version: 2,
      question,
      sql,
      plannerSource,
      createdAt: new Date().toISOString()
    };
    writePinnedCharts([...getPinnedCharts(), pinnedChart]);
    setIsPinned(true);
    router.push("/dashboard");
  };

  return (
    <Button type="button" size="sm" variant={isPinned ? "outline" : "default"} onClick={onPin} disabled={isPinned}>
      <Pin className="mr-2 h-3.5 w-3.5" />
      {isPinned ? "Angeheftet" : "Auf Dashboard anheften"}
    </Button>
  );
}
