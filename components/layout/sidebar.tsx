"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Bot, FileText, LayoutDashboard, PanelLeftClose } from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Chat", icon: Bot },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dokumentation", label: "Dokumentation", icon: FileText }
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-72 flex-col border-r border-border/70 bg-card/40 p-4 md:flex">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="rounded-xl bg-primary/20 p-2 text-primary">
            <BarChart3 className="h-4 w-4" />
          </span>
          <div>
            <p className="font-semibold">SIMAP Agentic BI</p>
            <p className="text-xs text-muted-foreground">Conversational procurement intelligence</p>
          </div>
        </div>
        <PanelLeftClose className="h-4 w-4 text-muted-foreground" />
      </div>
      <nav className="space-y-1">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-muted-foreground transition hover:bg-muted/70 hover:text-foreground",
                isActive && "bg-muted text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
