# F04 : Formes

- ADR liés : ADR-0004
- Dépend de : F07-S1

## Objectif

L'utilisateur dessine des rectangles et des ellipses pour structurer l'espace (zones, regroupements).

## Règles métier

- Taille par défaut au clic simple : 160 × 100. Taille minimale : 10 × 10.
- Style fixe : remplissage transparent, contour `#1f2937`, épaisseur 2. Le style n'est pas modifiable.
- Les formes se sélectionnent, se déplacent, se redimensionnent, s'ordonnent et se suppriment comme les autres éléments (F07, F08).

## Stories

### F04-S1 : Dessiner une forme

**Critères d'acceptance**

- **F04-S1-AC1** : dessin par glisser
  - Étant donné l'outil Rectangle (`R`)
  - Quand je fais glisser de A à B
  - Alors un rectangle dont les coins opposés sont A et B est créé et sélectionné
- **F04-S1-AC2** : glisser dans tous les sens
  - Quand je fais glisser de droite à gauche ou de bas en haut
  - Alors le rectangle a une largeur et une hauteur positives et couvre la zone glissée
- **F04-S1-AC3** : clic simple
  - Quand je clique sans glisser
  - Alors une forme de taille par défaut est créée centrée sur le clic
- **F04-S1-AC4** : ellipse et proportions
  - Étant donné l'outil Ellipse (`O`)
  - Quand je fais glisser en maintenant Shift
  - Alors un cercle (largeur = hauteur) est créé
- **F04-S1-AC5** : fluidité
  - Pendant le glisser, la forme en cours de dessin suit le pointeur en respectant FL-1 et FL-2 (F00)

## Hors périmètre

- Autres formes, couleurs de remplissage ou de contour, texte dans une forme, ombres.
