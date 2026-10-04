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

Puis ouvrir http://localhost:8080. Les données sont conservées dans le volume Docker `board-data` (`docker compose down -v` les efface).

## Développer

```bash
pnpm install
pnpm dev
```

Prérequis : Node.js 24 LTS, pnpm (via `corepack enable`).

L'application n'a pas d'authentification : ne l'exposez pas sur un réseau que vous ne maîtrisez pas.
