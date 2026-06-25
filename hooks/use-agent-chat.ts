"use client";

import { useCallback, useEffect, useState } from "react";
import { AgentError, AgentStreamEvent, AgentWorkflowState, CantonCode, CantonSelectionMode, WorkflowStageState } from "@/lib/agents/types";
import { ChatMessage } from "@/types";

const INITIAL_STAGES: WorkflowStageState[] = [
  { id: "planning", label: "Analyseplan erstellen", status: "pending" },
  { id: "guard", label: "Plan und Query prüfen", status: "pending" },
  { id: "query", label: "Supabase abfragen", status: "pending" },
  { id: "charts", label: "Zwei Diagramme erzeugen", status: "pending" }
];

const INITIAL_MESSAGE: ChatMessage = { id: "welcome", role: "assistant", createdAt: "", content: "Was möchtest du zu den SIMAP-Daten wissen?" };
const STORAGE_KEY = "simap-chat-session-v1";

function applyEvent(state: AgentWorkflowState, event: AgentStreamEvent): AgentWorkflowState {
  if (event.type === "stage") return { ...state, stages: state.stages.map((stage) => stage.id === event.stage ? { ...stage, status: event.status, detail: event.detail } : stage) };
  if (event.type === "plan") return { ...state, plan: event.plan, reason: event.reason };
  if (event.type === "sql") return { ...state, sql: event.sql, source: event.source };
  if (event.type === "data") return { ...state, rowCount: event.rowCount };
  if (event.type === "candidate") return { ...state, [event.slot]: event.candidate };
  if (event.type === "complete") return { ...state, result: event.result };
  if (event.type === "error") return { ...state, error: event.error };
  return state;
}

export function useAgentChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved) as ChatMessage[];
      if (Array.isArray(parsed) && parsed.length) setMessages(parsed);
    } catch {
      window.sessionStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  useEffect(() => {
    if (isLoading) return;
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [isLoading, messages]);

  const ask = useCallback(async (userText: string, selectedCantons: CantonCode[], selectionMode: CantonSelectionMode) => {
    const timestamp = Date.now();
    const assistantId = `assistant-${timestamp}`;
    const workflow: AgentWorkflowState = { question: userText, stages: INITIAL_STAGES.map((stage) => ({ ...stage })) };
    setMessages((previous) => [...previous,
      { id: `user-${timestamp}`, role: "user", createdAt: "", content: userText },
      { id: assistantId, role: "assistant", createdAt: "", content: "Agentenanalyse läuft.", agentWorkflow: workflow }
    ]);
    setIsLoading(true);

    const updateWorkflow = (event: AgentStreamEvent) => setMessages((previous) => previous.map((message) =>
      message.id === assistantId && message.agentWorkflow ? { ...message, agentWorkflow: applyEvent(message.agentWorkflow, event) } : message
    ));

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText, selectedCantons, selectionMode })
      });
      if (!response.ok || !response.body) {
        const payload = (await response.json().catch(() => null)) as { error?: AgentError } | null;
        if (payload?.error) return updateWorkflow({ type: "error", error: payload.error });
        throw new Error("Agentenworkflow konnte nicht gestartet werden.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) if (line.trim()) updateWorkflow(JSON.parse(line) as AgentStreamEvent);
        if (done) break;
      }
      if (buffer.trim()) updateWorkflow(JSON.parse(buffer) as AgentStreamEvent);
    } catch (error) {
      updateWorkflow({ type: "error", error: {
        code: "MODEL_UNAVAILABLE",
        message: error instanceof Error ? error.message : "Die Analyse konnte nicht ausgeführt werden.",
        suggestions: ["Prüfe die Netzwerkverbindung und versuche es erneut."], retryable: true
      } });
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, ask };
}
