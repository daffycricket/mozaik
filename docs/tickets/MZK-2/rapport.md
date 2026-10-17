# Rapport : MZK-2

## Étape 1 : Datation à l'image dans l'utilitaire de mesure

- Date : 2026-10-17T17:29:53.947Z
- Branche : ticket/MZK-2-mesures-fl-1-gonflees-par-l
- Commit parent : 2a7add5
- Docker : non vérifié

| Niveau | Passés | Échoués | Ignorés | Durée |
|---|---|---|---|---|
| Unitaire | 395 | 0 | 0 | 4.6 s |
| Intégration | 28 | 0 | 0 | 4.0 s |
| End-to-end | 153 | 0 | 0 | 169.1 s |

| Couverture | Lignes | Branches | Fonctions |
|---|---|---|---|
| Global | 90.3 % | 83.1 % | 88.3 % |
| packages/model | 98.0 % | 89.4 % | 100.0 % |

| Critère | Tests | Statut |
|---|---|---|
| B-004-AC1 | e2e/fluidity/utilities.spec.ts | passé |
| T-004-AC4 | e2e/fluidity/utilities.spec.ts | passé |
| F02-S3-AC1 | e2e/fluidity/board-open.spec.ts | passé |
| F01-S2-AC6 | e2e/fluidity/menu-board.spec.ts | passé |
| T-004-AC6 | e2e/fluidity/empty-board.spec.ts | passé |
| F02-S4-AC4 | e2e/fluidity/board-fit.spec.ts | passé |
| F09-S1-AC4 | e2e/fluidity/board-sync.spec.ts | passé |
| F03-S1-AC4 | e2e/fluidity/sticky-create.spec.ts | passé |
| F03-S3-AC3 | e2e/fluidity/sticky-color.spec.ts | passé |
| F03-S2-AC5 | e2e/fluidity/sticky-edit.spec.ts | passé |
| F05-S1-AC4 | e2e/fluidity/text-create.spec.ts | passé |
| F08-S1-AC3 | e2e/fluidity/delete.spec.ts | passé |
| F07-S2-AC4 | e2e/fluidity/board-move.spec.ts | passé |
| F07-S3-AC4 | e2e/fluidity/board-resize.spec.ts | passé |
| F06-S1-AC4 | apps/web/src/state/draft-store.test.ts, e2e/fluidity/arrow-create.spec.ts | passé |
| F04-S1-AC5 | apps/web/src/state/draft-store.test.ts, e2e/fluidity/shape-create.spec.ts | passé |
| F06-S2-AC3 | e2e/fluidity/arrow-edit.spec.ts | passé |
| F07-S2-AC5 | e2e/fluidity/board-move-remote.spec.ts | passé |
| F10-S2-AC2 | apps/web/src/collab/use-local-cursor.test.tsx, e2e/fluidity/presence.spec.ts, packages/model/src/presence.test.ts | passé |

Fluidité :

