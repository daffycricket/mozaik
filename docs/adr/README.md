# Décisions d'architecture (ADR)

Une décision par fichier `NNNN-titre-en-kebab-case.md`, à partir de [template.md](template.md).

Règles : [../process/documentation.md](../process/documentation.md). Un ADR `Accepted` n'est jamais réécrit : on le remplace.

L'agent crée et accepte seul ses ADR, y compris un ADR qui en remplace un autre (l'ancien passe en `Superseded by ADR-NNNN`). Chaque ADR créé est tracé dans [../journal.md](../journal.md).

| ADR | Titre | Statut |
|---|---|---|
| [0001](0001-enregistrer-les-decisions.md) | Enregistrer les décisions d'architecture | Accepted |
| [0002](0002-monorepo-typescript.md) | Monorepo pnpm, TypeScript strict, Node LTS | Accepted |
| [0003](0003-rendu-canvas-konva.md) | Rendu du canvas avec Konva | Accepted |
| [0004](0004-modele-partage-yjs.md) | Modèle partagé et synchronisation par CRDT Yjs | Accepted |
| [0005](0005-serveur-hocuspocus-sqlite.md) | Serveur Hocuspocus + Fastify, persistance SQLite | Accepted |
| [0006](0006-strategie-de-test.md) | Stratégie de test et seuils | Accepted |
| [0007](0007-workflow-git.md) | Plan numéroté, un commit par étape, Conventional Commits | Accepted |
| [0008](0008-pas-d-authentification-mvp.md) | Pas d'authentification dans le MVP | Accepted |
| [0009](0009-biome-lint-format.md) | Biome pour le lint et le formatage | Accepted |
| [0010](0010-lancement-local-docker.md) | Lancement local de l'application avec Docker Compose | Accepted |
| [0011](0011-design-system-shadcn.md) | Design system shadcn/ui sur Base UI, avec Tailwind CSS | Accepted |
| [0012](0012-routage-client-sans-dependance.md) | Routage client minimal sans dépendance | Accepted |
