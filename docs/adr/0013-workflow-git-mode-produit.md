# ADR-0013 : Workflow Git du mode produit, branche de ticket, rebase puis merge commit

- Statut : Accepted
- Date : 2026-10-11
- Décideurs : humain
- Ticket : aucun (mise en place du mode produit, branche `setup/mode-produit`)
- Raison : la v1 est livrée ; le produit évolue par tickets Trello traités en phases (spec, design, dev) revues par un humain
- Remplace : ADR-0007
- Liens : `process/git.md`, `process/documentation.md`, `journal.md`

## Contexte

La v1 a été construite par un agent seul, ticket après ticket, avec un plan commité en étape 0 et une intégration en fast-forward dans `main`. En mode produit, chaque ticket passe par une spec puis un plan validés par un humain, avant un développement autonome, une recette et un merge décidé par l'humain. Plusieurs tickets pourront plus tard être traités en parallèle. L'historique doit permettre de retrouver, pour chaque ticket, la spec, le plan, chaque étape de code vérifiée, et la décision d'intégration.

## Décision

- Une branche `ticket/MZK-<n>-<slug>` par ticket, créée dès la phase spec ; la spec, le plan et le code y vivent jusqu'au merge.
- Commits `MZK-<n>#<k>` : commits de phase écrits par les scripts (`docs(spec|spec-review|design|tech-review|dev|review|merge)`, `Refs:` seul), puis commits d'étape écrits par l'agent, un par étape du plan, verts, avec les trailers `Refs`, `Plan-Step`, `Tests`, `Coverage`, `Report`. Pas d'étape 0 : le plan est écrit en phase design.
- Intégration : rebase sur `main`, vérification indépendante de la tête de la branche rebasée, puis merge commit (`--no-ff`), sans squash. Chaque merge commit de `main` est vert, sauf dérogation humaine tracée pour un bug secondaire connu.
- Seuls les scripts publient ; l'agent ne pousse jamais et ne merge jamais dans `main`.
- Format contrôlé par le hook `commit-msg` (exigence T-001-AC4).

## Conséquences

- `git log --first-parent main` donne une ligne par ticket ; les commits d'étape restent consultables et revertables.
- Après un rebase, seule la tête de branche est revérifiée : les commits d'étape intermédiaires ne sont plus garantis verts sur la nouvelle base. La garantie porte sur les merge commits.
- La page « Commits » de GitHub affiche tous les commits, sans vue par ticket.
