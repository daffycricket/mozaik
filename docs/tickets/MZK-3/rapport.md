# Rapport : MZK-3

## Étape 1 : Bouton de recadrage

- Date : 2026-10-17T21:40:39.066Z
- Branche : ticket/MZK-3-bouton-pour-recadrer-la-vue-sur-tout
- Commit parent : 6c45640
- Docker : non vérifié

| Niveau | Passés | Échoués | Ignorés | Durée |
|---|---|---|---|---|
| Unitaire | 399 | 0 | 0 | 3.8 s |
| Intégration | 28 | 0 | 0 | 3.7 s |
| End-to-end | 157 | 0 | 0 | 167.3 s |

| Couverture | Lignes | Branches | Fonctions |
|---|---|---|---|
| Global | 90.3 % | 83.3 % | 88.4 % |
| packages/model | 98.0 % | 89.4 % | 100.0 % |

| Critère | Tests | Statut |
|---|---|---|
| F02-S4-AC5 | apps/web/src/components/board/zoom-controls.test.tsx, e2e/board-fit.spec.ts | passé |
| UI-BOARD-5 | apps/web/src/components/board/zoom-controls.test.tsx, e2e/layout/board-zoom.spec.ts | passé |
| F02-S4-AC4 | e2e/fluidity/board-fit.spec.ts | passé |
| F02-S4-AC3 | e2e/board-fit.spec.ts, packages/model/src/viewport-fit.test.ts | passé |
| UI-BOARD-6 | e2e/layout/board-zoom.spec.ts | passé |

Fluidité :

| Exigence | Scénario | Mesure | Seuil | Vidéo |
|---|---|---|---|---|
| FL-1 | Tracé d’une flèche suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 25.0 ms | ≤ 150 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une flèche sur un board de 300 éléments | 16.7 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Glisser d’une extrémité de flèche sur un board de 300 éléments (300 ms de latence) | 54.6 ms | ≤ 150 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’une extrémité de flèche sur un board de 300 éléments | 16.5 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Recadrage d’un board de 300 éléments (300 ms de latence) | 16.7 ms | ≤ 150 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Recadrage d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-4 | Déplacement continu d’un élément vu par un autre utilisateur (F07-S2-AC5) | 15.7 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-5 | Sélection et viewport de l’observateur stables pendant un déplacement distant | — | binaire : sélection, élément observé et viewport conservés | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-1 | Déplacement d’un élément sur un board de 300 éléments (300 ms de latence) | 47.7 ms | ≤ 150 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’un élément sur un board de 300 éléments | 16.4 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Glisser d’un élément sur un board de 300 éléments (tâche longue max) | 115.0 ms | ≤ 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-7 | Ouverture d’un board de 300 éléments mélangés depuis le menu | 174.7 ms | ≤ 3000 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Ouverture d’un board de 300 éléments mélangés (tâche longue max) | 87.0 ms | ≤ 200 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Pan d’un board de 300 éléments | 16.9 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Pan d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Redimensionnement d’un élément sur un board de 300 éléments (300 ms de latence) | 42.3 ms | ≤ 150 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Redimensionnement d’un élément sur un board de 300 éléments | 16.5 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Redimensionnement d’un élément sur un board de 300 éléments (tâche longue max) | 93.0 ms | ≤ 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Création d’un post-it avec 300 ms de latence réseau (F09-S1-AC4) | 14.8 ms | ≤ 150 ms | test-results/fluidity-board-sync--F09-S-474b9-less-remotely-under-latency-fluidity/video.webm |
| FL-2 | Zoom d’un board de 300 éléments | 17.5 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Zoom d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Suppression d’un élément sur un board de 300 éléments (300 ms de latence) | 117.1 ms | ≤ 150 ms | test-results/fluidity-delete--F08-S1-AC-19bb7-n-the-local-feedback-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board vide depuis le menu | 175.8 ms | ≤ 1000 ms | test-results/fluidity-empty-board--T-00-c5524--within-the-fluidity-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board depuis le menu | 91.9 ms | ≤ 1000 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-3 | Transition menu → board (aucune tâche longue > 200 ms) | 0.0 ms | ≤ 200 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-4 | Déplacement continu du curseur distant (F10-S2-AC2) | 4.5 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-presence--F10-S2--493ab-t-within-the-latency-budget-fluidity/video.webm |
| FL-1 | Tracé d’une forme suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 14.7 ms | ≤ 150 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une forme sur un board de 300 éléments | 16.7 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Changement de couleur d’un post-it sur un board de 300 éléments (300 ms de latence) | 72.5 ms | ≤ 150 ms | test-results/fluidity-sticky-color--F03-d7b23-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Création d’un post-it sur un board de 300 éléments (300 ms de latence) | 130.7 ms | ≤ 150 ms | test-results/fluidity-sticky-create--F0-b95cb-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Frappe dans un post-it sur un board de 300 éléments (300 ms de latence) | 3.3 ms | ≤ 150 ms | test-results/fluidity-sticky-edit--F03--0d640--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un post-it pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-sticky-edit--F03--43cad-ther-user-changes-the-board-fluidity/video.webm |
| FL-1 | Frappe dans un texte libre sur un board de 300 éléments (300 ms de latence) | 2.1 ms | ≤ 150 ms | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-6 | Frappe rapide de 200 caractères dans un texte libre | — | binaire : aucun caractère perdu ni réordonné | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un texte libre pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-text-create--F05--ad69c-ther-user-changes-the-board-fluidity/video.webm |

Remarques : —

## Synthèse de l'agent

### Travail réalisé

| Étape | Commit | Résumé |
|---|---|---|
| 1 | MZK-3#5 | Fonction partagée `fitViewportToContent`, bouton `zoom-fit` avec infobulle `Tooltip`, tests unitaires et e2e |

Le bouton de recadrage des contrôles de zoom (icône `maximize`, infobulle « Recadrer sur tout le contenu (Shift+1) ») déclenche la même logique que `Shift+1` : la boîte englobante des éléments est extraite dans `canvas/fit-content.ts` (`fitViewportToContent`), appelée par le raccourci (`useFitShortcut`) et par le bouton. Le composant `tooltip` de shadcn/ui (Base UI) est ajouté et utilisé pour l'infobulle, conformément à la charte et à la fiche composants.

### Tests ajoutés, modifiés ou supprimés

| Fichier | Action | Raison |
|---|---|---|
| apps/web/src/components/board/zoom-controls.test.tsx | étendu `[UI-BOARD-5]` ; ajouté `[F02-S4-AC5]` | Ordre du groupe de zoom avec `zoom-fit` ; clic sur le bouton (contenu, board vide, hors board) |
| e2e/board-fit.spec.ts | ajouté `[F02-S4-AC5]` (4 tests) | Le bouton recadre sur un contenu plus petit, plus grand, un board vide et un contenu borné |
| e2e/layout/board-zoom.spec.ts | étendu `[UI-BOARD-5]` | `zoom-fit` dans l'ordre du groupe et infobulle mentionnant `Shift+1` aux deux viewports |

### Points ouverts

Aucun.
