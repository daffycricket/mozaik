# ADR-0003 : Rendu du canvas avec Konva

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Il faut afficher un canvas infini avec pan/zoom, quelques centaines d'éléments (cible : 300), de la sélection, des poignées de redimensionnement et des flèches, avec une interaction fluide (F00). Le projet est open source : toute brique réutilisée doit avoir une licence permissive.

## Décision

Konva via react-konva (MIT). Le SDK tldraw est exclu : sa licence exige une clé en production, sans laquelle l'éditeur cesse de s'afficher ([tldraw.dev/sdk-features/license-key](https://tldraw.dev/sdk-features/license-key)).

Konva fournit nativement le clic sur un objet, le glisser et les poignées de redimensionnement, et la cible de 300 éléments est largement dans ses capacités.

## Conséquences

- Le DOM ne reflète pas le contenu du board : les tests e2e passent par `window.__board` (voir `process/testing.md`).
- L'édition de texte se fait par une zone de texte HTML positionnée en surimpression du canvas.
- Reconsidérer (PixiJS ou rendu maison) si les seuils FL-2 et FL-3 ne sont pas tenus sur un board de 300 éléments.
