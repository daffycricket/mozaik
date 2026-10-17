# Fonctionnalités

Un fichier par fonctionnalité, à partir de [_template.md](_template.md). Chaque fichier contient des stories ; chaque story a des critères d'acceptance identifiés `FNN-SN-ACN` au format Étant donné / Quand / Alors.

**Seul ce qui est décrit ici est développé.** Ce qui figure dans une section « Hors périmètre » ne doit pas être développé, même partiellement.

Ces fichiers décrivent le comportement actuel de Mozaik, sans historique : leurs modifications sont tracées dans [../journal.md](../journal.md). Ils ne changent que pendant les phases spec et spec review d'un ticket, sur la branche du ticket :

- un besoin qu'aucune fonctionnalité ne couvre crée un nouveau fichier `FNN-<nom>.md` (numéro suivant) ;
- si une story existante n'est plus vraie telle qu'écrite (même déclencheur ou objectif, comportement différent), elle est modifiée ;
- si elle reste vraie et que le nouveau comportement a un objectif distinct, livrable et testable seul, une nouvelle story est créée (numéro suivant dans le fichier) ;
- un identifiant de story, de critère ou de règle `UI-*` prend le numéro suivant et n'est jamais réutilisé après suppression.

Un critère d'acceptance est couvert par au moins un test dont le titre commence par son identifiant ([process/testing.md](../process/testing.md)).

| ID | Fonctionnalité |
|---|---|
| [F00](F00-fluidite.md) | Fluidité : exigences transverses FL-1 à FL-8 |
| [F01](F01-gestion-des-boards.md) | Menu des boards, navigation, URL partageable |
| [F02](F02-canvas-infini.md) | Canvas infini : pan et zoom |
| [F03](F03-post-its.md) | Post-its |
| [F04](F04-formes.md) | Formes |
| [F05](F05-texte.md) | Texte libre |
| [F06](F06-fleches.md) | Flèches |
| [F07](F07-selection-transformation.md) | Sélection, déplacement, redimensionnement, avancer/reculer |
| [F08](F08-edition.md) | Supprimer, annuler/rétablir, dupliquer, copier/coller |
| [F09](F09-collaboration-persistance.md) | Collaboration temps réel et persistance |
| [F10](F10-presence.md) | Identité (nom) et présence (curseurs) |

## Conventions transverses d'interaction

Maquettes, navigation et composants : [../design/](../design/README.md).

- Outils de la barre d'outils et raccourcis : Sélection `V`, Main `H`, Post-it `N`, Rectangle `R`, Ellipse `O`, Texte `T`, Flèche `A`. `Échap` revient à l'outil Sélection et quitte l'édition en cours. `Shift+1` (touche physique 1, quelle que soit la disposition du clavier) recadre la vue sur tout le contenu.
- Après la création d'un élément, l'outil actif revient à Sélection et l'élément créé est sélectionné.
- Les raccourcis clavier sont inactifs pendant l'édition d'un texte et pendant la saisie du nom.
- Chaque bouton de la barre d'outils a `data-testid="tool-<nom>"` et un `aria-label`.

## Palette de couleurs

Palette commune aux post-its (teinte « fond ») et aux textes libres (teinte « texte »). Elle est fixe : aucune autre couleur n'est proposée. Les teintes « texte » ont un contraste ≥ 4,5:1 sur fond blanc.

| Nom (`code`) | Fond (post-it) | Texte (texte libre) |
|---|---|---|
| `yellow` | `#FFE58F` | `#8A6D00` |
| `orange` | `#FFC58F` | `#B45309` |
| `red` | `#FFA8A8` | `#C62828` |
| `pink` | `#FFB3D9` | `#AD1457` |
| `purple` | `#D7B8FF` | `#6A1B9A` |
| `blue` | `#A8D1FF` | `#1565C0` |
| `teal` | `#9EE6DC` | `#00695C` |
| `green` | `#B6E8A8` | `#2E7D32` |
| `gray` | `#E0E0E0` | `#4B5563` |
| `black` | `#4B5563` | `#111827` |

Défauts : post-it `yellow`, texte `black`. Les boutons de couleur ont `data-testid="color-<code>"`.
