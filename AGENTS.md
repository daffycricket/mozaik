# AGENTS.md

Point d'entrée pour tout agent de développement (OpenCode, Codex, Claude Code, Cursor...).
Lis ce fichier en entier avant toute action. Il est court par construction : le détail est dans `docs/`.

## 1. Le projet en une phrase

Une application open source de tableau blanc collaboratif de type Miro : canvas infini, post-its, formes, textes, flèches, édition simultanée par plusieurs utilisateurs en temps réel, avec une expérience fluide. Cible actuelle : exécution locale uniquement (pas de déploiement).

## 2. Carte de la documentation

| Besoin | Fichier |
|---|---|
| Vision, périmètre MVP, hors périmètre | `docs/vision.md` |
| Architecture, modules, modèle de données, flux | `docs/architecture.md` |
| Décisions d'architecture (ADR) | `docs/adr/README.md` (index) puis `docs/adr/NNNN-*.md` |
| Fonctionnalités, user stories, critères d'acceptance | `docs/features/README.md` (index) puis `docs/features/FNN-*.md` |
| Exigences de fluidité (FL-1 à FL-8) | `docs/features/F00-fluidite.md` |
| Backlog global, ordre de travail, statut des tickets | `docs/backlog.md` |
| Journal des décisions et événements du projet | `docs/journal.md` |
| Standards de code et de qualité | `docs/process/code.md` |
| Stratégie et exigences de test | `docs/process/testing.md` |
| Workflow Git : plan, commit par étape, retour arrière | `docs/process/git.md` |
| Plans d'implémentation par ticket | `docs/plans/` |
| Règles de maintenance de la documentation | `docs/process/documentation.md` |
| Rapports de test par ticket | `docs/test-reports/` |
| Vocabulaire du domaine | `docs/glossary.md` |
| Design : navigation, maquettes, composants, charte | `docs/design/README.md` |

Ordre de lecture au démarrage d'une session : ce fichier, `docs/backlog.md`, les 10 dernières entrées de `docs/journal.md`, puis la feature, les ADR et les écrans de `docs/design/` liés au ticket en cours, et `docs/process/code.md` avant d'écrire du code.

## 3. Langue

- Documentation, backlog, ADR, rapports de test : **français**.
- Code, identifiants, commentaires de code, messages de commit, noms de branches, titres de tests : **anglais**.

## 4. Stack (résumé, détails et justification dans les ADR)

- Monorepo **pnpm workspaces**, **TypeScript strict**, **Node.js LTS (24.x)**. ADR-0002
- Front : **React + Vite**, rendu canvas **Konva** (`react-konva`), état UI local **Zustand**. ADR-0003
- Modèle partagé et synchro : **Yjs** (CRDT), présence via **Yjs Awareness**. ADR-0004
- Serveur : **Hocuspocus** (WebSocket Yjs) + **Fastify** (API REST des boards), persistance **SQLite**. ADR-0005
- Tests : **Vitest** (unitaires, intégration), **Playwright** (end-to-end). ADR-0006
- Lint et format : **Biome**. ADR-0009
- Lancement local packagé : **Docker Compose**, un seul conteneur qui sert front, API et WebSocket. ADR-0010
- Interface : design system **shadcn/ui** (primitives Base UI, thème `neutral`), **Tailwind CSS v4**, icônes **lucide-react**. ADR-0011

Toute dépendance ajoutée doit avoir une licence permissive (MIT, Apache-2.0, BSD, ISC, CC0, 0BSD). Une licence copyleft ou propriétaire (ex. SDK tldraw) est interdite.

## 5. Commandes

Ces scripts sont créés par les tickets techniques T-001 à T-006. Tant qu'un contrôle n'existe pas encore, `pnpm verify` enchaîne seulement ceux qui sont en place ; chaque ticket technique y ajoute le sien (T-001 : lint, typecheck, tests unitaires ; T-002 : intégration, couverture, e2e, `ac:check`, `report` ; T-004 : fluidité ; T-006 : conformité aux maquettes ; T-005 : image Docker).

