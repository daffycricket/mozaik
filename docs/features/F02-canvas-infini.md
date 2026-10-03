# F02 : Canvas infini, pan et zoom

- ADR liés : ADR-0003
- Dépend de : F01

## Objectif

L'utilisateur se déplace librement sur une surface sans limite et zoome pour voir le détail ou l'ensemble.

## Règles métier

- Zoom entre 10 % et 400 %. Zoom par défaut à l'ouverture : 100 %, centré sur l'origine (0, 0).
- Le zoom à la molette (avec Ctrl/Cmd) ou au pincement du pavé tactile est centré sur le pointeur.
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

## Hors périmètre

- Ajuster le zoom à l'ensemble du contenu, mini-carte, viewport partagé, tactile mobile, boards de plusieurs milliers d'éléments.
