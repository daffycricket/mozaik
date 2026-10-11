// Tests des outils côté hôte du mode produit : node --test runner/produit/lib.test.mjs
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  bugsOf,
  journalFiles,
  journalOpen,
  journalRow,
  journalSubsection,
  journalValidate,
  rapportRunner,
  retoursAppend,
  slug,
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
