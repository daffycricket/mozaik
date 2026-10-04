/**
 * Project design tokens from `docs/design/charte.md`, declared in `index.css` and
 * exposed to the Konva canvas rendering (which cannot read CSS classes).
 */
export const PROJECT_TOKENS = {
  '--canvas-bg': '#FAFAFA',
  '--canvas-dot': '#D4D4D8',
  '--selection': '#2563EB',
  '--selection-fill': 'rgba(37, 99, 235, 0.08)',
  '--shape-stroke': '#1F2937',
  '--cursor-label-text': '#FFFFFF',
  '--header-height-menu': '56px',
  '--header-height-board': '48px',
  '--float-gap': '12px',
  '--control-size': '32px',
} as const;

export type ProjectToken = keyof typeof PROJECT_TOKENS;

/**
 * Returns the current value of a project token, falling back to its declared value
 * when the DOM is unavailable (unit tests) or the variable is not set.
 */
export function readProjectToken(name: ProjectToken): string {
  const fallback = PROJECT_TOKENS[name];
  if (typeof document === 'undefined') {
    return fallback;
  }
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value === '' ? fallback : value;
}