| Exigence | Scénario | Mesure | Seuil | Vidéo |
|---|---|---|---|---|
| FL-1 | Tracé d’une flèche suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 29.9 ms | ≤ 150 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une flèche sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-create--F06-94da2-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Glisser d’une extrémité de flèche sur un board de 300 éléments (300 ms de latence) | 47.4 ms | ≤ 150 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’une extrémité de flèche sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-arrow-edit--F06-S-f2de8-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Recadrage d’un board de 300 éléments (300 ms de latence) | 9.5 ms | ≤ 150 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Recadrage d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-fit--F02-S4-693f3-within-the-fluidity-targets-fluidity/video.webm |
| FL-4 | Déplacement continu d’un élément vu par un autre utilisateur (F07-S2-AC5) | 19.8 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-5 | Sélection et viewport de l’observateur stables pendant un déplacement distant | — | binaire : sélection, élément observé et viewport conservés | test-results/fluidity-board-move-remote-84516-out-disturbing-the-observer-fluidity/video.webm |
| FL-1 | Déplacement d’un élément sur un board de 300 éléments (300 ms de latence) | 42.4 ms | ≤ 150 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser d’un élément sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Glisser d’un élément sur un board de 300 éléments (tâche longue max) | 127.0 ms | ≤ 200 ms | test-results/fluidity-board-move--F07-S-3fb98-within-the-fluidity-targets-fluidity/video.webm |
| FL-7 | Ouverture d’un board de 300 éléments mélangés depuis le menu | 187.1 ms | ≤ 3000 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Ouverture d’un board de 300 éléments mélangés (tâche longue max) | 81.0 ms | ≤ 200 ms | test-results/fluidity-board-open--F02-S-6cba9-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Pan d’un board de 300 éléments | 17.3 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Pan d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-pan--F02-S1-96e98--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Redimensionnement d’un élément sur un board de 300 éléments (300 ms de latence) | 48.8 ms | ≤ 150 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Redimensionnement d’un élément sur un board de 300 éléments | 16.6 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-3 | Redimensionnement d’un élément sur un board de 300 éléments (tâche longue max) | 88.0 ms | ≤ 200 ms | test-results/fluidity-board-resize--F07-f9777-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Création d’un post-it avec 300 ms de latence réseau (F09-S1-AC4) | 14.9 ms | ≤ 150 ms | test-results/fluidity-board-sync--F09-S-474b9-less-remotely-under-latency-fluidity/video.webm |
| FL-2 | Zoom d’un board de 300 éléments | 17.2 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-3 | Zoom d’un board de 300 éléments (tâche longue max) | 0.0 ms | ≤ 200 ms | test-results/fluidity-board-zoom--F02-S-665b0--element-board-free-of-jank-fluidity/video.webm |
| FL-1 | Suppression d’un élément sur un board de 300 éléments (300 ms de latence) | 120.3 ms | ≤ 150 ms | test-results/fluidity-delete--F08-S1-AC-19bb7-n-the-local-feedback-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board vide depuis le menu | 163.9 ms | ≤ 1000 ms | test-results/fluidity-empty-board--T-00-c5524--within-the-fluidity-target-fluidity/video.webm |
| FL-7 | Ouverture d’un board depuis le menu | 93.5 ms | ≤ 1000 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-3 | Transition menu → board (aucune tâche longue > 200 ms) | 0.0 ms | ≤ 200 ms | test-results/fluidity-menu-board--F01-S-b63fe-nsitions-free-of-long-tasks-fluidity/video.webm |
| FL-4 | Déplacement continu du curseur distant (F10-S2-AC2) | 5.3 ms | ≥ 5 positions intermédiaires, dernière ≤ 500 ms | test-results/fluidity-presence--F10-S2--493ab-t-within-the-latency-budget-fluidity/video.webm |
| FL-1 | Tracé d’une forme suivant le pointeur sur un board de 300 éléments (300 ms de latence) | 13.1 ms | ≤ 150 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-2 | Glisser de tracé d’une forme sur un board de 300 éléments | 16.2 ms | médiane ≤ 33 ms, aucun intervalle > 200 ms | test-results/fluidity-shape-create--F04-ebcd6-within-the-fluidity-targets-fluidity/video.webm |
| FL-1 | Changement de couleur d’un post-it sur un board de 300 éléments (300 ms de latence) | 87.1 ms | ≤ 150 ms | test-results/fluidity-sticky-color--F03-d7b23-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Création d’un post-it sur un board de 300 éléments (300 ms de latence) | 126.3 ms | ≤ 150 ms | test-results/fluidity-sticky-create--F0-b95cb-n-the-local-feedback-target-fluidity/video.webm |
| FL-1 | Frappe dans un post-it sur un board de 300 éléments (300 ms de latence) | 1.7 ms | ≤ 150 ms | test-results/fluidity-sticky-edit--F03--0d640--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un post-it pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-sticky-edit--F03--43cad-ther-user-changes-the-board-fluidity/video.webm |
| FL-1 | Frappe dans un texte libre sur un board de 300 éléments (300 ms de latence) | 1.7 ms | ≤ 150 ms | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-6 | Frappe rapide de 200 caractères dans un texte libre | — | binaire : aucun caractère perdu ni réordonné | test-results/fluidity-text-create--F05--dc447--on-a-board-of-300-elements-fluidity/video.webm |
| FL-5 | Édition d’un texte libre pendant qu’un autre utilisateur modifie le board | — | binaire : contenu et curseur conservés | test-results/fluidity-text-create--F05--ad69c-ther-user-changes-the-board-fluidity/video.webm |

