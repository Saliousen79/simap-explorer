"use client";

import { useCallback, useState } from "react";
import { AgentStreamEvent, AgentWorkflowState, WorkflowStageState } from "@/lib/agents/types";
import { ChatMessage } from "@/types";

const INITIAL_STAGES: WorkflowStageState[] = [
  { id: "planning", label: "Frage und SQL planen", status: "pending" },
  { id: "guard", label: "SQL-Sicherheit prüfen", status: "pending" },
  { id: "query", label: "Supabase abfragen", status: "pending" },
  { id: "charts", label: "Zwei Diagramme erzeugen", status: "pending" }
];

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  createdAt: "",
  content: "Was möchtest du zu den SIMAP-Daten wissen?"
};

function applyEvent(state: AgentWorkflowState, event: AgentStreamEvent): AgentWorkflowState {
  if (event.type === "stage") {
    return {
      ...state,
      stages: state.stages.map((stage) =>
        stage.id === event.stage ? { ...stage, status: event.status, detail: event.detail } : stage
      )
    };
  }
  if (event.type === "plan") return { ...state, plan: event.plan, reason: event.reason };
  if (event.type === "sql") return { ...state, sql: event.sql, source: event.source };
  if (event.type === "data") return { ...state, rowCount: event.rowCount };
  if (event.type === "candidate") return { ...state, [event.slot]: event.candidate };
  if (event.type === "complete") return { ...state, result: event.result };
  if (event.type === "error") return { ...state, error: event.message };
  return state;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const ask = useCallback(async (userText: string) => {
    const timestamp = Date.now();
    const assistantId = `assistant-${timestamp}`;
    const workflow: AgentWorkflowState = { question: userText, stages: INITIAL_STAGES.map((stage) => ({ ...stage })) };

    setMessages((previous) => [
      ...previous,
      { id: `user-${timestamp}`, role: "user", createdAt: "", content: userText },
      { id: assistantId, role: "assistant", createdAt: "", content: "Agentenanalyse läuft.", agentWorkflow: workflow }
    ]);
    setIsLoading(true);

    const updateWorkflow = (event: AgentStreamEvent) => {
      setMessages((previous) => previous.map((message) =>
        message.id === assistantId && message.agentWorkflow
          ? { ...message, agentWorkflow: applyEvent(message.agentWorkflow, event) }
          : message
      ));
    };

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: string } | null;
        throw new Error(payload?.error ?? "Agentenworkflow konnte nicht gestartet werden.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.trim()) updateWorkflow(JSON.parse(line) as AgentStreamEvent);
        }
        if (done) break;
      }

      if (buffer.trim()) updateWorkflow(JSON.parse(buffer) as AgentStreamEvent);
    } catch (error) {
      updateWorkflow({ type: "error", message: error instanceof Error ? error.message : "Die Analyse konnte nicht ausgeführt werden." });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, ask };
}
