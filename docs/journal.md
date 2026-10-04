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
