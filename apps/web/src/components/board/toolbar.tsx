import { Circle, Hand, MousePointer2, Redo2, Square, StickyNote, Undo2 } from 'lucide-react';
import { useBoardHistory } from '@/collab/history-context';
import { useHistoryState } from '@/collab/use-history-state';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { type Tool, useToolStore } from '@/state/tool-store';

const TOOLS: Array<{ tool: Tool; label: string; Icon: typeof MousePointer2 }> = [
  { tool: 'select', label: 'Sélection (V)', Icon: MousePointer2 },
  { tool: 'hand', label: 'Main (H)', Icon: Hand },
  { tool: 'sticky', label: 'Post-it (N)', Icon: StickyNote },
  { tool: 'rect', label: 'Rectangle (R)', Icon: Square },
  { tool: 'ellipse', label: 'Ellipse (O)', Icon: Circle },
];

/**
 * Floating toolbar of the board, vertically centered on the left edge. Only the
 * tools that exist are listed, in the order of `design/ecrans.md`, followed by a
 * separator and the undo/redo buttons, disabled without history (F08-S2-AC3).
 */
export function Toolbar() {
  const tool = useToolStore((state) => state.tool);
  const setTool = useToolStore((state) => state.setTool);
  const history = useBoardHistory();
  const { canUndo, canRedo } = useHistoryState(history);

  return (
    <div
      role="toolbar"
      aria-orientation="vertical"
      aria-label="Outils"
      data-testid="toolbar"
      className="absolute top-1/2 left-[var(--float-gap)] z-10 flex -translate-y-1/2 flex-col items-center rounded-lg border bg-background p-1 shadow-md"
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
      <Separator className="my-1" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Annuler"
        title="Annuler"
        data-testid="undo"
        disabled={!canUndo}
        onClick={() => history?.undo()}
      >
        <Undo2 aria-hidden="true" />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        aria-label="Rétablir"
        title="Rétablir"
        data-testid="redo"
        disabled={!canRedo}
        onClick={() => history?.redo()}
      >
        <Redo2 aria-hidden="true" />
      </Button>
    </div>
  );
}
