"use client";

import GridLayout, { Layout } from "react-grid-layout";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { ChartCard } from "@/components/dashboard/chart-card";
import { KpiCard } from "@/components/dashboard/kpi-card";
import { kpis, timeSeriesData, topCategories } from "@/lib/mock-data";

const COLORS = ["#38bdf8", "#60a5fa", "#818cf8", "#34d399", "#f59e0b"];

const defaultLayout: Layout[] = [
  { i: "contracts", x: 0, y: 0, w: 6, h: 8 },
  { i: "volume", x: 6, y: 0, w: 6, h: 8 },
  { i: "categories", x: 0, y: 8, w: 6, h: 8 },
  { i: "insights", x: 6, y: 8, w: 6, h: 8 }
];

export default function DashboardPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold tracking-tight">Customizable Dashboard</h1>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((kpi) => (
          <KpiCard key={kpi.id} kpi={kpi} />
        ))}
      </div>

      <p className="text-xs text-muted-foreground">Drag and resize widgets to pin your preferred BI layout.</p>

      <GridLayout className="layout" cols={12} width={1200} rowHeight={32} layout={defaultLayout} draggableHandle=".drag-handle">
        <div key="contracts">
          <ChartCard title="Contracts Over Time">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timeSeriesData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Line type="monotone" dataKey="contracts" stroke="#38bdf8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div key="volume">
          <ChartCard title="Award Volume by Month (CHF M)">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={timeSeriesData}>
                <XAxis dataKey="month" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip />
                <Bar dataKey="volume" fill="#60a5fa" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div key="categories">
          <ChartCard title="Top Categories">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={topCategories} dataKey="value" nameKey="name" outerRadius={80}>
                  {topCategories.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        <div key="insights">
          <ChartCard title="AI Insights">
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>1) IT and infrastructure dominate 62% of high-value awards.</p>
              <p>2) Single-submission ratio remains elevated in smaller cantons.</p>
              <p>3) Framework agreements increased procurement velocity in 2024.</p>
            </div>
          </ChartCard>
        </div>
      </GridLayout>
    </section>
  );
}
