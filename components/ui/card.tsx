import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/80 bg-card/80 shadow-[0_10px_40px_rgba(0,0,0,0.25)] backdrop-blur-sm",
        className
      )}
      {...props}
    />
  );
}
