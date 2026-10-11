# Workflow Git

Décision : [ADR-0013](../adr/0013-workflow-git-mode-produit.md), qui remplace l'ADR-0007.

## Principes

1. **Une branche par ticket**, créée par le script de la phase spec, qui porte la spec, le plan et le code du ticket. `main` ne décrit que ce qui est livré.
2. **Le plan avant le code.** Le plan est écrit en phase design et validé par l'humain ; la phase dev l'exécute.
3. **Une étape du plan = un commit**, complet (code, tests, section de rapport, documentation) et vert.
4. **Conventional Commits** pour tous les messages, en anglais.
5. **Rebase puis merge commit** pour intégrer un ticket dans `main` : les commits d'étape restent dans l'historique, et `git log --first-parent main` affiche une ligne par ticket.

## Où vit l'état d'avancement

- Statut d'un ticket : **uniquement** sa colonne dans Trello.
- Avancement du développement : **uniquement** dans Git. Une étape est faite quand son commit existe sur la branche (`git log --oneline main..HEAD`).
- Les fichiers de la documentation et du dossier de ticket ne portent aucun statut.

## Branches

- Une branche par ticket : `ticket/MZK-<n>-<slug-court>`, créée depuis `main` par le script de la phase spec. Exemple : `ticket/MZK-42-confirm-delete`.
- L'agent ne crée pas de branche et ne change pas de branche ; il ne merge pas dans `main`.
- Le dépôt de travail de l'agent n'a pas de remote. L'agent n'ajoute jamais de remote et ne pousse jamais ; les scripts publient la branche.

## Commits

### Numérotation

Le sujet porte `MZK-<n>#<k>`, où `<k>` est le numéro du commit dans la branche du ticket, séquentiel, toutes phases confondues : par exemple `#1` pour la spec, `#2` pour le design, `#3` pour l'ouverture de la phase dev (script), `#4` et `#5` pour les deux étapes du dev (agent), `#6` pour les métriques du runner. Pour le connaître : `git log --oneline main..HEAD | wc -l`, plus un.

### Commits de phase (écrits par les scripts)

Les scripts commitent les documents des phases spec, spec review, design et tech review, l'ouverture des sous-sections du journal et les métriques du runner en dev et en review, sans trailers de test :

```
docs(spec): MZK-42#1 specify confirmation before multiple deletion

Refs: MZK-42
```

Scopes : `spec`, `spec-review`, `design`, `tech-review`, `dev`, `review`, `merge`. Ces commits sont écrits par l'identité `mozaik-runner` ; l'agent n'utilise jamais ces scopes avec le type `docs`.

### Commits d'étape (écrits par l'agent en dev, review et merge)

```
<type>(<scope>): MZK-<n>#<k> <description à l'impératif>

<corps : ce que fait l'étape, pourquoi>

Refs: MZK-<n>, <identifiants des critères couverts>
Plan-Step: <n>/<total>
Tests: unit 142/142, integration 23/23, e2e 18/18
Coverage: lines 86.2%, branches 81.0%
Report: docs/tickets/MZK-<n>/rapport.md (step <n>)
```

- `type` : `feat`, `fix`, `test`, `refactor`, `chore`, `docs`, `perf`, `build`. Il décrit la nature principale de l'étape.
- `scope` : `web`, `server`, `model`, `e2e`, `docs`, `tooling`, `docker`.
- Sujet ≤ 72 caractères.
- `Refs:` commence par l'identifiant du ticket, suivi des critères couverts par l'étape.
- `Plan-Step:` renvoie aux étapes de `plan.md`. Une étape ajoutée en cours de route prend le numéro suivant (`3/3` pour un plan de 2 étapes) ; une correction après la vérification indépendante ou après la review aussi.
- `pnpm report MZK-<n> --step <n>` produit les lignes `Tests:`, `Coverage:`, `Report:` dans `.git/TRAILERS`.

Exemple :

