# F02 : Canvas infini, pan et zoom

- ADR liés : ADR-0003
- Dépend de : F01

## Objectif

L'utilisateur se déplace librement sur une surface sans limite et zoome pour voir le détail ou l'ensemble.

## Règles métier

- Zoom entre 10 % et 400 %. Zoom par défaut à l'ouverture : 100 %, centré sur l'origine (0, 0).
- Le zoom à la molette (avec Ctrl/Cmd) ou au pincement du pavé tactile est centré sur le pointeur.
- Recadrer la vue, au raccourci `Shift+1` (touche physique 1, quelle que soit la disposition du clavier) ou au bouton des contrôles de zoom, ajuste le zoom et le décalage pour afficher tout le contenu, centré, avec une marge constante `FIT_PADDING = 48 px` (en pixels écran) entre la boîte englobante du contenu et les bords du canvas ; si le contenu est plus grand que le viewport, le recadrage dézoome pour tout afficher. Sur un board vide, le viewport revient aux valeurs par défaut.
- Le viewport est local à chaque utilisateur, non partagé, non persisté.
- Fond : grille de points qui suit le pan et le zoom.
- Volume cible : 300 éléments par board. Aucune exigence au-delà dans un premier temps.

## Stories

### F02-S1 : Se déplacer (pan)

**Critères d'acceptance**

- **F02-S1-AC1** : pan à la molette
  - Étant donné un board avec un élément visible
  - Quand je fais défiler la molette sans modificateur
  - Alors le viewport se déplace et l'élément se déplace à l'écran du même nombre de pixels en sens inverse
- **F02-S1-AC2** : pan à l'outil Main
  - Quand j'active l'outil Main (`H`) et fais glisser sur le canvas
  - Alors le viewport suit le glissement
- **F02-S1-AC3** : pan à la barre d'espace
  - Quand je maintiens Espace et fais glisser, quel que soit l'outil
  - Alors le viewport suit le glissement et l'outil précédent est restauré au relâchement
- **F02-S1-AC4** : fluidité
  - Le pan respecte FL-2 et FL-3 (F00) sur un board de 300 éléments

### F02-S2 : Zoomer

**Critères d'acceptance**

- **F02-S2-AC1** : zoom centré sur le pointeur
  - Étant donné le pointeur au-dessus d'un point monde P
  - Quand je fais Ctrl+molette vers le haut
  - Alors le zoom augmente et P reste sous le pointeur (tolérance 1 px)
- **F02-S2-AC2** : bornes
  - Quand je zoome au-delà des limites
  - Alors le zoom reste entre 10 % et 400 %
- **F02-S2-AC3** : contrôles et raccourcis
  - Quand j'utilise les boutons +/− (`zoom-in`, `zoom-out`), `Ctrl+=`, `Ctrl+-` ou `Ctrl+0`
  - Alors le zoom change par paliers, `Ctrl+0` revient à 100 %, et le pourcentage affiché (`zoom-level`) est à jour
- **F02-S2-AC4** : fluidité
  - Le zoom à la molette respecte FL-2 et FL-3 (F00) sur un board de 300 éléments

### F02-S3 : Board de quelques centaines d'éléments

**Critères d'acceptance**

- **F02-S3-AC1** : ouverture d'un board de 300 éléments
  - Étant donné un board de 300 éléments mélangés (post-its, formes, textes, flèches), pré-rempli par l'API de test du serveur
  - Quand je l'ouvre
  - Alors tous les éléments sont présents dans `window.__board.getElements()` et l'ouverture respecte FL-3 et FL-7 (F00)

### F02-S4 : Recadrer la vue sur tout le contenu

**Critères d'acceptance**

- **F02-S4-AC1** : recadrage au raccourci clavier
  - Étant donné un board avec du contenu, plus petit ou plus grand que le viewport
  - Quand j'appuie sur `Shift+1` (touche physique 1, quelle que soit la disposition du clavier), aucun champ de saisie ni édition de texte n'ayant le focus
  - Alors le contenu est centré et entièrement visible — dézoomé si nécessaire quand il est plus grand que le viewport —, avec une marge d'au moins `FIT_PADDING` (48 px) entre la boîte englobante du contenu et les bords du canvas
- **F02-S4-AC2** : board vide
  - Étant donné un board sans élément
  - Quand j'appuie sur `Shift+1`
  - Alors le viewport revient aux valeurs par défaut (zoom 100 %, centré sur l'origine)
- **F02-S4-AC3** : bornes de zoom
  - Étant donné un contenu qui demanderait un zoom de recadrage hors des bornes
  - Quand je recadre
  - Alors le zoom reste entre 10 % et 400 % et le centre du contenu reste au centre du viewport
- **F02-S4-AC4** : fluidité
  - Le recadrage respecte FL-1 et FL-3 (F00) sur un board de 300 éléments
- **F02-S4-AC5** : recadrage au bouton des contrôles de zoom
  - Étant donné un board avec du contenu, plus petit ou plus grand que le viewport
  - Quand je clique sur le bouton de recadrage des contrôles de zoom (icône explicite, infobulle mentionnant `Shift+1`)
  - Alors le recadrage est identique à `Shift+1` (mêmes règles de marge `FIT_PADDING`, de dézoom, de board vide et de bornes de zoom), et les contrôles de zoom ne chevauchent aucun autre élément flottant aux deux viewports de référence

## Hors périmètre

- Mini-carte, viewport partagé, tactile mobile, boards de plusieurs milliers d'éléments.
