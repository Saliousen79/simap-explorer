import { AgentWorkflowState } from "@/lib/agents/types";

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: string;
  pinned?: boolean;
  agentWorkflow?: AgentWorkflowState;
}

export interface Kpi {
  id: string;
  label: string;
  value: string;
  delta: string;
}
