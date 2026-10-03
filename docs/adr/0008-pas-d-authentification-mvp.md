# ADR-0008 : Pas d'authentification dans le MVP

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Le MVP vise la collaboration temps réel en exécution locale. Aucun déploiement n'est prévu à ce stade.

## Décision

Aucune authentification : quiconque connaît l'URL d'un board peut l'ouvrir et le modifier ; l'identité se limite à un nom saisi et mémorisé dans le navigateur.

## Conséquences

- Ne jamais exposer le serveur sur un réseau non maîtrisé en l'état (mention dans le README).
