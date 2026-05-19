"use client";

import { motion } from "framer-motion";
import { AgentResult } from "@/components/chat/AgentResult";
import { ChatMessage } from "@/types";

export function ChatMessageCard({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex ${isAssistant ? "justify-start" : "justify-end"}`}
    >
      {message.agentResult ? (
        <div className="w-full">
          <AgentResult result={message.agentResult} />
        </div>
      ) : (
        <p className={`liquid-glass-bubble ${isAssistant ? "assistant" : "user"}`}>{message.content}</p>
      )}
    </motion.div>
  );
}
