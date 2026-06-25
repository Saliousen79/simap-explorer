import { z } from "zod";

export const CANTON_CODES = [
  "AG", "AI", "AR", "BE", "BL", "BS", "FR", "GE", "GL", "GR", "JU", "LU", "NE",
  "NW", "OW", "SG", "SH", "SO", "SZ", "TG", "TI", "UR", "VD", "VS", "ZG", "ZH"
] as const;

export const cantonCodeSchema = z.enum(CANTON_CODES);
export type CantonCode = z.infer<typeof cantonCodeSchema>;
export type CantonSelectionMode = "all" | "specific";

export const analyticsIntentSchema = z.enum([
  "trend",
  "winner_ranking",
  "office_ranking",
  "procedure_comparison",
  "cpv_analysis",
  "current_projects",
  "canton_comparison"
]);
export type AnalyticsIntent = z.infer<typeof analyticsIntentSchema>;

export const analyticsDimensionSchema = z.enum([
  "month", "quarter", "year", "canton", "winner_name", "proc_office_name_de",
  "process_type", "cpv_code_main", "publication_date", "title_de", "submission_deadline"
]);
export type AnalyticsDimension = z.infer<typeof analyticsDimensionSchema>;

export const analyticsMetricSchema = z.enum([
  "contract_count", "award_count", "total_award_amount", "avg_award_amount",
  "avg_submissions", "single_bid_ratio"
]);
export type AnalyticsMetric = z.infer<typeof analyticsMetricSchema>;

export const analyticsPlanSchema = z.object({
  supported: z.boolean(),
  unsupportedReason: z.string().max(240),
  intent: analyticsIntentSchema,
  table: z.enum(["public.archive", "public.projects"]),
  dimensions: z.array(analyticsDimensionSchema).min(1).max(3),
  metrics: z.array(analyticsMetricSchema).max(3),
  filters: z.object({
    yearFrom: z.number().int().min(1990).max(2100).nullable(),
    yearTo: z.number().int().min(1990).max(2100).nullable(),
    dateField: z.enum(["publication_date", "award_decision_date"]),
    orderTypes: z.array(z.string().min(1).max(80)).max(5),
    processTypes: z.array(z.string().min(1).max(80)).max(5),
    pubTypes: z.array(z.string().min(1).max(80)).max(5)
  }),
  sort: z.object({
    key: z.string().min(1).max(60),
    direction: z.enum(["asc", "desc"])
  }),
  limit: z.number().int().min(1).max(1000),
  plan: z.array(z.string().min(1).max(180)).min(2).max(5),
  reason: z.string().min(1).max(300),
  expectedChartType: z.enum(["bar", "line", "area", "pie", "scatter", "composed", "treemap", "table"])
});

export type AnalyticsPlan = z.infer<typeof analyticsPlanSchema>;
export type ChartType = AnalyticsPlan["expectedChartType"];
export type SeriesType = "bar" | "line" | "area";
export type PlannerSource = "openrouter" | "fallback";
export type SqlValue = string | number | boolean | Date | string[] | null;
export type SqlRow = Record<string, string | number | boolean | null>;

export interface CompiledAnalyticsQuery {
  sql: string;
  params: SqlValue[];
}

export interface PlannedAnalysis {
  analyticsPlan: AnalyticsPlan;
  source: PlannerSource;
}

export type AgentErrorCode =
  | "INVALID_REQUEST"
  | "UNSUPPORTED_TOPIC"
  | "UNSUPPORTED_ANALYSIS"
  | "FILTER_CONFLICT"
  | "PLAN_REJECTED"
  | "NO_DATA"
  | "QUERY_FAILED"
  | "MODEL_UNAVAILABLE"
  | "RATE_LIMITED";

export interface AgentError {
  code: AgentErrorCode;
  message: string;
  suggestions: string[];
  retryable: boolean;
  field?: string;
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
  xAxisLabel: string;
  yAxisLabel: string;
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

export interface AgentChatResponse {
  userMessage: string;
  plan: string[];
  sql: string;
  reason: string;
  expectedChartType: ChartType;
  source: PlannerSource;
  analyticsPlan: AnalyticsPlan;
  selectedCantons: CantonCode[];
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
  | { type: "error"; stage?: WorkflowStage; error: AgentError };

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
  error?: AgentError;
}

export interface PinnedChart extends ChartAgentResult {
  id: string;
  version: 2;
  question: string;
  sql: string;
  plannerSource: PlannerSource;
  createdAt: string;
}
