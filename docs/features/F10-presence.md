# F10 : Identité et présence

- ADR liés : ADR-0004, ADR-0008
- Dépend de : F01-S1

## Objectif

Sans authentification, chaque utilisateur se présente par un simple nom. Sur un board, chacun voit où sont les autres et suit leurs déplacements.

## Règles métier

- Le nom est libre : 1 à 30 caractères après suppression des espaces de début et de fin, tous caractères imprimables acceptés (ex. « Nicolas », « Nico L », « Lama Flamboyant »). Deux utilisateurs peuvent porter le même nom.
- Le nom est mémorisé dans le navigateur (`localStorage`) avec un identifiant aléatoire. Il est demandé une seule fois par navigateur.
- Si aucun nom n'est mémorisé, la saisie du nom s'affiche **juste avant l'entrée dans un board**, que l'utilisateur vienne du menu ou d'une URL directe. Le menu des boards ne demande pas de nom.
- Couleur de l'utilisateur dérivée de son identifiant, dans une palette de 12 couleurs contrastées (distincte de la palette des éléments).
- Présence = curseurs uniquement : on voit le curseur d'un autre utilisateur quand il est dans la partie visible de son propre écran ; rien n'est affiché pour un utilisateur hors de l'écran.

## Palette des curseurs

Douze couleurs, distinctes de la palette des éléments (`features/README.md`). L'étiquette du curseur est en blanc (jeton `--cursor-label-text`). La couleur d'un utilisateur est déterministe : hachage FNV-1a de son identifiant, modulo 12.

| # | Couleur | # | Couleur |
|---|---|---|---|
| 1 | `#E11D48` | 7 | `#0891B2` |
| 2 | `#DB2777` | 8 | `#0D9488` |
| 3 | `#9333EA` | 9 | `#16A34A` |
| 4 | `#7C3AED` | 10 | `#CA8A04` |
| 5 | `#4F46E5` | 11 | `#EA580C` |
| 6 | `#2563EB` | 12 | `#DC2626` |

## Stories

### F10-S1 : Saisir son nom avant d'entrer dans un board

**Critères d'acceptance**

- **F10-S1-AC1** : utilisateur inconnu arrivant par une URL partagée
  - Étant donné un navigateur sans nom mémorisé
  - Quand j'ouvre directement `/b/<id>`
  - Alors un dialogue (`data-testid="name-dialog"`) demande mon nom avant que le contenu du board soit affiché ; je n'apparais pas chez les autres tant que je n'ai pas validé
- **F10-S1-AC2** : utilisateur inconnu arrivant du menu
  - Étant donné un navigateur sans nom mémorisé, sur le menu des boards
  - Quand je clique sur un board
  - Alors le même dialogue s'affiche avant l'entrée dans le board
- **F10-S1-AC3** : validation
  - Quand je saisis « Lama Flamboyant » et valide avec Entrée ou le bouton
  - Alors j'entre dans le board et mon nom est mémorisé
- **F10-S1-AC4** : nom invalide
  - Quand je valide un nom vide, composé d'espaces, ou de plus de 30 caractères
  - Alors la validation est refusée avec un message, et je reste sur le dialogue
- **F10-S1-AC5** : nom mémorisé
  - Quand je rouvre un board, par le menu ou par URL, dans le même navigateur
  - Alors le dialogue ne s'affiche pas
- **F10-S1-AC6** : renoncer
  - Quand je clique sur « Retour aux boards » dans le dialogue
  - Alors j'arrive sur le menu des boards sans être entré dans le board

### F10-S2 : Voir où sont les autres

**Critères d'acceptance**

- **F10-S2-AC1** : curseur nommé
  - Étant donné deux utilisateurs « Nico L » et « Lama Flamboyant » sur le board
  - Quand « Nico L » déplace sa souris sur le canvas
  - Alors « Lama Flamboyant » voit un curseur à la couleur de « Nico L », étiqueté de son nom, à la position monde correspondante (vérifié via `window.__board.getPeers()`)
- **F10-S2-AC2** : suivre les déplacements
  - Quand « Nico L » déplace sa souris pendant 1 s
  - Alors le curseur affiché chez « Lama Flamboyant » se déplace de façon continue (FL-4)
- **F10-S2-AC3** : hors écran
  - Quand le curseur de « Nico L » est hors de la partie visible chez « Lama Flamboyant »
  - Alors aucun curseur ni indicateur n'est affiché pour lui
- **F10-S2-AC4** : départ
  - Quand « Nico L » ferme son onglet ou revient au menu
  - Alors son curseur disparaît chez les autres en ≤ 5 s
- **F10-S2-AC5** : trois utilisateurs
  - Étant donné trois utilisateurs sur le board
  - Alors chacun voit les curseurs des deux autres, avec des couleurs distinctes

## Hors périmètre

- Liste ou avatars des présents, indicateur de direction pour un utilisateur hors écran, rejoindre la vue d'un autre, sélection des autres, modification du nom, chat.
