export function SuggestedPrompts({
  prompts,
  onPick,
  disabled = false
}: {
  prompts: string[];
  onPick: (prompt: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="liquid-glass-suggestions">
      {prompts.map((prompt) => (
        <button
          key={prompt}
          type="button"
          disabled={disabled}
          onClick={() => onPick(prompt)}
          className="liquid-glass-chip"
        >
          {prompt}
        </button>
      ))}
    </div>
  );
}
