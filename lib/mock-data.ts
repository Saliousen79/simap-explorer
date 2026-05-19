import { Kpi } from "@/types";

export const suggestedPrompts = [
  "Trends 2023",
  "IT nach Kanton",
  "Bauvergaben vergleichen"
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
