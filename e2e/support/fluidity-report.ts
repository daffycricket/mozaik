import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import type { TestInfo } from '@playwright/test';
import type { FluidityMeasure } from '../../tooling/report';

const REPORT_PATH = resolve(process.cwd(), 'test-results/fluidity.json');

/**
 * Appends a fluidity measure to the local report read by `pnpm report`.
 */
export function recordFluidityMeasure(measure: FluidityMeasure): void {
  mkdirSync(dirname(REPORT_PATH), { recursive: true });
  const existing: FluidityMeasure[] = existsSync(REPORT_PATH)
    ? (JSON.parse(readFileSync(REPORT_PATH, 'utf8')) as FluidityMeasure[])
    : [];
  existing.push(measure);
  writeFileSync(REPORT_PATH, JSON.stringify(existing, null, 2), 'utf8');
}

/**
 * Returns the repository-relative path of the video recorded for a test.
 */
export function videoPathFor(testInfo: TestInfo): string {
  return relative(process.cwd(), testInfo.outputPath('video.webm'));
}
