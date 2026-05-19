"use client";

import { useMemo, useState } from "react";
import { mockMessages } from "@/lib/mock-data";

export function useChatMock() {
  const [isLoading, setIsLoading] = useState(false);

  const messages = useMemo(() => mockMessages, []);

  const simulateReply = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1200));
    setIsLoading(false);
  };

  return { messages, isLoading, simulateReply };
}
