# Plan : MZK-42 Confirmer avant une suppression multiple

Écrit par l'agent de design, commenté par l'humain sur la carte en tech review, exécuté tel quel en phase dev. Le titre de chaque étape suit exactement le format `### Étape <n> : <titre>`, lu par `pnpm report`.

## Éléments de spec couverts

Repris de la sous-section Spec du ticket dans le journal.

| Élément | Changement | Résumé |
|---|---|---|
| F08-S1-AC2 | modifié | Suppression directe jusqu'à 9 éléments |
| F08-S1-AC4 | supprimé | Bouton de suppression de la barre d'outils |
| F08-S1-AC6 | ajouté | Confirmation à partir de 10 éléments, avec le nombre |
| F08-S1-AC7 | ajouté | Entrée « Supprimer » du menu contextuel |
| UI-DEL-1 | ajouté | Dialogue de confirmation |

## Analyse d'impact

- **Modules et fichiers** : `apps/web/src/canvas/use-delete.ts` (seuil et appel du dialogue), `apps/web/src/canvas/Toolbar.tsx` (retrait du bouton), nouveau `apps/web/src/canvas/ContextMenu.tsx`, `apps/web/src/components/ui/dialog.tsx` (ajouté par la CLI shadcn).
- **Tests hérités concernés** : `e2e/delete.spec.ts` (`[F08-S1-AC2]`, modifié), `e2e/toolbar.spec.ts` (`[F08-S1-AC4]`, supprimé), `apps/web/src/canvas/Toolbar.test.tsx` (aucun identifiant, modifié : un bouton en moins).
- **Données** : aucun changement du modèle de board, pas de migration.
- **Fluidité (F00)** : aucun impact sur le rendu du canvas, pas de seuil à remesurer.
- **Documents à mettre à jour** : `docs/design/composants.md` (composant Dialog utilisé), `docs/architecture.md` (aucun changement).
- **ADR** : `0013-menu-contextuel` (exemple), créé au design.

## Étapes

| N° | Nom | Description | Éléments |
|---|---|---|---|
| 1 | Dialogue de confirmation | Seuil, dialogue et nombre d'éléments, pour la touche Suppr | F08-S1-AC2, F08-S1-AC6, UI-DEL-1 |
| 2 | Menu contextuel | Entrée « Supprimer » du clic droit, retrait du bouton de la barre d'outils | F08-S1-AC4, F08-S1-AC7 |

### Étape 1 : Dialogue de confirmation

- Éléments couverts : F08-S1-AC2, F08-S1-AC6, UI-DEL-1.
- Code : `use-delete.ts` (constante `CONFIRM_DELETE_THRESHOLD = 10`), composant Dialog de shadcn/ui.
- Tests : e2e `[F08-S1-AC6]` (9 éléments sans dialogue, 10 avec dialogue et nombre affiché), e2e `[UI-DEL-1]` (structure du dialogue), mise à jour de `[F08-S1-AC2]`.
- Terminée quand : `pnpm verify` vert et `pnpm report MZK-42 --step 1` écrit.

### Étape 2 : Menu contextuel

- Éléments couverts : F08-S1-AC4 (suppression), F08-S1-AC7.
- Code : `ContextMenu.tsx`, retrait du bouton dans `Toolbar.tsx`.
- Tests : e2e `[F08-S1-AC7]` ; suppression du test `[F08-S1-AC4]` ; mise à jour de `Toolbar.test.tsx`.
- Terminée quand : `pnpm verify` vert et `pnpm report MZK-42 --step 2` écrit.

## Risques

- Le menu contextuel natif du navigateur s'ouvre aussi : le canvas doit l'empêcher (`preventDefault`) sans bloquer le menu natif hors du canvas.
- Le dialogue prend le focus : vérifier que les raccourcis (Ctrl+Z) fonctionnent à nouveau après sa fermeture.
