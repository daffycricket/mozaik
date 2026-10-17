# Plan : MZK-1 Recadrer la vue sur tout le contenu

Écrit par l'agent de design, commenté par l'humain sur la carte en tech review, exécuté tel quel en phase dev. Le titre de chaque étape suit exactement le format `### Étape <n> : <titre>`, lu par `pnpm report`.

## Éléments de spec couverts

Repris de la sous-section Spec du ticket dans le journal.

| Élément | Changement | Résumé |
|---|---|---|
| F02-S4-AC1 | ajouté | `Shift+1` recadre la vue : contenu centré et entièrement visible, marge `FIT_PADDING = 48 px`, dézoom si le contenu dépasse le viewport |
| F02-S4-AC2 | ajouté | Sur un board vide, le viewport revient aux valeurs par défaut (100 %, origine) |
| F02-S4-AC3 | ajouté | Le zoom de recadrage reste borné à 10 %–400 % et le centre du contenu reste au centre du viewport |
| F02-S4-AC4 | ajouté | Fluidité : le recadrage respecte FL-1 et FL-3 (F00) sur un board de 300 éléments |
| F02 (règle métier) | ajouté | Règle de recadrage : `Shift+1` (touche physique 1, disposition indifférente), `FIT_PADDING = 48 px`, dézoom si le contenu dépasse le viewport |

## Analyse d'impact

