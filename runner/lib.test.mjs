// Tests des outils côté hôte du mode produit : node --test runner/lib.test.mjs
import assert from 'node:assert/strict';
import { createServer } from 'node:net';
import { test } from 'node:test';
import {
  bugsOf,
  imageVersionDrift,
  journalFiles,
  journalOpen,
  journalRow,
  journalSubsection,
  journalValidate,
  portFree,
  rapportRunner,
  retoursAppend,
  slug,
  trelloMarkdown,
} from './lib.mjs';

const base = '# Journal\n\n## v1 : run\n\n| a | b |\n';
const o = {
  ticket: 'MZK-42',
  title: 'Confirmer',
  type: 'change',
  branch: 'ticket/MZK-42-confirmer',
  card: 'https://trello.com/c/x',
  date: '2026-10-14',
};

test('slug ascii court', () => {
  assert.equal(
    slug('Confirmer avant une suppression multiple !'),
    'confirmer-avant-une-suppression-multiple',
  );
  assert.equal(slug('Éléments à côté'), 'elements-a-cote');
});

test('slug : mots entiers, élisions et mots vides finaux retirés', () => {
  assert.equal(slug('Recadrer la vue sur tout le contenu'), 'recadrer-la-vue-sur-tout-le-contenu');
  assert.equal(
    slug("Mesures FL-1 gonflées par l'attente des tests"),
    'mesures-fl-1-gonflees-par-attente',
  );
  assert.equal(slug('a'.repeat(50)), 'a'.repeat(40));
  assert.equal(slug('!!!'), 'ticket');
});

test('journal : ouverture de la section, des sous-sections, lignes et fichiers', () => {
  let j = journalOpen(base, { ...o, phase: 'Spec' });
  assert.match(
    j,
    /## MZK-42 : Confirmer\n\nCarte : https:\/\/trello.com\/c\/x · Type : change · Branche : `ticket\/MZK-42-confirmer`\n\n### Spec : 2026-10-14\n\n\| Type \|/,
  );
  j = j.replace(
    '|---|---|---|---|---|',
    '|---|---|---|---|---|\n| hypothèse | H1 | x | agent | oui |',
  );
  j = journalFiles(j, 'MZK-42', ['docs/features/F08.md']);
  j = journalOpen(j, { ...o, phase: 'Spec review' });
  j = journalRow(j, 'MZK-42', ['retour', 'Q1', 'réponse', 'humain', 'non']);
  assert.ok(j.indexOf('### Spec review') > j.indexOf('Fichiers modifiés : docs/features/F08.md'));
  assert.match(
    journalSubsection(j, 'MZK-42', 'Spec review'),
    /\| retour \| Q1 \| réponse \| humain \| non \|/,
  );
  const v = journalValidate(j, 'MZK-42', ['Spec']);
  assert.equal(v.count, 1);
  assert.match(v.text, /\| hypothèse \| H1 \| x \| agent \| revu \|/);
  assert.ok(j.startsWith('# Journal\n\n## v1 : run'));
});

test("journal : une section suivante n'est pas touchée", () => {
  let j = journalOpen(base, { ...o, phase: 'Spec' });
  j += '\n## MZK-43 : Autre\n\n### Spec : 2026-10-15\n\n| x | y | z | agent | oui |\n';
  j = journalOpen(j, { ...o, phase: 'Design' });
  assert.ok(j.indexOf('### Design') < j.indexOf('## MZK-43'));
  assert.equal(journalValidate(j, 'MZK-42', ['Spec']).count, 0);
});

