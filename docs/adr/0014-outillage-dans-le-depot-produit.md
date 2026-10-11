# ADR-0014 : Outillage des phases dans le dépôt produit, exécuté depuis la copie sur main

- Statut : Accepted
- Date : 2026-10-11
- Décideurs : humain
- Ticket : aucun (mise en place du mode produit, branche `setup/mode-produit`)
- Raison : l'outillage des phases est lié aux tickets et aux règles de ce dépôt ; le dépôt de construction de la v1 reste un banc d'essai indépendant
- Remplace : aucun
- Liens : `runner/README.md`, `process/git.md`, AGENTS.md §6

## Contexte

La v1 de Mozaik a été construite par un agent depuis un dépôt de contexte, qui contient aussi l'outillage de ces constructions (banc d'essai pour comparer des modèles). Le mode produit a son propre outillage (`mzk.sh`, image de l'agent, garde-fou, contrôles), étroitement lié au workflow des tickets, au journal et aux gabarits de ce dépôt. Le placer dans ce dépôt met l'agent face à un dépôt qui contient ses propres contrôles : sur sa branche, il pourrait les modifier.

## Décision

- L'outillage des phases vit dans `runner/` de ce dépôt. Le banc d'essai garde le sien, sans lien avec celui-ci.
- `runner/mzk.sh` se lance depuis une copie de travail de ce dépôt sur `main`, à jour et sans modification de `runner/`. L'image de l'agent est construite à partir de cette copie. Chaque ticket a son propre clone (par défaut `../mozaik-tickets/MZK-<n>/`), monté dans le conteneur comme dossier de travail : son `runner/` n'est jamais exécuté.
- L'agent ne modifie jamais `runner/` : le garde-fou refuse les écritures qu'il reconnaît, le contrôle de fin de session signale toute modification, et `mzk.sh merge` refuse une branche qui modifie `runner/`, sauf dérogation explicite.
- L'outillage évolue par des commits humains `<type>(runner): ...`, sans ticket ni trailer, relus en pull request.

## Conséquences

- Un seul dépôt pour le produit et sa façon d'évoluer ; l'outillage exécuté a toujours été relu et mergé.
- Les clés des fournisseurs sont dupliquées entre `runner/.env` de ce dépôt et celui du banc d'essai, ainsi que le catalogue des modèles (`runner/opencode/opencode.json`).
- Le garde-fou ne reconnaît pas toutes les écritures par le shell : la garantie repose sur la construction de l'image depuis `main` et sur le refus au merge.
