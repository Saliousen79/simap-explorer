"use client";

import { useCallback, useState } from "react";
import { ChatMessage } from "@/types";

const INITIAL_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  createdAt: "",
  content: "Was möchtest du zu den SIMAP-Daten wissen?"
};

const REPLY: ChatMessage = {
  id: "reply",
  role: "assistant",
  createdAt: "",
  content: "Analyse läuft — Dashboard folgt in Kürze."
};

export function useChatMock() {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);

  const simulateReply = useCallback(async (userText: string) => {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      createdAt: "",
      content: userText
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch("/api/agent/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userText })
      });

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Agent workflow failed.");
      }

      setMessages((prev) => [
        ...prev,
        {
          ...REPLY,
          id: `assistant-${Date.now()}`,
          content: "Hier ist der 3-Agenten-Vorschlag.",
          agentResult: payload
        }
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          ...REPLY,
          id: `assistant-${Date.now()}`,
          content: error instanceof Error ? error.message : "Die Analyse konnte nicht ausgeführt werden."
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { messages, isLoading, simulateReply };
}
