import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { BoardShell } from './board-page';

describe('BoardShell', () => {
  test('renders the boards link and the board name above the canvas', () => {
    const html = renderToStaticMarkup(<BoardShell name="Rétro S12" />);

    expect(html).toContain('data-testid="board-header"');
    expect(html).toContain('data-testid="nav-boards"');
    expect(html).toContain('data-testid="board-name"');
    expect(html).toContain('Rétro S12');
    expect(html).toContain('data-testid="board-canvas"');
  });
});
