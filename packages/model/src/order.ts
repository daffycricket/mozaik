import { generateKeyBetween } from 'fractional-indexing';
import type { Element } from './schema';

/**
 * Direction of a stacking change: `forward` moves towards the top of the board,
 * `backward` towards the bottom (F07-S4).
 */
export type ReorderDirection = 'forward' | 'backward';

/**
 * Returns the elements sorted by ascending zIndex, from the bottom to the top
 * of the board.
 */
export function sortByZIndex(elements: Element[]): Element[] {
  return [...elements].sort((a, b) => (a.zIndex < b.zIndex ? -1 : a.zIndex > b.zIndex ? 1 : 0));
}

/**
 * Tells whether at least one of the given elements can move one step in the
 * direction: an element moves only when its neighbour in that direction is not
 * selected, so a selection touching the top (or bottom) cannot move further
 * (F07-S4-AC3).
 */
export function canReorder(
  elements: Element[],
  ids: string[],
  direction: ReorderDirection,
): boolean {
  const order = sortByZIndex(elements);
  const selected = new Set(ids);
  if (direction === 'forward') {
    for (let i = 0; i < order.length - 1; i += 1) {
      const current = order[i];
      const above = order[i + 1];
      if (
        current !== undefined &&
        above !== undefined &&
        selected.has(current.id) &&
        !selected.has(above.id)
      ) {
        return true;
      }
    }
    return false;
  }
  for (let i = 1; i < order.length; i += 1) {
    const current = order[i];
    const below = order[i - 1];
    if (
      current !== undefined &&
      below !== undefined &&
      selected.has(current.id) &&
      !selected.has(below.id)
    ) {
      return true;
    }
  }
  return false;
}

/**
 * Computes the new zIndex of the elements that move one step towards the top
 * (`forward`) or the bottom (`backward`) of the board. Elements never pass each
 * other, so the relative order of a multiple selection is preserved
 * (F07-S4-AC4). Each moved element only writes its own zIndex, computed with
 * `generateKeyBetween`, so two users advancing different elements concurrently
 * both apply and converge (F07-S4-AC5). Returns an empty map when nothing moves.
 */
export function reorderStep(
  elements: Element[],
  ids: string[],
  direction: ReorderDirection,
): Map<string, string> {
  const order = sortByZIndex(elements);
  const selected = new Set(ids);
  const moved = new Set<string>();

  if (direction === 'forward') {
    for (let i = order.length - 2; i >= 0; i -= 1) {
      const current = order[i];
      const above = order[i + 1];
      if (
        current !== undefined &&
        above !== undefined &&
        selected.has(current.id) &&
        !selected.has(above.id)
      ) {
        order[i] = above;
        order[i + 1] = current;
        moved.add(current.id);
      }
    }
  } else {
    for (let i = 1; i < order.length; i += 1) {
      const current = order[i];
      const below = order[i - 1];
      if (
        current !== undefined &&
        below !== undefined &&
        selected.has(current.id) &&
        !selected.has(below.id)
      ) {
        order[i] = below;
        order[i - 1] = current;
        moved.add(current.id);
      }
    }
  }

  const result = new Map<string, string>();
  if (moved.size === 0) {
    return result;
  }

  let index = 0;
  while (index < order.length) {
    const first = order[index];
    if (first === undefined || !moved.has(first.id)) {
      index += 1;
      continue;
    }
    let end = index;
    while (end < order.length && moved.has(order[end]?.id ?? '')) {
      end += 1;
    }
    const lower = index > 0 ? (order[index - 1]?.zIndex ?? null) : null;
    const upper = end < order.length ? (order[end]?.zIndex ?? null) : null;
    let previous = lower;
    for (let i = index; i < end; i += 1) {
      const element = order[i];
      if (element === undefined) {
        continue;
      }
      const key = generateKeyBetween(previous, upper);
      result.set(element.id, key);
      previous = key;
    }
    index = end;
  }

  return result;
}
