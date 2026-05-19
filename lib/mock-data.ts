import { ChatMessage, Kpi } from "@/types";

export const suggestedPrompts = [
  "Show interesting procurement trends from 2023",
  "Analyze IT contracts by canton",
  "Compare construction tenders between 2022 and 2025"
];

export const mockMessages: ChatMessage[] = [
  {
    id: "1",
    role: "assistant",
    createdAt: "09:15",
    content:
      "### Snapshot\nSwiss procurement volume accelerated in Q4 2023, led by IT and transport contracts in Zurich and Vaud."
  },
  {
    id: "2",
    role: "user",
    createdAt: "09:16",
    content: "Analyze IT contracts by canton"
  },
  {
    id: "3",
    role: "assistant",
    createdAt: "09:16",
    pinned: true,
    content:
      "### Top Findings\n- Zurich and Bern dominate total IT award volume.\n- Geneva has fewer contracts but higher median award size.\n- Single-bid awards are elevated in smaller cantons."
  }
];

export const kpis: Kpi[] = [
  { id: "k1", label: "Total Contracts", value: "198,420", delta: "+8.2%" },
  { id: "k2", label: "Award Volume", value: "CHF 84.3B", delta: "+4.1%" },
  { id: "k3", label: "Active Cantons", value: "26", delta: "Stable" },
  { id: "k4", label: "Avg Contract", value: "CHF 425K", delta: "+2.7%" }
];

export const timeSeriesData = [
  { month: "Jan", contracts: 1210, volume: 630 },
  { month: "Feb", contracts: 1330, volume: 720 },
  { month: "Mar", contracts: 1490, volume: 810 },
  { month: "Apr", contracts: 1375, volume: 760 },
  { month: "May", contracts: 1520, volume: 870 },
  { month: "Jun", contracts: 1660, volume: 940 }
];

export const topCategories = [
  { name: "IT Services", value: 34 },
  { name: "Construction", value: 28 },
  { name: "Transport", value: 19 },
  { name: "Healthcare", value: 11 },
  { name: "Energy", value: 8 }
];
