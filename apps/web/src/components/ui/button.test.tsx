import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { Button, buttonVariants } from './button';

describe('[T-006-AC1] button component', () => {
  test('[T-006-AC1] renders a button with the shadcn/ui classes', () => {
    const html = renderToStaticMarkup(<Button>Valider</Button>);
    expect(html).toContain('<button');
    expect(html).toContain('data-slot="button"');
    expect(html).toContain('Valider');
  });

  test('[T-006-AC1] applies the requested variant and size', () => {
    const html = renderToStaticMarkup(
      <Button variant="destructive" size="icon">
        x
      </Button>,
    );
    expect(html).toContain('bg-destructive/10');
    expect(html).toContain('size-8');
  });

  test('[T-006-AC1] exposes the class variants', () => {
    expect(buttonVariants({ variant: 'ghost' })).toContain('hover:bg-muted');
  });
});
