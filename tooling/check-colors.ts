import { readdirSync, readFileSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

export type ColorViolation = { file: string; line: number; match: string };

const SCANNED_EXTENSIONS = new Set(['.ts', '.tsx', '.css']);

/**
 * Files allowed to declare raw color values: the theme (shadcn/ui + project
 * tokens) and the TypeScript module exposing the project tokens to the canvas.
 * The element color palette lives in `packages/model`, outside the scanned app.
 */
const EXEMPT_FILES = new Set(['index.css', 'lib/theme-tokens.ts']);

const TEST_FILE = /\.test\.tsx?$/;

const COLOR_PATTERNS: RegExp[] = [
  /#[0-9a-fA-F]{3,8}\b/g,
  /\b(?:rgba?|hsla?|oklch|oklab)\s*\(/g,
  /\[(?:#|rgba?\(|hsla?\(|oklch\(|oklab\()/g,
];

/**
 * Lists the raw color literals of a source file (hex values, color functions and
 * arbitrary Tailwind color values), one entry per match.
 */
export function findColorLiterals(source: string): Array<{ line: number; match: string }> {
  const found: Array<{ line: number; match: string }> = [];
  const lines = source.split('\n');
  for (const [index, line] of lines.entries()) {
    for (const pattern of COLOR_PATTERNS) {
      for (const match of line.matchAll(pattern)) {
        found.push({ line: index + 1, match: match[0] });
      }
    }
  }
  return found;
}

function walk(dir: string): string[] {
  const files: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walk(path));
    } else if (SCANNED_EXTENSIONS.has(extname(entry.name))) {
      files.push(path);
    }
  }
  return files;
}

/**
 * Scans `apps/web/src` for hardcoded colors, ignoring the theme and token files.
 */
export function runColorCheck(repoRoot: string): ColorViolation[] {
  const sourceRoot = join(repoRoot, 'apps/web/src');
  const violations: ColorViolation[] = [];
  for (const file of walk(sourceRoot)) {
    const relativePath = relative(sourceRoot, file);
    if (EXEMPT_FILES.has(relativePath) || TEST_FILE.test(relativePath)) {
      continue;
    }
    for (const found of findColorLiterals(readFileSync(file, 'utf8'))) {
      violations.push({
        file: `apps/web/src/${relativePath}`,
        line: found.line,
        match: found.match,
      });
    }
  }
  return violations;
}
