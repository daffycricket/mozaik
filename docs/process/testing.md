# Stratégie de test

Décision : [ADR-0006](../adr/0006-strategie-de-test.md).

## Trois niveaux, tous obligatoires

| Niveau | Outil | Périmètre | Emplacement |
|---|---|---|---|
| Unitaire | Vitest | Fonctions pures de `packages/model` (géométrie, opérations Yjs, validation), stores Zustand, hooks, utilitaires serveur | `**/*.test.ts` à côté du code |
| Intégration | Vitest | Serveur réel (Fastify + Hocuspocus) démarré sur un port libre avec SQLite en mémoire ; clients `HocuspocusProvider` réels ; API REST via `fetch` | `apps/server/test/**/*.int.test.ts` |
| End-to-end | Playwright (Chromium) | Application complète lancée par `webServer` Playwright, un ou plusieurs contextes navigateur | `e2e/**/*.spec.ts` |

Règle de répartition : un comportement se teste au niveau le plus bas possible. Chaque critère d'acceptance a **au moins un test e2e** s'il décrit un comportement visible par l'utilisateur, sinon un test d'intégration.

## Traçabilité critères d'acceptance → tests

- Chaque critère d'acceptance a un identifiant : `FNN-SN-ACN` dans `docs/features/`, `T-NNN-ACN` ou `B-NNN-ACN` dans `docs/exigences-techniques.md`, `UI-<ÉCRAN>-N` dans `docs/design/ecrans.md`.
- Le titre du test qui le couvre commence par cet identifiant entre crochets :

```ts
test('[F03-S1-AC2] creates a sticky note at the double-click position', async ({ page }) => { ... })
```

- `pnpm ac:check` extrait tous les identifiants déclarés (features, exigences techniques, règles `UI-*`), cherche chacun dans les titres de tests, et échoue en listant les critères non couverts. Il ne lit aucun statut : la documentation ne décrit que ce qui est livré sur `main`, ou ce que la branche du ticket doit livrer à la fin de la phase dev.
- Un critère supprimé de la spec disparaît du fichier : son identifiant n'est jamais réutilisé, et le test qui le portait est supprimé dans le même ticket.

## Tester un canvas en e2e

Konva dessine dans un `<canvas>` : le DOM ne contient pas les éléments du board. Pour que les tests e2e soient fiables :

- En mode test (variable `VITE_E2E=1`, positionnée par la config Playwright), l'application expose `window.__board` en lecture seule :
  - `getElements(): Element[]` : état courant du document Yjs, sérialisé ;
  - `getViewport(): { x, y, zoom }` ;
  - `worldToScreen(p)` / `screenToWorld(p)` : conversion de coordonnées ;
  - `getSelection(): string[]` ;
  - `getPeers(): Peer[]` : présence (awareness) ;
  - `getOverlayBoxes()` : position à l'écran du cadre de sélection, des poignées et des curseurs distants (règles `UI-*`).
