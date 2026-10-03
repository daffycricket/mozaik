# ADR-0004 : Modèle partagé et synchronisation par CRDT Yjs

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Plusieurs utilisateurs modifient le même board simultanément. Les modifications concurrentes doivent converger sans perte, chaque action locale doit s'afficher sans attendre le serveur (fluidité, F00), et la présence (curseurs) doit être diffusée.

## Décision

Yjs (MIT). Un `Y.Doc` par board, structure décrite dans `architecture.md` : `Y.Map` d'éléments, chaque élément étant lui-même une `Y.Map` (une clé par propriété). Ordre d'affichage par indexation fractionnaire (`fractional-indexing`, CC0). Texte stocké en `string` (dernier écrivain gagne sur la propriété). `Y.UndoManager` limité à l'origine locale.

## Conséquences

- Deux utilisateurs qui déplacent et recolorient le même élément en même temps voient les deux modifications appliquées.
- Deux utilisateurs qui éditent le texte du même post-it en même temps : la dernière validation l'emporte.
- Toute écriture passe par `packages/model/ops` dans une transaction : un seul endroit à tester pour la cohérence.
