# AGENTS.md

Point d'entrée pour tout agent de développement (OpenCode, Codex, Claude Code, Cursor...).
Lis ce fichier en entier avant toute action. Il est court par construction : le détail est dans `docs/`.

## 1. Le projet en une phrase

**Mozaik**, une application open source (licence MIT) de tableau blanc collaboratif de type Miro : canvas infini, post-its, formes, textes, flèches, édition simultanée par plusieurs utilisateurs en temps réel, avec une expérience fluide. La v1 est livrée (tag `v1.0`) ; le produit évolue désormais **ticket par ticket**.

## 2. Carte de la documentation

| Besoin | Fichier |
|---|---|
| Vision, périmètre, exigences non fonctionnelles | `docs/vision.md` |
| Architecture, modules, modèle de données, flux | `docs/architecture.md` |
| Décisions d'architecture (ADR) | `docs/adr/README.md` (index) puis `docs/adr/NNNN-*.md` |
| Fonctionnalités, stories, critères d'acceptance | `docs/features/README.md` (index) puis `docs/features/FNN-*.md` |
| Exigences de fluidité (FL-1 à FL-8) | `docs/features/F00-fluidite.md` |
| Exigences techniques et critères de non-régression | `docs/exigences-techniques.md` |
| Design : navigation, maquettes, règles `UI-*`, composants, charte | `docs/design/README.md` |
| Dossier du ticket : demande, plan, retours, rapport | `docs/tickets/<id>/` |
| Journal : trace unique de toutes les décisions et modifications | `docs/journal.md` |
| Gabarits des documents à produire | `docs/process/gabarits/` |
| Standards de code et de qualité | `docs/process/code.md` |
| Stratégie et exigences de test | `docs/process/testing.md` |
| Workflow Git : branche de ticket, commits, rebase, merge | `docs/process/git.md` |
| Règles de maintenance de la documentation | `docs/process/documentation.md` |
| Vocabulaire du domaine | `docs/glossary.md` |
| Outillage des phases (scripts, image, garde-fou, contrôles) : hors de ta portée | `runner/README.md` |

Ordre de lecture au démarrage d'une session : ce fichier, `docs/tickets/<id>/` (tous ses fichiers), **la section du ticket** dans `docs/journal.md` (pas tout le journal), puis selon la phase les features, écrans, ADR et code concernés. Pour connaître l'historique d'un élément que tu modifies, recherche son identifiant dans le journal (`grep -n "F08-S1" docs/journal.md`).

## 3. Langue

- Documentation, journal, ADR, plans, rapports de test : **français**.
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

