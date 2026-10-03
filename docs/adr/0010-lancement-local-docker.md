# ADR-0010 : Lancement local de l'application avec Docker Compose

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

L'application doit pouvoir être lancée en local par quelqu'un qui n'a pas Node.js ni pnpm, avec une seule commande. Le but n'est pas le déploiement : la cible reste l'exécution locale, sans authentification (ADR-0008).

## Décision

Docker Compose avec un seul conteneur, en plus de `pnpm dev` qui reste le mode de développement.

- `Dockerfile` multi-étapes à la racine : étape de build (`pnpm install --frozen-lockfile`, build de `packages/model`, `apps/web`, `apps/server`), puis image d'exécution `node:24-slim` ne contenant que le nécessaire.
- En exécution, le serveur sert le front compilé (`apps/web/dist`) en fichiers statiques, l'API sur `/api` et le WebSocket sur `/collab`, sur le port 3001 du conteneur. Toute route inconnue hors `/api` et `/collab` renvoie `index.html` (routage côté client, URL `/b/<id>` partageable).
- `docker-compose.yml` : un service `app`, port publié `127.0.0.1:8080:3001` (accessible depuis la machine seulement), volume nommé `board-data` monté sur `/data`, `DATABASE_PATH=/data/board.sqlite`, healthcheck sur `/api/health`.
- Le front utilise toujours des URL relatives (`/api`, `/collab`). En développement, le serveur Vite relaie ces chemins vers le serveur Node (proxy).

## Conséquences

- Lancement : `docker compose up --build`, puis http://localhost:8080.
- Les données survivent à `docker compose down` / `up` (volume nommé) ; `docker compose down -v` les supprime.
- `better-sqlite3` est un module natif : l'image d'exécution doit être basée sur glibc (`node:24-slim`, pas Alpine) pour utiliser les binaires précompilés.
- L'URL partageable n'est utilisable que depuis la même machine (port lié à `127.0.0.1`).
- La vérification de l'image fait partie de `pnpm verify` quand Docker est disponible (voir `process/testing.md`).
