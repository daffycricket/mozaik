# Rapport : MZK-1

## Étape 1 : Recadrage sur tout le contenu

- Date : 2026-10-17T09:46:31.586Z
- Branche : ticket/MZK-1-recadrer-la-vue-sur-tout-le
- Commit parent : 99555f2
- Docker : non vérifié

| Niveau | Passés | Échoués | Ignorés | Durée |
|---|---|---|---|---|
| Unitaire | 395 | 0 | 0 | 5.8 s |
| Intégration | 28 | 0 | 0 | 4.1 s |
| End-to-end | 152 | 0 | 0 | 154.5 s |

| Couverture | Lignes | Branches | Fonctions |
|---|---|---|---|
| Global | 90.3 % | 83.1 % | 88.3 % |
| packages/model | 98.0 % | 89.4 % | 100.0 % |

| Critère | Tests | Statut |
|---|---|---|
| F02-S4-AC1 | apps/web/src/state/viewport-store-fit.test.ts, apps/web/src/tools/fit-shortcut.test.tsx, e2e/board-fit.spec.ts, packages/model/src/viewport-fit.test.ts | passé |
| F02-S4-AC2 | apps/web/src/state/viewport-store-fit.test.ts, apps/web/src/tools/fit-shortcut.test.tsx, e2e/board-fit.spec.ts, packages/model/src/viewport-fit.test.ts | passé |
| F02-S4-AC3 | e2e/board-fit.spec.ts, packages/model/src/viewport-fit.test.ts | passé |
| F02-S4-AC4 | e2e/fluidity/board-fit.spec.ts | passé |
| UI-BOARD-5 | apps/web/src/components/board/zoom-controls.test.tsx, e2e/layout/board-zoom.spec.ts | passé |

Fluidité :

| Exigence | Scénario | Mesure | Seuil | Vidéo |
|---|---|---|---|---|
| FL-1 | Tracé d’une flèche suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 18.1 ms | ≤ 150 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une flèche sur un board de 300 éléments | 16.7 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Glisser d’une extrémité de flèche sur un board de 300 éléments (300 ms de latence) | 69.3 ms | ≤ 150 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’une extrémité de flèche sur un board de 300 éléments | 16.7 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Recadrage d’un board de 300 éléments (300 ms de latence) | 9.8 ms | ≤ 150 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Recadrage d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-4 | Déplacement continu d’un élément vu par un autre utilisateur (F07-S2-AC5) | 17.4 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-5 | Sélection et viewport de l’observateur stables pendant un déplacement distant | — | binaire : sélection, élément observé et viewport conservés | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-1 | Déplacement d’un élément sur un board de 300 éléments (300 ms de latence) | 105.7 ms | ≤ 150 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’un élément sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Glisser d’un élément sur un board de 300 éléments (tâche longue max) | 101.0 ms | ≤ 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-7 | Ouverture d’un board de 300 éléments mélangés depuis le menu | 179.0 ms | ≤ 3000 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Ouverture d’un board de 300 éléments mélangés (tâche longue max) | 77.0 ms | ≤ 200 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Pan d’un board de 300 éléments | 17.4 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Pan d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Redimensionnement d’un élément sur un board de 300 éléments (300 ms de latence) | 98.7 ms | ≤ 150 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Redimensionnement d’un élément sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Redimensionnement d’un élément sur un board de 300 éléments (tâche longue max) | 89.0 ms | ≤ 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Création d’un post-it avec 300 ms de latence réseau (F09-S1-AC4) | 15.1 ms | ≤ 150 ms | test-results/fluidity-board-sync--F09-S-474b9-less-remotely-under-latency-fluidity/video.webm |
| FL-2 | Zoom d’un board de 300 éléments | 16.7 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Zoom d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Suppression d’un élément sur un board de 300 éléments (300 ms de latence) | 117.0 ms | ≤ 150 ms | test-results/fluidity-delete--F08-S1-AC-19bb7-n-the-local-feedback-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board vide depuis le menu | 155.5 ms | ≤ 1000 ms | test-results/fluidity-empty-board--T-00-c5524--within-the-fluidity-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board depuis le menu | 93.1 ms | ≤ 1000 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-3 | Transition menu → board (aucune tâche longue > 200 ms) | 0.0 ms | ≤ 200 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-4 | Déplacement continu du curseur distant (F10-S2-AC2) | 4.8 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-presence--F10-S2--493ab-t-within-the-latency-budget-fluidity/video.webm |
| FL-1 | Tracé d’une forme suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 13.1 ms | ≤ 150 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une forme sur un board de 300 éléments | 16.8 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Changement de couleur d’un post-it sur un board de 300 éléments (300 ms de latence) | 78.5 ms | ≤ 150 ms | test-results/fluidity-sticky-color--F03-d7b23-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Création d’un post-it sur un board de 300 éléments (300 ms de latence) | 124.4 ms | ≤ 150 ms | test-results/fluidity-sticky-create--F0-b95cb-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Frappe dans un post-it sur un board de 300 éléments (300 ms de latence) | 2.1 ms | ≤ 150 ms | test-results/fluidity-sticky-edit--F03--0d640--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un post-it pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-sticky-edit--F03--43cad-ther-user-changes-the-board-fluidity/video.webm |
| FL-1 | Frappe dans un texte libre sur un board de 300 éléments (300 ms de latence) | 3.5 ms | ≤ 150 ms | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-6 | Frappe rapide de 200 caractères dans un texte libre | — | binaire : aucun caractère perdu ni réordonné | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un texte libre pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-text-create--F05--ad69c-ther-user-changes-the-board-fluidity/video.webm |

Remarques : —

## Synthèse de l'agent

### Travail réalisé

| Étape | Commit | Résumé |
|---|---|---|
| 1 | MZK-1#5 | Recadrage de la vue sur tout le contenu : `fitViewport`/`FIT_PADDING` dans `packages/model`, action `fitToContent` du store, raccourci `Shift+1` (`useFitShortcut`), tests unitaires, e2e et fluidité, `architecture.md` mis à jour |

### Tests ajoutés, modifiés ou supprimés

| Fichier | Action | Raison |
|---|---|---|
| packages/model/src/viewport-fit.test.ts | ajouté `[F02-S4-AC1]`, `[F02-S4-AC2]`, `[F02-S4-AC3]` | Nouveaux critères |
| apps/web/src/state/viewport-store-fit.test.ts | ajouté `[F02-S4-AC1]`, `[F02-S4-AC2]` | Nouveaux critères |
| apps/web/src/tools/fit-shortcut.test.tsx | ajouté `[F02-S4-AC1]`, `[F02-S4-AC2]` | Nouveaux critères |
| e2e/board-fit.spec.ts | ajouté `[F02-S4-AC1]`, `[F02-S4-AC2]`, `[F02-S4-AC3]` | Nouveaux critères |
| e2e/fluidity/board-fit.spec.ts | ajouté `[F02-S4-AC4]` | Nouveau critère |

Aucun test hérité n'a été modifié ni supprimé.

### Points ouverts

Aucun.

