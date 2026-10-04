import { Hand, MousePointer2 } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type Tool, useToolStore } from '@/state/tool-store';

const TOOLS: Array<{ tool: Tool; label: string; Icon: typeof MousePointer2 }> = [
  { tool: 'select', label: 'Sélection (V)', Icon: MousePointer2 },
  { tool: 'hand', label: 'Main (H)', Icon: Hand },
];

/**
 * Floating toolbar of the board, vertically centered on the left edge. Only the
 * tools that exist are listed, in the order of `design/ecrans.md`.
 */
export function Toolbar() {
  const tool = useToolStore((state) => state.tool);
  const setTool = useToolStore((state) => state.setTool);

  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Outils"
      data-testid="toolbar"
      className="absolute top-1/2 left-[var(--float-gap)] z-10 -translate-y-1/2 rounded-lg border bg-background p-1 shadow-md"
    >
      <ToggleGroup
        orientation="vertical"
        value={[tool]}
        onValueChange={(value) => {
          const next = value[0];
          if (next !== undefined) {
            setTool(next as Tool);
          }
        }}
      >
        {TOOLS.map(({ tool: value, label, Icon }) => (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            data-testid={`tool-${value}`}
          >
            <Icon />
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </div>
  );
}
