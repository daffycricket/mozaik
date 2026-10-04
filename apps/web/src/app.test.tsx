import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, test } from 'vitest';
import { APP_NAME, App } from './app';

describe('[T-001-AC2] application shell', () => {
  test('[T-001-AC2] renders the application name', () => {
    const html = renderToStaticMarkup(<App />);
    expect(html).toContain(APP_NAME);
    expect(APP_NAME).toBe('Mozaik');
  });
});

describe('[T-001-AC5] web package', () => {
  test('[T-001-AC5] exposes the application name', () => {
    expect(APP_NAME).toBe('Mozaik');
  });
});
