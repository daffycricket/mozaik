# ADR-0007 : Plan numéroté, un commit par étape, Conventional Commits

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

L'agent travaille seul et localement, ticket par ticket. L'humain veut que l'agent planifie avant d'implémenter, que chaque étape du plan soit un commit identifiable, complet (code, tests, résultats, documentation) et vert, et pouvoir revenir à l'étape précédente quand l'agent s'égare.

## Décision

- Plan dans `docs/plans/<TICKET-ID>.md`, commité en étape 0 avant tout code.
- Un commit par étape, au format Conventional Commits : `<type>(<scope>): <TICKET-ID>#<n> <description>`, avec les trailers `Refs`, `Plan-Step`, `Tests`, `Coverage`, `Report`.
- `pnpm verify` vert avant chaque commit d'étape.
- Retour arrière : abandon du travail non commité, ou `git revert` d'une étape commitée, tracé dans le journal du plan.
- Une branche par ticket, intégrée dans `main` par `git merge --ff-only`, sans squash.
- Format contrôlé par un hook `commit-msg` sur toutes les branches.

Détails : `process/git.md`.

## Conséquences

- `main` est vert à chaque commit, et son historique se lit ticket par ticket, étape par étape.
- `pnpm verify` (dont l'e2e complet) tourne à chaque étape. Si la suite dépasse 5 minutes, un ticket technique de parallélisation est créé (ADR-0006).
- Le rapport de test d'un ticket contient une section par étape.
