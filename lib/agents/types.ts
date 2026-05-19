export type ChartType = "bar" | "line" | "area" | "table" | "heatmap";

export type SqlRow = Record<string, string | number | boolean | null>;

export interface PlannerSQLResult {
  plan: string[];
  sql: string;
  reason: string;
  expectedChartType: ChartType;
}

export interface ChartAgentResult {
  title: string;
  chartType: ChartType;
  xKey: string;
  yKey: string;
  description: string;
  whyInteresting: string;
  data: SqlRow[];
}

export interface AgentChatResponse extends PlannerSQLResult {
  userMessage: string;
  rows: SqlRow[];
  chartA: ChartAgentResult;
  chartB: ChartAgentResult;
}

export interface PinnedChart extends ChartAgentResult {
  id: string;
  createdAt: string;
}