test('rapport : métriques et contrôles insérés puis remplacés', () => {
  const tsv =
    'phase\tsession\tmodele\tduree_s\texit\tin\tout\treasoning\tcache_read\tcout\tverification\tcouverture\ndev\t001\tumans/x\t120\t0\t10\t2\t1\t100\t0.01\tverte\t90 / 83\n';
  let r = rapportRunner("# Rapport : MZK-42\n\n## Synthèse de l'agent\n\nok\n", tsv, []);
  assert.match(
    r,
    /## Métriques du runner\n\n\| Phase .*\n\|---.*\n\| dev \| 001 \| umans\/x \| 120 \| 10 \/ 2 \/ 1 \/ 100 \| 0.01 \| verte \| 90 \/ 83 \|/,
  );
  assert.match(r, /## Contrôles du runner\n\nAucun écart constaté\./);
  r = rapportRunner(r, tsv, [{ phase: 'dev', session: '001', summary: 'a | b', review: 'oui' }]);
  assert.equal((r.match(/## Métriques du runner/g) || []).length, 1);
  assert.match(r, /\| dev \| 001 \| a \/ b \| oui \|/);
  assert.ok(r.indexOf("## Synthèse de l'agent") < r.indexOf('## Métriques du runner'));
});

test('rapport : bugs décrits', () => {
  const r =
    '# R\n\n## Bugs décrits\n\n### Bug : Pan instable\n\n- Qualification : secondaire\n- Reproduction : x\n\n### Bug : Crash\n\n- Qualification : bloquant\n\n## Métriques du runner\n';
  const b = bugsOf(r);
  assert.equal(b.length, 2);
  assert.deepEqual(
    b.map((x) => [x.title, x.qualification]),
    [
      ['Pan instable', 'secondaire'],
      ['Crash', 'bloquant'],
    ],
  );
  assert.match(b[0].body, /Reproduction : x/);
});

test('retours : section ajoutée avec une remarque par ligne', () => {
  const r = retoursAppend('', 'MZK-42', 'Confirmer', 'Spec review', '2026-10-14', [
    { text: '[spec] Q1 : oui\n\n- [impl] focus' },
  ]);
  assert.equal(
    r,
    '# Retours MZK-42 : Confirmer\n\n## Spec review : 2026-10-14\n\n- [spec] Q1 : oui\n- [impl] focus\n',
  );
});

test('port libre puis occupé', async () => {
  const server = createServer();
  await new Promise((r) => server.listen(0, '127.0.0.1', r));
  const { port } = server.address();
  assert.equal(await portFree(port), false);
  await new Promise((r) => server.close(r));
  assert.equal(await portFree(port), true);
});

test('versions de l’image : écarts avec le projet', () => {
  const dockerfile =
    'ARG NODE_IMAGE=node:24\nARG PLAYWRIGHT_VERSION=1.63.0\nARG PNPM_VERSION=12.8.1\n';
  const same = JSON.stringify({
    packageManager: 'pnpm@12.8.1',
    devDependencies: { '@playwright/test': '1.63.0' },
  });
  assert.deepEqual(imageVersionDrift(dockerfile, same), []);
  const bumped = JSON.stringify({
    packageManager: 'pnpm@12.9.0+sha512.abc',
    devDependencies: { '@playwright/test': '^1.64.0' },
  });
  assert.deepEqual(imageVersionDrift(dockerfile, bumped), [
    'PLAYWRIGHT_VERSION vaut 1.63.0 dans runner/Dockerfile, le projet utilise ^1.64.0',
    'PNPM_VERSION vaut 12.8.1 dans runner/Dockerfile, le projet utilise 12.9.0',
  ]);
  assert.deepEqual(imageVersionDrift(dockerfile, ''), []);
});

test('trello : tableau du journal en liste, reste du texte inchangé', () => {
  const md = [
    '[mozaik] Phase Spec terminée.',
    '',
    '### Spec : 2026-10-17',
    '',
    '| Type | Éléments concernés | Décision et raison | Origine | À revoir |',
    '|---|---|---|---|---|',
    '| critère | F02-S4-AC5 | Ajouté : un clic recadre | humain | non |',
    '| ui | UI-BOARD-13 | Ajoutée | agent | oui |',
    '',
    'Fichiers modifiés : a.md',
  ].join('\n');
  assert.equal(
    trelloMarkdown(md),
    [
      '[mozaik] Phase Spec terminée.',
      '',
      '### Spec : 2026-10-17',
      '',
      '- **critère** F02-S4-AC5 : Ajouté : un clic recadre (humain)',
      '- **ui** UI-BOARD-13 : Ajoutée (agent, à revoir)',
      '',
      'Fichiers modifiés : a.md',
    ].join('\n'),
  );
});

test('trello : autre tableau en liste, cellules vides ignorées', () => {
  const md = '| Étape | Commit | Résumé |\n|---|---|---|\n| 1 | MZK-3#5 | Bouton |\n| 2 | — | |';
  assert.equal(trelloMarkdown(md), '- **1** ; Commit : MZK-3#5 ; Résumé : Bouton\n- **2**');
});
