"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { ChatMessageCard } from "@/components/chat/chat-message";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { useChatMock } from "@/hooks/use-chat-mock";
import { suggestedPrompts } from "@/lib/mock-data";

export function LiquidChatPanel() {
  const [prompt, setPrompt] = useState("");
  const { messages, isLoading, simulateReply } = useChatMock();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const text = prompt.trim();
    if (!text || isLoading) return;
    await simulateReply(text);
    setPrompt("");
  };

  const onPick = async (value: string) => {
    if (isLoading) return;
    await simulateReply(value);
    setPrompt("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="liquid-glass-panel"
    >
      <header className="liquid-glass-header">
        <h1 className="text-sm font-medium tracking-wide text-foreground/90">SIMAP Explorer</h1>
        <p className="text-xs text-muted-foreground/80">Ausschreibungen analysieren</p>
      </header>

      <motion.div ref={scrollRef} className="liquid-glass-messages">
        {messages.map((message) => (
          <ChatMessageCard key={message.id} message={message} />
        ))}
        {isLoading ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
            <span className="liquid-glass-bubble assistant">
              <span className="liquid-typing">
                <span />
                <span />
                <span />
              </span>
            </span>
          </motion.div>
        ) : null}
      </motion.div>

      {messages.length <= 1 ? (
        <SuggestedPrompts prompts={suggestedPrompts} onPick={onPick} disabled={isLoading} />
      ) : null}

      <form onSubmit={onSubmit} className="liquid-glass-input-row">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Frage stellen…"
          disabled={isLoading}
          className="liquid-glass-input"
          aria-label="Chat-Eingabe"
        />
        <button
          type="submit"
          disabled={isLoading || !prompt.trim()}
          className="liquid-glass-send"
          aria-label="Senden"
        >
          <ArrowUp className="h-4 w-4" />
        </button>
      </form>
    </motion.div>
  );
}
