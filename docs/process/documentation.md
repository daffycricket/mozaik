# Maintenir la documentation

La documentation est un livrable au même titre que le code. Elle est relue par l'agent à chaque session : si elle est fausse, l'agent travaille faux.

## Structure

```
AGENTS.md                 Point d'entrée agent, court, pointe vers docs/
docs/
  README.md               Index de la documentation
  vision.md               Pourquoi, pour qui, périmètre MVP / hors MVP
  architecture.md         Vue d'ensemble technique, à jour avec le code
  glossary.md             Vocabulaire du domaine (FR → identifiant EN dans le code)
  journal.md              Décisions et événements du projet, le plus récent en haut
  backlog.md              Liste ordonnée de tous les tickets et leur statut
  adr/                    Une décision par fichier, numérotée, immuable une fois acceptée
  features/               Une fonctionnalité par fichier : stories + critères d'acceptance
  design/                 Navigation, maquettes ASCII et règles UI-*, composants, charte
  plans/                  Un plan d'implémentation numéroté par ticket, écrit avant le code
  process/                Règles de travail : code, git, tests, documentation
  test-reports/           Un rapport par ticket terminé, généré par `pnpm report`
```

## Qui met à jour quoi, et quand

| Événement | Mise à jour |
|---|---|
| Début d'un ticket | Plan `plans/<TICKET-ID>.md` écrit ; `backlog.md` : statut `in-progress` (commit d'étape 0) |
| Chaque étape | Rapport de test : section de l'étape ; documentation rendue inexacte par l'étape ; plan seulement s'il évolue (journal, découpage) |
| Fin d'un ticket | `backlog.md` : `done`. C'est le seul endroit qui porte un statut de ticket |
| Nouvelle décision structurante | Nouvel ADR `Accepted` (remplaçant éventuellement un ADR existant) ; index `adr/README.md` ; entrée `adr` dans `journal.md` |
| Point flou ou non spécifié tranché | Story concernée mise à jour ; entrée `décision` dans `journal.md` |
| Changement de module, de flux ou de modèle de données | `architecture.md` dans le même commit |
| Précision technique d'un comportement déjà décrit | Story concernée dans `features/FNN-*.md` (précision, jamais d'ajout de fonctionnalité ni de suppression silencieuse) |
| Bug ou dette découverts | Nouvelle ligne dans `backlog.md` (`B-` ou `T-`) |
| Critère d'acceptance ajouté, précisé ou corrigé | Story concernée ; entrée `spec` dans `journal.md` |
| Test désactivé, instable, exclusion de couverture | Ticket de dette ; entrée `test` dans `journal.md` |
| Nouveau terme métier | `glossary.md` |

## Règles

- Un fichier = un sujet. Pas de doublon : on pointe vers la source plutôt que de recopier.
- Un ADR `Accepted` ne se réécrit pas. On en crée un nouveau qui le remplace, et on passe l'ancien en `Superseded by ADR-NNNN`.
- Un critère d'acceptance d'une story `done` ne se modifie pas. Un changement de comportement sur une story terminée passe par un ticket `bug`, tracé dans `journal.md`.
- Les identifiants (`F03`, `F03-S1`, `F03-S1-AC2`, `T-001`, `B-004`, `ADR-0005`) ne sont jamais réutilisés.
- Les modifications de doc liées à une étape sont dans le commit de cette étape.