| Commande | Effet |
|---|---|
| `pnpm install` | Installe les dépendances |
| `pnpm dev` | Lance le serveur et le front en local, en mode développement |
| `docker compose up --build` | Lance l'application packagée sur http://localhost:8080 (ticket T-005) |
| `pnpm test:docker` | Construit l'image, la démarre et vérifie le parcours de base (ticket T-005) |
| `pnpm lint` / `pnpm typecheck` | Biome / `tsc --noEmit` sur tout le monorepo |
| `pnpm test:unit` | Tests unitaires Vitest |
| `pnpm test:int` | Tests d'intégration Vitest (serveur réel en mémoire) |
| `pnpm test:e2e` | Tests Playwright (lance l'app complète) |
| `pnpm test:cov` | Unit + intégration avec couverture, échoue sous 80 % |
| `pnpm ac:check` | Vérifie que chaque critère d'acceptance a au moins un test |
| `pnpm verify` | Lint, typecheck, couverture, e2e, ac:check, puis test:docker si Docker est disponible ; s'arrête au premier échec |
| `pnpm report <TICKET-ID> --step <n>` | Ajoute la section de l'étape n à `docs/test-reports/<TICKET-ID>.md` et écrit les trailers de commit dans `.git/TRAILERS` |

## 6. Boucle de travail (obligatoire)

Règles détaillées : `docs/process/git.md`.

Tu travailles **en totale autonomie, sans humain disponible**. Tu ne poses jamais de question et tu n'attends jamais de réponse : tu décides selon la vision, les specs et les règles de ce contexte, et tu traces tes décisions (section 8).

**Une session = un ticket.** Chaque session traite un seul ticket jusqu'à son intégration dans `main`, puis se termine. Une nouvelle session sera relancée pour le ticket suivant.

**Git local uniquement.** N'ajoute aucun remote et ne pousse jamais (`git push` est interdit). Les fichiers `RUN.md` et `RUN-SUMMARY.md`, s'ils existent, appartiennent à l'outillage d'exécution : ne les modifie pas.

1. Si le dossier n'est pas un dépôt Git, exécute `git init -b main` et commite le contexte tel quel : `docs(context): import agent context`.
2. **Reprise** : si un ticket est `in-progress` dans `docs/backlog.md`, reprends-le. Va sur sa branche, lis son plan `docs/plans/<ticket-id>.md` et `git log --oneline` pour voir les étapes déjà commitées, abandonne tout travail non commité (`git restore --staged --worktree . && git clean -fd`), et continue à l'étape suivante.
3. Sinon, prends le **premier ticket `todo` dont les dépendances sont `done`**. S'il n'y en a aucun, écris une entrée `bilan` dans `docs/journal.md` (tickets `done`, `blocked`, restants, et pourquoi), commite-la sur `main` avec le message `docs(journal): RUN#0 bilan` et les trailers `Refs: RUN` et `Plan-Step: 0/0`, et termine la session. Ce commit marque la fin du travail.
4. Lis la feature, les ADR et les écrans de `docs/design/` liés au ticket. Un critère ambigu ou un comportement non spécifié se tranche selon la section 8.
5. Crée la branche : `git switch -c <type>/<ticket-id>-<slug>`.
6. **Étape 0, le plan.** Avant tout code, écris `docs/plans/<ticket-id>.md` à partir du gabarit : étapes numérotées 1, 2, 3…, chacune avec son objectif, les critères d'acceptance couverts, le code applicatif, le code technique, le code de test et la documentation qu'elle touche. Passe le ticket en `in-progress` dans le backlog. Commit : `docs(plan): <ticket-id>#0 plan <n> steps`.
7. **Pour chaque étape n du plan** :
   1. implémente le code applicatif et technique de l'étape, et ses tests (unitaires, intégration, e2e). Chaque critère d'acceptance a au moins un test dont le titre commence par son identifiant, ex. `[F03-S1-AC2]` ;
   2. mets à jour la documentation que l'étape rend inexacte, et le journal si l'étape a pris une décision ;
   3. exécute `pnpm verify` jusqu'à ce qu'il passe intégralement. Corrige le code, jamais le test pour le faire passer. Les tests des tickets précédents sont des **tests de non-régression** : tu ne les supprimes jamais, et tu ne les modifies que si la spec qu'ils vérifient change dans ce ticket, avec une entrée `test` au journal qui cite chaque fichier modifié et la raison (`docs/process/testing.md`, « Tests de non-régression ») ;
   4. exécute `pnpm report <ticket-id> --step <n>` ;
   5. commite l'étape : `<type>(<scope>): <ticket-id>#<n> <description>`, avec les trailers de `.git/TRAILERS` ;
   6. si tu te perds dans l'étape, reviens au dernier commit d'étape (ou `git revert` d'une étape commitée), note-le dans le journal du plan, et reprends autrement.
8. À la dernière étape, passe aussi le ticket en `done` dans le backlog (dans le commit de cette étape).
9. Intègre dans `main` sans squash : `git switch main && git merge --ff-only <branche>`, puis supprime la branche. **Termine la session.**

## 7. Definition of Done d'un ticket

Un ticket est `done` si et seulement si :

- [ ] Les critères « Fluidité » du ticket passent, avec les mesures et vidéos citées dans le rapport (F00).
- [ ] Tous les critères d'acceptance du ticket sont couverts par au moins un test nommé avec leur identifiant, et `pnpm ac:check` passe.
- [ ] `pnpm verify` passe intégralement : lint, typecheck, unitaires, intégration, couverture ≥ 80 % lignes et branches, **100 % des tests e2e au vert**.
- [ ] Aucun test d'un ticket précédent n'est supprimé ; toute modification de l'un d'eux est justifiée par une spec modifiée dans ce ticket et tracée au journal.
- [ ] Aucun test n'est désactivé (`skip`, `only`, `fixme`) sans ticket de dette ouvert dans le backlog et justification dans le rapport.
- [ ] Le plan `docs/plans/<ticket-id>.md` existe, a été commité avant le code (étape 0), et chacune de ses étapes a son commit `<ticket-id>#<n>` (les reprises sont expliquées dans le journal du plan).
- [ ] Chaque étape est un commit au format `<type>(<scope>): <ticket-id>#<n> ...`, vert, contenant son code, ses tests, la section de rapport correspondante et la documentation mise à jour, avec les trailers `Refs:`, `Plan-Step:`, `Tests:`, `Coverage:`, `Report:`.
- [ ] La branche est intégrée dans `main` en fast-forward, sans squash.
- [ ] Le code respecte `docs/process/code.md`.
- [ ] La documentation impactée est à jour (architecture, ADR, feature, glossaire).
- [ ] Le statut du ticket est `done` dans `docs/backlog.md`.
- [ ] Les décisions, enrichissements de specs, ADR, ajustements de seuil et tests désactivés du ticket sont tracés dans `docs/journal.md`.

## 8. Autonomie et points d'arrêt

**Périmètre strict.** Tu développes uniquement les fonctionnalités et stories décrites dans `docs/features/`. Tu ne crées aucune nouvelle fonctionnalité ni story, et tu n'ajoutes aucune option, raccourci, réglage ou écran qui n'y figure pas, même s'il te paraît utile ou évident pour une application de ce type. Ce qui est listé en « Hors périmètre » est interdit.

Tu es **autonome** sur : choix d'implémentation, découpage technique, écriture et exécution des tests, refactorings, ajout de dépendances à licence permissive, création de tickets techniques ou de bugs dans le backlog, calibrage des seuils de fluidité dans les limites fixées par F00, et sur les points suivants, **à condition de les tracer dans `docs/journal.md`** :

- **trancher un flou** : un critère ambigu ou un comportement nécessaire mais non spécifié. Choisis l'option la plus simple et la plus cohérente avec les specs existantes, écris-la dans la story concernée, et trace-la (`décision`) ;
- **enrichir les specs** d'une story existante : préciser ou ajouter un critère d'acceptance, corriger une règle métier incohérente (`spec`). Un critère d'une story `done` ne se modifie pas : un changement de comportement sur une story terminée passe par un ticket `bug` ;
- **créer un ADR** pour toute décision structurante, y compris un ADR qui en remplace un autre (`adr`) ;
- toute autre **décision structurante** prise en cours de route (`décision`).

Tu **ne t'arrêtes jamais pour demander une décision**. Quand rien ne fonctionne, applique la règle de repli correspondante et trace-la dans le journal :

| Situation | Repli |
|---|---|
| La seule dépendance adaptée n'a pas de licence permissive | Choisis une alternative permissive, ou écris le code toi-même (`dépendance` ou `décision`). |
| Une étape échoue 3 fois malgré des retours à l'étape précédente | Choisis une approche plus simple, quitte à redécouper le plan (`abandon` ou `décision`). |
| Aucune approche ne permet de terminer le ticket | Passe le ticket en `blocked` avec un résumé des tentatives dans la colonne Notes (`blocage`), intègre dans `main` ce qui est vert et utile, et termine la session. Les tickets qui en dépendent ne seront pas traités. |
| `pnpm verify` échoue pour une raison extérieure au code (outil, réseau, machine) | Corrige l'environnement si c'est possible depuis le projet (script, configuration) ; sinon traite le ticket comme bloqué ci-dessus (`environnement`). |
| Un ordre de tickets différent est nécessaire | Réordonne le backlog et explique pourquoi (`backlog`). |
| Docker n'est pas disponible dans ton environnement | C'est normal : `pnpm verify` saute la vérification de l'image et le rapport indique « Docker : non vérifié ». Ce n'est ni un échec ni un blocage. |

## 9. Garder la documentation vivante

La documentation fait partie du livrable : règles dans `docs/process/documentation.md`.

## 10. Règles de code

Les standards de code et de qualité sont dans `docs/process/code.md`. Lis-le avant d'écrire du code dans une session, et applique sa checklist avant chaque commit d'étape.

Deux règles qu'aucun contrôle automatique ne vérifie, et dont la violation casse l'annulation et la synchronisation :

- toute écriture dans le document Yjs passe par une fonction de `packages/model/ops`, dans `doc.transact(fn, LOCAL_ORIGIN)` ; jamais d'écriture Yjs depuis un composant ;
- l'état partagé vit uniquement dans Yjs ; il n'est jamais recopié dans un store Zustand.
