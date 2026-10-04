# Glossaire

Terme métier (documentation, français) → identifiant dans le code (anglais).

| Terme | Code | Définition |
|---|---|---|
| Board | `Board` | Un espace de travail : métadonnées (SQLite) + document Yjs |
| Élément | `Element` | Tout objet posé sur le board |
| Post-it | `sticky` | Élément coloré carré contenant du texte |
| Forme | `rect`, `ellipse` | Rectangle ou ellipse avec texte optionnel |
| Texte | `text` | Texte libre sans fond |
| Flèche | `arrow` | Segment libre entre deux points, avec une pointe à l'arrivée |
| Palette | `PaletteColor` | Les 10 couleurs fixes des post-its et des textes |
| Menu des boards | `BoardListPage` | Page `/` listant tous les boards |
| Fluidité | `fluidity` | Exigences FL-1 à FL-8 de F00, mesurées dans le navigateur |
| Redimensionnement | `resize` | Changement de largeur et hauteur d'un élément par une poignée du cadre ; taille minimale `MIN_ELEMENT_SIZE` |
| Ordre de superposition | `order`, `zIndex` | Position d'un élément dans le plan (devant/derrière), clé `zIndex` ; avancer/reculer d'un plan via `bringForward`/`sendBackward` (F07-S4) |
| Viewport | `viewport` | Partie visible du canvas : position et zoom, locale à l'utilisateur |
| Coordonnées monde | `world` | Repère du board, indépendant du zoom |
| Coordonnées écran | `screen` | Pixels dans la fenêtre du navigateur |
| Présence | `presence`, `awareness` | État éphémère partagé : utilisateur et position de son curseur |
| Identité | `UserIdentity` | Nom et identifiant aléatoires d'un utilisateur, mémorisés dans le navigateur (`localStorage`) |
| Pair | `peer` | Autre utilisateur connecté au même board |
| Origine locale | `LOCAL_ORIGIN` | Marqueur des transactions Yjs faites par l'utilisateur local, suivies par l'annulation |
| Historique | `BoardHistory` | `Y.UndoManager` d'un board, limité aux transactions de l'utilisateur local ; une action (glisser, flèches, création) = une entrée |
| Jeton de design | `PROJECT_TOKENS` | Valeur visuelle propre au projet (canvas, sélection, mise en page), déclarée dans `index.css` et exposée au canvas par `theme-tokens.ts` |
| Boîtes de superposition | `OverlayBoxes` | Positions à l'écran du cadre de sélection, de ses poignées et des curseurs distants, exposées aux tests e2e par `getOverlayBoxes()` |
