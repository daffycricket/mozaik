import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { BoardNotFound } from './board-not-found';

describe('BoardNotFound', () => {
  test('[F01-S5-AC1] renders the not found message and a link to the boards menu', () => {
    const html = renderToStaticMarkup(<BoardNotFound />);

    expect(html).toContain('Board introuvable');
    expect(html).toContain('existe pas ou a été supprimé');
    expect(html).toContain('data-testid="nav-boards"');
    expect(html).toContain('Retour aux boards');
  });
});
