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
| Viewport | `viewport` | Partie visible du canvas : position et zoom, locale à l'utilisateur |
| Coordonnées monde | `world` | Repère du board, indépendant du zoom |
| Coordonnées écran | `screen` | Pixels dans la fenêtre du navigateur |
| Présence | `presence`, `awareness` | État éphémère partagé : utilisateur et position de son curseur |
| Pair | `peer` | Autre utilisateur connecté au même board |
| Origine locale | `LOCAL_ORIGIN` | Marqueur des transactions Yjs faites par l'utilisateur local, suivies par l'annulation |
