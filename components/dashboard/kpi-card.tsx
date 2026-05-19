import { Card } from "@/components/ui/card";
import { Kpi } from "@/types";

export function KpiCard({ kpi }: { kpi: Kpi }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-muted-foreground">{kpi.label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{kpi.value}</p>
      <p className="mt-1 text-xs text-primary">{kpi.delta}</p>
    </Card>
  );
}
