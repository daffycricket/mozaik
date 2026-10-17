# Écrans

Maquettes de structure. Les dimensions indiquées sont des cibles ; les règles `UI-*` en fin de section sont les critères vérifiés par les tests (tolérance de position : 4 px). Viewports de référence : 1280 × 800 et 1024 × 768.

## Menu des boards `/`

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Boards                                                 [ + Nouveau board ] │  en-tête, 56 px
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│          ┌──────────────────────────────────────────────────────┐          │
│          │ Rétro S12                       modifié il y a 2 h  🗑 │          │  ligne de board, 48 px
│          ├──────────────────────────────────────────────────────┤          │
│          │ Atelier vision                  modifié hier        🗑 │          │
│          ├──────────────────────────────────────────────────────┤          │
│          │ Board sans titre                modifié le 28/09    🗑 │          │
│          └──────────────────────────────────────────────────────┘          │
│                   liste centrée, largeur max 720 px                        │
└────────────────────────────────────────────────────────────────────────────┘
```

État vide :

```
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│                        Aucun board pour l'instant.                         │
│                          [ + Créer un board ]                              │
│                                                                            │
```

Dialogue de suppression :

```
          ┌──────────────────────────────────────────┐
          │ Supprimer « Rétro S12 » ?                 │
          │ Cette action est définitive.              │
          │                     [ Annuler ] [Supprimer]│   Supprimer en variante destructive
          └──────────────────────────────────────────┘
          fond de page assombri, dialogue centré
```

| ID | Règle | Story |
|---|---|---|
| UI-MENU-1 | L'en-tête occupe toute la largeur en haut de page ; le titre « Boards » est à gauche, le bouton « Nouveau board » à droite. | F01-S2 |
| UI-MENU-2 | La liste est centrée horizontalement, de largeur ≤ 720 px ; les lignes sont empilées sans espace entre elles, séparées par une bordure. | F01-S2 |
| UI-MENU-3 | Dans une ligne : nom aligné à gauche, date de modification à droite, bouton Supprimer (icône) tout à droite. Toute la ligne est cliquable pour ouvrir le board, sauf le bouton Supprimer. | F01-S2 |
| UI-MENU-4 | L'état vide affiche un message et un bouton de création, centrés dans la zone de liste. | F01-S2 |
| UI-MENU-5 | Les lignes sont atteignables à la touche Tab dans l'ordre d'affichage ; Entrée ouvre le board. | F01-S2 |
| UI-MENU-6 | Le dialogue de suppression est modal et centré, le fond est assombri ; le focus initial est sur « Annuler » ; Échap annule. | F01-S4 |

## Board `/b/:id`

```
┌────────────────────────────────────────────────────────────────────────────┐
│ ← Boards │ Rétro S12                                                        │  en-tête, 48 px
├────────────────────────────────────────────────────────────────────────────┤
│ ┌────┐                                                                     │
│ │ ▸  │ V                                                                   │
│ │ ✋ │ H              · · · · · · · · grille de points · · · · · · ·       │
│ │ ▢  │ N                                                                   │
│ │ ▭  │ R              ┌──────────────────────────────────────┐             │
│ │ ◯  │ O              │ ● ● ● ● ● ● ● ● ● ● │ ⤒ Avancer ⤓ Reculer │  barre contextuelle
│ │ T  │ T              └──────────────────────────────────────┘             │
│ │ ↗  │ A                   ┌───────────────┐                               │
│ │────│                     │  post-it      │  cadre de sélection           │
│ │ ↶  │                     │  sélectionné  │  et 8 poignées                │
│ │ ↷  │                     └───────────────┘                               │
│ └────┘                                         ↖ Lama Flamboyant           │  curseur distant
│ barre d'outils flottante                                  ┌──────────────┐ │
│ à gauche, centrée verticalement                           │ −  100 %  +  ⤢ │ │  zoom, en bas à droite
│                                                           └──────────────┘ │
└────────────────────────────────────────────────────────────────────────────┘
```

Édition d'un texte (post-it ou texte libre) : une zone de saisie HTML se superpose exactement à l'élément.

```
                     ┌───────────────┐
                     │ Idée 1|       │  zone de saisie, même police et même taille
                     │               │  que le rendu, cadre --selection
                     └───────────────┘
