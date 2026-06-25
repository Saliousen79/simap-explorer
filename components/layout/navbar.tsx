import { Bell } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border/70 bg-background/80 px-4 backdrop-blur md:px-6">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">SIMAP Agentic BI</p>
      </div>
      <div />
      <button className="rounded-lg border border-border p-2 text-muted-foreground hover:text-foreground">
        <Bell className="h-4 w-4" />
      </button>
    </header>
  );
}
