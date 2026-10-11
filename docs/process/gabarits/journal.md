# Gabarit : section d'un ticket dans le journal

La section est ajoutée à la fin de `docs/journal.md`. Chaque phase ajoute sa sous-section, dans l'ordre. Règles : [../../journal.md](../../journal.md).

```markdown
## MZK-42 : Confirmer avant une suppression multiple

Carte : https://trello.com/c/<shortLink> · Type : change · Branche : `ticket/MZK-42-confirm-delete`

### Spec : 2026-10-14

| Type | Éléments concernés | Décision et raison | Origine | À revoir |
|---|---|---|---|---|
| critère | F08-S1-AC2 | Modifié : la suppression directe ne vaut plus que jusqu'à 10 éléments, demandé par la carte | humain | non |
| critère | F08-S1-AC4 | Supprimé : le bouton de la barre d'outils est remplacé par une entrée du menu contextuel | humain | non |
| critère | F08-S1-AC6 | Ajouté : confirmation au-delà de 10 éléments, avec le nombre d'éléments | humain | non |
| hypothèse | H1, F08-S1-AC6 | Le seuil s'applique à la touche Suppr et à l'entrée de menu ; la carte ne cite que Suppr | agent | oui |
| ui | UI-DEL-1 | Ajoutée : dialogue de confirmation, bouton principal « Supprimer », bouton « Annuler » | agent | oui |
| question | Q1, F08-S1-AC6 | Le seuil de 10 inclut-il 10 (confirmation à partir de 10, ou au-delà) ? Hypothèse retenue : au-delà, soit 11 et plus | agent | oui |
| fichier | docs/design/ecrans.md | Maquette du dialogue ajoutée, conséquence de UI-DEL-1 | agent | oui |

Fichiers modifiés : docs/features/F08-edition.md, docs/design/ecrans.md, docs/tickets/MZK-42/ticket.md

### Spec review : 2026-10-14

| Type | Éléments concernés | Décision et raison | Origine | À revoir |
|---|---|---|---|---|
| retour | Q1, F08-S1-AC6 | Réponse : confirmation à partir de 10 éléments inclus ; critère mis à jour | humain | non |

Fichiers modifiés : docs/features/F08-edition.md, docs/tickets/MZK-42/retours.md

### Design : 2026-10-14

| Type | Éléments concernés | Décision et raison | Origine | À revoir |
|---|---|---|---|---|
| décision | apps/web/src/canvas/use-delete.ts | Le seuil est une constante du module de suppression, partagée par le clavier et le menu | agent | oui |
| adr | adr/0013 | Créé au design : menu contextuel du canvas sans dépendance supplémentaire | agent | oui |

Fichiers modifiés : docs/tickets/MZK-42/plan.md, docs/adr/0013-menu-contextuel.md, docs/adr/README.md

### Dev : 2026-10-15

| Type | Éléments concernés | Décision et raison | Origine | À revoir |
|---|---|---|---|---|
| test | e2e/delete.spec.ts | Test hérité modifié, imposé par F08-S1-AC2 (10 éléments au lieu de 20) | agent | non |
| test | e2e/toolbar.spec.ts | Test de F08-S1-AC4 supprimé, critère supprimé en spec | agent | non |
| décision | Plan-Step 3/3 | Étape ajoutée au plan : le focus revient au canvas après le dialogue, nécessaire pour enchaîner un Ctrl+Z | agent | oui |

Fichiers modifiés : (générés depuis Git, commits MZK-42#3 à MZK-42#5)

### Review : 2026-10-16

| Type | Éléments concernés | Décision et raison | Origine | À revoir |
|---|---|---|---|---|
| retour | UI-DEL-1 | [impl] La touche Entrée valide le dialogue | humain | non |

Fichiers modifiés : (générés depuis Git)

### Merge : 2026-10-16

Commit de merge : `<sha>`. Rebase sans conflit, vérification verte.
```