- Les **actions** passent par la souris et le clavier réels (`page.mouse`, `page.keyboard`), aux coordonnées calculées via `worldToScreen`. On n'appelle jamais une fonction de mutation exposée pour simuler une action utilisateur.
- Les **assertions** portent sur `window.__board` (état) et sur le DOM pour les éléments HTML (barre d'outils, éditeur de texte en surimpression, liste des boards).
- Assertions asynchrones avec `expect.poll` ou `expect(...).toPass()`, jamais de `waitForTimeout` fixe.

## Tests de collaboration

- Deux (ou plus) `browser.newContext()` ouverts sur le même board, chacun avec un nom d'utilisateur distinct.
- Une action dans le contexte A est vérifiée dans le contexte B avec un délai maximal explicite (cf. exigences non fonctionnelles de chaque feature).
- La latence réseau se simule en interceptant le WebSocket avec `page.routeWebSocket` (utilitaire fourni par T-004).

## Tests de fluidité

Exigences et seuils : [F00](../features/F00-fluidite.md). Projet Playwright dédié `fluidity`, Chromium, `workers: 1`, vidéo activée. Les mesures se font dans la page (intervalles `requestAnimationFrame`, `PerformanceObserver` `longtask`, horodatage action → effet visible). Chaque mesure chiffrée est la médiane de 3 exécutions. Un seuil non atteint fait échouer le test. L'agent calibre les seuils lui-même, sans descendre sous les planchers de F00 : il met à jour la valeur dans F00 et trace le changement au journal.

## Conformité aux maquettes

Les règles `UI-*` de [design/ecrans.md](../design/ecrans.md) sont des critères d'acceptance rattachés à une story. Elles vérifient l'ergonomie et la structure des écrans, **pas le pixel** : aucune comparaison de captures d'écran.

- Projet Playwright dédié `layout`, exécuté aux deux viewports de référence (1280 × 800 et 1024 × 768).
- Chaque règle est couverte par un test dont le titre commence par son identifiant, ex. `[UI-BOARD-3]`.
- Les tests s'appuient sur des utilitaires de mise en page fournis par T-006, qui lisent les boîtes englobantes (`locator.boundingBox()`) et les styles calculés :
  - position relative : `expectLeftOf`, `expectAbove`, `expectInside`, `expectNoOverlap` ;
  - alignement : `expectCenteredH`, `expectCenteredV`, `expectAlignedLeft`, `expectAlignedRight` ;
  - distance au bord ou entre éléments, avec tolérance (4 px par défaut) ;
  - ordre visuel d'une liste d'éléments (`expectOrder`) ;
  - style issu du thème : `expectToken(locator, propriété, variable)` compare un style calculé à la valeur d'une variable CSS (thème shadcn/ui ou jeton de `charte.md`).
- Les éléments du canvas (cadre de sélection, poignées, curseurs distants) se vérifient via `window.__board`, qui expose leur position à l'écran.
- L'ordre de tabulation et les rôles ARIA (`banner`, `toolbar`, `dialog`, `alertdialog`, `list`) font partie des vérifications.

## Vérification de l'image Docker

`pnpm test:docker` (ADR-0010) utilise une configuration Playwright séparée, dans `e2e-docker/`. Ces tests ne font **pas** partie de `pnpm test:e2e` : leur absence d'exécution sans Docker ne fait jamais échouer la suite e2e.

Scénario :

1. construit l'image et démarre `docker compose` avec un projet et un volume dédiés au test, sur un port libre ;
2. attend que le healthcheck soit vert ;
3. exécute un test Playwright court contre l'application packagée : ouverture du menu, création d'un board, saisie du nom, création d'un post-it, ouverture de l'URL `/b/<id>` dans un second contexte ;
4. redémarre le conteneur et vérifie que le post-it est toujours là ;
5. arrête et supprime le projet de test et son volume, même en cas d'échec.

`pnpm verify` l'exécute si `docker info` répond. Sinon il affiche un avertissement et le rapport de test indique « Docker : non vérifié » ; ce n'est pas un échec.

`pnpm ac:check` cherche les identifiants de critères dans les titres de tests de `e2e/`, `e2e-docker/` et des tests Vitest.

Le **mode packagé sans Docker** est, lui, couvert par `pnpm test:e2e` : un test construit le front, démarre le serveur avec `STATIC_DIR` sur un port libre, et vérifie le menu, l'ouverture directe d'une URL `/b/<id>` et l'API sur le même port. Seule la construction de l'image reste propre à `test:docker`.

## Couverture

- Outil : `@vitest/coverage-v8`, rapport fusionné unitaire + intégration.
- **Seuil bloquant : 80 % lignes et 80 % branches**, global au monorepo. `pnpm test:cov` échoue en dessous.
- Objectif non bloquant : ≥ 90 % sur `packages/model`.
- Exclusions autorisées, listées explicitement dans la config Vitest avec un commentaire : points d'entrée (`main.tsx`, `index.ts` de démarrage serveur), composants de rendu Konva purs (couverts par l'e2e), fichiers de types. Toute nouvelle exclusion est justifiée dans le rapport du ticket.

## Tests de non-régression

Un **test hérité** est un test présent sur `main` au moment où la branche du ticket a été créée, donc écrit par un ticket précédent. L'ensemble des tests hérités constitue la suite de non-régression.

La référence est la liste des éléments modifiés par le ticket, dans les sous-sections Spec et Spec review de sa section du journal (types `story`, `critère`, `ui`), comparée à toute la branche et pas seulement à la session.

