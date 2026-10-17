// Outils côté hôte du mode produit (appelés par mzk.sh) : journal, rapport, retours, Trello.
// Node 18+ sans dépendance. Usage : node lib.mjs <commande> [options]
// Les secrets Trello (TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD) sont lus dans l'environnement,
// jamais transmis à l'agent.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:net';

const MARK = '[mozaik]';
const TABLE_HEAD =
  '| Type | Éléments concernés | Décision et raison | Origine | À revoir |\n|---|---|---|---|---|';
export const LISTS = {
  inbox: 'Inbox',
  triage: 'Triage',
  spec: 'Spec',
  specReview: 'Spec review',
  design: 'Design',
  techReview: 'Tech review',
  dev: 'Dev',
  review: 'Review',
  done: 'Done',
  rejected: 'Rejeté',
};

const args = process.argv.slice(3);
const opt = (name, def = undefined) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
};
const need = (name) => {
  const v = opt(name);
  if (v === undefined) {
    process.stderr.write(`option --${name} manquante\n`);
    process.exit(2);
  }
  return v;
};
const read = (f) => (existsSync(f) ? readFileSync(f, 'utf8') : '');

// ---------- Texte ----------

// Mots vides retirés en fin de slug, pour qu'il ne se termine pas sur « le », « par »...
const SLUG_TRAILING_STOPWORDS = new Set(
  'a au aux de des du en et la le les par pour sur un une'.split(' '),
);

// Slug de branche : mots entiers jusqu'à 40 caractères, élisions (l', d') retirées
export function slug(title) {
  const words = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\b[a-z]['’]/g, '')
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const kept = [];
  for (const word of words) {
    if ([...kept, word].join('-').length > 40) break;
    kept.push(word);
  }
  if (!kept.length && words.length) kept.push(words[0].slice(0, 40));
  while (kept.length > 1 && SLUG_TRAILING_STOPWORDS.has(kept.at(-1))) kept.pop();
  return kept.join('-') || 'ticket';
}

// ---------- Journal ----------

// Bornes [début, fin[ de la section d'un ticket (« ## MZK-42 : ... ») en indices de lignes
function ticketSection(lines, ticket) {
  const start = lines.findIndex((l) => l.startsWith(`## ${ticket} :`) || l === `## ${ticket}`);
  if (start < 0) return null;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  return [start, end];
}

// Ouvre la sous-section d'une phase (et la section du ticket si elle n'existe pas)
export function journalOpen(text, o) {
  const lines = text.replace(/\s+$/, '').split('\n');
  let sec = ticketSection(lines, o.ticket);
  if (!sec) {
    lines.push(
      '',
      `## ${o.ticket} : ${o.title}`,
      '',
      `Carte : ${o.card || '(aucune)'} · Type : ${o.type} · Branche : \`${o.branch}\``,
    );
    sec = ticketSection(lines, o.ticket);
  }
  const block = ['', `### ${o.phase} : ${o.date}`, '', ...TABLE_HEAD.split('\n')];
  lines.splice(sec[1], 0, ...block);
  return `${lines.join('\n')}\n`;
}

// Ajoute une ligne au tableau de la dernière sous-section du ticket
export function journalRow(text, ticket, cells) {
  const lines = text.replace(/\s+$/, '').split('\n');
  const sec = ticketSection(lines, ticket);
  if (!sec) throw new Error(`section ${ticket} introuvable dans le journal`);
  let at = sec[1];
  while (at > sec[0] && !lines[at - 1].startsWith('|')) at--;
  lines.splice(at, 0, `| ${cells.map((c) => String(c).replace(/\|/g, '/')).join(' | ')} |`);
  return `${lines.join('\n')}\n`;
}

// Ajoute un texte libre à la fin de la section du ticket
export function journalAppend(text, ticket, block) {
  const lines = text.replace(/\s+$/, '').split('\n');
  const sec = ticketSection(lines, ticket);
  if (!sec) throw new Error(`section ${ticket} introuvable dans le journal`);
  let at = sec[1];
  while (at > sec[0] && lines[at - 1].trim() === '') at--;
  lines.splice(at, 0, '', ...block.trim().split('\n'));
  return `${lines.join('\n')}\n`;
}

// Ajoute la ligne « Fichiers modifiés » à la dernière sous-section du ticket
export function journalFiles(text, ticket, files) {
  const lines = text.replace(/\s+$/, '').split('\n');
  const sec = ticketSection(lines, ticket);
  if (!sec) throw new Error(`section ${ticket} introuvable dans le journal`);
  let at = sec[1];
  while (at > sec[0] && lines[at - 1].trim() === '') at--;
  const list = files.length ? files.join(', ') : 'aucun';
  lines.splice(at, 0, '', `Fichiers modifiés : ${list}`);
  return `${lines.join('\n')}\n`;
}

// Passe à « revu » les entrées « oui » des sous-sections données d'un ticket
export function journalValidate(text, ticket, phases) {
  const lines = text.split('\n');
  const sec = ticketSection(lines, ticket);
  if (!sec) return { text, count: 0 };
  let current = null,
    count = 0;
  for (let i = sec[0]; i < sec[1]; i++) {
    const h = /^### (.+?) : /.exec(lines[i]);
    if (h) current = h[1];
    if (current && phases.includes(current) && /^\|.*\|\s*oui\s*\|\s*$/.test(lines[i])) {
      lines[i] = lines[i].replace(/\|\s*oui\s*\|\s*$/, '| revu |');
      count++;
    }
  }
  return { text: lines.join('\n'), count };
}

// Texte de la dernière sous-section d'une phase pour un ticket
export function journalSubsection(text, ticket, phase) {
  const lines = text.split('\n');
  const sec = ticketSection(lines, ticket);
  if (!sec) return '';
  let start = -1;
  for (let i = sec[0]; i < sec[1]; i++) if (lines[i].startsWith(`### ${phase} : `)) start = i;
  if (start < 0) return '';
  let end = sec[1];
  for (let i = start + 1; i < sec[1]; i++)
    if (lines[i].startsWith('### ')) {
      end = i;
      break;
    }
  return lines.slice(start, end).join('\n').trim();
}

// ---------- Rapport ----------

function upsertH2(text, title, body) {
  const lines = text.replace(/\s+$/, '').split('\n');
  const start = lines.indexOf(`## ${title}`);
  const block = [`## ${title}`, '', ...body.trim().split('\n')];
  if (start < 0) return `${[...lines, '', ...block].join('\n')}\n`;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++)
    if (lines[i].startsWith('## ')) {
      end = i;
      break;
    }
  lines.splice(start, end - start, ...block, '');
  return `${lines
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/\s+$/, '')}\n`;
}