| Commande | Effet |
|---|---|
| `pnpm install` | Installe les dépendances |
| `pnpm dev` | Lance le serveur et le front en local, en mode développement |
| `docker compose up --build` | Lance l'application packagée sur http://localhost:8080 |
| `pnpm test:docker` | Construit l'image, la démarre et vérifie le parcours de base |
| `pnpm lint` / `pnpm typecheck` | Biome et contrôle des couleurs / `tsc --noEmit` sur tout le monorepo |
| `pnpm test:unit` | Tests unitaires Vitest |
| `pnpm test:int` | Tests d'intégration Vitest (serveur réel en mémoire) |
| `pnpm test:e2e` | Tests Playwright (lance l'app complète) |
| `pnpm test:cov` | Unit + intégration avec couverture, échoue sous 80 % |
| `pnpm ac:check` | Vérifie que chaque critère déclaré (features, règles `UI-*`, exigences techniques) a au moins un test |
| `pnpm verify` | Lint, typecheck, couverture, e2e, ac:check, puis test:docker si Docker est disponible ; s'arrête au premier échec |
| `pnpm report <id> --step <n>` | Ajoute la section de l'étape n à `docs/tickets/<id>/rapport.md` et écrit les trailers de commit dans `.git/TRAILERS` |

## 6. Comment tu es lancé

Chaque évolution est un **ticket** `MZK-<n>` (numéro court de sa carte Trello), traité sur sa branche `ticket/MZK-<n>-<slug>` en phases successives. Un humain lance chaque phase par une commande ; un script prépare la session, te lance avec la consigne de la phase, puis fait le reste (commit, publication, carte Trello).

| Phase | Commande | Ton rôle | Qui commite |
|---|---|---|---|
| Spec | `spec <id>` | Produire ou modifier la spec à partir de `ticket.md` (§7) | le script |
| Spec review | `spec-review <id>` | Appliquer les retours de l'humain à la spec (§10) | le script |
| Design | `design <id>` | Écrire `plan.md`, les ADR, l'analyse d'impact (§8) | le script |
| Tech review | `tech-review <id>` | Appliquer les retours de l'humain au plan (§10) | le script |
| Dev | `dev <id>` | Exécuter le plan, étape par étape (§9) | toi, une étape = un commit |
| Review | `review <id>` | Corriger selon les retours de la recette (§10) | toi |
| Merge | `merge <id>` | Résoudre les conflits du rebase si le script te le demande (§11) | toi, puis le script merge |

Règles communes à toutes les phases :

- **Tu ne poses jamais de question en attendant une réponse.** En spec et en design, tu écris tes questions dans le journal (`Q1`, `Q2`...) avec l'hypothèse que tu retiens, et tu continues ; l'humain répond en commentaire de la carte. En dev, tu tranches et tu traces (§13).
- **Une session = une phase d'un ticket.** Tu restes sur la branche du ticket ; tu ne crées pas de branche, tu ne changes pas de branche, tu ne merges pas dans `main`.
- **Git local uniquement.** N'ajoute aucun remote et ne pousse jamais (`git push` est interdit). La publication est faite par le script.
- **Ne modifie jamais `runner/`**, à aucune phase : c'est l'outillage qui te lance et te contrôle. Le garde-fou le refuse, le contrôle de fin de session le signale, et le merge d'une branche qui modifie `runner/` est refusé. Si l'outillage te gêne, écris-le dans les points ouverts du rapport.
- **Écritures limitées à ta phase.** En spec : `docs/features/`, `docs/design/`, `docs/exigences-techniques.md`, `docs/tickets/<id>/`, `docs/journal.md`. En design : `docs/tickets/<id>/plan.md`, `docs/tickets/<id>/synthese.md`, `docs/adr/`, `docs/architecture.md`, `docs/glossary.md`, `docs/journal.md`. En dev, review et merge : tout le dépôt, sauf `runner/`, `plan.md` et la spec (`docs/features/`, et dans `docs/design/` tout sauf `composants.md`), modifiable seulement sur un retour `[spec]` explicite (§10).
- **Traçabilité dans le journal uniquement** (`docs/journal.md`, section du ticket, sous-section de ta phase, créée par le script) : chaque décision, hypothèse, question, critère ou story modifié, ADR, test hérité modifié, répercussion d'un fichier sur un autre. Format : [docs/journal.md](docs/journal.md) et [le gabarit](docs/process/gabarits/journal.md). Aucun autre fichier ne porte d'historique, sauf l'en-tête des ADR. La ligne « Fichiers modifiés » est écrite par le script : ne l'écris pas.
- **Synthèse de phase**, pour l'humain : avant la fin de chaque phase (spec, spec review, design, tech review, dev, review), ajoute à la fin de `docs/tickets/<id>/synthese.md` (crée-le s'il n'existe pas) une section `## <Phase> : <date>` selon [le gabarit](docs/process/gabarits/synthese.md) : trois paragraphes rédigés, « Ce que j'ai compris », « Ce qui change », « Ce que tu dois trancher ». C'est ce que l'humain lit en premier, en commentaire de la carte : des phrases claires, pas une liste d'identifiants. En dev et en review, écris-la avant le dernier commit d'étape et inclus-la dans ce commit.

## 7. Phase spec

Entrée : `docs/tickets/<id>/ticket.md` (la demande, telle que l'a écrite un humain, parfois succincte).

1. Lis la demande, puis les features, écrans et règles `UI-*` qu'elle touche, et le code si c'est nécessaire pour comprendre l'existant (lecture seule).
2. Décide où va la demande ([docs/features/README.md](docs/features/README.md)) : story existante modifiée (elle n'est plus vraie telle qu'écrite), nouvelle story dans la feature (objectif distinct, livrable et testable seul), ou nouvelle feature (aucune ne couvre le besoin). Pour un bug, la spec existante est souvent juste : précise le critère que le comportement actuel viole, ou ajoute le critère manquant.
3. Écris la spec : stories en « En tant que... je veux... afin de... », critères d'acceptance « Étant donné / Quand / Alors » avec leurs identifiants, règles `UI-*` et maquette dans `docs/design/` si l'interface change. Les identifiants prennent le numéro suivant et ne sont jamais réutilisés. Une exigence technique durable va dans `docs/exigences-techniques.md` (groupe `T-` ou `B-` suivant).
4. Ne réduis pas la demande et n'ajoute rien qu'elle ne demande pas. Ce qui est ambigu devient une hypothèse (`H1`...) que tu appliques, ou une question (`Q1`...) avec l'hypothèse retenue en attendant la réponse.
5. Trace dans la sous-section Spec du journal : chaque story, critère ou règle `UI-*` ajouté, modifié ou supprimé (avec l'ancien et le nouveau sens), chaque hypothèse, chaque question, chaque répercussion sur un autre fichier.

Tu n'écris ni code, ni test, ni plan. Tu ne commites pas.

## 8. Phase design

Entrée : la spec du ticket (sous-sections Spec et Spec review du journal, fichiers de `docs/features/` et `docs/design/` modifiés sur la branche).

1. Analyse l'impact dans le code : modules et fichiers touchés, tests hérités concernés (par identifiant), données (changement compatible, ou migration : `docs/process/code.md`, « Évolution du modèle de données »), fluidité (F00), documents à mettre à jour.
2. Tu peux exécuter des tests si c'est utile à ton analyse, avec parcimonie et de façon ciblée (`pnpm exec vitest run <fichier>`, `pnpm exec playwright test <fichier>`) ; ce n'est pas requis.
3. Écris `docs/tickets/<id>/plan.md` selon le [gabarit](docs/process/gabarits/plan.md) : éléments de spec couverts, analyse d'impact, étapes (une étape = un commit en dev, titre au format `### Étape <n> : <titre>`, avec ses critères et ses tests attendus), risques. Un ticket simple peut n'avoir qu'une étape.
4. Toute décision structurante devient un ADR ([gabarit](docs/adr/template.md)), numéro suivant de `docs/adr/README.md`, avec le ticket, « créé au design » et la raison dans l'en-tête ; mets l'index à jour.
5. Trace dans la sous-section Design du journal : décisions, hypothèses, questions techniques, ADR.

Tu n'écris ni code applicatif ni test, et tu ne modifies pas la spec. Tu ne commites pas.

## 9. Phase dev

Entrée : `plan.md` validé, spec du ticket, section du ticket dans le journal. Règles Git détaillées : [docs/process/git.md](docs/process/git.md).

Tu travailles **en totale autonomie, sans humain disponible**. Le plan est exécuté tel quel : il n'y a pas d'étape 0.

1. Vérifie que tu es sur la branche du ticket et que l'arbre de travail est propre. Si des étapes sont déjà commitées (reprise), lis `git log --oneline main..HEAD` et continue à l'étape suivante ; abandonne tout travail non commité (`git restore --staged --worktree . && git clean -fd`).
2. **Pour chaque étape n du plan** :
   1. implémente le code applicatif et technique de l'étape, et ses tests (unitaires, intégration, e2e). Chaque critère a au moins un test dont le titre commence par son identifiant, ex. `[F08-S1-AC6]` ;
   2. applique les règles des tests hérités ([testing.md](docs/process/testing.md), « Tests de non-régression ») et trace chaque test hérité modifié ou supprimé au journal ;
   3. mets à jour la documentation que l'étape rend inexacte (`architecture.md`, `glossary.md`, `design/composants.md`, README) et trace la répercussion ;
   4. exécute `pnpm verify` jusqu'à ce qu'il passe intégralement. Corrige le code, jamais le test pour le faire passer ;
   5. exécute `pnpm report <id> --step <n>` ;
   6. à la dernière étape, écris la synthèse dans `rapport.md` (§9 bis) ;
   7. commite l'étape : `<type>(<scope>): MZK-<n>#<k> <description>` avec `Refs: MZK-<n>, <critères>`, `Plan-Step: <n>/<total>` et les trailers de `.git/TRAILERS`.
3. **Écart au plan** : si une étape est impossible telle qu'écrite, s'il en faut une de plus ou si un critère est ambigu, continue et prends l'initiative nécessaire. Ne modifie ni `plan.md` ni la spec. Une étape ajoutée prend le numéro suivant (`Plan-Step: 3/3` pour un plan de 2 étapes). Trace l'écart au journal (`décision`, « À revoir : oui ») et dans les points ouverts du rapport.
4. Si tu te perds dans une étape, reviens au dernier commit d'étape (ou `git revert` d'une étape commitée) et reprends autrement ; trace-le au journal.
5. **Échec de la vérification indépendante** (la consigne de ta session le signale, avec le rapport d'échec) : corrige sur la branche par un commit supplémentaire. Si tu n'y parviens pas, trace l'échec au journal et décris un bug dans la section « Bugs décrits » du rapport, au format du [gabarit](docs/process/gabarits/rapport.md) (`### Bug : <titre>`, puis `- Qualification : bloquant` ou `secondaire`, description, reproduction, test en échec, extrait de log). **Bloquant** : le ticket ne peut pas être livré ; **secondaire** : problème préexistant ou hors du périmètre du ticket. Le script crée la carte Trello. La qualification est « À revoir : oui » au journal.
6. Ne merge pas : la session se termine quand la dernière étape est commitée.

### 9 bis. Synthèse du rapport

Dans `docs/tickets/<id>/rapport.md` ([gabarit](docs/process/gabarits/rapport.md)), section « Synthèse de l'agent » : travail réalisé par étape et commit, tests ajoutés, modifiés ou supprimés avec la raison, **points ouverts** (écarts au plan, hypothèses, échecs, bugs décrits ; « Aucun » s'il n'y en a pas). La section « Métriques du runner » est écrite par le script : n'y touche pas.

## 10. Traitement des retours (spec review, tech review, review)

Entrée : `docs/tickets/<id>/retours.md`, sous-section de la phase en cours. Chaque remarque est préfixée :

| Préfixe | Ce que tu fais |
|---|---|
| `[spec]` | Tu modifies la spec du ticket (et en review, le code et les tests qui en découlent). C'est le seul cas où la spec change hors phase spec. |
| `[impl]` | Tu corriges l'implémentation (ou le plan en tech review), sans toucher à la spec. |
| `[règle]` | Tu ajoutes ou modifies une règle transverse : `docs/process/`, `docs/architecture.md`, `docs/design/` ou un ADR. |
| aucun | Tu classes toi-même la remarque dans l'une des trois catégories, avec « À revoir : oui ». Tu ne crées jamais de règle transverse sans préfixe `[règle]` : tu peux seulement la proposer dans les points ouverts du rapport. |

Chaque remarque traitée est une entrée `retour` au journal (origine `humain`), suivie des entrées qui en découlent. En review, les corrections sont des commits d'étape comme en dev (§9), avec `Plan-Step` au numéro suivant, et la synthèse du rapport est mise à jour. Une remarque qui change la spec en profondeur ne se traite pas en review : signale-la dans les points ouverts, l'humain renverra le ticket en spec.

## 11. Phase merge

Le script rebase la branche sur `main`. S'il y a un conflit ou si la vérification échoue après le rebase, il te lance : résous le conflit en conservant le comportement des deux côtés (`main` et ticket), corrige ce qui est nécessaire par un commit supplémentaire, et trace la résolution au journal : ajoute à la fin de la section du ticket une sous-section `### Merge : <date>` avec le tableau, entrées « À revoir : oui ». Tu ne merges pas et tu ne pousses pas : le script vérifie, puis l'humain reteste avant le merge.

## 12. Definition of Done d'une phase dev ou review

- [ ] Toutes les étapes du plan ont leur commit, et chaque écart est tracé au journal et dans les points ouverts.
- [ ] Tous les critères du plan sont couverts par au moins un test nommé avec leur identifiant, et `pnpm ac:check` passe.
- [ ] `pnpm verify` passe intégralement : lint, typecheck, unitaires, intégration, couverture ≥ 80 % lignes et branches, **100 % des tests e2e au vert**.
- [ ] Les critères « Fluidité » concernés passent, avec mesures et vidéos citées dans le rapport (F00).
- [ ] Aucun test hérité n'est supprimé ou modifié hors des cas prévus par `testing.md`, et chaque cas est tracé au journal.
- [ ] Aucun test n'est désactivé (`skip`, `only`, `fixme`).
- [ ] Chaque commit d'étape est au format de `process/git.md`, vert, avec son code, ses tests, sa section de rapport, la documentation mise à jour et ses trailers.
- [ ] Les données existantes restent lisibles : changement compatible, ou migration avec fixture et test (`docs/process/code.md`, « Évolution du modèle de données »).
- [ ] Le code respecte `docs/process/code.md`.
- [ ] La synthèse du rapport est écrite, points ouverts compris.

## 13. Autonomie et règles de repli

**Périmètre strict.** Tu développes uniquement ce que décrivent `docs/features/`, `docs/design/` et `docs/exigences-techniques.md`. En dev, tu n'ajoutes aucune option, raccourci, réglage ou écran qui n'y figure pas. Ce qui est listé en « Hors périmètre » est interdit. Seule la phase spec crée ou modifie des stories et des features.

Tu es **autonome** sur : choix d'implémentation, découpage technique, écriture et exécution des tests, refactorings nécessaires au ticket, ajout de dépendances à licence permissive, calibrage des seuils de fluidité dans les limites de F00, création d'un ADR au dev pour une décision découverte en codant (« créé au dev »). Chaque décision est tracée au journal.

Tu **ne t'arrêtes jamais pour demander une décision**. Quand rien ne fonctionne, applique la règle de repli et trace-la :

| Situation | Repli |
|---|---|
| La seule dépendance adaptée n'a pas de licence permissive | Alternative permissive, ou code écrit toi-même (`décision`). |
| Une étape échoue 3 fois malgré des retours à l'étape précédente | Approche plus simple, quitte à ajouter une étape (écart au plan, `décision`). |
| Aucune approche ne permet de terminer le ticket | Commite ce qui est vert et utile, décris un bug **bloquant** dans le rapport, trace-le, et termine la session. |
| `pnpm verify` échoue pour une raison extérieure au code (outil, réseau, machine) | Corrige l'environnement si c'est possible depuis le projet ; sinon décris un bug (`décision`). |
| Docker n'est pas disponible dans ton environnement | C'est normal : `pnpm verify` saute la vérification de l'image et le rapport indique « Docker : non vérifié ». |

## 14. Garder la documentation vivante

La documentation fait partie du livrable : règles dans `docs/process/documentation.md`.

## 15. Règles de code

Les standards de code et de qualité sont dans `docs/process/code.md`. Lis-le avant d'écrire du code dans une session, et applique sa checklist avant chaque commit d'étape.

Deux règles qu'aucun contrôle automatique ne vérifie, et dont la violation casse l'annulation et la synchronisation :

- toute écriture dans le document Yjs passe par une fonction de `packages/model/ops`, dans `doc.transact(fn, LOCAL_ORIGIN)` ; jamais d'écriture Yjs depuis un composant ;
- l'état partagé vit uniquement dans Yjs ; il n'est jamais recopié dans un store Zustand.
