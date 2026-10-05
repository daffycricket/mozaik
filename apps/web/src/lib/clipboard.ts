import { type Element, parseElements, serializeElements } from '@mozaik/model';

/**
 * In-memory copy of the last payload written to the clipboard. It is the
 * fallback when the browser refuses the system clipboard access, and it also
 * lets a paste work when the system clipboard holds unrelated text (F08-S3).
 */
let memoryClipboard: string | null = null;

/**
 * Writes the elements to the system clipboard as a prefixed JSON payload, always
 * keeping an in-memory copy as a fallback when the access is refused (F08-S3).
 */
export async function writeClipboard(elements: Element[]): Promise<void> {
  const payload = serializeElements(elements);
  memoryClipboard = payload;
  try {
    await navigator.clipboard.writeText(payload);
  } catch (error) {
    console.warn('Clipboard write refused, keeping the elements in memory', error);
  }
}

async function readSystemClipboard(): Promise<string | null> {
  try {
    return await navigator.clipboard.readText();
  } catch (error) {
    console.warn('Clipboard read refused, using the in-memory elements', error);
    return null;
  }
}

/**
 * Reads the elements of the system clipboard, falling back to the in-memory
 * payload when the access is refused or when the clipboard does not carry a
 * Mozaik payload (F08-S3). Returns `null` when nothing can be pasted.
 */
export async function readClipboard(): Promise<Element[] | null> {
  const system = await readSystemClipboard();
  const fromSystem = system === null ? null : parseElements(system);
  if (fromSystem !== null) {
    return fromSystem;
  }
  return memoryClipboard === null ? null : parseElements(memoryClipboard);
}
