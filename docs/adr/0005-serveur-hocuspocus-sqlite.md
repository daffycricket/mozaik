# ADR-0005 : Serveur Hocuspocus + Fastify, persistance SQLite

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Il faut un serveur qui relaie les mises à jour Yjs entre clients, persiste l'état des boards, et expose une petite API pour la liste des boards. Cible : exécution locale uniquement, sans base de données externe à installer (le lancement par Docker, ADR-0010, reste un seul conteneur).

## Décision

Hocuspocus pour la synchro, Fastify pour l'API REST, montés sur le même serveur HTTP (WebSocket sur `/collab`). Persistance SQLite via `better-sqlite3`, avec l'extension de base de données Hocuspocus pour lire et écrire l'état Yjs binaire dans une table `documents`.

## Conséquences

- `pnpm dev` suffit, aucun service à installer.
- Tests d'intégration rapides avec `DATABASE_PATH=:memory:`.
- Accès aux données isolé dans `apps/server/src/db`.
