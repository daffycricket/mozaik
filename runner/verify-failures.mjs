// Extraction des échecs d'une commande de la vérification indépendante (checks.mjs verify),
// pour dire à l'agent ce qui a échoué et pas seulement quelle commande.

const MAX_ITEMS = 10;

const unique = (items) => [...new Set(items)];

// Playwright, rapporteur list : tests listés sous « N failed » dans le résumé final
function playwrightFailures(lines) {
  const out = [];
  let inFailed = false;
  for (const line of lines) {
    if (/^\s+\d+ failed\s*$/.test(line)) {
      inFailed = true;
      continue;
    }
    if (!inFailed) continue;
    if (/^\s+\d+ (passed|flaky|skipped|did not run|interrupted)\b/.test(line) || !line.trim()) {
      inFailed = false;
      continue;
    }
    if (line.includes('›'))
      out.push(
        line
          .replace(/[\s─━]+$/, '')
          .trim()
          .replace(/\s*›\s*/g, ' › '),
      );
  }
  return out;
}

// Vitest : lignes « FAIL  <fichier> > <suite> > <test> »
const vitestFailures = (lines) =>
  lines.map((l) => /^\s*FAIL\s+(.*\S)\s*$/.exec(l)?.[1]).filter(Boolean);

// tsc : « fichier(l,c): error TS... » ou « fichier:l:c - error TS... »
const tscErrors = (lines) => lines.filter((l) => /\berror TS\d+:/.test(l)).map((l) => l.trim());

// Biome : en-tête de diagnostic « fichier:l:c lint/... » ou « fichier format »
const biomeErrors = (lines) =>
  lines
    .map((l) => /^(\S+?(?::\d+:\d+)?)\s+((?:lint|assist)\/\S+|format)\b/.exec(l))
    .filter(Boolean)
    .map((m) => `${m[1]} ${m[2]}`);

// ac:check : critères listés après « uncovered criteria: »
function acCheckFailures(lines) {
  const i = lines.findIndex((l) => l.includes('uncovered criteria:'));
  if (i < 0) return [];
  return lines
    .slice(i + 1)
    .map((l) => /^\s+-\s+(.*\S)/.exec(l)?.[1])
    .filter(Boolean);
}

const lastLines = (lines, n) =>
  lines
    .filter((l) => l.trim())
    .slice(-n)
    .map((l) => l.trim());

/**
 * Éléments identifiant l'échec d'une commande de vérification, d'après sa sortie.
 * @param {string} name commande (lint, typecheck, test:cov, test:e2e, ac:check, install)
 * @param {string} output sortie standard et d'erreur
 * @returns {{items: string[], total: number}} au plus MAX_ITEMS éléments, et leur nombre total
 */
export function failureItems(name, output) {
  const lines = String(output || '').split('\n');
  let items;
  if (name === 'test:e2e') items = playwrightFailures(lines);
  else if (name.startsWith('test')) items = vitestFailures(lines);
  else if (name === 'typecheck') items = tscErrors(lines);
  else if (name === 'lint') items = biomeErrors(lines);
  else if (name === 'ac:check') items = acCheckFailures(lines);
  else items = [];
  items = unique(items);
  if (!items.length) items = lastLines(lines, 5);
  return { items: items.slice(0, MAX_ITEMS), total: items.length };
}

/** Message d'échec d'une commande : « nom : échec (code n) : éléments ». */
export function failureMessage(name, status, output) {
  const { items, total } = failureItems(name, output);
  const head = `${name} : échec (code ${status})`;
  if (!items.length) return head;
  const more = total > items.length ? ` (et ${total - items.length} autre(s))` : '';
  return `${head} : ${items.join(' | ')}${more}`;
}
