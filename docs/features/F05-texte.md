# F05 : Texte libre

- ADR liés : ADR-0004
- Dépend de : F03-S2

## Objectif

L'utilisateur pose des titres et des annotations colorés directement sur le canvas, sans fond.

## Règles métier

- Taille de police fixe : 20.
- Couleur : une des 10 couleurs de la palette commune ([README](README.md#palette-de-couleurs)), teinte « texte ». Défaut : `black`.
- La largeur s'adapte au texte jusqu'à 600 unités, puis le texte passe à la ligne. La hauteur suit le contenu.
- Un texte vide à la sortie de l'édition est supprimé.

## Stories

### F05-S1 : Créer et éditer un texte

**Critères d'acceptance**

- **F05-S1-AC1** : création
  - Étant donné l'outil Texte (`T`)
  - Quand je clique au point P
  - Alors un texte vide est créé en P et passe en édition
- **F05-S1-AC2** : suppression d'un texte vide
  - Quand je quitte l'édition sans rien saisir
  - Alors l'élément n'existe plus dans le document
- **F05-S1-AC3** : taille auto
  - Quand je saisis un texte de 3 lignes
  - Alors la hauteur de l'élément correspond à 3 lignes
- **F05-S1-AC4** : fluidité
  - La saisie respecte FL-1, FL-5 et FL-6 (F00)

### F05-S2 : Couleur du texte

**Critères d'acceptance**

- **F05-S2-AC1** : changement de couleur
  - Étant donné un ou plusieurs textes sélectionnés
  - Quand je choisis `red` dans la barre contextuelle (`data-testid="color-red"`)
  - Alors la propriété `color` de tous les textes sélectionnés vaut `red`
- **F05-S2-AC2** : palette complète
  - Alors la barre contextuelle propose exactement les 10 couleurs de la palette commune, la couleur courante étant signalée (`aria-pressed="true"`)
- **F05-S2-AC3** : sélection mixte
  - Étant donné une sélection contenant des post-its et des textes
  - Quand je choisis une couleur
  - Alors les post-its et les textes prennent cette couleur, chacun dans sa teinte (fond ou texte)

## Hors périmètre

- Taille de police modifiable, texte riche (gras, italique, listes), polices personnalisées.
