import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { App } from './app';

describe('App routing', () => {
  test('renders the board list at the root route', () => {
    const html = renderToStaticMarkup(<App route={{ kind: 'board-list' }} />);

    expect(html).toContain('data-testid="board-create"');
  });

  test('renders the board canvas on a board route', () => {
    const html = renderToStaticMarkup(<App route={{ kind: 'board', boardId: 'abc123' }} />);

    expect(html).toContain('data-testid="board-canvas"');
  });

  test('defaults to the board list', () => {
    const html = renderToStaticMarkup(<App />);

    expect(html).toContain('Mozaik');
  });
});
