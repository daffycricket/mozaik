# Backlog

Liste ordonnée de tout le travail. L'agent prend toujours le **premier ticket `todo` dont les dépendances sont `done`** (AGENTS.md §6). Les décisions et événements survenus pendant l'implémentation sont tracés dans [journal.md](journal.md).

- Statuts : `todo`, `in-progress`, `blocked` (impossible à terminer malgré les règles de repli ; résumé des tentatives dans la colonne Notes), `done`.
- Types : `story` (une story d'une feature, critères d'acceptance dans le fichier de la feature), `tech` (`T-NNN`), `bug` (`B-NNN`).
- Un ticket `tech` ou `bug` porte ses critères d'acceptance ici, dans sa section de détail.
- Les identifiants ne sont jamais réutilisés. Un ticket abandonné passe en `done` avec la note « abandonné : raison ».
- L'agent peut ajouter des tickets `tech` et `bug`, et les insérer à la position qu'il juge nécessaire ; chaque ajout est tracé dans le journal (`backlog`). Il peut réordonner les tickets si c'est nécessaire, en traçant la raison dans le journal.
- **L'agent n'ajoute jamais de story ni de fonctionnalité.** Un comportement nécessaire mais non spécifié se tranche dans la story existante concernée et se trace dans le journal (AGENTS.md §8).

## Tickets

| # | ID | Titre | Type | Dépend de | Statut | Notes |
|---|---|---|---|---|---|---|
| 1 | T-001 | Bootstrap du monorepo et de l'outillage | tech |  | done |  |
| 2 | T-002 | Harnais de test, couverture, rapports, traçabilité | tech | T-001 | done |  |
| 3 | F01-S1 | Créer un board et l'ouvrir | story | T-002 | done |  |
| 4 | T-003 | Socle collaboratif : document Yjs, provider, persistance, `window.__board` | tech | F01-S1 | done |  |
| 5 | T-004 | Harnais de mesure de la fluidité (F00) | tech | T-003 | done |  |
| 6 | T-006 | Design system et harnais de conformité aux maquettes | tech | T-003 | done |  |
| 7 | F10-S1 | Saisir son nom avant d'entrer dans un board | story | T-003, T-006 | done |  |
| 8 | F01-S2 | Lister les boards, naviguer, URL partagée | story | F10-S1, T-004, T-006 | done |  |
| 9 | F01-S5 | Board inexistant | story | T-003, T-006 | done |  |
| 10 | F01-S3 | Renommer un board | story | F01-S2 | done |  |
| 11 | F01-S4 | Supprimer un board | story | F01-S2 | done |  |
| 12 | F02-S1 | Se déplacer (pan) | story | T-004, T-006 | done |  |
| 13 | F02-S2 | Zoomer | story | F02-S1 | in-progress |  |
| 14 | F03-S1 | Créer un post-it | story | F02-S2 | todo |  |
| 15 | F09-S1 | Synchroniser les modifications | story | F03-S1 | todo |  |
| 16 | F09-S2 | Persister | story | F09-S1 | todo |  |
| 17 | T-005 | Lancement local avec Docker Compose | tech | F09-S2 | todo |  |
| 18 | F10-S2 | Voir où sont les autres (curseurs) | story | F09-S1 | todo |  |
| 19 | F03-S2 | Écrire dans un post-it | story | F03-S1 | todo |  |
| 20 | F07-S1 | Sélectionner | story | F03-S1 | todo |  |
| 21 | F03-S3 | Changer la couleur d'un post-it | story | F07-S1 | todo |  |
| 22 | F07-S2 | Déplacer | story | F07-S1 | todo |  |
| 23 | F07-S3 | Redimensionner | story | F07-S1 | todo |  |
| 24 | F07-S4 | Avancer et reculer dans le plan | story | F07-S1 | todo |  |
| 25 | F08-S1 | Supprimer des éléments | story | F07-S1 | todo |  |
| 26 | F08-S2 | Annuler et rétablir | story | F07-S2 | todo |  |
| 27 | F04-S1 | Dessiner une forme | story | F07-S1 | todo |  |
| 28 | F05-S1 | Créer et éditer un texte | story | F03-S2 | todo |  |
| 29 | F05-S2 | Couleur du texte | story | F05-S1, F07-S1 | todo |  |
| 30 | F06-S1 | Tracer une flèche | story | F07-S2 | todo |  |
| 31 | F06-S2 | Modifier une flèche | story | F06-S1 | todo |  |
| 32 | F08-S3 | Dupliquer, copier, coller | story | F06-S1, F05-S1 | todo |  |
| 33 | F02-S3 | Board de 300 éléments | story | F06-S1, F04-S1, F05-S1 | todo |  |

