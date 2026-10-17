# Plan : MZK-3 Bouton pour recadrer la vue sur tout le contenu

Écrit par l'agent de design, commenté par l'humain sur la carte en tech review, exécuté tel quel en phase dev. Le titre de chaque étape suit exactement le format `### Étape <n> : <titre>`, lu par `pnpm report`.

## Éléments de spec couverts

Repris de la sous-section Spec du ticket dans le journal.

| Élément | Changement | Résumé |
|---|---|---|
| F02-S4-AC5 | ajouté | Un clic sur le bouton de recadrage fait exactement comme `Shift+1` (marge, dézoom, board vide, bornes) |
| UI-BOARD-5 | modifié | Ordre du groupe : −, pourcentage, +, puis le bouton de recadrage (icône explicite, infobulle mentionnant `Shift+1`) |
| F02-S4 (règle métier) | modifié | Le recadrage a deux déclencheurs : `Shift+1` et le bouton des contrôles de zoom |
| F02-S4-AC4 | inchangé | La fluidité reste couverte par `Shift+1` : le bouton déclenche la même action, aucun seuil nouveau |

## Analyse d'impact

- **Modules et fichiers** :
  - `apps/web/src/components/board/zoom-controls.tsx` : nouveau bouton `zoom-fit` (icône `Maximize`, `aria-label`, infobulle) après `zoom-in` ; lit le document par le contexte (`useBoardDoc()`, comme `ContextBar`) et appelle la fonction de recadrage partagée.
  - `apps/web/src/canvas/fit-content.ts` (nouveau) : `fitViewportToContent(doc, canvas)` extrait de `useFitShortcut` ; source unique de la logique « recadrer sur tout le contenu ».
  - `apps/web/src/tools/shortcuts.ts` : `useFitShortcut` appelle `fitViewportToContent` ; comportement de `Shift+1` inchangé.
  - `apps/web/src/components/ui/tooltip.tsx` (nouveau) : composant `tooltip` de shadcn/ui (Base UI), conformément à `charte.md` et `composants.md`.
- **Tests hérités concernés** :
  - `apps/web/src/components/board/zoom-controls.test.tsx` : test `[UI-BOARD-5]` étendu à `zoom-fit` (ordre) — règle modifiée par le ticket, modification légitime (entrée `test` au journal).
  - `e2e/layout/board-zoom.spec.ts` : test `[UI-BOARD-5]` étendu à `zoom-fit` (ordre et infobulle) — même règle (entrée `test` au journal).
  - `apps/web/src/tools/fit-shortcut.test.tsx` : inchangé, le comportement de `Shift+1` ne change pas.
- **Données** : aucun changement du modèle de board, pas de migration.
- **Fluidité (F00)** : aucun seuil à remesurer ni nouveau critère ; `[F02-S4-AC4]` couvre déjà l'action déclenchée par le bouton.
- **Documents à mettre à jour** : `docs/architecture.md` (le recadrage a deux déclencheurs et une fonction partagée) ; `docs/design/composants.md` est déjà à jour (spec) ; aucun changement de `glossary.md`.
- **ADR** : aucun ; décision d'implémentation locale, sans impact sur l'architecture ni le modèle de données.

## Étapes

| N° | Nom | Description | Éléments |
|---|---|---|---|
| 1 | Bouton de recadrage | Fonction partagée, bouton `zoom-fit`, infobulle, tests | F02-S4-AC5, UI-BOARD-5 |

### Étape 1 : Bouton de recadrage

- Éléments couverts : F02-S4-AC5, UI-BOARD-5.
- Code : `canvas/fit-content.ts` (`fitViewportToContent`), `tools/shortcuts.ts` (réutilise la fonction), `components/board/zoom-controls.tsx` (bouton `zoom-fit` : icône `Maximize`, `aria-label` et infobulle « Recadrer sur tout le contenu (Shift+1) »), `components/ui/tooltip.tsx`.
- Tests :
  - unitaire `zoom-controls.test.tsx` : `[UI-BOARD-5]` étendu (ordre −, pourcentage, +, bouton de recadrage ; nom accessible mentionnant `Shift+1`) et `[F02-S4-AC5]` (un clic recadre le viewport sur la boîte englobante du contenu) ;
  - e2e `board-fit.spec.ts` : `[F02-S4-AC5]` sur un contenu plus petit que le viewport, plus grand (dézoom), un board vide (retour au viewport par défaut) et un contenu qui borne le zoom (F02-S4-AC3) ;
  - layout `board-zoom.spec.ts` : `[UI-BOARD-5]` étendu à `zoom-fit` (ordre et infobulle) aux deux viewports de référence, `[UI-BOARD-6]` inchangé (le groupe agrandi ne chevauche pas la barre d'outils).
- Terminée quand : `pnpm verify` vert et `pnpm report MZK-3 --step 1` écrit.

## Risques

- **Composant `tooltip` absent du projet** : les boutons icône actuels utilisent l'attribut natif `title`. Ajouter `components/ui/tooltip.tsx` via `pnpm dlx shadcn@latest add tooltip` ; si le CLI ou le registre est indisponible, écrire le composant sur le modèle des wrappers Base UI existants (`@base-ui/react` est déjà une dépendance) ; en dernier recours, repli sur `title` avec mise à jour de `composants.md`, tracé au journal.
- **Le `TooltipProvider` ne doit pas casser la mise en page** : utiliser `render={<Button/>}` pour que le `data-testid` et le `onClick` restent sur le bouton, et vérifier que l'ordre de `[UI-BOARD-5]` et l'absence de chevauchement de `[UI-BOARD-6]` restent vrais.
- **Cohérence avec `Shift+1`** : le bouton doit lire `getElements(doc)` au moment du clic (comme le raccourci) via la fonction partagée ; ne pas recalculer une boîte différente.
- **Infobulle en e2e** : si l'ouverture du tooltip au survol est instable, vérifier le nom accessible (`aria-label`) qui contient aussi `Shift+1`.