```

| ID | Règle | Story |
|---|---|---|
| UI-BOARD-1 | L'en-tête occupe toute la largeur en haut ; à gauche le lien « ← Boards » puis le nom du board ; rien à droite. | F01-S2 |
| UI-BOARD-2 | Le canvas occupe tout l'espace sous l'en-tête ; la page n'a aucune barre de défilement. | F02-S1 |
| UI-BOARD-3 | La barre d'outils flotte à gauche (12 px du bord), centrée verticalement dans la zone du canvas. Les outils présents apparaissent dans l'ordre Sélection, Main, Post-it, Rectangle, Ellipse, Texte, Flèche, puis un séparateur, puis Annuler et Rétablir. | F02-S1 |
| UI-BOARD-4 | L'outil actif est mis en évidence (état actif du composant Toggle de shadcn/ui) et porte `aria-pressed="true"`. | F02-S1 |
| UI-BOARD-5 | Les contrôles de zoom flottent en bas à droite (12 px des bords), dans l'ordre −, pourcentage, +. | F02-S2 |
| UI-BOARD-6 | Aucun élément flottant (barre d'outils, zoom, barre contextuelle) n'en chevauche un autre, aux deux viewports de référence. | F02-S2 |
| UI-BOARD-7 | La barre contextuelle apparaît centrée horizontalement au-dessus du cadre de sélection, à 8 px ; s'il n'y a pas la place au-dessus, elle passe en dessous. Elle ne recouvre jamais la sélection. | F03-S3 |
| UI-BOARD-8 | La barre contextuelle montre les pastilles de couleur seulement si la sélection contient un post-it ou un texte, puis les boutons Avancer et Reculer. | F07-S4 |
| UI-BOARD-9 | La zone de saisie de texte recouvre l'élément édité (tolérance 2 px) et utilise la même taille de police que son rendu au zoom courant. | F03-S2 |
| UI-BOARD-10 | Un élément sélectionné est entouré d'un cadre `--selection` de 1 px avec 8 poignées carrées (coins et milieux des côtés) ; une flèche sélectionnée montre 2 poignées rondes à ses extrémités, sans cadre. | F07-S1 |
| UI-BOARD-11 | Le nom du board dans l'en-tête devient un champ éditable au clic, à la même position. | F01-S3 |
| UI-BOARD-12 | Un curseur distant est une flèche à la couleur de l'utilisateur, avec une étiquette de même couleur portant son nom, décalée en bas à droite de la pointe. | F10-S2 |
| UI-BOARD-13 | Le bouton de recadrage sur tout le contenu est placé dans les contrôles de zoom, à côté de −, pourcentage, + ; son icône est explicite et son infobulle mentionne le raccourci `Shift+1`. | F02-S4 |

## Dialogue de nom

Affiché avant l'entrée dans un board, sur un fond neutre (le contenu du board n'est pas visible derrière).

```
          ┌──────────────────────────────────────────┐
          │ Comment t'appelles-tu ?                   │
          │ Ton nom sera visible des autres           │
          │ participants.                             │
          │ ┌──────────────────────────────────────┐ │
          │ │ Lama Flamboyant                      │ │
          │ └──────────────────────────────────────┘ │
          │ message d'erreur éventuel                 │
          │  Retour aux boards           [ Entrer ]   │
          └──────────────────────────────────────────┘
```

| ID | Règle | Story |
|---|---|---|
| UI-NAME-1 | Le dialogue est centré ; le champ a le focus à l'ouverture ; « Entrer » est le bouton principal, à droite ; « Retour aux boards » est un lien, à gauche. | F10-S1 |
| UI-NAME-2 | Le message d'erreur s'affiche sous le champ, en `text-destructive`, et le champ est marqué `aria-invalid="true"`. | F10-S1 |

## Board introuvable et board supprimé

```
┌────────────────────────────────────────────────────────────────────────────┐
│                                                                            │
│                         Board introuvable                                  │
│              Ce board n'existe pas ou a été supprimé.                      │
│                       [ Retour aux boards ]                                │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

Le message « Ce board a été supprimé » (F01-S4-AC4) a la même mise en page, en surimpression modale sur le board.

| ID | Règle | Story |
|---|---|---|
| UI-ERR-1 | Titre, explication et bouton « Retour aux boards » sont centrés horizontalement et verticalement. | F01-S5 |
| UI-ERR-2 | Le message de board supprimé est modal : le board derrière n'est plus manipulable. | F01-S4 |