Note : l'ordre de la colonne `#` prime. Si les dépendances d'un ticket ne sont pas `done`, prendre le suivant éligible et le signaler dans Notes.

## Détail des tickets techniques

### T-001 : Bootstrap du monorepo et de l'outillage

Contexte : ADR-0002, ADR-0007, ADR-0009.

Critères d'acceptance :

- **T-001-AC1** : `pnpm install` à la racine installe `apps/web`, `apps/server`, `packages/model` (workspaces), avec `packageManager` fixé dans `package.json` et `engines.node` à `>=24`.
- **T-001-AC2** : `pnpm dev` démarre le serveur (`GET /api/health` → `200`) et le front (page affichant le nom de l'application).
- **T-001-AC3** : `pnpm lint` (Biome) et `pnpm typecheck` passent ; une erreur de type volontaire les fait échouer.
- **T-001-AC4** : hook `commit-msg` (via `simple-git-hooks` ou équivalent à licence permissive) qui, sur toutes les branches, refuse un message non conforme à `process/git.md` : Conventional Commits, `<TICKET-ID>#<n>` dans le sujet, trailers `Refs:` et `Plan-Step:`, et trailers `Tests:`, `Coverage:`, `Report:` sauf pour l'étape 0 (plan) et les reverts. Il accepte aussi le commit de bilan final `docs(journal): RUN#0 bilan` (AGENTS.md §6). Des tests unitaires du validateur couvrent les cas acceptés et refusés.
- **T-001-AC5** : un test unitaire trivial par paquet passe avec `pnpm test:unit`.
- **T-001-AC6** : la configuration TypeScript et Biome applique les contrôles de la section « Qualité automatisée » de `process/code.md` (hors couleurs, traitées par T-006) ; une violation volontaire de chacun fait échouer `pnpm lint` ou `pnpm typecheck`.

Note : ce ticket ne peut pas produire de rapport automatique avant T-002. Ses commits d'étape portent `Tests:` et `Coverage:` relevés manuellement dans la sortie Vitest, et `Report: n/a (T-002)`. Le plan `docs/plans/T-001.md` est écrit à la main. Pendant T-001, « `pnpm verify` vert » signifie : `pnpm lint`, `pnpm typecheck` et `pnpm test:unit` verts. Le hook accepte `Report: n/a` pour `T-001` uniquement ; cette exception est supprimée dans T-002.

### T-002 : Harnais de test, couverture, rapports, traçabilité

Contexte : ADR-0006, `process/testing.md`.

Critères d'acceptance :

- **T-002-AC1** : `pnpm test:int` démarre un serveur réel sur un port libre avec SQLite en mémoire ; un test d'intégration appelle `GET /api/health`.
- **T-002-AC2** : `pnpm test:e2e` lance l'application complète via `webServer` Playwright, avec `VITE_E2E=1` et une base SQLite temporaire, et un test vérifie le chargement de l'accueil. Les navigateurs Playwright s'installent automatiquement dans la version attendue par le projet (`pnpm exec playwright install chromium`, appelé par le script `test:e2e` s'ils sont absents).
- **T-002-AC3** : `pnpm test:cov` échoue si la couverture fusionnée est sous 80 % lignes ou branches (démontré par un test temporaire non couvert, puis retiré).
- **T-002-AC4** : `pnpm ac:check` lit les statuts dans `docs/backlog.md` et liste les critères sans test associé ; il est bloquant pour les tickets `in-progress` et `done`, informatif pour les autres.
- **T-002-AC5** : `pnpm report T-002 --step <n>` crée `docs/test-reports/T-002.md` s'il n'existe pas, y ajoute (ou remplace) la section « Étape <n> » au format de `process/testing.md`, et écrit `.git/TRAILERS`.
- **T-002-AC6** : `pnpm verify` enchaîne lint, typecheck, test:cov, test:e2e, ac:check et s'arrête au premier échec avec un code de sortie non nul.
- **T-002-AC7** : en environnement de test (`NODE_ENV=test`), le serveur expose `POST /api/test/seed` (création d'un board pré-rempli de N éléments) et `POST /api/test/reset` ; ces routes n'existent pas hors test (test d'intégration).
- **T-002-AC8** : l'exception du hook `commit-msg` pour T-001 est supprimée.

### T-003 : Socle collaboratif

Contexte : ADR-0004, ADR-0005, `architecture.md`.

Critères d'acceptance :

- **T-003-AC1** : `packages/model` expose `createBoardDoc()`, les types et schémas zod des éléments, et `createElement`, `updateElement`, `deleteElements` exécutés dans une transaction à origine locale ; couverture du paquet ≥ 90 %.
- **T-003-AC2** : le serveur Hocuspocus sur `/collab` charge et enregistre l'état Yjs dans SQLite ; refuse la connexion à un document dont le board n'existe pas (test d'intégration).
- **T-003-AC3** : la page `/b/:id` connecte un `HocuspocusProvider` et affiche le contenu du document.
- **T-003-AC4** : en mode `VITE_E2E`, `window.__board` expose `getElements`, `getViewport`, `worldToScreen`, `screenToWorld`, `getSelection`, `getPeers` ; un test e2e vérifie un board vide.
- **T-003-AC5** : un client connecté à un board reçoit la fermeture de sa connexion quand le board est supprimé (base de F01-S4-AC4).

### T-004 : Harnais de mesure de la fluidité

Contexte : [F00](features/F00-fluidite.md), ADR-0006.

Critères d'acceptance :

- **T-004-AC1** : un utilitaire e2e mesure, pendant un scénario, les intervalles entre images (`requestAnimationFrame`) et en extrait médiane et maximum (FL-2).
- **T-004-AC2** : un utilitaire e2e collecte les tâches longues (`PerformanceObserver`, type `longtask`) pendant un scénario (FL-3).
- **T-004-AC3** : un utilitaire e2e ajoute une latence configurable aux messages WebSocket dans les deux sens (`page.routeWebSocket`), sans modifier le serveur (FL-1, FL-4).
- **T-004-AC4** : un utilitaire e2e mesure le délai entre une action et son effet visible, côté local (FL-1) et chez un second utilisateur (FL-4), et compte les positions intermédiaires reçues.
- **T-004-AC5** : un projet Playwright `fluidity` enregistre une vidéo par test ; `pnpm report` ajoute au rapport un tableau des mesures FL obtenues (valeur mesurée et seuil) et les chemins des vidéos (FL-8).
- **T-004-AC6** : un premier test de fluidité sur un board vide (FL-7) passe ; les mesures de référence de la machine sont consignées dans le rapport T-004, et les seuils sont calibrés si nécessaire selon la règle de F00.

### T-006 : Design system et harnais de conformité aux maquettes

Contexte : ADR-0011, [design/](design/README.md), `process/testing.md` (« Conformité aux maquettes »).

Critères d'acceptance :

- **T-006-AC1** : shadcn/ui est initialisé dans `apps/web` (fichier `components.json`, primitives Base UI, couleur de base `neutral`, alias `@` vers `src`), avec Tailwind CSS v4 via `@tailwindcss/vite` et `lucide-react`. Seul le composant `button` est ajouté à ce stade ; les autres le seront par les stories qui en ont besoin.
- **T-006-AC2** : `apps/web/src/index.css` contient les variables du thème shadcn/ui sans modification et les jetons du projet de `design/charte.md` ; un module de `src/lib/` les expose au rendu Konva ; un test unitaire vérifie que chaque jeton de la charte est déclaré avec sa valeur.
- **T-006-AC3** : les utilitaires de mise en page décrits dans `process/testing.md` existent dans `e2e/support/` et sont couverts par un test qui les exerce sur une page de démonstration en mode test (cas qui passent et cas qui échouent).
- **T-006-AC4** : un projet Playwright `layout` s'exécute aux viewports 1280 × 800 et 1024 × 768 dans `pnpm test:e2e`.
- **T-006-AC5** : `pnpm ac:check` contrôle les règles `UI-*` de `design/ecrans.md`, rattachées à leur story, avec la même règle que les autres critères.
- **T-006-AC6** : en mode `VITE_E2E`, `window.__board.getOverlayBoxes()` renvoie la position à l'écran du cadre de sélection, des poignées et des curseurs distants.
- **T-006-AC7** : une vérification intégrée à `pnpm lint` refuse les couleurs en dur (`#xxx`, `rgb(`, `oklch(`) et les valeurs de couleur arbitraires Tailwind (`bg-[#…]`) dans `apps/web/src`, hors `index.css`, le module des jetons et la palette des éléments.

### T-005 : Lancement local avec Docker Compose

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

Note : les tests de AC1 à AC5 vivent dans `e2e-docker/`, hors de `pnpm test:e2e`. Si Docker n'est pas disponible dans l'environnement de l'agent, ils sont écrits et nommés (ils comptent pour `ac:check`) mais ne s'exécutent pas ; le rapport indique « Docker : non vérifié ». Le ticket peut passer `done` dans ces conditions.

## Bugs

| ID | Titre | Découvert dans | Statut | Notes |
|---|---|---|---|---|
| | | | | |

## Dette technique

| ID | Titre | Origine | Statut | Notes |
|---|---|---|---|---|
| | | | | |
