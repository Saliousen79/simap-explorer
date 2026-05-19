import { Button } from "@/components/ui/button";

export function SuggestedPrompts({
  prompts,
  onPick
}: {
  prompts: string[];
  onPick: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {prompts.map((prompt) => (
        <Button key={prompt} variant="outline" size="sm" onClick={() => onPick(prompt)}>
          {prompt}
        </Button>
      ))}
    </div>
  );
}
