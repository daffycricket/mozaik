# ADR-0012 : Routage client minimal sans dépendance

- Statut : Accepted
- Date : 2026-10-04
- Décideurs : agent
- Liens : F01, F01-S1, [architecture.md](../architecture.md)

## Contexte

L'application expose deux routes côté client : `/` (menu des boards) et `/b/:id` (board). Les URL sont partageables, la navigation ajoute des entrées d'historique (Précédent/Suivant), et un rechargement direct doit réafficher le même écran. ADR-0010 impose que toute route inconnue serve `index.html`. Le besoin reste simple : peu de routes, pas de paramètres imbriqués, pas de chargement paresseux ni de route protégée. Aucune bibliothèque de routage n'a encore été retenue.

## Décision

Implémenter le routage client avec un module minimal sans dépendance : un type `Route`, une fonction pure `parsePath`, une fonction `navigate` fondée sur l'API History, et un hook `useRoute` branché sur `useSyncExternalStore` pour réagir à `popstate` et à la navigation interne.

## Conséquences

- Positives : aucune dépendance à auditer ni à maintenir ; la logique de correspondance est pure, donc testable sans DOM ; empreinte minimale.
- Négatives / dettes acceptées : à réévaluer si les routes se complexifient (paramètres imbriqués, routes protégées, chargement paresseux). Un nouvel ADR remplacerait alors celui-ci.
