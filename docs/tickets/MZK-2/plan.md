# Plan : MZK-2 Mesures FL-1 gonflées par l'attente des tests

Écrit par l'agent de design, commenté par l'humain sur la carte en tech review, exécuté tel quel en phase dev. Le titre de chaque étape suit exactement le format `### Étape <n> : <titre>`, lu par `pnpm report`.

## Éléments de spec couverts

Repris de la sous-section Spec du ticket dans le journal.

| Élément | Changement | Résumé |
|---|---|---|
| B-004-AC1 | ajouté | `measureActionToEffect` date l'effet à la première image d'animation où il devient visible, indépendamment de la méthode d'attente du test, pour tous ses usages (FL-1, FL-4, FL-7) ; seuils de F00, 3 exécutions et médiane inchangés, aucun test affaibli, désactivé ni supprimé |
| F00 (méthode de mesure) | modifié | La datation à l'image près est précisée : le délai mesuré est celui de la réaction de l'application, pas de l'attente du test |

## Analyse d'impact

- **Modules et fichiers** :
  - `e2e/support/action-effect.ts` : nouvelle signature `measureActionToEffect(page, action, effect, arg?)`, où `effect` est un prédicat navigateur autonome `(arg) => boolean` (et `arg` un argument sérialisable). L'utilitaire matérialise le prédicat dans la page, l'évalue à chaque image (`page.waitForFunction`, sondage `requestAnimationFrame` par défaut) et retient le `performance.now()` de la première image où il est vrai. `start` reste l'instant qui précède immédiatement l'action. `countIntermediatePositions` est inchangé.
  - `e2e/fluidity/*.spec.ts` (18 fichiers, 19 appels) : chaque effet passe d'un callback d'attente (`expect.poll`, `page.waitForFunction`, `expect(locator)...`) à un prédicat in-page + argument. Assertions, seuils, nombre d'exécutions et médiane inchangés.
  - `e2e/fluidity/utilities.spec.ts` : `[T-004-AC4]` adapté à la nouvelle API (mêmes bornes) ; nouveau test `[B-004-AC1]`.
- **Inventaire des appels** (fichier → critère → effet mesuré) :
  - `board-open.spec.ts` [F02-S3-AC1] : canvas visible et 300 éléments chargés ;
  - `menu-board.spec.ts` [F01-S2-AC6] : canvas visible ;
  - `empty-board.spec.ts` [T-004-AC6] : canvas visible ;
  - `board-fit.spec.ts` [F02-S4-AC4] : viewport différent de l'état initial ;
  - `board-sync.spec.ts` [F09-S1-AC4] : nombre d'éléments attendu ;
  - `sticky-create.spec.ts` [F03-S1-AC4] : nombre d'éléments attendu ;
  - `sticky-color.spec.ts` [F03-S3-AC3] : couleur de l'élément attendue ;
  - `sticky-edit.spec.ts` [F03-S2-AC5] : longueur du `textarea` `text-editor` attendue ;
  - `text-create.spec.ts` [F05-S1-AC4] : longueur du `textarea` `text-editor` attendue ;
  - `delete.spec.ts` [F08-S1-AC3] : élément absent du document ;
  - `board-move.spec.ts` [F07-S2-AC4] : `x` de l'élément au-delà du seuil ;
  - `board-resize.spec.ts` [F07-S3-AC4] : largeur de l'élément au-delà du seuil ;
  - `arrow-create.spec.ts` [F06-S1-AC4] : longueur du brouillon de flèche au-delà du seuil ;
  - `shape-create.spec.ts` [F04-S1-AC5] : largeur du brouillon de forme au-delà du seuil ;
  - `arrow-edit.spec.ts` [F06-S2-AC3] : `x2` de la flèche au-delà du seuil ;
  - `board-move-remote.spec.ts` [F07-S2-AC5] : position de l'élément chez l'observateur ;
  - `presence.spec.ts` [F10-S2-AC2] : curseur distant chez l'observateur ;
  - `utilities.spec.ts` [T-004-AC4] : canvas visible (local) et drapeau `__remote` chez un second utilisateur.
