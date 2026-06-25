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
  Treemap,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { ChartAgentResult, ChartSeries, SqlRow } from "@/lib/agents/types";

const TREEMAP_PALETTE = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b", "#f472b6", "#22d3ee"];

const FALLBACK_COLORS = ["#38bdf8", "#818cf8", "#34d399", "#f59e0b"];
const TOOLTIP_CONTENT_STYLE = {
  backgroundColor: "#111827",
  border: "1px solid #334155",
  borderRadius: "12px",
  boxShadow: "0 14px 30px rgba(0, 0, 0, 0.4)",
  color: "#f8fafc"
};
const TOOLTIP_LABEL_STYLE = { color: "#f8fafc", fontWeight: 600, marginBottom: "6px" };
const TOOLTIP_ITEM_STYLE = { color: "#cbd5e1" };

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
      <XAxis
        dataKey={chart.xKey}
        stroke="#94a3b8"
        tick={{ fontSize: 11 }}
        label={{ value: chart.xAxisLabel, position: "insideBottom", offset: -8, fill: "#cbd5e1", fontSize: 11 }}
      />
      <YAxis
        width={82}
        stroke="#94a3b8"
        tick={{ fontSize: 11 }}
        tickFormatter={(value) => formatCell(value)}
        label={{ value: chart.yAxisLabel, angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }}
      />
      <Tooltip
        contentStyle={TOOLTIP_CONTENT_STYLE}
        labelStyle={TOOLTIP_LABEL_STYLE}
        itemStyle={TOOLTIP_ITEM_STYLE}
        cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
        formatter={(value, name) => [formatCell(value, String(name)), name]}
      />
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

function usesHorizontalBars(chart: ChartAgentResult) {
  if (chart.chartType !== "bar" || typeof chart.data[0]?.[chart.xKey] !== "string") return false;
  return chart.data.length > 5 || chart.data.some((row) => String(row[chart.xKey] ?? "").length > 12);
}

function TreemapCell(props: any) {
  const { x, y, width, height, root, depth, payload, xKey, valueKey } = props as {
    x: number; y: number; width: number; height: number;
    root: any; depth?: number; payload: SqlRow | undefined; xKey: string; valueKey: string;
  };
  if (!root || depth == null) return null;
  const isTooSmall = width < 36 || height < 22;
  const name = String(payload?.[xKey] ?? "");
  const value = formatCell(payload?.[valueKey], valueKey);
  const safeWidth = Math.max(width, 0);
  const safeHeight = Math.max(height, 0);

  const baseFont = Math.min(safeWidth / 14, safeHeight / 6, 14);
  const nameFont = Math.max(Math.min(baseFont, isTooSmall ? 9 : 13), 8);
  const valueFont = Math.max(nameFont - 3, 8);

  const siblings = (root && root.children) || [];
  const index = siblings.findIndex((c: any) => c === props);
  const fill = TREEMAP_PALETTE[Math.max(index, 0) % TREEMAP_PALETTE.length];

  const maxNameChars = Math.max(Math.floor((safeWidth - 24) / (nameFont * 0.55)), 4);
  const displayName = name.length * nameFont * 0.55 > safeWidth - 16 ? name.slice(0, maxNameChars) + "…" : name;

  return (
    <g>
      <rect x={x} y={y} width={safeWidth} height={safeHeight} fill={fill} fillOpacity={0.92} stroke="#0f172a" strokeWidth={2} />
      {isTooSmall ? (
        <text x={x + safeWidth / 2} y={y + safeHeight / 2} dx={0} dy={nameFont / 3} textAnchor="middle" fill="#0b1220" fontSize={nameFont} fontWeight={700}>
          {String(name).slice(0, 3)}.
        </text>
      ) : (
        <>
          <text x={x + 8} y={y + nameFont + 8} fill="#0b1220" fontSize={nameFont} fontWeight={700}>
            {displayName}
          </text>
          <text x={x + 8} y={y + nameFont + valueFont + 12} fill="#0b1220" fontSize={valueFont} opacity={0.85}>
            {value}
          </text>
        </>
      )}
    </g>
  );
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

  const commonProps = { data: chart.data, margin: { top: 8, right: 16, left: 12, bottom: 28 } };

  if (chart.chartType === "pie") {
    const series = chart.series[0];
    return (
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={chart.data.slice(0, 12)} dataKey={series.key} nameKey={chart.xKey} outerRadius="78%" label>
            {chart.data.slice(0, 12).map((_, index) => <Cell key={index} fill={FALLBACK_COLORS[index % FALLBACK_COLORS.length]} />)}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            formatter={(value) => formatCell(value, series.key)}
          />
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
          <XAxis
            type="number"
            dataKey={chart.xKey}
            name={chart.xAxisLabel}
            stroke="#94a3b8"
            label={{ value: chart.xAxisLabel, position: "insideBottom", offset: -8, fill: "#cbd5e1", fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey={series.key}
            name={chart.yAxisLabel}
            stroke="#94a3b8"
            label={{ value: chart.yAxisLabel, angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            cursor={{ strokeDasharray: "3 3", stroke: "#64748b" }}
          />
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

  if (chart.chartType === "treemap") {
    const series = chart.series[0];
    return (
      <div className="flex h-full min-h-0 flex-col gap-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground">
          <span>{chart.xAxisLabel}</span>
          <span>{chart.yAxisLabel}</span>
        </div>
        <div className="min-h-0 flex-1">
          <ResponsiveContainer width="100%" height="100%">
            <Treemap
              data={chart.data}
              dataKey={series.key}
              nameKey={chart.xKey}
              stroke="#0f172a"
              fill={series.color}
              aspectRatio={4 / 3}
              isAnimationActive={false}
              content={<TreemapCell xKey={chart.xKey} valueKey={series.key} />}
            >
              <Tooltip
                contentStyle={TOOLTIP_CONTENT_STYLE}
                labelStyle={TOOLTIP_LABEL_STYLE}
                itemStyle={TOOLTIP_ITEM_STYLE}
                formatter={(value) => formatCell(value, series.key)}
              />
            </Treemap>
          </ResponsiveContainer>
        </div>
      </div>
    );
  }

  if (usesHorizontalBars(chart)) {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...commonProps} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" horizontal={false} />
          <XAxis
            type="number"
            stroke="#94a3b8"
            tick={{ fontSize: 11 }}
            tickFormatter={(value) => formatCell(value)}
            label={{ value: chart.yAxisLabel, position: "insideBottom", offset: -8, fill: "#cbd5e1", fontSize: 11 }}
          />
          <YAxis
            type="category"
            dataKey={chart.xKey}
            width={155}
            stroke="#94a3b8"
            tick={{ fontSize: 10 }}
            interval={0}
            label={{ value: chart.xAxisLabel, angle: -90, position: "insideLeft", fill: "#cbd5e1", fontSize: 11 }}
          />
          <Tooltip
            contentStyle={TOOLTIP_CONTENT_STYLE}
            labelStyle={TOOLTIP_LABEL_STYLE}
            itemStyle={TOOLTIP_ITEM_STYLE}
            cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
            formatter={(value, name) => [formatCell(value, String(name)), name]}
          />
          {chart.showLegend ? <Legend /> : null}
          {chart.series.map((series) => <Bar key={series.key} dataKey={series.key} name={series.label} fill={series.color} radius={[0, 6, 6, 0]} />)}
        </BarChart>
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
