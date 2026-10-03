# F09 : Collaboration temps réel et persistance

- ADR liés : ADR-0004, ADR-0005
- Dépend de : F01, F03

## Objectif

Plusieurs utilisateurs éditent le même board en même temps, voient les modifications des autres immédiatement et sans à-coups, et rien n'est perdu au rechargement ou au redémarrage du serveur.

## Règles métier

- Le nom du document Hocuspocus est l'`id` du board.
- N'importe quel utilisateur qui ouvre un board peut le modifier (ADR-0008).
- Délai de propagation et continuité des mouvements : FL-4 (F00).

## Stories

### F09-S1 : Synchroniser les modifications

**Critères d'acceptance**

- **F09-S1-AC1** : propagation
  - Étant donné deux utilisateurs sur le même board
  - Quand l'utilisateur 1 crée, modifie puis supprime un post-it
  - Alors l'utilisateur 2 voit chaque étape dans le délai de FL-4 (F00)
- **F09-S1-AC2** : modifications concurrentes sur le même élément
  - Étant donné un post-it
  - Quand l'utilisateur 1 le déplace et l'utilisateur 2 change sa couleur au même moment
  - Alors les deux clients convergent vers la nouvelle position et la nouvelle couleur
- **F09-S1-AC3** : charge
  - Étant donné 5 clients connectés au même board (test d'intégration avec providers réels)
  - Quand chacun crée 60 éléments en parallèle
  - Alors les 5 documents convergent vers 300 éléments identiques
- **F09-S1-AC4** : fluidité sous latence
  - Étant donné 300 ms de latence réseau simulée pour l'utilisateur 1
  - Quand il crée et déplace des éléments
  - Alors ses actions restent immédiates de son point de vue (FL-1) et arrivent chez l'utilisateur 2 sans perte

### F09-S2 : Persister

**Critères d'acceptance**

- **F09-S2-AC1** : rechargement
  - Étant donné un board avec des éléments
  - Quand je recharge la page
  - Alors je retrouve les mêmes éléments
- **F09-S2-AC2** : redémarrage serveur
  - Étant donné des modifications enregistrées
  - Quand le serveur est arrêté puis redémarré sur la même base
  - Alors un nouveau client obtient l'état complet (test d'intégration)
- **F09-S2-AC3** : date de modification
  - Quand le contenu d'un board change
  - Alors son `updatedAt` est mis à jour (au rythme de l'enregistrement)

## Hors périmètre

- Édition hors ligne, indicateur de connexion, historique de versions, restauration, mode lecture seule.
