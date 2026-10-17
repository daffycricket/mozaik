# Décisions d'architecture (ADR)

Une décision par fichier `NNNN-titre-en-kebab-case.md`, à partir de [template.md](template.md).

Règles : [../process/documentation.md](../process/documentation.md). Un ADR `Accepted` n'est jamais réécrit : on le remplace.

Un ADR est créé en phase design (revu en tech review) ou, pour une décision découverte en codant, en phase dev ; il peut en remplacer un autre (l'ancien passe en `Superseded by ADR-NNNN`). Son en-tête indique le ticket, le moment de sa création et la raison ; il est tracé dans [../journal.md](../journal.md). Le numéro est le suivant de cet index.

| ADR | Titre | Statut |
|---|---|---|
| [0001](0001-enregistrer-les-decisions.md) | Enregistrer les décisions d'architecture | Accepted |
| [0002](0002-monorepo-typescript.md) | Monorepo pnpm, TypeScript strict, Node LTS | Accepted |
| [0003](0003-rendu-canvas-konva.md) | Rendu du canvas avec Konva | Accepted |
| [0004](0004-modele-partage-yjs.md) | Modèle partagé et synchronisation par CRDT Yjs | Accepted |
| [0005](0005-serveur-hocuspocus-sqlite.md) | Serveur Hocuspocus + Fastify, persistance SQLite | Accepted |
| [0006](0006-strategie-de-test.md) | Stratégie de test et seuils | Accepted |
| [0007](0007-workflow-git.md) | Plan numéroté, un commit par étape, Conventional Commits | Superseded by ADR-0013 |
| [0008](0008-pas-d-authentification-mvp.md) | Pas d'authentification dans le MVP | Accepted |
| [0009](0009-biome-lint-format.md) | Biome pour le lint et le formatage | Accepted |
| [0010](0010-lancement-local-docker.md) | Lancement local de l'application avec Docker Compose | Accepted |
| [0011](0011-design-system-shadcn.md) | Design system shadcn/ui sur Base UI, avec Tailwind CSS | Accepted |
| [0012](0012-routage-client-sans-dependance.md) | Routage client minimal sans dépendance | Accepted |
| [0013](0013-workflow-git-mode-produit.md) | Workflow Git du mode produit : branche de ticket, rebase puis merge commit | Accepted |
| [0014](0014-outillage-dans-le-depot-produit.md) | Outillage des phases dans le dépôt produit, exécuté depuis la copie sur main | Accepted |
| [0015](0015-datation-a-l-image-des-mesures-action-effet.md) | Datation à l'image de la mesure action → effet dans l'utilitaire e2e | Accepted |
