# Exigences techniques

Exigences techniques et critères de non-régression de Mozaik, avec leurs identifiants. Elles complètent les critères des features ([features/](features/README.md)) et les règles `UI-*` ([design/ecrans.md](design/ecrans.md)).

- Chaque critère (`T-NNN-ACn`, `B-NNN-ACn`) est couvert par au moins un test qui porte son identifiant dans son titre ; `pnpm ac:check` le vérifie.
- Les groupes `T-001` à `T-006` et `B-001` à `B-003` proviennent de la v1 (tag `v1.0`). Un ticket `tech` ou `bug` qui ajoute une exigence durable crée le groupe suivant (`T-007`, `B-004`...) en phase spec. Un identifiant n'est jamais réutilisé.
- Ce fichier ne contient aucun historique : les modifications sont tracées dans [journal.md](journal.md).

## T-001 : Bootstrap du monorepo et de l'outillage

Contexte : ADR-0002, ADR-0007, ADR-0009.

Critères d'acceptance :

- **T-001-AC1** : `pnpm install` à la racine installe `apps/web`, `apps/server`, `packages/model` (workspaces), avec `packageManager` fixé dans `package.json` et `engines.node` à `>=24`.
- **T-001-AC2** : `pnpm dev` démarre le serveur (`GET /api/health` → `200`) et le front (page affichant le nom de l'application).
- **T-001-AC3** : `pnpm lint` (Biome) et `pnpm typecheck` passent ; une erreur de type volontaire les fait échouer.
- **T-001-AC4** : hook `commit-msg` (via `simple-git-hooks` ou équivalent à licence permissive) qui, sur toutes les branches, refuse un message non conforme à `process/git.md` : Conventional Commits et `MZK-<n>#<k>` dans le sujet ; trailer `Refs:` commençant par l'identifiant du ticket ; trailers `Plan-Step:`, `Tests:`, `Coverage:` et `Report:` pour un commit d'étape de développement ; `Refs:` seul pour un commit de phase (`docs(spec)`, `docs(spec-review)`, `docs(design)`, `docs(tech-review)`) et pour un revert. Les commits de merge écrits par Git sont acceptés. Des tests unitaires du validateur couvrent les cas acceptés et refusés.
- **T-001-AC5** : un test unitaire trivial par paquet passe avec `pnpm test:unit`.
- **T-001-AC6** : la configuration TypeScript et Biome applique les contrôles de la section « Qualité automatisée » de `process/code.md` (hors couleurs, traitées par T-006) ; une violation volontaire de chacun fait échouer `pnpm lint` ou `pnpm typecheck`.

## T-002 : Harnais de test, couverture, rapports, traçabilité

Contexte : ADR-0006, `process/testing.md`.

Critères d'acceptance :

- **T-002-AC1** : `pnpm test:int` démarre un serveur réel sur un port libre avec SQLite en mémoire ; un test d'intégration appelle `GET /api/health`.
- **T-002-AC2** : `pnpm test:e2e` lance l'application complète via `webServer` Playwright, avec `VITE_E2E=1` et une base SQLite temporaire, et un test vérifie le chargement de l'accueil. Les navigateurs Playwright s'installent automatiquement dans la version attendue par le projet (`pnpm exec playwright install chromium`, appelé par le script `test:e2e` s'ils sont absents).
- **T-002-AC3** : `pnpm test:cov` échoue si la couverture fusionnée est sous 80 % lignes ou branches (démontré par un test temporaire non couvert, puis retiré).
- **T-002-AC4** : `pnpm ac:check` liste les critères déclarés sans test associé (critères des features, règles `UI-*` de `design/ecrans.md`, critères de ce fichier) et échoue s'il en reste un.
- **T-002-AC5** : `pnpm report <MZK-ID> --step <n>` crée `docs/tickets/<MZK-ID>/rapport.md` s'il n'existe pas, y ajoute (ou remplace) la section « Étape <n> » au format de `process/testing.md`, avec le titre de l'étape et les critères lus dans `docs/tickets/<MZK-ID>/plan.md`, et écrit `.git/TRAILERS`.
- **T-002-AC6** : `pnpm verify` enchaîne lint, typecheck, test:cov, test:e2e, ac:check et s'arrête au premier échec avec un code de sortie non nul.
- **T-002-AC7** : en environnement de test (`NODE_ENV=test`), le serveur expose `POST /api/test/seed` (création d'un board pré-rempli de N éléments) et `POST /api/test/reset` ; ces routes n'existent pas hors test (test d'intégration).
- **T-002-AC8** : le hook `commit-msg` refuse un trailer `Report: n/a`.

## T-003 : Socle collaboratif

Contexte : ADR-0004, ADR-0005, `architecture.md`.

Critères d'acceptance :

- **T-003-AC1** : `packages/model` expose `createBoardDoc()`, les types et schémas zod des éléments, et `createElement`, `updateElement`, `deleteElements` exécutés dans une transaction à origine locale ; couverture du paquet ≥ 90 %.
- **T-003-AC2** : le serveur Hocuspocus sur `/collab` charge et enregistre l'état Yjs dans SQLite ; refuse la connexion à un document dont le board n'existe pas (test d'intégration).
- **T-003-AC3** : la page `/b/:id` connecte un `HocuspocusProvider` et affiche le contenu du document.
- **T-003-AC4** : en mode `VITE_E2E`, `window.__board` expose `getElements`, `getViewport`, `worldToScreen`, `screenToWorld`, `getSelection`, `getPeers` ; un test e2e vérifie un board vide.
- **T-003-AC5** : un client connecté à un board reçoit la fermeture de sa connexion quand le board est supprimé (base de F01-S4-AC4).

## T-004 : Harnais de mesure de la fluidité

Contexte : [F00](features/F00-fluidite.md), ADR-0006.

Critères d'acceptance :

- **T-004-AC1** : un utilitaire e2e mesure, pendant un scénario, les intervalles entre images (`requestAnimationFrame`) et en extrait médiane et maximum (FL-2).
- **T-004-AC2** : un utilitaire e2e collecte les tâches longues (`PerformanceObserver`, type `longtask`) pendant un scénario (FL-3).
- **T-004-AC3** : un utilitaire e2e ajoute une latence configurable aux messages WebSocket dans les deux sens (`page.routeWebSocket`), sans modifier le serveur (FL-1, FL-4).
- **T-004-AC4** : un utilitaire e2e mesure le délai entre une action et son effet visible, côté local (FL-1) et chez un second utilisateur (FL-4), et compte les positions intermédiaires reçues.
- **T-004-AC5** : un projet Playwright `fluidity` enregistre une vidéo par test ; `pnpm report` ajoute au rapport un tableau des mesures FL obtenues (valeur mesurée et seuil) et les chemins des vidéos (FL-8).
- **T-004-AC6** : un premier test de fluidité sur un board vide (FL-7) passe ; les mesures de référence de la machine sont consignées dans le rapport, et les seuils sont calibrés si nécessaire selon la règle de F00.

## T-006 : Design system et harnais de conformité aux maquettes

Contexte : ADR-0011, [design/](design/README.md), `process/testing.md` (« Conformité aux maquettes »).

Critères d'acceptance :

- **T-006-AC1** : shadcn/ui est initialisé dans `apps/web` (fichier `components.json`, primitives Base UI, couleur de base `neutral`, alias `@` vers `src`), avec Tailwind CSS v4 via `@tailwindcss/vite` et `lucide-react`. Seul le composant `button` est ajouté à ce stade ; les autres le seront par les stories qui en ont besoin.
- **T-006-AC2** : `apps/web/src/index.css` contient les variables du thème shadcn/ui sans modification et les jetons du projet de `design/charte.md` ; un module de `src/lib/` les expose au rendu Konva ; un test unitaire vérifie que chaque jeton de la charte est déclaré avec sa valeur.
- **T-006-AC3** : les utilitaires de mise en page décrits dans `process/testing.md` existent dans `e2e/support/` et sont couverts par un test qui les exerce sur une page de démonstration en mode test (cas qui passent et cas qui échouent).
- **T-006-AC4** : un projet Playwright `layout` s'exécute aux viewports 1280 × 800 et 1024 × 768 dans `pnpm test:e2e`.
- **T-006-AC5** : `pnpm ac:check` contrôle les règles `UI-*` de `design/ecrans.md`, rattachées à leur story, avec la même règle que les autres critères.
- **T-006-AC6** : en mode `VITE_E2E`, `window.__board.getOverlayBoxes()` renvoie la position à l'écran du cadre de sélection, des poignées et des curseurs distants.
- **T-006-AC7** : une vérification intégrée à `pnpm lint` refuse les couleurs en dur (`#xxx`, `rgb(`, `oklch(`) et les valeurs de couleur arbitraires Tailwind (`bg-[#…]`) dans `apps/web/src`, hors `index.css`, le module des jetons et la palette des éléments.

## T-005 : Lancement local avec Docker Compose

Contexte : ADR-0010.

Critères d'acceptance :

- **T-005-AC1** : `docker compose up --build` à la racine construit l'image et l'application répond sur http://localhost:8080 (menu des boards), healthcheck vert.
- **T-005-AC2** : l'URL `/b/<id>` ouverte directement dans le navigateur affiche le board (routage côté client servi par le serveur).
- **T-005-AC3** : les données survivent à `docker compose down` puis `up` (volume `board-data`).
- **T-005-AC4** : le port n'est publié que sur `127.0.0.1`.
- **T-005-AC5** : `pnpm test:docker` exécute le scénario décrit dans `process/testing.md` et nettoie son projet et son volume, y compris en cas d'échec.
- **T-005-AC6** : `pnpm verify` lance `test:docker` si Docker est disponible, sinon affiche un avertissement sans échouer ; `pnpm report` indique dans le rapport si l'image a été vérifiée.
- **T-005-AC7** : `README.md` décrit le lancement avec Docker, conforme à ce qui est livré.
- **T-005-AC8** : sans Docker, un test de `pnpm test:e2e` construit le front, démarre le serveur avec `STATIC_DIR` sur un port libre, et vérifie que le menu s'affiche, qu'une URL `/b/<id>` ouverte directement affiche le board, et que l'API répond sur le même port.

Note : les tests de AC1 à AC5 vivent dans `e2e-docker/`, hors de `pnpm test:e2e`. Si Docker n'est pas disponible dans l'environnement de l'agent, ils sont écrits et nommés (ils comptent pour `ac:check`) mais ne s'exécutent pas ; le rapport indique « Docker : non vérifié ».

## B-001 : Mesure FL-2 du pan instable sous charge

Contexte : `e2e/fluidity/board-pan.spec.ts`, exigence FL-2 (F00).

Critères d'acceptance :

- **B-001-AC1** : `pnpm test:e2e` complet enchaîné plusieurs fois de suite ne fait plus échouer F02-S1-AC4, sans abaisser les seuils de F00 ni marquer le test `skip`.

## B-002 : Mesure FL-2 du zoom instable sous charge

Contexte : `e2e/fluidity/board-zoom.spec.ts`, exigence FL-2 (F00).

Critères d'acceptance :

- **B-002-AC1** : `pnpm test:e2e` complet enchaîné plusieurs fois de suite ne fait plus échouer F02-S2-AC4, sans abaisser les seuils de F00 ni marquer le test `skip`.

## B-003 : Redimensionnement : annulation partielle sous charge

Contexte : `e2e/fluidity/board-resize.spec.ts` (ligne 142, `[F07-S3-AC4]`), `packages/model/src/history.ts`, `apps/web/src/canvas/use-select.ts`, F07-S3-AC4, F08-S2-AC1.

Cause : un geste de glisser écrit dans Yjs plusieurs fois (au plus toutes les 50 ms) ; le `Y.UndoManager` fusionne ces écritures en une entrée tant qu'elles sont à moins de `captureTimeout` (500 ms). Un blocage du fil principal de plus de 500 ms entre deux écritures scinde le geste, et un seul `Ctrl+Z` n'annule que la dernière partie.

Critères d'acceptance :

- **B-003-AC1** : un geste de glisser (déplacement, redimensionnement, glisser d'extrémité de flèche) reste une seule entrée d'annulation même si le fil principal se bloque plus de 500 ms entre deux écritures intermédiaires ; `e2e/fluidity/board-resize.spec.ts` enchaîné plusieurs fois de suite ne fait plus échouer sa vérification d'annulation (ligne 142), sans abaisser les seuils de F00 ni marquer le test `skip`.