- **Modules et fichiers** :
  - `packages/model/src/viewport.ts` : constante `FIT_PADDING = 48` et fonction pure `fitViewport(bounds: Box | null, canvas: { width; height }): Viewport` (zoom = plus petit rapport disponible/contenu, borné par `clampZoom`, contenu recentré ; `bounds` nul → `DEFAULT_VIEWPORT`). `Box` est importé en `import type` depuis `geometry.ts` (aucun cycle à l'exécution).
  - `apps/web/src/state/viewport-store.ts` : action `fitToContent(bounds: Box | null, canvas: CanvasSize)` qui écrit le viewport, au même titre que `panByScreen`/`zoomTo`/`zoomBy`/`resetViewport`.
  - `apps/web/src/tools/shortcuts.ts` : hook `useFitShortcut(doc)`, actif sur `event.code === 'Digit1'` + `Shift` (touche physique, indépendant de la disposition), inactif en édition de texte et sans `Ctrl`/`Meta`/`Alt` ; calcule la boîte englobante via `unionBounds(getElements(doc))` et appelle `fitToContent` avec `useCanvasSizeStore`.
  - `apps/web/src/canvas/board-canvas.tsx` : montage de `useFitShortcut(doc)` à côté des autres raccourcis qui dépendent de `doc`.
  - Nouveaux tests : `packages/model/src/viewport-fit.test.ts`, `apps/web/src/state/viewport-store-fit.test.ts`, `apps/web/src/tools/fit-shortcut.test.tsx`, `e2e/board-fit.spec.ts`, `e2e/fluidity/board-fit.spec.ts`.
- **Tests hérités concernés** : aucun. `viewport-zoom.test.ts`, `viewport-pan.test.ts`, `zoom-shortcuts.test.tsx` et `e2e/board-zoom.spec.ts` restent inchangés (le nouveau raccourci ne modifie pas `Ctrl+0`).
- **Données** : aucun changement du modèle de board, pas de migration. Le viewport reste local et non persisté.
- **Fluidité (F00)** : nouvelle mesure pour F02-S4-AC4 (FL-1 action → effet local ≤ 150 ms avec 300 ms de latence simulée, FL-3 aucune tâche longue > 200 ms) sur un board de 300 éléments. Aucun seuil F00 modifié.
- **Documents à mettre à jour** : `docs/architecture.md` (`viewport.ts` gagne `fitViewport`/`FIT_PADDING`, `shortcuts.ts` gagne `useFitShortcut`, flux « Recadrage »). Aucun changement de `docs/design/` : pas de composant ni de règle `UI-*` nouvelle (le raccourci ne modifie pas `UI-BOARD-5`, qui ne liste que −, pourcentage, +).
- **ADR** : aucun. Décision locale (fonction pure + action de store + hook), sans impact structurant sur l'architecture ou le modèle.

## Étapes

| N° | Nom | Description | Éléments |
|---|---|---|---|
| 1 | Recadrage sur tout le contenu | Fonction de calcul, action de store, raccourci `Shift+1`, montage, tests unitaires, e2e et fluidité, documentation | F02-S4-AC1, F02-S4-AC2, F02-S4-AC3, F02-S4-AC4 |

### Étape 1 : Recadrage sur tout le contenu

- Éléments couverts : F02-S4-AC1, F02-S4-AC2, F02-S4-AC3, F02-S4-AC4.
- Code : `fitViewport` + `FIT_PADDING` dans `packages/model/src/viewport.ts` ; `fitToContent` dans `viewport-store.ts` ; `useFitShortcut` dans `tools/shortcuts.ts` ; montage dans `canvas/board-canvas.tsx`.
- Tests :
  - unitaire `packages/model/src/viewport-fit.test.ts` : `[F02-S4-AC1]` contenu plus petit que le canvas (centré, marge ≥ `FIT_PADDING` sur l'axe contraignant), `[F02-S4-AC1]` contenu plus grand que le viewport mais dans les bornes (dézoom, entièrement visible), `[F02-S4-AC2]` boîte nulle → `DEFAULT_VIEWPORT`, `[F02-S4-AC3]` zoom demandé sous `MIN_ZOOM`/au-dessus de `MAX_ZOOM` → borné et contenu toujours centré, contenu de dimension nulle sur un axe (flèche horizontale) ;
  - unitaire `apps/web/src/state/viewport-store-fit.test.ts` : `[F02-S4-AC1]`/`[F02-S4-AC2]` l'action met le viewport attendu ;
  - unitaire `apps/web/src/tools/fit-shortcut.test.tsx` : `[F02-S4-AC1]` `Shift+1` recadre, `[F02-S4-AC2]` board vide → défaut, touche reconnue par `event.code` (événement avec `code: 'Digit1'` et un `key` différent déclenche), inactif en édition de texte et avec `Ctrl`/`Alt` ;
  - e2e `e2e/board-fit.spec.ts` : `[F02-S4-AC1]` board de contenu plus petit et plus grand que le viewport (centre du contenu au centre du canvas, marge ≥ `FIT_PADDING`), `[F02-S4-AC2]` board vide → viewport par défaut, `[F02-S4-AC3]` board assez grand pour demander un zoom < 10 % → zoom borné et centre conservé ;
  - e2e fluidité `e2e/fluidity/board-fit.spec.ts` : `[F02-S4-AC4]` FL-1 et FL-3 sur un board de 300 éléments, mesures enregistrées via `recordFluidityMeasure`.
- Documentation : `docs/architecture.md` mis à jour dans le même commit.
- Terminée quand : `pnpm verify` est vert et `pnpm report MZK-1 --step 1` est écrit.

## Risques

- **Disposition du clavier** : se fier à `event.code === 'Digit1'` et non à `event.key`, pour que la touche physique 1 soit reconnue en AZERTY comme en QWERTY. Le test unitaire couvre le cas `key` ≠ `'1'`.
- **Conflit avec `useToolShortcuts`** : il lit `event.key` et ignore `Shift` ; `'1'`/`'!'` ne correspond à aucun outil, aucun conflit attendu, à vérifier par un test e2e.
- **Contenu de dimension nulle** (flèche parfaitement horizontale ou verticale) : ne pas diviser par zéro ; traiter l'axe de dimension nulle comme non contraignant.
- **Canvas non mesuré (0 × 0)** au premier rendu : replier sur `DEFAULT_VIEWPORT` plutôt que produire un zoom `NaN`.
- **Tension AC1/AC3** pour un contenu très grand : le zoom est borné (`clampZoom`) et le contenu reste centré ; il n'est « entièrement visible » que lorsque le zoom requis est dans les bornes, comme prévu par AC3.
- **Mesure FL-1** : le recadrage est idempotent (deux appuis donnent le même viewport) ; perturber le viewport entre les 3 exécutions de la mesure pour que l'effet soit observable.