- **Tests hérités concernés** : les 18 tests ci-dessus ne changent que dans leur **attente d'effet** (le prédicat remplace le callback) ; assertions, seuils, nombre d'exécutions et médiane sont inchangés. `[T-004-AC4]` est le test de l'utilitaire lui-même. Chaque modification est une entrée `test` au journal en dev. Aucun test n'est supprimé, affaibli ni désactivé (`skip`, `only`, `fixme`).
- **Données** : aucun changement du modèle de board, pas de migration.
- **Fluidité (F00)** : aucun seuil modifié. La datation à l'image s'applique à FL-1, FL-4 et FL-7 ; les valeurs mesurées diminuent (suppression du palier de sondage), les seuils restent ceux de F00.
- **Documents à mettre à jour** : `docs/adr/0015-datation-a-l-image-des-mesures-action-effet.md` et l'index `docs/adr/README.md` (créés au design). `docs/architecture.md` : aucun changement (les utilitaires de `e2e/support/` n'y figurent pas). `docs/glossary.md` : aucun terme nouveau. `docs/design/` : aucun changement d'interface.
- **ADR** : `0015-datation-a-l-image-des-mesures-action-effet.md`, créé au design.

## Étapes

| N° | Nom | Description | Éléments |
|---|---|---|---|
| 1 | Datation à l'image dans l'utilitaire de mesure | Prédicat in-page évalué à chaque image, migration des 19 appels, test `[B-004-AC1]` | B-004-AC1 |

### Étape 1 : Datation à l'image dans l'utilitaire de mesure

- Éléments couverts : B-004-AC1.
- Code : `e2e/support/action-effect.ts` (signature à prédicat, datation par `requestAnimationFrame`) ; migration des effets dans `e2e/fluidity/*.spec.ts` (19 appels).
- Tests : `[B-004-AC1]` ajouté dans `e2e/fluidity/utilities.spec.ts` (un effet rendu visible à la 2e image est daté sous 100 ms, là où un `expect.poll` mesurerait au moins 100 ms) ; `[T-004-AC4]` adapté (mêmes bornes `localDelay < 3000`, `remoteDelay ≥ 100` et `< 2000`) ; les tests de fluidité existants restent la couverture de FL-1, FL-4 et FL-7.
- Terminée quand : `pnpm verify` vert et `pnpm report MZK-2 --step 1` écrit.

## Risques

- **`effect.toString()` après transpilation** : le prédicat doit être autonome (aucune fermeture sur une variable Node, aucun import) pour être reconstruit dans la page. Repli si la transpilation altérait le source : installer un registre de prédicats nommés dans `e2e/support/` (init script) et référencer le prédicat par nom. Vérifié par `[B-004-AC1]`.
- **Affaiblissement involontaire** : remplacer `expect(...).toBeVisible()` par un prédicat DOM pourrait relâcher la vérification ; le prédicat contrôle une boîte non nulle (et la visibilité calculée), et les assertions fonctionnelles des tests restent. Vérifié par la non-régression e2e.
- **Mesure distante** : le prédicat s'exécute sur la page de l'observateur et l'argument doit rester sérialisable. Les cas `board-move-remote` et `presence` sont couverts par leurs tests.
- **Délai de `page.waitForFunction`** : conserver le délai par défaut (délai du test) pour qu'un effet absent échoue comme avant.
- **Seuils** : aucun seuil de F00 n'est modifié dans ce ticket (B-004-AC1 l'exige) ; la règle de calibrage de F00 (assouplissement jusqu'au plancher) ne s'applique donc pas ici. Si une mesure dépasse son seuil après le correctif (peu probable, les valeurs baissent), décrire un bug dans le rapport au lieu d'ajuster le seuil, qualification secondaire si le dépassement préexiste au ticket.
