// Garde-fou OpenCode du mode produit.
// Chargé depuis /runner/opencode dans l'image, construite depuis la copie de mozaik sur main :
// le dossier runner/ du clone du ticket n'est jamais exécuté, et l'agent ne doit pas le modifier.
// La phase (MZK_PHASE) et le ticket (MZK_TICKET) sont fixés par phase.sh.
// Chaque refus est journalisé dans $GUARD_LOG ; mzk.sh le reporte dans le rapport du ticket.
import { appendFileSync } from 'node:fs';
import { isAbsolute, relative } from 'node:path';

const LOG = process.env.GUARD_LOG || '/run-logs/guard.jsonl';
const PHASE = process.env.MZK_PHASE || '';
const TICKET = process.env.MZK_TICKET || '';

const SPEC_PATHS = [
  'docs/features/',
  'docs/design/',
  `docs/tickets/${TICKET}/`,
  'docs/journal.md',
  'docs/exigences-techniques.md',
];
const DESIGN_PATHS = [
  `docs/tickets/${TICKET}/plan.md`,
  'docs/adr/',
  'docs/architecture.md',
  'docs/glossary.md',
  'docs/journal.md',
];
const DOC_PHASES = {
  spec: SPEC_PATHS,
  'spec-review': SPEC_PATHS,
  design: DESIGN_PATHS,
  'tech-review': DESIGN_PATHS,
};
const CODE_PHASES = new Set(['dev', 'review', 'merge']);
// Spec du ticket : interdite en dev et en merge ; en review, permise pour un retour [spec] (contrôle après coup)
const SPEC_FILES = (p) =>
  p.startsWith('docs/features/') ||
  (p.startsWith('docs/design/') && p !== 'docs/design/composants.md');

function record(entry) {
  try {
    appendFileSync(
      LOG,
      `${JSON.stringify({ ts: new Date().toISOString(), phase: PHASE, ...entry })}\n`,
    );
  } catch {
    // le journal du garde-fou ne doit jamais faire échouer l'agent
  }
}

function deny(entry) {
  record({ event: 'blocked', ...entry });
  throw new Error(`[garde-fou] Refusé : ${entry.rule} ${entry.instead}`);
}

