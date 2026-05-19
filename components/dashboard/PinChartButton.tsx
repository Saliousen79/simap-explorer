"use client";

import { useState } from "react";
import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChartAgentResult, PinnedChart } from "@/lib/agents/types";

const STORAGE_KEY = "simap-pinned-charts";

function readPinnedCharts(): PinnedChart[] {
  if (typeof window === "undefined") return [];

  try {
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]") as PinnedChart[];
  } catch {
    return [];
  }
}

export function getPinnedCharts() {
  return readPinnedCharts();
}

/**
 * User pinning = human-in-the-loop.
 *
 * For now the selected chart is stored in localStorage.
 * TODO: Persist pinned dashboard charts in Supabase when user accounts exist.
 */
export function PinChartButton({ chart }: { chart: ChartAgentResult }) {
  const [isPinned, setIsPinned] = useState(false);

  const onPin = () => {
    const pinnedChart: PinnedChart = {
      ...chart,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString()
    };

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([...readPinnedCharts(), pinnedChart]));
    window.dispatchEvent(new Event("simap-pinned-charts-updated"));
    setIsPinned(true);
  };

  return (
    <Button type="button" size="sm" variant={isPinned ? "outline" : "default"} onClick={onPin}>
      <Pin className="mr-2 h-3.5 w-3.5" />
      {isPinned ? "Gepinnt" : "Pin to Dashboard"}
    </Button>
  );
}