| Cas | Règle |
|---|---|
| Test lié à un critère modifié par le ticket | Modification légitime ; entrée `test` au journal qui cite le fichier et le critère |
| Test lié à un critère supprimé par le ticket | Suppression légitime ; entrée `test` au journal |
| Test lié à un critère que le ticket ne modifie pas | Interdit : un échec est une régression, on corrige le code. Toute modification est signalée et l'ancienne version du test est rejouée sur le nouveau code |
| Test sans identifiant de critère (unitaire, intégration), modifié | Entrée `test` au journal avec la raison, « À revoir : oui » |
| Test d'un code supprimé par le ticket | Suppression acceptée si le fichier source testé est supprimé sur la branche ; entrée `test`, « À revoir : oui » |
| Cas ajouté dans un fichier de test existant | Ce n'est pas une modification de test hérité |
| Ticket de type `bug` | Un test hérité qui vérifiait le comportement erroné peut être corrigé ; entrée `test` |

- Préférer ajouter un test plutôt que d'en affaiblir un : un test hérité modifié ne perd ni cas de test ni assertion, sauf si la spec l'impose.
- Un test hérité ne se déplace pas.

Quand l'agent est exécuté par l'outillage, ces règles sont vérifiées automatiquement après chaque session : les tests hérités modifiés ou supprimés sont inventoriés (cas de test disparus, assertions en baisse), confrontés aux changements de spec du ticket et au journal, et leur version de `main` est réexécutée sur le nouveau code. Tout écart est signalé dans le rapport.

## Stabilité

- Un test e2e instable (flaky) est un bug : l'agent le corrige dans le ticket, ou le décrit dans la section « Bugs décrits » du rapport (AGENTS.md §9). Il est interdit de le marquer `skip` pour avancer.
- Playwright : `retries: 0` en local. Un test qui ne passe qu'au retry n'est pas vert.
- Chaque test e2e crée son propre board (nom unique) : aucun état partagé entre tests.

## Vérification indépendante

Après chaque session de dev, de review ou de merge, l'outillage rejoue `lint`, `typecheck`, `test:cov` (à défaut `test:unit` et `test:int`), `test:e2e` et `ac:check` sur une copie propre de la tête de la branche du ticket (installation à partir du lockfile), et compare la couverture mesurée aux trailers `Coverage:` (tolérance 0,5 point, seuil 80 %). Un échec est transmis à la session suivante, qui le corrige sur la branche (AGENTS.md §9). Avant le merge, la même vérification est faite sur la branche rebasée. Conséquence : la branche doit rester verte sans rien d'autre que le dépôt, sans fichier non commité ni service lancé à la main.

## Rapport de test

Un fichier par ticket, `docs/tickets/<id>/rapport.md` ([gabarit](gabarits/rapport.md)), avec **une section par étape du plan**, la synthèse de l'agent et les métriques du runner. `pnpm report <id> --step <n>` crée le fichier si besoin et y ajoute (ou remplace) la section de l'étape n, à partir des sorties JSON de Vitest et Playwright, de `coverage-summary.json`, et du titre et des critères de l'étape lus dans `docs/tickets/<id>/plan.md`. La section est commitée avec l'étape (`process/git.md`).

```markdown
# Rapport : MZK-42

## Étape 1 : Dialogue de confirmation

- Date : 2026-10-03T14:12:00+02:00
- Branche : ticket/MZK-42-confirm-delete
- Commit parent : a1b2c3d
- Docker : vérifié | non vérifié

| Niveau | Passés | Échoués | Ignorés | Durée |
|---|---|---|---|---|
| Unitaire | 151 | 0 | 0 | 3.2 s |
| Intégration | 23 | 0 | 0 | 8.4 s |
| End-to-end | 21 | 0 | 0 | 44.0 s |

| Couverture | Lignes | Branches | Fonctions |
|---|---|---|---|
| Global | 86.9 % | 81.4 % | 88.7 % |
| packages/model | 94.1 % | 90.3 % | 96.0 % |

| Critère | Tests | Statut |
|---|---|---|
| F08-S1-AC6 | e2e/delete.spec.ts | passé |

Fluidité (si l'étape en mesure) : exigence, valeur médiane mesurée, seuil, chemin de la vidéo.

Remarques : exclusions ajoutées, tests modifiés et pourquoi, dette ouverte.
```

Il écrit aussi `.git/TRAILERS` avec les lignes `Tests:`, `Coverage:`, `Report:` à reprendre dans le message de commit de l'étape.

Les rapports bruts (HTML Playwright, lcov, JSON, vidéos) sont générés localement et **ignorés par Git**.
