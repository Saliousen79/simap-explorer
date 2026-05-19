import ReactMarkdown from "react-markdown";
import { motion } from "framer-motion";
import { Pin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { ChatMessage } from "@/types";

export function ChatMessageCard({ message }: { message: ChatMessage }) {
  const isAssistant = message.role === "assistant";

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={`p-4 ${isAssistant ? "bg-card/90" : "bg-muted/30"}`}>
        <div className="mb-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>{isAssistant ? "BI Agent" : "You"}</span>
          <div className="flex items-center gap-2">
            {message.pinned ? <Pin className="h-3.5 w-3.5" /> : null}
            <span>{message.createdAt}</span>
          </div>
        </div>
        <div className="prose prose-invert max-w-none prose-headings:mb-2 prose-headings:mt-0 prose-p:my-1">
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>
      </Card>
    </motion.div>
  );
}
