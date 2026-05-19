import { Card } from "@/components/ui/card";

export function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="h-full p-4">
      <h3 className="mb-4 text-sm font-medium text-muted-foreground">{title}</h3>
      <div className="h-[240px]">{children}</div>
    </Card>
  );
}
