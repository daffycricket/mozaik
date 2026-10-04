# Tableau blanc collaboratif open source

Application de tableau blanc collaboratif en temps réel, de type Miro, open source.

- Vision et périmètre : [docs/vision.md](docs/vision.md)
- Architecture : [docs/architecture.md](docs/architecture.md)
- Contribuer (humains et agents) : [AGENTS.md](AGENTS.md)

## Lancer l'application

Avec Docker (aucun autre prérequis) :

```bash
docker compose up --build
```

Puis ouvrir http://localhost:8080. Le serveur sert le front compilé, l'API et le WebSocket sur le même port, publié uniquement sur `127.0.0.1` : l'URL d'un board (`http://localhost:8080/b/<id>`) est donc partageable seulement depuis la même machine.

Les données sont conservées dans le volume Docker `board-data` (`docker compose down -v` les efface). Un healthcheck vérifie `/api/health`.

## Développer

```bash
pnpm install
pnpm dev
```

Prérequis : Node.js 24 LTS, pnpm (via `corepack enable`).

L'application n'a pas d'authentification : ne l'exposez pas sur un réseau que vous ne maîtrisez pas.
