import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { Router } from './router';

describe('Router', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test('renders the board list for the root location', () => {
    vi.stubGlobal('window', {
      location: { pathname: '/' },
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    const html = renderToStaticMarkup(<Router />);

    expect(html).toContain('data-testid="board-create"');
  });
});
