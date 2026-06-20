"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartAgentResult, ChartSeries } from "@/lib/agents/types";

const FALLBACK_COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b"];

function formatCell(value: unknown, key?: string) {
  if (typeof value === "number") {
    const formatted = new Intl.NumberFormat("de-CH", { maximumFractionDigits: 2 }).format(value);
    return key && (key.includes("amount") || key.includes("value")) ? `CHF ${formatted}` : formatted;
  }
  return String(value ?? "");
}

function GridAndAxes({ chart }: { chart: ChartAgentResult }) {
  return (
    <>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
      <XAxis dataKey={chart.xKey} stroke="#94a3b8" tick={{ fontSize: 11 }} />
      <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} tickFormatter={(value) => formatCell(value)} />
      <Tooltip formatter={(value, name) => [formatCell(value, String(name)), name]} />
      {chart.showLegend ? <Legend /> : null}
    </>
  );
}

function renderSeries(series: ChartSeries, stacked: boolean) {
  const common = { key: series.key, dataKey: series.key, name: series.label, stroke: series.color };
  if (series.type === "line") return <Line {...common} type="monotone" strokeWidth={2} dot={false} />;
  if (series.type === "area") return <Area {...common} type="monotone" fill={series.color} fillOpacity={0.2} />;
  return <Bar {...common} fill={series.color} stackId={stacked ? "stack" : undefined} radius={[6, 6, 0, 0]} />;
}

export function ChartRenderer({ chart }: { chart: ChartAgentResult }) {
  if (!chart.data.length) {
    return <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Keine Daten gefunden.</div>;
  }

  if (chart.chartType === "table") {
    const columns = Object.keys(chart.data[0]);
    return (
      <div className="h-full overflow-auto rounded-xl border border-border/70">
        <table className="w-full text-left text-xs">
          <thead className="sticky top-0 bg-card">
            <tr>{columns.map((column) => <th key={column} className="border-b border-border/70 px-3 py-2 font-medium text-muted-foreground">{column}</th>)}</tr>
          </thead>
          <tbody>
            {chart.data.map((row, rowIndex) => (
              <tr key={rowIndex} className="border-b border-border/40 last:border-0">
                {columns.map((column) => <td key={column} className="px-3 py-2 text-foreground/90">{formatCell(row[column], column)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const commonProps = { data: chart.data, margin: { top: 8, right: 16, left: 4, bottom: 8 } };

  if (chart.chartType === "pie") {
    const series = chart.series[0];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chart.data.slice(0, 12)} dataKey={series.key} nameKey={chart.xKey} outerRadius="78%" label>
            {chart.data.slice(0, 12).map((_, index) => <Cell key={index} fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />)}
          </Pie>
          <Tooltip formatter={(value) => formatCell(value, series.key)} />
          {chart.showLegend ? <Legend /> : null}
        </PieChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "scatter") {
    const series = chart.series[0];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart {...commonProps}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" />
          <XAxis type="number" dataKey={chart.xKey} name={chart.xKey} stroke="#94a3b8" />
          <YAxis type="number" dataKey={series.key} name={series.label} stroke="#94a3b8" />
          <Tooltip cursor={{ strokeDasharray: "3 3" }} />
          <Scatter data={chart.data} fill={series.color} name={series.label} />
        </ScatterChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "composed") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart {...commonProps}>
          <GridAndAxes chart={chart} />
          {chart.series.map((series) => renderSeries(series, chart.stacked))}
        </ComposedChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "line") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...commonProps}>
          <GridAndAxes chart={chart} />
          {chart.series.map((series) => <Line key={series.key} dataKey={series.key} name={series.label} type="monotone" stroke={series.color} strokeWidth={2} dot={false} />)}
        </LineChart>
      </ResponsiveContainer>
    );
  }

  if (chart.chartType === "area") {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...commonProps}>
          <GridAndAxes chart={chart} />
          {chart.series.map((series) => <Area key={series.key} dataKey={series.key} name={series.label} type="monotone" stroke={series.color} fill={series.color} fillOpacity={0.2} stackId={chart.stacked ? "stack" : undefined} />)}
        </AreaChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart {...commonProps}>
        <GridAndAxes chart={chart} />
        {chart.series.map((series) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={series.color} stackId={chart.stacked ? "stack" : undefined} radius={[6, 6, 0, 0]} />)}
      </BarChart>
    </ResponsiveContainer>
  );
}
