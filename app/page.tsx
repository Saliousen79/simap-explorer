"use client";

import { FormEvent, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { ChatMessageCard } from "@/components/chat/chat-message";
import { SuggestedPrompts } from "@/components/chat/suggested-prompts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { suggestedPrompts } from "@/lib/mock-data";
import { useChatMock } from "@/hooks/use-chat-mock";

export default function HomePage() {
  const [prompt, setPrompt] = useState("");
  const { messages, isLoading, simulateReply } = useChatMock();

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await simulateReply();
  };

  return (
    <section className="mx-auto flex max-w-4xl flex-col gap-6">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 text-center">
        <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card/70 px-3 py-1 text-xs text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          Conversational BI workspace
        </p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">SIMAP Agentic BI</h1>
      </motion.div>

      <div className="space-y-3">
        {messages.map((message) => (
          <ChatMessageCard key={message.id} message={message} />
        ))}
        {isLoading ? <Skeleton className="h-24 w-full" /> : null}
      </div>

      <SuggestedPrompts prompts={suggestedPrompts} onPick={setPrompt} />

      <form onSubmit={onSubmit} className="sticky bottom-4 rounded-2xl border border-border bg-card/85 p-3 backdrop-blur">
        <div className="flex items-center gap-2">
          <Input
            placeholder="Ask the BI agents for trends, anomalies, and comparisons..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          <Button type="submit">Analyze</Button>
        </div>
      </form>
    </section>
  );
}
