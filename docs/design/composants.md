# Composants

Position et dimensions de référence : `ecrans.md`. Apparence : shadcn/ui et jetons de `charte.md`. La colonne « shadcn/ui » indique le composant à ajouter avec `pnpm dlx shadcn@latest add <nom>` ; « sur mesure » signifie un composant du projet, construit avec les classes du thème.

## Menu des boards

| Composant | `data-testid` | shadcn/ui | Description | Clavier |
|---|---|---|---|---|
| Bouton Nouveau board | `board-create` | `button` (variante par défaut) | Icône `plus` + libellé ; désactivé pendant la création | Entrée, Espace |
| Liste des boards | `board-list` | sur mesure | `role="list"`, bordure et coins du thème | |
| Ligne de board | `board-item` | sur mesure | `role="listitem"` contenant un lien vers `/b/<id>` ; nom en gras, date relative en `text-muted-foreground` ; fond `bg-accent` au survol | Tab, Entrée |
| Bouton Supprimer | `board-delete` | `button` (variante `ghost`, taille icône) | Icône `trash-2`, `text-destructive` au survol | Entrée, Espace |
| État vide | `board-empty` | sur mesure | Message + bouton `board-empty-create` | |
| Dialogue de suppression | `delete-dialog` | `alert-dialog` | Boutons `delete-cancel` et `delete-confirm` (variante `destructive`) | focus piégé ; Échap = Annuler |

## Board

| Composant | `data-testid` | shadcn/ui | Description | Clavier |
|---|---|---|---|---|
| En-tête | `board-header` | sur mesure | `role="banner"`, `bg-background`, bordure basse | |
| Lien retour | `nav-boards` | `button` (variante `ghost`) | Icône `arrow-left` + « Boards » | Entrée |
| Nom du board | `board-name` | `input` en édition | Texte en gras ; au clic devient le champ `board-name-input` | Entrée valide, Échap annule |
| Canvas | `board-canvas` | sur mesure | Conteneur du stage Konva, occupe l'espace restant | |
| Barre d'outils | `toolbar` | `toggle-group`, `separator`, `button`, `tooltip` | Conteneur `role="toolbar"` vertical ; outils `tool-<nom>` (`select`, `hand`, `sticky`, `rect`, `ellipse`, `text`, `arrow`) en groupe à choix unique, outil actif `aria-pressed="true"` ; séparateur ; `undo`, `redo` en boutons `ghost`, désactivés sans historique | raccourcis de `features/README.md` ; flèches haut/bas entre les boutons |
| Contrôles de zoom | `zoom-controls` | `button` (`ghost`, icône), `tooltip` | `zoom-out`, pourcentage `zoom-level`, `zoom-in`, puis `zoom-fit` (icône `maximize`, infobulle « Recadrer sur tout le contenu (Shift+1) ») | `Ctrl+-`, `Ctrl+=`, `Ctrl+0`, `Shift+1` |
| Barre contextuelle | `context-bar` | `toggle-group`, `separator`, `button`, `tooltip` | `role="toolbar"` ; pastilles `color-<code>` (24 px, rondes, `aria-pressed` sur la couleur courante) ; séparateur ; `order-forward`, `order-backward`, désactivés aux limites (F07-S4-AC3) | Tab entre les boutons |
| Zone de saisie de texte | `text-editor` | sur mesure | `textarea` transparent, cadre `--selection`, superposé à l'élément | Entrée ou Échap valide ; Shift+Entrée = retour à la ligne |
| Cadre de sélection | (rendu Konva) | aucun | Cadre 1 px `--selection`, poignées 8 × 8 px fond blanc bordure `--selection` | |
| Curseur distant | (rendu Konva) | aucun | Flèche 16 px couleur de l'utilisateur, étiquette arrondie de même couleur, texte blanc 12 px | |

## Dialogues et messages

| Composant | `data-testid` | shadcn/ui | Description | Clavier |
|---|---|---|---|---|
| Dialogue de nom | `name-dialog` | `dialog`, `input`, `label`, `button` | Non fermable par clic extérieur ni Échap ; champ `name-input`, lien `name-back` (variante `link`), bouton principal `name-submit`, message `name-error` en `text-destructive` | focus initial sur le champ ; Entrée valide |
| Board introuvable | `board-not-found` | `button` | Page centrée : titre, texte, bouton `nav-boards` | |
| Board supprimé | `board-deleted` | `alert-dialog` | Message et bouton unique `nav-boards` ; non fermable autrement | |
