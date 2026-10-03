# Workflow Git

Décision : [ADR-0007](../adr/0007-workflow-git.md).

## Principes

1. **Un plan avant chaque implémentation.** Avant d'écrire du code pour un ticket, l'agent écrit un plan numéroté dans `docs/plans/<TICKET-ID>.md` ([gabarit](../plans/_template.md)).
2. **Une étape du plan = un commit.** Le commit porte le numéro de l'étape.
3. **Chaque étape est complète et verte.** Elle contient tout ce qu'il faut pour être un point de retour sûr : code, tests, résultats de test, documentation.
4. **Conventional Commits** pour tous les messages.
5. **On peut toujours revenir à l'étape précédente.** Chaque commit d'étape est un état stable de référence.

## Où vit l'état d'avancement

- Statut d'un ticket : **uniquement** dans `docs/backlog.md`.
- Avancement d'un plan : **uniquement** dans Git. Une étape est faite quand son commit `<TICKET-ID>#<n>` existe.
- Les fichiers de fonctionnalités et de plans ne portent aucun statut.

## Branches

- Une branche par ticket : `<type>/<TICKET-ID>-<slug-court>`, créée depuis `main`.

| Type | Usage |
|---|---|
| `feat` | Story fonctionnelle (`F03-S1`) |
| `fix` | Bug (`B-004`) |
| `chore` | Outillage, configuration, technique (`T-002`) |
| `docs` | Documentation seule |
| `refactor` | Refactoring sans changement de comportement |

Exemples : `feat/F03-S1-create-sticky-note`, `chore/T-001-bootstrap-monorepo`.

- Le dépôt de travail n'a pas de remote : l'agent intègre lui-même sa branche dans `main` en local. Il n'ajoute jamais de remote et ne pousse jamais ; la publication éventuelle est assurée par l'outillage qui l'exécute.

## Le plan (étape 0)

Premier commit de la branche, avant tout code :

- crée `docs/plans/<TICKET-ID>.md` avec les étapes numérotées 1, 2, 3… ;
- passe le ticket en `in-progress` dans `docs/backlog.md`.

Message : `docs(plan): <TICKET-ID>#0 plan <n> steps`. C'est la seule étape sans trailers de test.

Une étape doit être assez petite pour être terminée et vérifiée en une fois (ordre de grandeur : un critère d'acceptance, ou une brique technique). Un ticket compte en général 2 à 6 étapes.

## Contenu obligatoire d'un commit d'étape

Chaque commit d'étape contient, pour cette étape :

| Élément | Contenu | Obligatoire |
|---|---|---|
| Code applicatif | Le comportement fonctionnel de l'étape (`apps/*`, `packages/model`) | Oui, sauf étape purement technique : « aucun » justifié dans le plan |
| Code technique | Configuration, outillage, scripts, utilitaires de test, Docker | Oui, sauf si l'étape n'en demande pas : « aucun » justifié dans le plan |
| Code de test | Tests unitaires, d'intégration et e2e de ce que l'étape ajoute ou modifie | Toujours |
| Résultats de test | Section de l'étape ajoutée à `docs/test-reports/<TICKET-ID>.md` par `pnpm report <TICKET-ID> --step <n>`, et trailers dans le message | Toujours |
| Documentation | Documentation impactée : architecture, ADR, glossaire, README | Toujours vérifiée ; mise à jour dès que l'étape la rend inexacte |
| Fichiers Markdown de suivi | `docs/journal.md` si l'étape a pris une décision, enrichi une spec, créé un ADR, ajusté un seuil ou désactivé un test ; `docs/plans/<TICKET-ID>.md` si le plan évolue ; `docs/backlog.md` à la dernière étape | Selon besoin |

Avant chaque commit d'étape, `pnpm verify` passe intégralement. Chaque commit est donc vert.

## Message de commit d'étape

Format [Conventional Commits](https://www.conventionalcommits.org/), en anglais :

```
<type>(<scope>): <TICKET-ID>#<n> <description à l'impératif>

<corps : ce que fait l'étape, pourquoi>

Refs: <TICKET-ID>
Plan-Step: <n>/<total>
Tests: unit 142/142, integration 23/23, e2e 18/18
Coverage: lines 86.2%, branches 81.0%
Report: docs/test-reports/<TICKET-ID>.md (step <n>)
```

- `type` : `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `perf`, `build`. Il décrit la nature principale de l'étape.
- `scope` : `web`, `server`, `model`, `e2e`, `docs`, `tooling`, `docker`.
- Sujet ≤ 72 caractères, numéro d'étape juste après les deux-points.

Exemple :

```
feat(web): F03-S1#2 create sticky note on toolbar click

Adds the sticky tool, creation at click position and selection of the
new note. Covers F03-S1-AC1 and F03-S1-AC4.

Refs: F03-S1
Plan-Step: 2/4
Tests: unit 151/151, integration 23/23, e2e 21/21
Coverage: lines 86.9%, branches 81.4%
Report: docs/test-reports/F03-S1.md (step 2)
```

`pnpm report <TICKET-ID> --step <n>` produit les lignes `Tests:`, `Coverage:`, `Report:` dans `.git/TRAILERS`.

Un hook `commit-msg` (installé par T-001) refuse tout commit dont le message ne respecte pas ce format : Conventional Commits, `<TICKET-ID>#<n>` dans le sujet, trailers `Refs:` et `Plan-Step:`, et trailers de test sauf pour l'étape 0. Identifiants acceptés : `FNN-SN`, `T-NNN`, `B-NNN`, et `RUN` pour les commits qui ne relèvent d'aucun ticket : le bilan final de l'agent (`docs(journal): RUN#0 bilan`) et les commits de l'outillage d'exécution (`RUN#0`).

## Revenir à l'étape précédente

L'agent se perd dans une étape (tests qui ne passent plus, approche qui ne mène nulle part) :

- **L'étape en cours n'est pas encore commitée** : il abandonne le travail en cours et repart du dernier commit d'étape.

  ```bash
  git restore --staged --worktree . && git clean -fd
  ```

- **Une étape déjà commitée sur la branche s'avère mauvaise** : il l'annule par un commit de revert, ce qui conserve la trace de l'essai.

  ```bash
  git revert --no-edit <sha-de-l-etape>
  ```

  Le message produit est retouché au format `revert(<scope>): <TICKET-ID>#<n> revert step <n>`, avec les trailers de test du nouvel état.

Dans les deux cas, il note dans le plan, section « Journal », ce qui a été tenté et pourquoi c'est abandonné (le journal du projet `docs/journal.md` ne reçoit une entrée `abandon` que si l'enseignement dépasse le ticket), puis il refait l'étape (même numéro, approche différente) ou découpe le plan autrement. Un plan modifié est commité avec la reprise de l'étape.

Après 3 échecs sur la même étape, il applique les règles de repli d'AGENTS.md §8 : approche plus simple, ou ticket `blocked` en dernier recours.

## Intégration dans `main`

Quand la dernière étape est commitée (rapport complet, ticket `done` dans le backlog) :

```bash
git switch main
git merge --ff-only <branche>     # rebase sur main d'abord si nécessaire
git branch -d <branche>
```

Pas de squash : les commits d'étape restent visibles dans l'historique de `main`. `git log --oneline main` montre ainsi chaque ticket découpé en étapes numérotées, chacune avec ses résultats de test.

## Interdits

- Commit d'étape sans `pnpm verify` vert.
- `--no-verify` pour contourner les hooks.
- Réécrire l'historique de `main` (`reset`, `rebase`, `push --force` sur `main`).
- Commit fourre-tout qui couvre plusieurs étapes, ou étape sans plan préalable.