Remarques : —

## Synthèse de l'agent

### Travail réalisé

| Étape | Commit | Résumé |
|---|---|---|
| 1 | MZK-2#5 | `measureActionToEffect` date l'effet à la première image d'animation où un prédicat in-page devient vrai ; migration des 19 appels (18 fichiers) et test `[B-004-AC1]` |

### Tests ajoutés, modifiés ou supprimés

| Fichier | Action | Raison |
|---|---|---|
| e2e/support/action-effect.ts | modifié : `measureActionToEffect` reçoit un prédicat navigateur autonome `(arg) => boolean` + argument sérialisable, évalué à chaque image (`page.waitForFunction`) et daté par `performance.now()` | B-004-AC1, ADR-0015 |
| e2e/fluidity/utilities.spec.ts | ajouté `[B-004-AC1]` ; modifié `[T-004-AC4]` | Nouveau critère (datation à la 2e image sous 100 ms) ; adaptation à la nouvelle API, mêmes bornes |
| e2e/fluidity/board-open.spec.ts | modifié `[F02-S3-AC1]` ; helper `elementCount` supprimé | Effet exprimé comme prédicat in-page ; helper devenu inutilisé (code mort interdit) |
| e2e/fluidity/menu-board.spec.ts | modifié `[F01-S2-AC6]` | Effet exprimé comme prédicat in-page |
| e2e/fluidity/empty-board.spec.ts | modifié `[T-004-AC6]` | Effet exprimé comme prédicat in-page |
| e2e/fluidity/board-fit.spec.ts | modifié `[F02-S4-AC4]` | Effet exprimé comme prédicat in-page (viewport différent) |
| e2e/fluidity/board-sync.spec.ts | modifié `[F09-S1-AC4]` | Effet exprimé comme prédicat in-page (nombre d'éléments) |
| e2e/fluidity/sticky-create.spec.ts | modifié `[F03-S1-AC4]` | Effet exprimé comme prédicat in-page (nombre d'éléments) |
| e2e/fluidity/sticky-color.spec.ts | modifié `[F03-S3-AC3]` | Effet exprimé comme prédicat in-page (couleur) |
| e2e/fluidity/sticky-edit.spec.ts | modifié `[F03-S2-AC5]` | Effet exprimé comme prédicat in-page (longueur de l'éditeur) |
| e2e/fluidity/text-create.spec.ts | modifié `[F05-S1-AC4]` | Effet exprimé comme prédicat in-page (longueur de l'éditeur) |
| e2e/fluidity/delete.spec.ts | modifié `[F08-S1-AC3]` ; helper `waitForMissing` supprimé | Effet exprimé comme prédicat in-page ; helper devenu inutilisé (code mort interdit) |
| e2e/fluidity/board-move.spec.ts | modifié `[F07-S2-AC4]` | Effet exprimé comme prédicat in-page (`x` au-delà du seuil) |
| e2e/fluidity/board-resize.spec.ts | modifié `[F07-S3-AC4]` | Effet exprimé comme prédicat in-page (largeur au-delà du seuil) |
| e2e/fluidity/arrow-create.spec.ts | modifié `[F06-S1-AC4]` | Effet exprimé comme prédicat in-page (longueur du brouillon) |
| e2e/fluidity/shape-create.spec.ts | modifié `[F04-S1-AC5]` | Effet exprimé comme prédicat in-page (largeur du brouillon) |
| e2e/fluidity/arrow-edit.spec.ts | modifié `[F06-S2-AC3]` | Effet exprimé comme prédicat in-page (`x2` au-delà du seuil) |
| e2e/fluidity/board-move-remote.spec.ts | modifié `[F07-S2-AC5]` | Effet exprimé comme prédicat in-page (position chez l'observateur) |
| e2e/fluidity/presence.spec.ts | modifié `[F10-S2-AC2]` | Effet exprimé comme prédicat in-page (curseur distant) |

Aucun test supprimé ni désactivé. Assertions fonctionnelles, seuils de F00, 3 exécutions et médiane inchangés. Les mesures FL-1 baissent (par ex. `[F06-S2-AC3]` : 47,4 ms contre 160,1 ms cités sur MZK-1) ; toutes restent sous les seuils.

### Points ouverts

Aucun.
