export type ChartType = "bar" | "line" | "area" | "pie" | "scatter" | "composed" | "table";
export type SeriesType = "bar" | "line" | "area";
export type PlannerSource = "openrouter" | "fallback";
export type SqlRow = Record<string, string | number | boolean | null>;

export interface PlannerSQLResult {
  plan: string[];
  sql: string;
  reason: string;
  expectedChartType: ChartType;
  source?: PlannerSource;
}

export interface ChartSeries {
  key: string;
  label: string;
  type: SeriesType;
  color: string;
}

export interface ChartAgentResult {
  title: string;
  chartType: ChartType;
  xKey: string;
  yKey: string;
  series: ChartSeries[];
  stacked: boolean;
  showLegend: boolean;
  description: string;
  whyInteresting: string;
  insights: string[];
  caveat: string;
  model: string;
  modelLabel: string;
  latencyMs: number;
  data: SqlRow[];
}

export interface AgentChatResponse extends PlannerSQLResult {
  userMessage: string;
  source: PlannerSource;
  rows: SqlRow[];
  chartA: ChartAgentResult;
  chartB: ChartAgentResult;
  totalLatencyMs: number;
}

export type WorkflowStage = "planning" | "guard" | "query" | "charts";
export type WorkflowStageStatus = "pending" | "running" | "complete" | "error";

export interface WorkflowStageState {
  id: WorkflowStage;
  label: string;
  status: WorkflowStageStatus;
  detail?: string;
}

export type AgentStreamEvent =
  | { type: "stage"; stage: WorkflowStage; status: WorkflowStageStatus; detail?: string }
  | { type: "plan"; plan: string[]; reason: string }
  | { type: "sql"; sql: string; source: PlannerSource }
  | { type: "data"; rowCount: number; columns: string[] }
  | { type: "candidate"; slot: "chartA" | "chartB"; candidate: ChartAgentResult }
  | { type: "complete"; result: AgentChatResponse }
  | { type: "error"; stage?: WorkflowStage; message: string };

export interface AgentWorkflowState {
  question?: string;
  stages: WorkflowStageState[];
  plan?: string[];
  reason?: string;
  sql?: string;
  source?: PlannerSource;
  rowCount?: number;
  chartA?: ChartAgentResult;
  chartB?: ChartAgentResult;
  result?: AgentChatResponse;
  error?: string;
}

export interface PinnedChart extends ChartAgentResult {
  id: string;
  version: 2;
  question: string;
  sql: string;
  plannerSource: PlannerSource;
  createdAt: string;
}
