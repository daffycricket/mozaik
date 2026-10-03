# ADR-0006 : Stratégie de test et seuils

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

L'agent est autonome sur l'écriture et l'exécution des tests. L'humain veut une garantie forte : tests unitaires, d'intégration et end-to-end, une couverture élevée, et aucun passage au ticket suivant tant que les critères d'acceptance ne sont pas validés.

## Décision

Vitest (unitaires, intégration, couverture v8) et Playwright (e2e, plusieurs navigateurs simultanés, interception du WebSocket). Seuil de couverture bloquant à 80 % lignes et branches (unitaire + intégration fusionnés). 100 % des tests e2e doivent passer. Traçabilité critère d'acceptance → test par identifiant dans le titre du test, vérifiée par `pnpm ac:check`. Rapport Markdown par ticket commité, rapports bruts ignorés par Git. Détails : `process/testing.md`.

## Conséquences

- Le code de rendu Konva est exclu de la couverture unitaire et couvert par l'e2e : la logique doit donc vivre dans `packages/model` et les stores, testables unitairement.
- La suite e2e s'allonge à chaque ticket : surveiller sa durée (au-delà de 5 minutes, ticket technique de parallélisation).
