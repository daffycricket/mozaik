# Maintenir la documentation

La documentation est un livrable au même titre que le code. Elle est relue par l'agent à chaque session : si elle est fausse, l'agent travaille faux.

## Structure

```
AGENTS.md                   Point d'entrée agent, court, pointe vers docs/
docs/
  README.md                 Index de la documentation
  vision.md                 Pourquoi, pour qui, périmètre, exigences non fonctionnelles
  architecture.md           Vue d'ensemble technique, à jour avec le code
  glossary.md               Vocabulaire du domaine (FR → identifiant EN dans le code)
  exigences-techniques.md   Exigences techniques et critères de non-régression (T-NNN, B-NNN)
  journal.md                Trace unique des décisions et modifications, par ticket et par phase
  adr/                      Une décision par fichier, numérotée, immuable une fois acceptée
  features/                 Une fonctionnalité par fichier : stories et critères d'acceptance
  design/                   Navigation, maquettes ASCII et règles UI-*, composants, charte
  tickets/                  Un dossier par ticket : ticket.md, plan.md, retours.md, rapport.md
  process/                  Règles de travail : code, git, tests, documentation, gabarits
```

## Deux règles structurantes

- **Les documents décrivent l'état actuel, sans historique.** Une feature, un écran, l'architecture ou une exigence technique disent ce qui est vrai maintenant. Pas de section « historique », « points tranchés » ou « modifié par ».
- **Toute la traçabilité est dans `journal.md`**, section du ticket, sous-section de la phase : pourquoi un élément a changé, sur quelle demande, avec quelle conséquence sur d'autres fichiers. Seule exception : l'en-tête d'un ADR indique le ticket qui l'a créé, quand (au design ou au dev) et pourquoi.

## Qui met à jour quoi, et quand

| Phase | Mise à jour |
|---|---|
| Spec, spec review | `features/` (stories, critères), `design/` (écrans, règles `UI-*`, maquettes), `exigences-techniques.md` si une exigence technique durable est ajoutée ; `tickets/<id>/ticket.md` (script) ; journal |
| Design, tech review | `tickets/<id>/plan.md` ; nouvel ADR et index `adr/README.md` ; `architecture.md` et `glossary.md` si la conception les change ; journal |
| Dev, review, merge | Code et tests ; `tickets/<id>/rapport.md` (sections d'étape par `pnpm report`, synthèse par l'agent) ; documentation rendue inexacte par le code (`architecture.md`, `glossary.md`, `design/composants.md`, README) ; ADR créé au dev ; spec seulement sur un retour `[spec]` explicite ; journal |
| Retour `[règle]` | `process/`, `architecture.md`, `design/` ou nouvel ADR, selon la règle ; journal |

## Règles

- Un fichier = un sujet. Pas de doublon : on pointe vers la source plutôt que de recopier.
- Un ADR `Accepted` ne se réécrit pas. On en crée un nouveau qui le remplace, et on passe l'ancien en `Superseded by ADR-NNNN`. Numérotation séquentielle globale ; deux branches qui créent le même numéro règlent la collision au rebase.
- Les identifiants (`F03`, `F03-S1`, `F03-S1-AC2`, `UI-BOARD-3`, `T-001-AC4`, `B-004`, `ADR-0013`, `MZK-42`) ne sont jamais réutilisés, même après suppression de l'élément.
- Les modifications de doc liées à une étape de dev sont dans le commit de cette étape.
- Chaque document produit par une phase suit son [gabarit](gabarits/README.md).
