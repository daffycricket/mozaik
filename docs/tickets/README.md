# Tickets

Un dossier par ticket : `docs/tickets/MZK-<n>/`, créé sur la branche du ticket par la commande de la phase spec. `<n>` est le numéro court de la carte Trello.

| Fichier | Écrit par | Contenu |
|---|---|---|
| `ticket.md` | script de la phase spec | Copie de la demande de la carte au lancement de la phase spec, lien vers la carte, type (`bug`, `feat`, `change`, `tech`), branche |
| `plan.md` | agent de design | Éléments de spec couverts, analyse d'impact, étapes de développement, risques. L'humain le commente sur la carte, il ne le modifie pas. |
| `retours.md` | script, à partir des commentaires de la carte | Remarques de revue, une par ligne, préfixées par `[spec]`, `[impl]` ou `[règle]` : ce sont des consignes pour l'agent |
| `synthese.md` | l'agent de chaque phase | Une section par phase, en prose : ce que l'agent a compris, ce qui change, ce que l'humain doit trancher. Publiée en commentaire de la carte. |
| `rapport.md` | `pnpm report`, l'agent de dev et le runner | Une section par étape de développement (générée), la synthèse de l'agent (travail, tests, points ouverts) et les métriques du runner |

- Aucun statut dans ces fichiers : le statut d'un ticket est sa colonne Trello.
- Aucune traçabilité dans ces fichiers : elle est dans [../journal.md](../journal.md).
- Gabarits : [../process/gabarits/](../process/gabarits/).
