import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, test } from 'vitest';

type TsConfig = {
  compilerOptions?: Record<string, unknown>;
};

const baseTsconfigPath = fileURLToPath(new URL('../tsconfig.base.json', import.meta.url));

describe('[T-001-AC5] @mozaik/config unit test', () => {
  test('[T-001-AC5] enables the strict TypeScript options required by the standards', () => {
    const config = JSON.parse(readFileSync(baseTsconfigPath, 'utf8')) as TsConfig;
    const options = config.compilerOptions ?? {};
    expect(options.strict).toBe(true);
    expect(options.noUncheckedIndexedAccess).toBe(true);
    expect(options.noImplicitOverride).toBe(true);
    expect(options.noFallthroughCasesInSwitch).toBe(true);
    expect(options.noUnusedLocals).toBe(true);
    expect(options.noUnusedParameters).toBe(true);
  });
});
