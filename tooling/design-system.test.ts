import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

type ComponentsConfig = {
  style?: string;
  tsx?: boolean;
  tailwind?: { baseColor?: string; cssVariables?: boolean };
  aliases?: Record<string, string>;
  iconLibrary?: string;
};

type Manifest = {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

const repoRoot = fileURLToPath(new URL('..', import.meta.url));
const webRoot = join(repoRoot, 'apps/web');

function readJson<T>(path: string): T {
  return JSON.parse(readFileSync(path, 'utf8')) as T;
}

describe('[T-006-AC1] shadcn/ui design system', () => {
  test('[T-006-AC1] configures shadcn/ui on Base UI with the neutral base color', () => {
    const config = readJson<ComponentsConfig>(join(webRoot, 'components.json'));
    expect(config.style).toBe('base-nova');
    expect(config.tsx).toBe(true);
    expect(config.tailwind?.baseColor).toBe('neutral');
    expect(config.tailwind?.cssVariables).toBe(true);
    expect(config.aliases?.components).toBe('@/components');
    expect(config.aliases?.ui).toBe('@/components/ui');
    expect(config.aliases?.utils).toBe('@/lib/utils');
    expect(config.iconLibrary).toBe('lucide');
  });

  test('[T-006-AC1] installs Tailwind CSS v4, Base UI and lucide-react', () => {
    const manifest = readJson<Manifest>(join(webRoot, 'package.json'));
    expect(manifest.dependencies?.['@base-ui/react']).toBeDefined();
    expect(manifest.dependencies?.['lucide-react']).toBeDefined();
    expect(manifest.devDependencies?.tailwindcss).toMatch(/^4\./);
    expect(manifest.devDependencies?.['@tailwindcss/vite']).toMatch(/^4\./);
  });

  test('[T-006-AC1] wires the Tailwind Vite plugin', () => {
    const config = readFileSync(join(webRoot, 'vite.config.ts'), 'utf8');
    expect(config).toContain('@tailwindcss/vite');
    expect(config).toContain('tailwindcss()');
  });

  test('[T-006-AC1] adds the button component, built on the Base UI primitive', () => {
    const uiDir = join(webRoot, 'src/components/ui');
    const entries = readdirSync(uiDir);
    expect(entries).toContain('button.tsx');
    expect(entries).toContain('button.test.tsx');
    const button = readFileSync(join(uiDir, 'button.tsx'), 'utf8');
    expect(button).toContain('@base-ui/react/button');
  });
});