export function rapportRunner(text, sessionsTsv, checks) {
  const rows = sessionsTsv
    .trim()
    .split('\n')
    .slice(1)
    .filter(Boolean)
    .map((l) => l.split('\t'));
  const metrics = [
    '| Phase | Session | Modèle | Durée (s) | Tokens entrée / sortie / raisonnement / cache lu | Coût estimé | Vérification | Couverture vérifiée |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map(
      (r) =>
        `| ${r[0]} | ${r[1]} | ${r[2]} | ${r[3]} | ${r[5]} / ${r[6]} / ${r[7]} / ${r[8]} | ${r[9]} | ${r[10] || '—'} | ${r[11] || '—'} |`,
    ),
  ];
  let out = upsertH2(text, 'Métriques du runner', metrics.join('\n'));
  const ctl = checks.length
    ? [
        '| Phase | Session | Contrôle | À revoir |',
        '|---|---|---|---|',
        ...checks.map(
          (c) =>
            `| ${c.phase} | ${c.session} | ${String(c.summary).replace(/\|/g, '/')} | ${c.review} |`,
        ),
      ].join('\n')
    : 'Aucun écart constaté.';
  out = upsertH2(out, 'Contrôles du runner', ctl);
  return out;
}

// Bugs décrits par l'agent : « ### Bug : <titre> » puis « - Qualification : bloquant|secondaire »
export function bugsOf(text) {
  const lines = text.split('\n');
  const start = lines.indexOf('## Bugs décrits');
  if (start < 0) return [];
  const bugs = [];
  let cur = null;
  for (let i = start + 1; i < lines.length && !lines[i].startsWith('## '); i++) {
    const h = /^### Bug : (.+)$/.exec(lines[i]);
    if (h) {
      cur = { title: h[1].trim(), body: [], qualification: 'bloquant' };
      bugs.push(cur);
      continue;
    }
    if (!cur) continue;
    const q = /^- Qualification : (bloquant|secondaire)/i.exec(lines[i]);
    if (q) cur.qualification = q[1].toLowerCase();
    cur.body.push(lines[i]);
  }
  return bugs.map((b) => ({ ...b, body: b.body.join('\n').trim() }));
}

