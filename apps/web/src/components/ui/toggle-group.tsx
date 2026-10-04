import { Toggle as TogglePrimitive } from '@base-ui/react/toggle';
import { ToggleGroup as ToggleGroupPrimitive } from '@base-ui/react/toggle-group';
import { cn } from '@/lib/utils';

function ToggleGroup({
  className,
  orientation = 'horizontal',
  ...props
}: ToggleGroupPrimitive.Props<string>) {
  return (
    <ToggleGroupPrimitive
      data-slot="toggle-group"
      orientation={orientation}
      className={cn(
        'flex w-fit items-center gap-1 rounded-lg',
        orientation === 'vertical' && 'flex-col',
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({ className, ...props }: TogglePrimitive.Props<string>) {
  return (
    <TogglePrimitive
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex size-8 shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors outline-none select-none hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-pressed:bg-accent aria-pressed:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
