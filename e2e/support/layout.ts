import { expect, type Locator } from '@playwright/test';

const DEFAULT_TOLERANCE = 4;

export type Box = { x: number; y: number; width: number; height: number };
export type Edge = 'left' | 'right' | 'top' | 'bottom';
export type OrderDirection = 'horizontal' | 'vertical';

async function boxOf(locator: Locator): Promise<Box> {
  const box = await locator.boundingBox();
  if (box === null) {
    throw new Error('Expected element to have a bounding box (is it visible?)');
  }
  return box;
}

function rightEdge(box: Box): number {
  return box.x + box.width;
}

function bottomEdge(box: Box): number {
  return box.y + box.height;
}

function centerX(box: Box): number {
  return box.x + box.width / 2;
}

function centerY(box: Box): number {
  return box.y + box.height / 2;
}

/**
 * Expects the first element to be entirely to the left of the second one.
 */
export async function expectLeftOf(
  left: Locator,
  right: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const a = await boxOf(left);
  const b = await boxOf(right);
  expect(rightEdge(a), 'expected the first element left of the second').toBeLessThanOrEqual(
    b.x + tolerance,
  );
}

/**
 * Expects the first element to be entirely above the second one.
 */
export async function expectAbove(
  above: Locator,
  below: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const a = await boxOf(above);
  const b = await boxOf(below);
  expect(bottomEdge(a), 'expected the first element above the second').toBeLessThanOrEqual(
    b.y + tolerance,
  );
}

/**
 * Expects the first element to be contained inside the second one.
 */
export async function expectInside(
  inner: Locator,
  outer: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const a = await boxOf(inner);
  const b = await boxOf(outer);
  expect(a.x, 'inner element left edge').toBeGreaterThanOrEqual(b.x - tolerance);
  expect(a.y, 'inner element top edge').toBeGreaterThanOrEqual(b.y - tolerance);
  expect(rightEdge(a), 'inner element right edge').toBeLessThanOrEqual(rightEdge(b) + tolerance);
  expect(bottomEdge(a), 'inner element bottom edge').toBeLessThanOrEqual(bottomEdge(b) + tolerance);
}

/**
 * Expects two elements not to overlap.
 */
export async function expectNoOverlap(
  a: Locator,
  b: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const first = await boxOf(a);
  const second = await boxOf(b);
  const separated =
    rightEdge(first) <= second.x + tolerance ||
    rightEdge(second) <= first.x + tolerance ||
    bottomEdge(first) <= second.y + tolerance ||
    bottomEdge(second) <= first.y + tolerance;
  expect(separated, 'expected the two elements not to overlap').toBe(true);
}

/**
 * Expects the first element to be horizontally centered inside the second one.
 */
export async function expectCenteredH(
  inner: Locator,
  outer: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const a = await boxOf(inner);
  const b = await boxOf(outer);
  expect(Math.abs(centerX(a) - centerX(b)), 'horizontal centering').toBeLessThanOrEqual(tolerance);
}

/**
 * Expects the first element to be vertically centered inside the second one.
 */
export async function expectCenteredV(
  inner: Locator,
  outer: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const a = await boxOf(inner);
  const b = await boxOf(outer);
  expect(Math.abs(centerY(a) - centerY(b)), 'vertical centering').toBeLessThanOrEqual(tolerance);
}

/**
 * Expects two elements to share the same left edge.
 */
export async function expectAlignedLeft(
  a: Locator,
  b: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const first = await boxOf(a);
  const second = await boxOf(b);
  expect(Math.abs(first.x - second.x), 'left edge alignment').toBeLessThanOrEqual(tolerance);
}

/**
 * Expects two elements to share the same right edge.
 */
export async function expectAlignedRight(
  a: Locator,
  b: Locator,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const first = await boxOf(a);
  const second = await boxOf(b);
  expect(
    Math.abs(rightEdge(first) - rightEdge(second)),
    'right edge alignment',
  ).toBeLessThanOrEqual(tolerance);
}

function gapBetween(a: Box, b: Box): number {
  return Math.max(a.x - rightEdge(b), b.x - rightEdge(a), a.y - bottomEdge(b), b.y - bottomEdge(a));
}

/**
 * Expects the edge-to-edge distance between two elements to be at least `distance`.
 */
export async function expectDistanceAtLeast(
  a: Locator,
  b: Locator,
  distance: number,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const gap = gapBetween(await boxOf(a), await boxOf(b));
  expect(gap, 'edge-to-edge distance').toBeGreaterThanOrEqual(distance - tolerance);
}

/**
 * Expects the distance between an element and a viewport edge to match `distance`.
 */
export async function expectDistanceToEdge(
  element: Locator,
  edge: Edge,
  distance: number,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  const box = await boxOf(element);
  const viewport = element.page().viewportSize();
  if (viewport === null) {
    throw new Error('Expected the page to have a viewport size');
  }
  const measured: Record<Edge, number> = {
    left: box.x,
    right: viewport.width - rightEdge(box),
    top: box.y,
    bottom: viewport.height - bottomEdge(box),
  };
  expect(Math.abs(measured[edge] - distance), `distance to the ${edge} edge`).toBeLessThanOrEqual(
    tolerance,
  );
}

/**
 * Expects a list of elements to be laid out in visual order along one axis.
 */
export async function expectOrder(
  locators: Locator[],
  direction: OrderDirection,
  tolerance = DEFAULT_TOLERANCE,
): Promise<void> {
  let previous: Box | undefined;
  for (const locator of locators) {
    const box = await boxOf(locator);
    if (previous !== undefined) {
      const previousEnd = direction === 'horizontal' ? rightEdge(previous) : bottomEdge(previous);
      const currentStart = direction === 'horizontal' ? box.x : box.y;
      expect(
        currentStart,
        `expected the next element to follow in ${direction} order`,
      ).toBeGreaterThanOrEqual(previousEnd - tolerance);
    }
    previous = box;
  }
}

/**
 * Expects a computed style to resolve to the value of a CSS variable (theme or token).
 */
export async function expectToken(
  locator: Locator,
  property: string,
  variable: string,
): Promise<void> {
  const actual = await locator.evaluate((element, prop) => {
    const browser = globalThis as unknown as {
      getComputedStyle: (target: unknown) => { getPropertyValue: (name: string) => string };
    };
    return browser.getComputedStyle(element).getPropertyValue(prop);
  }, property);
  const expected = await locator.page().evaluate((name) => {
    const browser = globalThis as unknown as {
      document: { documentElement: unknown };
      getComputedStyle: (target: unknown) => { getPropertyValue: (variable: string) => string };
    };
    return browser.getComputedStyle(browser.document.documentElement).getPropertyValue(name);
  }, variable);
  expect(actual.trim(), `expected "${property}" to resolve to ${variable}`).toBe(expected.trim());
}
