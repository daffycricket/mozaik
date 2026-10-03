# Plan : <TICKET-ID> <titre du ticket>

- Ticket : [backlog](../backlog.md), story ou détail technique : <lien>
- Critères d'acceptance visés : <liste des identifiants>
- Branche : `<type>/<TICKET-ID>-<slug>`

## Synthèse des étapes

Vue d'ensemble du plan, cohérente avec le détail ci-dessous. L'avancement ne s'écrit pas ici : une étape est faite quand son commit `<TICKET-ID>#<n>` existe (`git log --oneline`).

| N° | Nom | Description | Critères d'acceptance |
|---|---|---|---|
| 1 | <nom court> | <ce que fait l'étape, une phrase> | <identifiants et résumé, ex. F03-S1-AC1 : création par clic ; ou « aucun (étape technique) »> |
| 2 | ... | ... | ... |

## Étapes

### Étape 1 : <objectif en une phrase>

- Critères d'acceptance couverts : <identifiants, ou « aucun (étape technique) »>
- Code applicatif : <fichiers ou modules, ou « aucun : raison »>
- Code technique : <fichiers ou modules, ou « aucun : raison »>
- Code de test : <tests unitaires / intégration / e2e ajoutés ou modifiés>
- Documentation et Markdown : <fichiers à mettre à jour, toujours au moins la section de l'étape dans le rapport de test>
- Terminée quand : <condition vérifiable, en plus de `pnpm verify` vert>

### Étape 2 : ...

## Journal

Tentatives abandonnées, reverts, modifications du plan, avec la date et la raison.

| Date | Étape | Événement | Raison |
|---|---|---|---|
| | | | |
