import { z } from 'zod';
import type { Point } from './viewport';

/**
 * Twelve contrasting colors for user cursors, distinct from the element palette (F10).
 * The label text is white, so every color stays dark enough to remain readable.
 */
export const USER_COLORS = [
  '#E11D48',
  '#DB2777',
  '#9333EA',
  '#7C3AED',
  '#4F46E5',
  '#2563EB',
  '#0891B2',
  '#0D9488',
  '#16A34A',
  '#CA8A04',
  '#EA580C',
  '#DC2626',
] as const;

export const presenceUserSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  color: z.string().min(1),
});

export const presenceCursorSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
});

/**
 * Ephemeral presence state shared through Yjs Awareness (never persisted).
 */
export const presenceStateSchema = z.object({
  user: presenceUserSchema,
  cursor: presenceCursorSchema.nullable(),
});

export type PresenceUser = z.infer<typeof presenceUserSchema>;
export type PresenceCursor = z.infer<typeof presenceCursorSchema>;
export type PresenceState = z.infer<typeof presenceStateSchema>;

/**
 * Derives a user cursor color from the identity id, deterministically (F10).
 */
export function userColor(id: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < id.length; index += 1) {
    hash ^= id.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return USER_COLORS[hash % USER_COLORS.length] ?? '#E11D48';
}

/**
 * Validates a presence state read from another client, ignoring invalid entries.
 */
export function parsePresenceState(value: unknown): PresenceState | null {
  const parsed = presenceStateSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

/**
 * Tells whether a screen point falls inside the visible canvas (F10-S2-AC3).
 */
export function isPointVisible(point: Point, size: { width: number; height: number }): boolean {
  return point.x >= 0 && point.y >= 0 && point.x <= size.width && point.y <= size.height;
}

/**
 * Linear interpolation between two points, with the progress clamped to [0, 1] (FL-4).
 */
export function interpolatePoint(from: Point, to: Point, progress: number): Point {
  const ratio = Math.min(1, Math.max(0, progress));
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}
