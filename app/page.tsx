"use client";

import { LiquidChatPanel } from "@/components/chat/liquid-chat-panel";

export default function HomePage() {
  return (
    <section className="liquid-chat-shell">
      <div className="liquid-chat-ambient" aria-hidden />
      <LiquidChatPanel />
    </section>
  );
}
