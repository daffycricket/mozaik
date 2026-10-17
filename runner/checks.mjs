// Contrôles et vérification indépendante du mode produit, exécutés dans le conteneur (phase.sh),
// sur la branche du ticket. Aucun contrôle ne bloque : les écarts sont constatés et reportés dans le rapport.
//
//   node checks.mjs check --phase <p> --ticket <id> --base <sha> --before <sha> --session <n> --exit <code> --guard-offset <k>
//       -> une ligne JSON par événement {phase, session, summary, review}
//   node checks.mjs verify --ticket <id> --since <sha> --session <n>
//       -> {ok, failures, passed, coverage} ; chaque échec nomme les tests ou erreurs en cause
//          (verify-failures.mjs), le détail est dans /run-logs/verify-<phase>-<n>.log
//   node checks.mjs progress --ticket <id> --base <sha>
//       -> {planSteps, lastStep}
import { execFileSync, spawnSync } from 'node:child_process';
import {
  appendFileSync,
  existsSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { failureMessage } from './verify-failures.mjs';

const GUARD_LOG = process.env.GUARD_LOG || '/run-logs/guard.jsonl';
const LOGS = process.env.RUN_LOGS || '/run-logs';
const AGENT_EMAIL = 'agent@localhost';
const SUBJECT_RE =
  /^(feat|fix|test|refactor|chore|docs|perf|build|revert)\(([a-z][a-z0-9-]*)\): (MZK-\d+)#\d+ \S/;
const TEST_FILE_RE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const TITLE_RE =
  /\b(?:it|test)(?:\.(?:only|skip|fixme|concurrent|fails))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
const ASSERT_RE = /\bexpect(?:\.soft|\.poll)?\s*\(|\bassert(?:\.\w+)?\s*\(/g;
const ID_RE = /\b(?:F\d{2}-S\d+(?:-AC\d+)?|UI-[A-Z]+-\d+|[TB]-\d{3}-AC\d+)\b/g;
const DISABLED_TEST_RE =
  /\b(it|test|describe)\.(skip|only|fixme)\s*\(|\bx(it|describe)\s*\(|\btest\.fixme\s*\(/;
const REPLAY = process.env.TNR_REPLAY !== '0';
const REPLAY_TIMEOUT_MS = Number(process.env.REPLAY_TIMEOUT_MS || 20 * 60 * 1000);
const VERIFY_TIMEOUT_MS = Number(process.env.VERIFY_TIMEOUT_MS || 30 * 60 * 1000);
const COVERAGE_MIN = 80;
const COVERAGE_TOLERANCE = 0.5;
const DOC_PHASES = new Set(['spec', 'spec-review', 'design', 'tech-review']);

function git(...args) {
  try {
    return execFileSync('git', args, {
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 64 * 1024 * 1024,
    }).toString();
  } catch {
    return null;
  }
}
const ok = (...args) => git(...args) !== null;
const arg = (name, def = '') => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};
const titlesOf = (src) => [...(src || '').matchAll(TITLE_RE)].map((m) => m[2]);
const assertionsOf = (src) => ((src || '').match(ASSERT_RE) || []).length;
const idsOf = (s) => [...new Set(String(s).match(ID_RE) || [])];

// Section du ticket dans le journal, découpée par sous-section de phase
function journalPhases(text, ticket) {
  const lines = (text || '').split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${ticket} :`));
  const out = [];
  if (start < 0) return { out, section: '' };
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  let cur = null;
  for (let i = start; i < end; i++) {
    const h = /^### (.+?) : /.exec(lines[i]);
    if (h) {
      cur = { phase: h[1], rows: [] };
      out.push(cur);
      continue;
    }
    if (cur && /^\|/.test(lines[i]) && !/^\|\s*(Type|---)/.test(lines[i])) {
      const c = lines[i].split('|').map((x) => x.trim());
      cur.rows.push({
        type: c[1],
        elements: c[2],
        decision: c[3],
        origin: c[4],
        review: c[5],
        raw: lines[i],
      });
    }
  }
  return { out, section: lines.slice(start, end).join('\n') };
}
const withoutSection = (text, ticket) => {
  const lines = (text || '').split('\n');
  const start = lines.findIndex((l) => l.startsWith(`## ${ticket} :`));
  if (start < 0) return text || '';
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  return [...lines.slice(0, start), ...lines.slice(end)].join('\n').trimEnd();
};

function check() {
  const phase = arg('phase');
  const ticket = arg('ticket');
  const base = arg('base');
  const before = arg('before');
  const session = arg('session', '?');
  const exit = Number(arg('exit', '0'));
  const guardOffset = Number(arg('guard-offset', '0'));
  const ev = [];
  const add = (summary, review = 'oui') => ev.push({ phase, session, summary, review });

  // Garde-fou
  const guardLines = existsSync(GUARD_LOG)
    ? readFileSync(GUARD_LOG, 'utf8').split('\n').filter(Boolean).slice(guardOffset)
    : [];
  const guard = guardLines
    .map((l) => {
      try {
        return JSON.parse(l);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
  if (!guard.some((g) => g.event === 'loaded'))
    add("Le garde-fou OpenCode ne s'est pas chargé : les interdits n'ont pas été appliqués.");
  for (const g of guard.filter((g) => g.event === 'blocked'))
    add(`Garde-fou, bloqué (${g.tool}) : ${g.detail}. ${g.rule}`);

  if (exit === 124) add('Session interrompue : délai maximal atteint (SESSION_TIMEOUT).', 'non');
  else if (exit !== 0) add(`Session terminée en erreur (code ${exit}).`, 'non');

  const head = git('rev-parse', 'HEAD')?.trim();

  // Outillage runner/ : jamais modifié par l'agent, ni commité ni en cours
  const toolingChanged = [
    ...(head && before && head !== before
      ? (git('diff', '--name-only', before, 'HEAD', '--', 'runner') || '').split('\n')
      : []),
    ...(git('status', '--porcelain', '--', 'runner') || '').split('\n').map((l) => l.slice(3)),
  ].filter(Boolean);
  if (toolingChanged.length)
    add(
      `Outillage runner/ modifié pendant la session (${[...new Set(toolingChanged)].slice(0, 5).join(', ')}) : interdit à l'agent ; le merge sera refusé tant que la branche modifie runner/.`,
    );

  if (DOC_PHASES.has(phase)) {
    if (head && before && head !== before)
      add(`L'agent a commité en phase ${phase} (le script commite).`);
    return ev;
  }
  if (!head || !before || head === before) return ev;

  // Historique de la branche
  if (phase !== 'merge' && !ok('merge-base', '--is-ancestor', before, 'HEAD')) {
    add(
      `L'historique de la branche a été réécrit (le commit ${before.slice(0, 7)} n'en fait plus partie).`,
    );
    return ev;
  }
  const from = phase === 'merge' ? base : before;

  // Format des commits de l'agent
  const log = git('log', '--format=%H%x1f%ae%x1f%s%x1f%b%x1e', `${from}..HEAD`) || '';
  const bad = [];
  for (const rec of log
    .split('\x1e')
    .map((r) => r.trim())
    .filter(Boolean)) {
    const [sha, email, subject, body = ''] = rec.split('\x1f');
    if (email !== AGENT_EMAIL) continue;
    const problems = [];
    const m = SUBJECT_RE.exec(subject);
    if (!m) problems.push('sujet hors format');
    else if (m[3] !== ticket) problems.push(`identifiant ${m[3]} au lieu de ${ticket}`);
    const refs = /^Refs:\s*(.+)$/m.exec(body)?.[1] || '';
    if (refs.split(',')[0].trim() !== ticket)
      problems.push('trailer Refs absent ou ne commençant pas par le ticket');
    if (!subject.startsWith('revert')) {
      for (const t of ['Plan-Step', 'Tests', 'Coverage', 'Report'])
        if (!new RegExp(`^${t}: `, 'm').test(body)) problems.push(`trailer ${t} absent`);
    }
    if (problems.length)
      bad.push(`${sha.slice(0, 7)} « ${subject.slice(0, 60)} » (${problems.join(', ')})`);
  }
  if (bad.length)
    add(
      `Commit(s) non conforme(s) à process/git.md : ${bad.slice(0, 5).join(' ; ')}${bad.length > 5 ? ` ; et ${bad.length - 5} autre(s)` : ''}.`,
    );

  // Plan et spec : inchangés en dev et en merge ; en review, seulement sur retour [spec]
  const plan = `docs/tickets/${ticket}/plan.md`;
  if (!ok('diff', '--quiet', before, 'HEAD', '--', plan))
    add(`Le plan ${plan} a été modifié en phase ${phase}.`);
  const specChanged = (
    git('diff', '--name-only', before, 'HEAD', '--', 'docs/features', 'docs/design') || ''
  )
    .split('\n')
    .filter((f) => f && f !== 'docs/design/composants.md');
  if (specChanged.length) {
    add(
      phase === 'review'
        ? `Spec modifiée en review (${specChanged.join(', ')}) : vérifier qu'un retour [spec] le justifie.`
        : `Spec modifiée en phase ${phase} (${specChanged.join(', ')}), ce qui est interdit.`,
    );
  }

  // Journal : rien ne change hors de la section du ticket
  const jBefore = git('show', `${before}:docs/journal.md`);
  const jAfter = git('show', 'HEAD:docs/journal.md');
  if (withoutSection(jBefore, ticket) !== withoutSection(jAfter, ticket))
    add('docs/journal.md modifié hors de la section du ticket.');
  const rowsBefore = new Set(
    journalPhases(jBefore, ticket).out.flatMap((p) => p.rows.map((r) => r.raw)),
  );
  const altered = journalPhases(jAfter, ticket)
    .out.flatMap((p) => p.rows)
    .filter((r) => /\|\s*revu\s*\|\s*$/.test(r.raw) && !rowsBefore.has(r.raw));
  if (altered.length)
    add(
      `${altered.length} entrée(s) du journal passée(s) à « revu » par l'agent : seul le script le fait.`,
    );

  // Tests désactivés ajoutés pendant la session
  const diff = git('diff', '-U0', `${before}..HEAD`, '--', '*.test.*', '*.spec.*') || '';
  const disabled = diff
    .split('\n')
    .filter((l) => l.startsWith('+') && !l.startsWith('+++') && DISABLED_TEST_RE.test(l));
  if (disabled.length)
    add(
      `${disabled.length} test(s) désactivé(s) ou isolé(s) ajouté(s) (skip, only, fixme), ce qui est interdit.`,
    );

  for (const e of inheritedTestChecks(ticket, base, before, jAfter)) add(e.summary, e.review);
  return ev;
}

// Tests hérités (présents sur main à la création de la branche) modifiés ou supprimés pendant la session
function inheritedTestChecks(ticket, base, before, journal) {
  const out = [];
  if (!base) return out;
  const inherited = new Set(
    (git('ls-tree', '-r', '--name-only', base) || '')
      .split('\n')
      .filter((f) => TEST_FILE_RE.test(f)),
  );
  const changed = (git('diff', '--name-only', before, 'HEAD') || '')
    .split('\n')
    .filter((f) => inherited.has(f));
  if (!changed.length) return out;

  const { out: phases } = journalPhases(journal, ticket);
  const specIds = new Set(
    phases
      .filter((p) => p.phase === 'Spec' || p.phase === 'Spec review')
      .flatMap((p) =>
        p.rows
          .filter((r) => ['critère', 'story', 'ui'].includes(r.type))
          .flatMap((r) => idsOf(r.elements)),
      ),
  );
  const covered = (id) => specIds.has(id) || [...specIds].some((s) => id.startsWith(`${s}-`));
  const isBug = /Type\s*:\s*bug/i.test(git('show', `HEAD:docs/tickets/${ticket}/ticket.md`) || '');
  const testRows = phases
    .filter((p) => !['Spec', 'Spec review', 'Design', 'Tech review'].includes(p.phase))
    .flatMap((p) => p.rows.filter((r) => r.type === 'test'));
  const cited = (f) =>
    testRows.some((r) => r.raw.includes(f) || r.raw.includes(f.split('/').pop()));

  const replayFiles = [];
  for (const f of changed) {
    const baseSrc = git('show', `${base}:${f}`);
    const newSrc = git('show', `HEAD:${f}`);
    const oldTitles = titlesOf(baseSrc);
    const deleted = newSrc === null;
    const lost = deleted ? oldTitles : oldTitles.filter((t) => !titlesOf(newSrc).includes(t));
    const fewer = !deleted && assertionsOf(newSrc) < assertionsOf(baseSrc);
    const removedLines = deleted
      ? []
      : (git('diff', '-U0', base, 'HEAD', '--', f) || '')
          .split('\n')
          .filter((l) => l.startsWith('-') && !l.startsWith('---'))
          .map((l) => l.slice(1))
          .filter((l) => l.trim() && !/^\s*(import\b|\}\s*from\s)/.test(l));
    if (!deleted && !lost.length && !fewer && !removedLines.length) continue; // ajouts seuls
    const ids = idsOf((lost.length ? lost : oldTitles).join(' '));
    let legit, reason;
    if (isBug) {
      legit = cited(f);
      reason = 'ticket bug';
    } else if (ids.length) {
      legit = ids.every(covered) && cited(f);
      reason = `critères ${ids.join(', ')}`;
    } else {
      const source = f.replace(/\.(test|spec)(\.[cm]?[jt]sx?)$/, '$2');
      const sourceGone =
        deleted &&
        git('show', `${base}:${source}`) !== null &&
        git('show', `HEAD:${source}`) === null;
      legit = cited(f) && (!deleted || sourceGone);
      reason = deleted
        ? sourceGone
          ? 'code testé supprimé'
          : 'code testé toujours présent'
        : 'test sans identifiant';
    }
    const detail = deleted
      ? 'supprimé'
      : `${lost.length} test(s) disparu(s), assertions ${assertionsOf(baseSrc)} -> ${assertionsOf(newSrc)}`;
    const justification = legit
      ? `justifié (${reason}, entrée test au journal)`
      : `non justifié (${reason}${cited(f) ? '' : ', aucune entrée test au journal'}${ids.length && !ids.every(covered) ? ', critère non modifié par la spec du ticket' : ''})`;
    out.push({
      summary: `Test hérité ${f} : ${detail}, ${justification}.`,
      review: legit && ids.length ? 'non' : 'oui',
    });
    if (!legit && !deleted) replayFiles.push(f);
  }
  if (REPLAY) {
    for (const r of replay(base, replayFiles)) {
      if (r.status === 'error')
        out.push({ summary: `Rejeu des tests hérités impossible : ${r.detail}.`, review: 'non' });
      else if (r.status === 'fail')
        out.push({
          summary: `Rejeu : la version de main de ${r.file} échoue sur le nouveau code sans changement de spec qui le justifie. Régression probablement masquée en modifiant le test.`,
          review: 'oui',
        });
    }
  }
  return out;
}

function replay(base, files) {
  if (!files.length) return [];
  const dir = mkdtempSync(join(tmpdir(), 'tnr-replay-'));
  const run = (cmd, a) =>
    spawnSync(cmd, a, {
      cwd: dir,
      timeout: REPLAY_TIMEOUT_MS,
      stdio: 'ignore',
      env: { ...process.env, CI: 'true' },
    });
  try {
    if (!ok('worktree', 'add', '--detach', dir, 'HEAD'))
      return [{ status: 'error', detail: 'création du worktree' }];
    for (const f of files) writeFileSync(join(dir, f), git('show', `${base}:${f}`));
    if (run('pnpm', ['install', '--frozen-lockfile', '--prefer-offline']).status !== 0)
      return [{ status: 'error', detail: 'pnpm install dans le worktree' }];
    return files.map((f) => {
      const e2e = f.startsWith('e2e') || /\.spec\.[cm]?[jt]sx?$/.test(f);
      const res = e2e
        ? run('pnpm', ['exec', 'playwright', 'test', f])
        : run('pnpm', ['exec', 'vitest', 'run', f]);
      if (res.error)
        return {
          file: f,
          status: 'error',
          detail: `${f} : ${res.error.code || res.error.message}`,
        };
      return { file: f, status: res.status === 0 ? 'pass' : 'fail' };
    });
  } finally {
    git('worktree', 'remove', '--force', dir);
    rmSync(dir, { recursive: true, force: true });
  }
}

// Vérification indépendante de la tête de la branche, dans un worktree propre
function verify() {
  const since = arg('since');
  const session = String(arg('session', '?')).padStart(3, '0');
  const logFile = join(LOGS, `verify-${arg('phase', 'dev')}-${session}.log`);
  const result = { ok: false, failures: [], passed: [], coverage: null };
  const head = git('rev-parse', 'HEAD')?.trim();
  let scripts = {};
  try {
    scripts = JSON.parse(git('show', 'HEAD:package.json') || '{}').scripts || {};
  } catch {
    /* scripts absents */
  }
  const has = (n) => typeof scripts[n] === 'string';
  const dir = mkdtempSync(join(tmpdir(), 'verify-'));
  const logLine = (t) => {
    try {
      appendFileSync(logFile, `${t}\n`);
    } catch {
      /* facultatif */
    }
  };
  const run = (name, a) => {
    logLine(`\n=== ${name} : pnpm ${a.join(' ')}`);
    const env = { ...process.env, CI: 'true', NO_COLOR: '1' };
    delete env.FORCE_COLOR;
    const r = spawnSync('pnpm', a, {
      cwd: dir,
      timeout: VERIFY_TIMEOUT_MS,
      encoding: 'utf8',
      maxBuffer: 64 * 1024 * 1024,
      env,
    });
    const output = `${r.stdout || ''}${r.stderr || ''}`;
    logLine(output.split('\n').slice(-400).join('\n'));
    if (r.error)
      return `${name} : ${r.error.code === 'ETIMEDOUT' ? 'délai dépassé' : r.error.message}`;
    return r.status === 0 ? null : failureMessage(name, r.status, output);
  };
  try {
    if (!ok('worktree', 'add', '--detach', dir, 'HEAD')) {
      result.failures.push('création du worktree');
      return result;
    }
    logLine(`Vérification indépendante de ${head?.slice(0, 7)}, session ${session}`);
    const install = run('install', ['install', '--frozen-lockfile', '--prefer-offline']);
    if (install) result.failures.push(install);
    else {
      for (const s of [
        'lint',
        'typecheck',
        has('test:cov') ? 'test:cov' : null,
        'test:e2e',
        'ac:check',
      ].filter(Boolean)) {
        if (!has(s)) {
          result.failures.push(`${s} : script absent`);
          continue;
        }
        const e = run(s, ['run', s]);
        if (e) result.failures.push(e);
        else result.passed.push(s);
      }
    }
    const measured = result.passed.includes('test:cov') ? coverageOf(dir) : null;
    if (measured) {
      result.coverage = measured;
      const m = `lignes ${measured.lines} %, branches ${measured.branches} %`;
      if (measured.lines < COVERAGE_MIN || measured.branches < COVERAGE_MIN)
        result.failures.push(`couverture sous ${COVERAGE_MIN} % (${m})`);
      const declared = declaredCoverage(since);
      if (declared) {
        const gap = Math.max(
          declared.lines - measured.lines,
          declared.branches - measured.branches,
        );
        if (gap > COVERAGE_TOLERANCE)
          result.failures.push(
            `couverture mesurée (${m}) inférieure à la couverture déclarée dans ${declared.sha} (lignes ${declared.lines} %, branches ${declared.branches} %)`,
          );
      }
    }
  } finally {
    git('worktree', 'remove', '--force', dir);
    rmSync(dir, { recursive: true, force: true });
  }
  result.ok = result.failures.length === 0;
  return result;
}

function coverageOf(dir) {
  let best = null;
  const walk = (d, depth) => {
    if (depth > 4) return;
    for (const e of readdirSync(d, { withFileTypes: true })) {
      if (e.name === 'node_modules' || e.name === '.git') continue;
      const p = join(d, e.name);
      if (e.isDirectory()) walk(p, depth + 1);
      else if (e.name === 'coverage-summary.json') {
        const t = statSync(p).mtimeMs;
        if (!best || t > best.t) best = { p, t };
      }
    }
  };
  try {
    walk(dir, 0);
  } catch {
    return null;
  }
  if (!best) return null;
  try {
    const total = JSON.parse(readFileSync(best.p, 'utf8')).total;
    return { lines: Number(total.lines.pct), branches: Number(total.branches.pct) };
  } catch {
    return null;
  }
}

function declaredCoverage(since) {
  const log = git('log', '--format=%h%x1f%B%x1e', since ? `${since}..HEAD` : 'HEAD') || '';
  for (const rec of log.split('\x1e')) {
    const [sha, body = ''] = rec.trim().split('\x1f');
    const m = body.match(/^Coverage:\s*lines\s*([\d.]+)\s*%,\s*branches\s*([\d.]+)\s*%/m);
    if (m) return { sha, lines: Number(m[1]), branches: Number(m[2]) };
  }
  return null;
}

// Avancement : nombre d'étapes du plan et plus grand numéro d'étape commité depuis la base
function progress() {
  const ticket = arg('ticket');
  const base = arg('base');
  const plan = git('show', `HEAD:docs/tickets/${ticket}/plan.md`) || '';
  const planSteps = (plan.match(/^### Étape \d+ : /gm) || []).length;
  const log = git('log', '--format=%B%x1e', `${base}..HEAD`) || '';
  let lastStep = 0;
  for (const m of log.matchAll(/^Plan-Step:\s*(\d+)\/\d+/gm))
    lastStep = Math.max(lastStep, Number(m[1]));
  return { planSteps, lastStep };
}

const cmd = process.argv[2];
if (cmd === 'check') for (const e of check()) process.stdout.write(`${JSON.stringify(e)}\n`);
else if (cmd === 'verify') process.stdout.write(JSON.stringify(verify()));
else if (cmd === 'progress') process.stdout.write(JSON.stringify(progress()));
else {
  process.stderr.write('usage: checks.mjs check|verify|progress\n');
  process.exit(2);
}
