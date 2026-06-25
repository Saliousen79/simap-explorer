"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp } from "lucide-react";
import { CantonSelector } from "@/components/chat/canton-selector";
import { ChatMessageCard } from "@/components/chat/chat-message";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { useAgentChat } from "@/hooks/use-agent-chat";
import { CantonCode, CantonSelectionMode } from "@/lib/agents/types";
import { CANTONS } from "@/lib/config/cantons";
import { suggestedPrompts } from "@/lib/suggested-prompts";

export function LiquidChatPanel() {
  const [prompt, setPrompt] = useState("");
  const [selectedCantons, setSelectedCantons] = useState<CantonCode[]>([]);
  const [selectionMode, setSelectionMode] = useState<CantonSelectionMode>("all");
  const { messages, isLoading, ask } = useAgentChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const selectionInvalid = selectionMode === "specific" && !selectedCantons.length;
  const selectionLabel = selectionMode === "all"
    ? "Ganze Schweiz"
    : selectedCantons
      .map((code) => CANTONS.find((canton) => canton.code === code)?.name ?? code)
      .join(", ");

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isLoading]);

  const submit = async (text: string) => {
    if (!text || isLoading || selectionInvalid) return;
    await ask(text, selectedCantons, selectionMode);
    setPrompt("");
  };

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await submit(prompt.trim());
  };

  return (
    <div className="flex h-full w-full max-w-6xl flex-col items-center justify-start gap-2 pt-0">
      <div className="max-w-4xl text-center">
        <p className="text-balance text-3xl font-semibold leading-tight text-foreground md:text-4xl">
          Schweizer Vergaben verstehen, bevor andere sie übersehen.
        </p>
        <p className="mt-1 text-balance text-base text-muted-foreground md:text-lg">
          Analysiere über 200.000 offizielle Aufträge von{" "}
          <a href="https://www.simap.ch" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 transition hover:underline">
            simap.ch
          </a>
          .
        </p>
      </div>

      <CantonSelector selected={selectedCantons} mode={selectionMode} onChange={(next, mode) => { setSelectedCantons(next); setSelectionMode(mode); }} invalid={selectionInvalid} />

      <motion.div initial={{ opacity: 0, y: 12, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }} className="liquid-glass-panel">
        <motion.div ref={scrollRef} className="liquid-glass-messages">
          {messages.map((message) => <ChatMessageCard key={message.id} message={message} />)}
          {isLoading ? <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start"><span className="liquid-glass-bubble assistant"><span className="liquid-typing"><span /><span /><span /></span></span></motion.div> : null}
        </motion.div>

        {messages.length <= 1 ? <SuggestedPrompts prompts={suggestedPrompts} onPick={submit} disabled={isLoading || selectionInvalid} /> : null}

        <div className="mx-4 mb-1 rounded-2xl border border-border/60 bg-background/35 px-4 py-2 text-sm text-muted-foreground md:mx-6">
          Analysebereich: <span className="font-medium text-foreground">{selectionLabel || "Keine Kantone ausgewählt"}</span>
        </div>

        <form onSubmit={onSubmit} className="liquid-glass-input-row">
          <input type="text" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="Frage stellen…" disabled={isLoading} maxLength={800} className="liquid-glass-input" aria-label="Chat-Eingabe" />
          <button type="submit" disabled={isLoading || !prompt.trim() || selectionInvalid} className="liquid-glass-send" aria-label="Senden"><ArrowUp className="h-4 w-4" /></button>
        </form>
      </motion.div>
    </div>
  );
}