```
feat(web): MZK-42#4 ask for confirmation before deleting many elements

Adds the confirmation dialog from ten selected elements, with the number
of elements in the message.

Refs: MZK-42, F08-S1-AC2, F08-S1-AC6, UI-DEL-1
Plan-Step: 1/2
Tests: unit 151/151, integration 23/23, e2e 22/22
Coverage: lines 86.9%, branches 81.4%
Report: docs/tickets/MZK-42/rapport.md (step 1)
```

### Contenu obligatoire d'un commit d'étape

| Élément | Contenu |
|---|---|
| Code applicatif et technique | Le comportement de l'étape, la configuration et l'outillage qu'elle demande |
| Code de test | Tests unitaires, d'intégration et e2e de ce que l'étape ajoute ou modifie |
| Résultats de test | Section de l'étape dans `docs/tickets/<id>/rapport.md`, et trailers dans le message |
| Documentation | Documentation rendue inexacte par l'étape : architecture, ADR créé au dev, glossaire, composants, README |
| Journal | Entrées de la sous-section Dev (ou Review, Merge) de la section du ticket |

Avant chaque commit d'étape, `pnpm verify` passe intégralement. Chaque commit d'étape est donc vert.

### Contrôle

Le hook `commit-msg` (`tooling/commit-msg.ts`, exigence T-001-AC4) refuse tout message non conforme : Conventional Commits, `MZK-<n>#<k>` dans le sujet, `Refs:` commençant par l'identifiant du ticket ; trailers `Plan-Step:`, `Tests:`, `Coverage:` et `Report:` pour un commit d'étape ; `Refs:` seul pour un commit de phase des scripts (`docs(spec|spec-review|design|tech-review|dev|review|merge)`) et pour un revert. Les commits de merge écrits par Git sont acceptés.

## Revenir à l'étape précédente

- **L'étape en cours n'est pas encore commitée** : abandonner le travail en cours et repartir du dernier commit.

  ```bash
  git restore --staged --worktree . && git clean -fd
  ```

- **Une étape déjà commitée s'avère mauvaise** : l'annuler par un commit de revert, ce qui conserve la trace de l'essai.

  ```bash
  git revert --no-edit <sha-de-l-etape>
  ```

  Le message est retouché au format `revert(<scope>): MZK-<n>#<k> revert step <n>` avec `Refs: MZK-<n>`.

Dans les deux cas, l'agent trace au journal ce qui a été tenté et pourquoi c'est abandonné, puis refait l'étape autrement. Après 3 échecs sur la même étape, il applique les règles de repli d'AGENTS.md §13.

Si l'humain demande de repartir de zéro (`dev <id> --restart`), le script ramène la branche au commit de la dernière phase design ou tech review et le trace au journal.

## Intégration dans `main`

Faite par le script de merge, à la demande de l'humain, après la recette :

1. rebase de la branche du ticket sur `main` ; en cas de conflit, ou de vérification rouge après le rebase, un agent corrige (AGENTS.md §11) ;
2. vérification indépendante de la tête de la branche rebasée ; la branche n'est publiée (`--force-with-lease`) que si elle est verte ;
3. si l'agent a résolu un conflit ou corrigé du code, arrêt avant le merge : l'humain reteste la branche rebasée, puis relance le merge ;
4. merge commit sans fast-forward ni squash :

   ```bash
   git switch main
   git merge --no-ff ticket/MZK-42-confirm-delete
   ```

5. SHA du commit de merge noté dans la sous-section Merge du journal, entrées « À revoir » des phases Dev et Review passées à « revu », déploiement de `main` en recette.

Règle : **chaque merge commit de `main` est vert**. Seule exception : un merge décidé par l'humain alors que la vérification est rouge à cause d'un bug secondaire déjà connu (carte existante), tracé dans la sous-section Merge avec la référence de la carte.

## Interdits

- Commit d'étape sans `pnpm verify` vert.
- `--no-verify` pour contourner les hooks.
- Réécrire l'historique de `main` (`reset`, `rebase`, `push --force` sur `main`).
- Squash d'un ticket dans `main`.
- Commit fourre-tout qui couvre plusieurs étapes.
