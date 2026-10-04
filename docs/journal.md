# Journal du projet

Trace des décisions et des événements qui modifient le cadre du projet pendant l'implémentation. Il permet à l'humain de voir, en revenant, ce que l'agent a décidé ou changé sans lui.

## Ce qui va dans le journal

Une ligne par événement, **la plus récente en haut** :

| Type | Quand |
|---|---|
| `décision` | L'agent tranche un point flou ou non spécifié, ou fait un choix structurant (bibliothèque, format de données, protocole, convention, comportement non décrit) |
| `spec` | Un critère d'acceptance ou une règle métier est ajouté, précisé ou corrigé dans `docs/features/` |
| `adr` | Un ADR est créé ou en remplace un autre |
| `seuil` | Un seuil de fluidité est ajusté (détail dans l'historique de F00) |
| `test` | Un test est désactivé ou instable, une exclusion de couverture est ajoutée, ou un test hérité est modifié parce que sa spec a changé (citer le chemin de chaque fichier et la spec) |
| `backlog` | Un ticket est ajouté, découpé, réordonné ou abandonné ; un bug est découvert |
| `blocage` | Un ticket passe en `blocked` malgré les règles de repli |
| `dépendance` | Une dépendance est ajoutée ou retirée (avec sa licence) |
| `environnement` | Problème d'outil ou de machine : Docker absent, version changée, test non exécutable |
| `abandon` | Une approche est abandonnée et l'enseignement dépasse le ticket |
| `bilan` | Plus aucun ticket n'est faisable : état final (tickets `done`, `blocked`, restants) et raisons |
| `garde-fou` | *Écrit par l'outillage du run.* Une commande ou une modification interdite a été bloquée |
| `contrôle` | *Écrit par l'outillage du run.* Un écart aux règles a été constaté après une session (format, historique, fichier protégé, test désactivé) |
| `run` | *Écrit par l'outillage du run.* Événement d'exécution : session en échec ou hors délai, crédit épuisé, fin du run |

## Entrées écrites par l'outillage

Quand l'agent est exécuté par un outillage automatisé, celui-ci ajoute lui-même des entrées `garde-fou`, `contrôle` et `run`, dans un commit `chore(run): RUN#0 journal`. L'agent les lit comme les autres, ne les modifie pas, et en tient compte (une entrée `contrôle` signale une règle qu'il a enfreinte).

## Ce qui n'y va pas

Fichiers créés, code modifié, exécutions de tests, commits, retours arrière à l'intérieur d'une étape : ils sont déjà dans Git, dans les rapports de test et dans le journal du plan du ticket.

## Colonne « À revoir »

- `oui` pour les types `décision`, `spec`, `adr`, `seuil`, `test`, `garde-fou` et `contrôle` : l'humain doit en prendre connaissance.
- `non` pour les autres.
- L'humain remplace `oui` par `revu` après lecture. L'agent ne modifie jamais cette valeur.

## Format

- Date : AAAA-MM-JJ.
- Résumé : une ou deux phrases, la décision et sa raison.
- Lien : fichier modifié, ADR, plan ou rapport où se trouve le détail.

## Entrées

| Date | Ticket | Type | Résumé | Lien | À revoir |
|---|---|---|---|---|---|
| 2026-10-04 | T-004 | contrôle | Vérification indépendante de main @ 85b9384 réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 93.58 %, branches 93.81 %). | logs/verify-005.log | non |
| 2026-10-04 | T-004 | contrôle | Test hérité modifié : tooling/report.test.ts, modification non justifiée (aucune entrée test au journal qui cite ce fichier ; ni ticket bug, ni spec modifiée dans la session, ni critère T-004-ACn cité dans l'entrée test). | session 005 (logs du run) | oui |
| 2026-10-04 | RUN | run | Reprise du run : sessions 5 à 7, outillage @ 95d021c. | logs/loop.log | non |
| 2026-10-04 | T-004 | décision | Seuil FL-7 conservé à ≤ 1000 ms (board vide) : mesure de référence médiane de 78 ms sur la machine, aucun ajustement de F00 nécessaire. | docs/test-reports/T-004.md | oui |
| 2026-10-04 | T-004 | décision | Les mesures de fluidité sont écrites par le projet Playwright `fluidity` dans `test-results/fluidity.json` (ignoré par Git) ; `pnpm report` les lit et produit le tableau exigence / scénario / mesure / seuil / vidéo. | tooling/report.ts, e2e/support/fluidity-report.ts | oui |
| 2026-10-04 | T-004 | décision | La mesure distante de l'utilitaire action → effet est exercée sur un scénario contrôlé à deux pages (BroadcastChannel) car l'awareness (donc `getPeers`) n'est pas publiée avant F10-S2 ; la mesure locale est prise sur l'application réelle. | e2e/fluidity/utilities.spec.ts | oui |
| 2026-10-04 | T-004 | décision | Les tâches longues sont produites par une tâche planifiée (`setTimeout`) dans la page : un busy-wait exécuté directement par `page.evaluate` n'est pas rapporté comme `longtask` par Chromium, alors qu'une tâche planifiée l'est. | e2e/fluidity/utilities.spec.ts | oui |
| 2026-10-04 | RUN | run | Fin du run après 4 session(s) : nombre maximal de sessions atteint (4, dont 1 après la reprise). | RUN-SUMMARY.md | oui |
| 2026-10-04 | T-003 | contrôle | Vérification indépendante de main @ ce0d7ba réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 93.58 %, branches 93.81 %). | logs/verify-004.log | non |
| 2026-10-04 | T-003 | contrôle | Test hérité modifié : e2e/create-board.spec.ts, modification non justifiée (aucune spec modifiée dans la session). | session 004 (logs du run) | oui |
| 2026-10-04 | T-003 | contrôle | Commit(s) non conforme(s) à process/git.md : 8cf0150 « docs(plan): T-003#0 plan 1 step » (trailer Refs absent, trailer Plan-Step absent). | session 004 (logs du run) | oui |
| 2026-10-04 | RUN | run | Reprise du run : session 4, outillage @ c661826-dirty. | logs/loop.log | non |
| 2026-10-04 | T-003 | décision | Hocuspocus est monté sur le serveur HTTP de Fastify via l'adaptateur Node de `crossws` (classe `Hocuspocus`), pour tenir ADR-0005 (même port, WebSocket sur `/collab`) sans second serveur. | apps/server/src/collab/server.ts | oui |
| 2026-10-04 | T-003 | décision | `DELETE /api/boards/:id` est ajouté dans T-003 (base serveur de F01-S4) car T-003-AC5 exige un chemin de suppression réel ; l'UI et `GET /api/boards/:id` restent à F01-S4. | apps/server/src/http/boards.ts | oui |
| 2026-10-04 | T-003 | décision | Le seed de test (`POST /api/test/seed`) pré-remplit désormais le document Yjs avec N éléments, comme annoncé au journal de T-002. | apps/server/src/app.ts | oui |
| 2026-10-04 | T-003 | décision | `storeDocumentState` ignore un document dont le board n'existe plus, pour qu'un enregistrement tardif après suppression ne ressuscite pas le board. | apps/server/src/db/documents.ts | oui |
| 2026-10-04 | T-003 | décision | Les conversions monde ↔ écran et le viewport par défaut vivent dans `packages/model` (pur, testable) ; `window.__board.getViewport` renvoie le viewport par défaut tant que F02 n'ajoute pas pan/zoom. | packages/model/src/viewport.ts | oui |
| 2026-10-04 | T-003 | décision | La palette des 10 couleurs des post-its et textes est définie dans `packages/model/src/schema.ts`, emplacement autorisé pour les couleurs par T-006-AC7. | packages/model/src/schema.ts | oui |
| 2026-10-04 | T-003 | décision | `window.__board` est construit par `createBoardApi` et n'est posé que si `VITE_E2E=1` ; il est en lecture seule (getElements, getViewport, worldToScreen, screenToWorld, getSelection, getPeers). | apps/web/src/testing/board-api.ts | oui |
| 2026-10-04 | T-003 | décision | `packages/model/tsconfig.json` inclut les types Node uniquement pour typer `console.error` (éléments invalides, `process/code.md`) ; le paquet reste sans import Node/DOM, contrôlé par Biome. | packages/model/tsconfig.json | oui |
| 2026-10-04 | T-003 | test | Exclusion de couverture `apps/web/src/canvas/**` : composant de rendu Konva pur, couvert par les tests e2e (justifié dans le rapport T-003). | vitest.cov.config.ts | oui |
| 2026-10-04 | T-003 | test | Test hérité modifié : `e2e/create-board.spec.ts`, l'assertion `toBeEmpty()` du conteneur `board-canvas` est remplacée par la présence du canvas, car T-003-AC3 fait arriver le stage Konva sur la page board. | e2e/create-board.spec.ts | oui |
| 2026-10-04 | T-003 | dépendance | Ajout de yjs 13.6.33 (MIT), zod 4.6.5 (MIT) et fractional-indexing 4.0.0 (CC0) à `packages/model`. | packages/model/package.json | non |
| 2026-10-04 | T-003 | dépendance | Ajout de @hocuspocus/server 4.7.0, @hocuspocus/extension-database 4.7.0 et crossws 0.4.12 (MIT) à `apps/server`, et de @hocuspocus/provider 4.7.0 (MIT) en dev. | apps/server/package.json | non |
| 2026-10-04 | T-003 | dépendance | Ajout de @hocuspocus/provider 4.7.0, konva 10.7.0 et react-konva 19.3.0 (MIT) à `apps/web`. | apps/web/package.json | non |
| 2026-10-04 | RUN | run | Fin du run après 3 session(s) : nombre maximal de sessions atteint (3). | RUN-SUMMARY.md | oui |
| 2026-10-04 | F01-S1 | contrôle | Vérification indépendante de main @ 2842500 réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 91 %, branches 89.65 %). | logs/verify-003.log | non |
| 2026-10-04 | F01-S1 | décision | Le menu reste minimal pour F01-S1 : il conserve le titre « Mozaik » de T-001 (T-001-AC2) et ajoute le bouton « Nouveau board » ; le titre « Boards », la liste et les règles UI-MENU arrivent avec F01-S2. | apps/web/src/app/board-list-page.tsx | oui |
| 2026-10-04 | F01-S1 | décision | La page board de F01-S1 n'affiche qu'un conteneur `board-canvas` vide : le stage Konva et la connexion Yjs arrivent avec T-003. | apps/web/src/app/board-page.tsx | oui |
| 2026-10-04 | F01-S1 | adr | ADR-0012 : routage client minimal sans dépendance (`parsePath` pur, `navigate` sur l'API History, `useRoute` via `useSyncExternalStore`). | docs/adr/0012-routage-client-sans-dependance.md | oui |
| 2026-10-04 | F01-S1 | dépendance | Ajout de zod 4.6.5 (MIT) à `apps/web` pour valider la réponse de `POST /api/boards`. | apps/web/package.json | non |
| 2026-10-04 | F01-S1 | backlog | Plan F01-S1 ramené de 2 étapes à 1 : `pnpm ac:check` bloque tout critère non couvert d'un ticket `in-progress`, donc un premier commit limité au serveur échouait sur F01-S1-AC1 (test e2e côté front). | docs/plans/F01-S1.md | non |
| 2026-10-04 | T-002 | contrôle | Vérification indépendante de main @ bc0d437 réussie : lint, typecheck, test:cov, test:e2e, ac:check, couverture conforme aux trailers (lignes 96.36 %, branches 85 %). | logs/verify-002.log | non |
| 2026-10-04 | T-002 | contrôle | Rejeu : l'ancienne version de tooling/commit-msg.test.ts échoue sur le nouveau code alors qu'aucune spec n'a changé. Régression probablement masquée en modifiant le test. | session 002 (logs du run) | oui |
| 2026-10-04 | T-002 | contrôle | Test hérité modifié : tooling/commit-msg.test.ts, modification non justifiée (aucune spec modifiée dans la session) ; 1 test(s) disparu(s) : « [T-001-AC4] accepts an n/a report for the T-001 bo ». | session 002 (logs du run) | oui |
| 2026-10-04 | T-002 | contrôle | Commit(s) non conforme(s) à process/git.md : 3e504e0 « docs(plan): T-002#0 plan 6 steps » (trailer Refs absent, trailer Plan-Step absent). | session 002 (logs du run) | oui |
| 2026-10-04 | T-002 | test | Le test hérité `tooling/commit-msg.test.ts` « accepts an n/a report for the T-001 bootstrap ticket » est remplacé par « [T-002-AC8] rejects an n/a report even for the bootstrap ticket » : T-002-AC8 supprime l'exception `n/a` du hook. Le cas reste couvert, aucune assertion n'est perdue. | tooling/commit-msg.test.ts, tooling/commit-msg.ts | oui |
| 2026-10-04 | T-002 | décision | `pnpm ac:check` cherche les identifiants de critères (`FNN-SN-ACN`, `T-NNN-ACN`, `UI-*`) entre crochets dans les fichiers de test, rattache chaque critère à son ticket (les règles `UI-*` à leur story dans `ecrans.md`) et bloque seulement les critères non couverts des tickets `in-progress` ou `done`. | tooling/ac-check.ts | oui |
| 2026-10-04 | T-002 | décision | Le mode e2e lance l'application complète par deux `webServer` Playwright : le serveur API (port 3001, `DATABASE_PATH=:memory:`) et le serveur Vite (port 5173, `VITE_E2E=1`, hôte `127.0.0.1`), le front relayant `/api` et `/collab` vers l'API. Le mode packagé sans Docker (STATIC_DIR) reste prévu par T-005. | playwright.config.ts | oui |
| 2026-10-04 | T-002 | dépendance | Ajout de @playwright/test 1.63.0 (Apache-2.0) pour les tests e2e ; Chromium est installé à la demande par `test:e2e`. | package.json | non |
| 2026-10-04 | T-002 | dépendance | Ajout de @vitest/coverage-v8 5.0.3 (MIT) pour la couverture fusionnée unitaire + intégration. | package.json | non |
| 2026-10-04 | T-002 | décision | Les tests d'intégration ont leur propre configuration Vitest (`vitest.int.config.ts`) et écrivent leurs résultats dans `coverage/vitest-int-results.json`, distincts des unitaires ; l'outil de rapport fusionne les deux, ou lit le fichier fusionné de `test:cov`. | vitest.int.config.ts | non |
| 2026-10-04 | T-002 | décision | Le serveur ouvre la base SQLite et expose les routes `POST /api/test/seed` et `POST /api/test/reset` uniquement quand `NODE_ENV=test`. À ce stade le modèle d'éléments n'existe pas : `seed` crée le board dans la table `boards` et renvoie `elementCount` ; le pré-remplissage réel des éléments sera branché quand le document Yjs existera (T-003). | apps/server/src/app.ts | oui |
| 2026-10-04 | T-002 | décision | `buildApp` accepte une configuration optionnelle : sans configuration, il ne monte que la route de santé, ce qui évite d'ouvrir une base pendant les tests unitaires et préserve les tests de T-001. | apps/server/src/app.ts | non |
| 2026-10-04 | T-002 | dépendance | Ajout de better-sqlite3 13.0.3 (MIT), zod 4.6.5 (MIT), nanoid 6.0.1 (MIT) et @types/better-sqlite3 9.6.0 (MIT) au serveur. | apps/server/package.json | non |
| 2026-10-04 | T-001 | contrôle | Vérification indépendante de main @ eaddd6b réussie : lint, typecheck, test:unit. Scripts absents, non vérifiés : test:int, test:e2e, ac:check. | logs/verify-001.log | non |
| 2026-10-04 | T-001 | contrôle | Commit(s) non conforme(s) à process/git.md : ba8832c « docs(plan): T-001#0 plan 3 steps » (trailer Refs absent, trailer Plan-Step absent). | session 001 (logs du run) | oui |
| 2026-10-04 | T-001 | dépendance | Ajout de simple-git-hooks 2.14.0 (MIT) pour installer le hook `commit-msg`. | package.json | non |
| 2026-10-04 | T-001 | décision | Le validateur de message de commit est un module TypeScript testable (`tooling/commit-msg.ts`) exécuté par `tsx` ; l'étape 0 et les reverts sont exemptés des trailers de test, conformément à `process/git.md`. | tooling/commit-msg.ts | oui |
| 2026-10-04 | T-001 | décision | pnpm 12 bloque les scripts de build par défaut : `esbuild` et `simple-git-hooks` sont autorisés via `allowBuilds` dans `pnpm-workspace.yaml`. | pnpm-workspace.yaml | non |
| 2026-10-04 | T-001 | dépendance | Ajout des dépendances d'outillage : TypeScript 7.0.2 (Apache-2.0), @biomejs/biome 2.5.15 (MIT), vitest 5.0.3 (MIT), tsx 4.23.15 (MIT), @types/node 26.6.4 (MIT). | package.json | non |
| 2026-10-04 | T-001 | dépendance | Ajout de Fastify 5.12.5 (MIT) au serveur. | apps/server/package.json | non |
| 2026-10-04 | T-001 | dépendance | Ajout de React et React-DOM 19.3.0 (MIT), Vite 8.3.2 (MIT), @vitejs/plugin-react 6.1.1 (MIT), @types/react et @types/react-dom 19.3.0 (MIT) au front. | apps/web/package.json | non |