// ---------- Retours ----------

export function retoursAppend(text, ticket, title, phase, date, comments) {
  const head = text.trim() ? text.replace(/\s+$/, '') : `# Retours ${ticket} : ${title}`;
  const body = comments
    .map((c) =>
      c.text
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => (l.startsWith('- ') ? l : `- ${l}`))
        .join('\n'),
    )
    .join('\n');
  return `${head}\n\n## ${phase} : ${date}\n\n${body}\n`;
}

// ---------- Trello ----------

function trelloEnv() {
  const { TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD } = process.env;
  if (!TRELLO_KEY || !TRELLO_TOKEN || !TRELLO_BOARD)
    throw new Error('TRELLO_KEY, TRELLO_TOKEN ou TRELLO_BOARD absent');
  return { key: TRELLO_KEY, token: TRELLO_TOKEN, board: TRELLO_BOARD };
}
async function trello(method, path, params = {}) {
  const { key, token } = trelloEnv();
  const url = new URL(`https://api.trello.com/1${path}`);
  for (const [k, v] of Object.entries({ ...params, key, token })) url.searchParams.set(k, v);
  const res = await fetch(url, { method, headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`Trello ${method} ${path} : ${res.status} ${await res.text()}`);
  return res.json();
}
const shortOf = (ticket) => Number(String(ticket).replace(/^MZK-/, ''));
async function listsByName() {
  const lists = await trello('GET', `/boards/${trelloEnv().board}/lists`);
  return new Map(lists.map((l) => [l.name, l.id]));
}
export async function trelloCard(ticket) {
  const card = await trello('GET', `/boards/${trelloEnv().board}/cards/${shortOf(ticket)}`);
  const lists = await listsByName();
  const listName = [...lists].find(([, id]) => id === card.idList)?.[0] || '';
  return {
    id: card.id,
    idShort: card.idShort,
    name: card.name,
    desc: card.desc,
    url: card.shortUrl || card.url,
    list: listName,
  };
}
export async function trelloMove(ticket, listName) {
  const lists = await listsByName();
  if (!lists.has(listName)) throw new Error(`colonne Trello « ${listName} » introuvable`);
  const card = await trello('GET', `/boards/${trelloEnv().board}/cards/${shortOf(ticket)}`);
  await trello('PUT', `/cards/${card.id}`, { idList: lists.get(listName) });
}
export async function trelloComment(ticket, text) {
  const card = await trello('GET', `/boards/${trelloEnv().board}/cards/${shortOf(ticket)}`);
  await trello('POST', `/cards/${card.id}/actions/comments`, {
    text: text.startsWith(MARK) ? text : `${MARK} ${text}`,
  });
}
// Commentaires humains postérieurs au dernier commentaire du script, du plus ancien au plus récent
export async function trelloHumanComments(ticket) {
  const card = await trello('GET', `/boards/${trelloEnv().board}/cards/${shortOf(ticket)}`);
  const actions = await trello('GET', `/cards/${card.id}/actions`, {
    filter: 'commentCard',
    limit: '1000',
  });
  const out = [];
  for (const a of actions) {
    // du plus récent au plus ancien
    const text = a.data?.text || '';
    if (text.startsWith(MARK)) break;
    out.push({ date: a.date, author: a.memberCreator?.fullName || '', text });
  }
  return out.reverse();
}
export async function trelloCreate(listName, name, desc) {
  const lists = await listsByName();
  if (!lists.has(listName)) throw new Error(`colonne Trello « ${listName} » introuvable`);
  const card = await trello('POST', '/cards', {
    idList: lists.get(listName),
    name,
    desc: `${MARK} ${desc}`.slice(0, 16000),
  });
  return { idShort: card.idShort, url: card.shortUrl };
}

// ---------- CLI ----------

// Port TCP libre sur 127.0.0.1 (adresse publiée par le docker-compose.yml de l'application)
export function portFree(port) {
  return new Promise((resolve) => {
    const server = createServer();
    server.once('error', () => resolve(false));
    server.listen(Number(port), '127.0.0.1', () => server.close(() => resolve(true)));
  });
}

// Écarts entre les versions figées de l'image de l'agent (ARG du Dockerfile) et celles du projet
export function imageVersionDrift(dockerfile, packageJson) {
  const argOf = (name) => new RegExp(`^ARG ${name}=(\\S+)`, 'm').exec(dockerfile)?.[1];
  let pkg = {};
  try {
    pkg = JSON.parse(packageJson || '{}');
  } catch {
    return [];
  }
  const wanted = {
    PLAYWRIGHT_VERSION:
      pkg.devDependencies?.['@playwright/test'] ?? pkg.dependencies?.['@playwright/test'],
    PNPM_VERSION: /^pnpm@([^+]+)/.exec(pkg.packageManager || '')?.[1],
  };
  return Object.entries(wanted)
    .filter(
      ([name, version]) => version && argOf(name) && argOf(name) !== version.replace(/^[\^~]/, ''),
    )
    .map(
      ([name, version]) =>
        `${name} vaut ${argOf(name)} dans runner/Dockerfile, le projet utilise ${version}`,
    );
}

async function main() {
  const cmd = process.argv[2];
  const file = opt('file');
  switch (cmd) {
    case 'slug':
      process.stdout.write(slug(need('title')));
      break;
    case 'journal-open':
      writeFileSync(
        file,
        journalOpen(read(file), {
          ticket: need('ticket'),
          title: opt('title', ''),
          type: opt('type', ''),
          branch: opt('branch', ''),
          card: opt('card', ''),
          phase: need('phase'),
          date: need('date'),
        }),
      );
      break;
    case 'journal-files':
      writeFileSync(
        file,
        journalFiles(
          read(file),
          need('ticket'),
          (opt('files', '') || '').split('\n').filter(Boolean),
        ),
      );
      break;
    case 'journal-row':
      writeFileSync(file, journalRow(read(file), need('ticket'), need('cells').split('\t')));
      break;
    case 'journal-append':
      writeFileSync(file, journalAppend(read(file), need('ticket'), read(need('block-file'))));
      break;
    case 'rapport-section': {
      const lines = read(file).split('\n');
      const start = lines.indexOf(`## ${need('title')}`);
      if (start >= 0) {
        let end = lines.length;
        for (let i = start + 1; i < lines.length; i++)
          if (lines[i].startsWith('## ')) {
            end = i;
            break;
          }
        process.stdout.write(lines.slice(start, end).join('\n').trim());
      }
      break;
    }
    case 'journal-validate': {
      const r = journalValidate(read(file), need('ticket'), need('phases').split(','));
      writeFileSync(file, r.text);
      process.stdout.write(String(r.count));
      break;
    }
    case 'journal-subsection':
      process.stdout.write(journalSubsection(read(file), need('ticket'), need('phase')));
      break;
    case 'rapport-runner': {
      const checks = read(need('checks'))
        .split('\n')
        .filter(Boolean)
        .map((l) => JSON.parse(l));
      writeFileSync(
        file,
        rapportRunner(
          read(file) || `# Rapport : ${need('ticket')}\n`,
          read(need('sessions')),
          checks,
        ),
      );
      break;
    }
    case 'bugs':
      process.stdout.write(JSON.stringify(bugsOf(read(file))));
      break;
    case 'port-free':
      process.exit((await portFree(need('port'))) ? 0 : 1);
      break;
    case 'image-drift':
      for (const d of imageVersionDrift(read(need('dockerfile')), read(need('package'))))
        process.stdout.write(`${d}\n`);
      break;
    case 'retours-append': {
      const comments = JSON.parse(read(need('comments')) || '[]');
      writeFileSync(
        file,
        retoursAppend(
          read(file),
          need('ticket'),
          opt('title', ''),
          need('phase'),
          need('date'),
          comments,
        ),
      );
      break;
    }
    case 'trello-card':
      process.stdout.write(JSON.stringify(await trelloCard(need('ticket'))));
      break;
    case 'trello-move':
      await trelloMove(need('ticket'), need('list'));
      break;
    case 'trello-comment':
      await trelloComment(need('ticket'), read(need('text-file')));
      break;
    case 'trello-comments':
      process.stdout.write(JSON.stringify(await trelloHumanComments(need('ticket'))));
      break;
    case 'trello-create':
      process.stdout.write(
        JSON.stringify(await trelloCreate(need('list'), need('name'), read(need('desc-file')))),
      );
      break;
    default:
      process.stderr.write(
        'usage: node lib.mjs <slug|journal-open|journal-row|journal-append|rapport-section|journal-files|journal-validate|journal-subsection|rapport-runner|bugs|port-free|image-drift|retours-append|trello-card|trello-move|trello-comment|trello-comments|trello-create> [options]\n',
      );
      process.exit(2);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((e) => {
    process.stderr.write(`${e.message}\n`);
    process.exit(1);
  });
}
