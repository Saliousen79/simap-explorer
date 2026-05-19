"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartAgentResult } from "@/lib/agents/types";

function formatCell(value: unknown) {
  if (typeof value === "number") {
    return new Intl.NumberFormat("de-CH", { maximumFractionDigits: 0 }).format(value);
  }

  return String(value ?? "");
}

export function ChartRenderer({ chart }: { chart: ChartAgentResult }) {
  if (!chart.data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Keine Daten gefunden.</div>;
  }

  if (chart.chartType === "table" || chart.chartType === "heatmap") {
    const columns = Object.keys(chart.data[0]);

    return (
      <div className="h-full overflow-auto rounded-xl border border-border/70">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-card">
            <tr>
              {columns.map((column) => (
                <th key={column} className="border-b border-border/70 px-3 py-2 font-medium text-muted-foreground">
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {chart.data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/40 last:border-0">
                {columns.map((column) => (
                  <td key={column} className="px-3 py-2 text-foreground/90">
                    {formatCell(row[column])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const commonProps = {
    data: chart.data,
    margin: { top: 8, right: 12, left: 0, bottom: 8 }
  };

  if (chart.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
          <XAxis dataKey={chart.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Line type="monotone" dataKey={chart.yKey} stroke="#38bdf8" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
          <XAxis dataKey={chart.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
          <Tooltip />
          <Area type="monotone" dataKey={chart.yKey} stroke="#60a5fa" fill="#60a5fa" fillOpacity={0.25} />
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart {...commonProps}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
        <XAxis dataKey={chart.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
        <Tooltip />
        <Bar dataKey={chart.yKey} fill="#38bdf8" radius={[8, 8, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

