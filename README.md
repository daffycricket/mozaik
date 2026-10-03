# Tableau blanc collaboratif open source

Application de tableau blanc collaboratif en temps réel, de type Miro, open source.

<!-- runner:start -->
> **Ce dépôt (branche `main`) contient uniquement le contexte** destiné à un agent de développement autonome, et l'outillage pour lancer des constructions. L'application elle-même est produite par chaque run, sur une branche `run/<run-id>`.
>
> **Démarrer une construction** (prérequis : Docker, Git, une clé API de fournisseur, un jeton de push) :
>
> ```bash
> git clone https://<hôte>/<compte>/<dépôt>.git miro-app-context && cd miro-app-context
> cp runner/.env.example runner/.env          # clés API et jeton de push
> runner/start-run.sh <provider>/<model> [label]
> ```
>
> **Évaluer un run** :
>
> ```bash
> git fetch && git switch run/<run-id>
> docker compose up --build                   # http://localhost:8080
> ```
>
> Mode d'emploi complet (fournisseurs, suivi, garde-fous, limites) : [runner/README.md](runner/README.md).
<!-- runner:end -->

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
