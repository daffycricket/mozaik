const MINUTE_MS = 60_000;

function isYesterday(date: Date, now: Date): boolean {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return (
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()
  );
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

/**
 * Formats a modification date the way the board list displays it:
 * "à l'instant", "il y a N min", "il y a N h", "hier" or "le JJ/MM".
 */
export function formatRelativeDate(iso: string, now: Date): string {
  const date = new Date(iso);
  const minutes = Math.floor((now.getTime() - date.getTime()) / MINUTE_MS);
  if (minutes < 1) {
    return "à l'instant";
  }
  if (minutes < 60) {
    return `il y a ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `il y a ${hours} h`;
  }
  if (isYesterday(date, now)) {
    return 'hier';
  }
  return `le ${pad(date.getDate())}/${pad(date.getMonth() + 1)}`;
}
