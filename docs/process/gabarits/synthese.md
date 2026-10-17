# Gabarit : synthèse de phase

`docs/tickets/<id>/synthese.md` : une section par phase, ajoutée à la fin du fichier par l'agent de la phase (spec, spec review, design, tech review, dev, review). C'est le texte que l'humain lit en premier : le script le publie en commentaire de la carte. Règles : [AGENTS.md](../../../AGENTS.md), §6.

- Trois paragraphes rédigés, toujours dans cet ordre, 10 à 20 lignes en tout.
- Écrits pour quelqu'un qui connaît l'application mais n'a pas lu la spec : des phrases, pas de listes d'identifiants. Un identifiant (`F02-S4-AC5`, `UI-BOARD-5`) ne vient qu'en appui d'une phrase qui se comprend sans lui.
- « Ce que tu dois trancher » reprend en clair les hypothèses, questions et choix discutables de la phase, chacun avec l'option retenue en attendant. S'il n'y en a pas : « Rien à trancher. »
- Aucune traçabilité ici : le détail reste dans le journal.

```markdown
# Synthèse : MZK-42 Confirmer avant une suppression multiple

## Spec : 2026-10-14

### Ce que j'ai compris

Aujourd'hui, supprimer une sélection l'efface immédiatement, quelle que soit sa taille. La carte demande qu'une suppression importante soit confirmée, pour éviter de perdre une partie du board par erreur, sans ralentir la suppression d'un ou deux éléments.

### Ce qui change

La suppression reste directe jusqu'à 10 éléments. Au-delà, une boîte de dialogue demande confirmation et rappelle le nombre d'éléments concernés ; Entrée confirme, Échap annule. La story de suppression (F08-S1) est modifiée plutôt que dupliquée, parce que son objectif ne change pas. Une règle d'écran décrit la boîte de dialogue, sur le modèle de celle qui supprime un board.

### Ce que tu dois trancher

Le seuil de 10 éléments est mon choix : la carte parle seulement de « beaucoup d'éléments ». J'ai aussi supposé qu'annuler (Ctrl+Z) une suppression confirmée restaure tous les éléments d'un coup, comme aujourd'hui.
```
