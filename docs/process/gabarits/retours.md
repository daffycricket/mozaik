# Retours MZK-42 : Confirmer avant une suppression multiple

Rempli par le script à partir des commentaires de la carte (ou à la main avant l'intégration Trello). Une remarque par ligne, préfixée :

- `[spec]` : la spec du ticket change ;
- `[impl]` : l'implémentation est à corriger, la spec reste juste ;
- `[règle]` : règle transverse, valable pour les tickets suivants (`docs/process/`, `architecture.md`, `design/` ou ADR).

Sans préfixe, l'agent classe lui-même la remarque et marque son classement « À revoir : oui » au journal. Une règle transverse n'est jamais créée sans préfixe `[règle]`.

## Spec review : 2026-10-14

- [spec] Q1 : confirmation à partir de 10 éléments inclus.
- [spec] Le dialogue indique le nombre d'éléments supprimés.

## Tech review : 2026-10-14

- [impl] Réutiliser le composant Dialog de shadcn/ui existant, pas de nouveau composant.
- [règle] Toute action destructive sur plus d'un élément passe par une confirmation.

## Review : 2026-10-16

- [impl] La touche Entrée ne valide pas le dialogue, elle devrait.
- Le texte du bouton de confirmation est un peu long.
