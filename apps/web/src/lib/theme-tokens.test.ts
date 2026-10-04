import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';
import { PROJECT_TOKENS, type ProjectToken, readProjectToken } from './theme-tokens';

const chartePath = fileURLToPath(new URL('../../../../docs/design/charte.md', import.meta.url));
const cssPath = fileURLToPath(new URL('../index.css', import.meta.url));

function normalize(value: string): string {
  return value.replace(/\s+/g, '').toLowerCase();
}

function charteTokens(): Map<string, string> {
  const content = readFileSync(chartePath, 'utf8');
  const tokens = new Map<string, string>();
  for (const match of content.matchAll(/\|\s*`(--[a-z-]+)`\s*\|\s*`([^`]+)`\s*\|/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) {
      tokens.set(name, normalize(value));
    }
  }
  return tokens;
}

function cssVariables(): Map<string, string> {
  const content = readFileSync(cssPath, 'utf8');
  const variables = new Map<string, string>();
  for (const match of content.matchAll(/(--[a-z-]+)\s*:\s*([^;]+);/g)) {
    const name = match[1];
    const value = match[2];
    if (name !== undefined && value !== undefined) {
      variables.set(name, normalize(value));
    }
  }
  return variables;
}

describe('[T-006-AC2] project design tokens', () => {
  test('[T-006-AC2] declares every charte token in index.css with its value', () => {
    const tokens = charteTokens();
    expect(tokens.size).toBeGreaterThan(0);
    const variables = cssVariables();
    for (const [name, value] of tokens) {
      expect(variables.get(name), `missing ${name} in index.css`).toBe(value);
    }
  });

  test('[T-006-AC2] exposes every charte token from the TypeScript module', () => {
    const tokens = charteTokens();
    for (const [name, value] of tokens) {
      expect(PROJECT_TOKENS[name as ProjectToken]).toBeDefined();
      expect(normalize(PROJECT_TOKENS[name as ProjectToken])).toBe(value);
    }
  });

  test('[T-006-AC2] declares the shadcn/ui theme variables without modification', () => {
    const variables = cssVariables();
    expect(variables.get('--background')).toBe('oklch(100)');
    expect(variables.get('--foreground')).toBe('oklch(0.14500)');
    expect(variables.get('--primary')).toBe('oklch(0.20500)');
    expect(variables.get('--border')).toBe('oklch(0.92200)');
    expect(variables.get('--ring')).toBe('oklch(0.70800)');
    expect(variables.get('--radius')).toBe('0.625rem');
  });

  test('[T-006-AC2] falls back to the declared value without a DOM', () => {
    expect(readProjectToken('--canvas-bg')).toBe('#FAFAFA');
    expect(readProjectToken('--control-size')).toBe('32px');
  });
});