const BASH_RULES = [
  [
    /\bgit\s+push\b/,
    'Interdit de pousser (AGENTS.md §6).',
    'Commite localement ; la publication est faite par le script.',
  ],
  [
    /\bgit\s+remote\s+(add|set-url|rename)\b/,
    "Interdit d'ajouter ou de modifier un remote (AGENTS.md §6).",
    'Travaille sans remote.',
  ],
  [
    /(--no-verify\b|\bgit\s+commit\b[^;&|]*\s-n\b)/,
    'Interdit de contourner les hooks Git (process/git.md).',
    "Corrige le message ou le code pour que le hook l'accepte.",
  ],
  [
    /\bgit\b[^;&|]*core\.hooksPath/,
    'Interdit de modifier la configuration des hooks Git.',
    'Laisse les hooks en place.',
  ],
  [
    /\brm\b[^;&|]*(^|\s|\/)\.git(\s|\/|$)/,
    'Interdit de supprimer le dépôt Git.',
    'Utilise git restore ou git revert pour revenir en arrière.',
  ],
  [
    /\bgit\s+(switch|checkout\s+-[bB]|checkout\s+main\b|branch\s+(-[dDmMfc]\b|--(delete|move|force|copy)\b)|worktree\s+add)/,
    'Interdit de créer, supprimer ou changer de branche (AGENTS.md §6).',
    'Reste sur la branche du ticket.',
  ],
  [
    /\bgit\s+merge\b/,
    'Interdit de merger (AGENTS.md §6).',
    'Le merge est fait par le script après la recette.',
  ],
  [
    /\bgit\s+(commit\s+--amend|filter-branch|filter-repo|update-ref|replace|reset\s+--(hard|soft|mixed)\s+\S)/,
    "Interdit de réécrire l'historique de la branche (process/git.md).",
    'Annule une étape commitée par git revert ; abandonne le travail non commité par git restore et git clean.',
  ],
];
const REBASE = /\bgit\s+rebase\b/;
// Outillage des phases : jamais modifié par l'agent (le contrôle de fin de session détecte aussi les autres voies)
const TOOLING = 'runner/';
const WRITES_TOOLING =
  /(>>?|\btee\b|\bsed\s+-i|\bperl\s+-i|\b(cp|mv|rm|touch|truncate|ln|install|chmod|patch)\b|\bgit\s+(checkout|restore|rm|mv|apply)\b)[^;&|]*(^|[\s'"=/])\.?\/?runner(\/|\s|$)/;
const REBASE_CONTINUE = /\bgit\s+rebase\s+--continue\b/;
const COMMIT = /\bgit\s+commit\b/;

function rel(directory, p) {
  const r = isAbsolute(p) ? relative(directory, p) : p.replace(/^\.\//, '');
  return r;
}

export const MozaikGuard = async ({ directory }) => {
  record({ event: 'loaded', directory, ticket: TICKET });
  return {
    'tool.execute.before': async (input, output) => {
      const tool = String(input?.tool || '');
      const args = output?.args || {};

      if (tool === 'bash') {
        const cmd = String(args.command || '');
        for (const [re, rule, instead] of BASH_RULES)
          if (re.test(cmd)) deny({ tool, detail: cmd.slice(0, 300), rule, instead });
        if (WRITES_TOOLING.test(cmd)) {
          deny({
            tool,
            detail: cmd.slice(0, 300),
            rule: "L'outillage runner/ ne se modifie jamais par l'agent (AGENTS.md §6).",
            instead: 'Signale le besoin dans les points ouverts du rapport.',
          });
        }
        if (REBASE.test(cmd) && !(PHASE === 'merge' && REBASE_CONTINUE.test(cmd))) {
          deny({
            tool,
            detail: cmd.slice(0, 300),
            rule: 'Le rebase est fait par le script (process/git.md).',
            instead:
              PHASE === 'merge'
                ? 'Résous les conflits, git add, puis git rebase --continue.'
                : 'Ne rebase pas.',
          });
        }
        if (DOC_PHASES[PHASE] && COMMIT.test(cmd)) {
          deny({
            tool,
            detail: cmd.slice(0, 300),
            rule: `En phase ${PHASE}, le script commite (AGENTS.md §6).`,
            instead: 'Laisse tes modifications non commitées.',
          });
        }
        return;
      }

      if (
        [
          'read',
          'grep',
          'glob',
          'list',
          'webfetch',
          'todoread',
          'todowrite',
          'task',
          'skill',
        ].includes(tool)
      )
        return;

      const paths = Object.entries(args)
        .filter(([k, v]) => typeof v === 'string' && /path|file/i.test(k))
        .map(([, v]) => rel(directory, v));
      const patchText =
        typeof args.patchText === 'string'
          ? args.patchText
          : typeof args.patch === 'string'
            ? args.patch
            : '';
      for (const m of patchText.matchAll(/^\*\*\* (?:Update|Add|Delete) File: (.+)$/gm))
        paths.push(rel(directory, m[1].trim()));
      if (!paths.length) return;

      const tooling = paths.filter((p) => p.startsWith(TOOLING));
      if (tooling.length)
        deny({
          tool,
          detail: tooling.join(', ').slice(0, 300),
          rule: "L'outillage runner/ ne se modifie jamais par l'agent (AGENTS.md §6).",
          instead: 'Signale le besoin dans les points ouverts du rapport.',
        });
      const allowed = DOC_PHASES[PHASE];
      if (allowed) {
        const outside = paths.filter(
          (p) => !allowed.some((a) => (a.endsWith('/') ? p.startsWith(a) : p === a)),
        );
        if (outside.length)
          deny({
            tool,
            detail: outside.join(', ').slice(0, 300),
            rule: `En phase ${PHASE}, seuls ces chemins sont modifiables : ${allowed.join(', ')} (AGENTS.md §6).`,
            instead: 'Écris dans les fichiers de ta phase.',
          });
      }
      if (CODE_PHASES.has(PHASE)) {
        const plan = paths.filter((p) => p === `docs/tickets/${TICKET}/plan.md`);
        if (plan.length)
          deny({
            tool,
            detail: plan.join(', '),
            rule: 'Le plan validé ne se modifie pas en dev (AGENTS.md §9).',
            instead: "Trace l'écart au journal et dans les points ouverts du rapport.",
          });
        const spec = paths.filter(SPEC_FILES);
        if (spec.length && PHASE !== 'review')
          deny({
            tool,
            detail: spec.join(', ').slice(0, 300),
            rule: 'La spec ne se modifie pas en dev ni en merge (AGENTS.md §6).',
            instead: "Trace l'écart au journal et dans les points ouverts du rapport.",
          });
      }
    },
  };
};
