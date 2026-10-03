# F01 : Gestion des boards

- ADR liés : ADR-0005, ADR-0008
- Dépend de : aucune

## Objectif

Un menu liste tous les boards. L'utilisateur crée, ouvre, renomme et supprime des boards, navigue du menu vers un board et revient au menu pour en ouvrir un autre. Il peut transmettre l'URL d'un board : la personne qui la reçoit l'ouvre directement dans son navigateur, sans passer par le menu.

## Règles métier

- Nom : 1 à 100 caractères après suppression des espaces de début et de fin. Nom par défaut : « Board sans titre ».
- URL d'un board : `/b/<id>`. Le menu des boards est la page `/`.
- N'importe qui peut ouvrir n'importe quel board (pas d'authentification, ADR-0008). La liste montre tous les boards existants.
- Si l'utilisateur n'a pas encore saisi de nom, la saisie du nom (F10-S1) s'intercale juste avant l'entrée dans le board, qu'il arrive du menu ou d'une URL directe.
- La liste est triée par date de dernière modification décroissante.
- La suppression est définitive, après confirmation.

## Stories

### F01-S1 : Créer un board et l'ouvrir

En tant qu'utilisateur, je veux créer un board depuis l'accueil afin de commencer à travailler.

**Critères d'acceptance**

- **F01-S1-AC1** : création depuis l'accueil
  - Étant donné que je suis sur `/`
  - Quand je clique sur « Nouveau board » (`data-testid="board-create"`)
  - Alors un board « Board sans titre » est créé et j'entre dans `/b/<id>` sur un canvas vide (après la saisie du nom si je ne suis pas encore connu)
- **F01-S1-AC2** : API de création
  - Étant donné le serveur démarré
  - Quand j'appelle `POST /api/boards` avec `{ "name": "Rétro S12" }`
  - Alors je reçois `201` et un board avec `id`, `name`, `createdAt`, `updatedAt`
- **F01-S1-AC3** : validation du nom
  - Quand j'appelle `POST /api/boards` avec un nom vide ou de plus de 100 caractères
  - Alors je reçois `400` avec `{ error: { code: "VALIDATION_ERROR", ... } }`

### F01-S2 : Lister les boards

En tant qu'utilisateur, je veux voir mes boards sur l'accueil afin de rouvrir l'un d'eux.

**Critères d'acceptance**

- **F01-S2-AC1** : liste triée
  - Étant donné trois boards modifiés à des moments différents
  - Quand j'ouvre `/`
  - Alors ils sont affichés du plus récemment modifié au plus ancien, avec leur nom et leur date de modification
- **F01-S2-AC2** : état vide
  - Étant donné aucun board
  - Quand j'ouvre `/`
  - Alors un message invite à créer un premier board
- **F01-S2-AC3** : ouverture
  - Quand je clique sur un board de la liste
  - Alors j'arrive sur `/b/<id>` et je vois son contenu
- **F01-S2-AC4** : retour au menu
  - Étant donné que je suis sur un board ouvert depuis le menu
  - Quand je clique sur « Boards » (`data-testid="nav-boards"`) dans l'en-tête, ou sur Précédent dans le navigateur
  - Alors je reviens au menu des boards, et je peux ouvrir un autre board
- **F01-S2-AC5** : URL partagée
  - Étant donné l'URL `/b/<id>` d'un board existant
  - Quand une autre personne l'ouvre dans un nouveau navigateur
  - Alors elle saisit son nom (F10-S1) puis arrive directement sur ce board, sans passer par le menu
- **F01-S2-AC6** : fluidité
  - Le passage du menu à un board et le retour au menu respectent FL-3 et FL-7 (F00)

### F01-S3 : Renommer un board

**Critères d'acceptance**

- **F01-S3-AC1** : renommage depuis le board
  - Étant donné que je suis sur un board
  - Quand je clique sur son nom dans l'en-tête, saisis « Atelier vision » et valide avec Entrée
  - Alors le nom est mis à jour dans l'en-tête et sur l'accueil
- **F01-S3-AC2** : annulation
  - Quand j'appuie sur Échap pendant la saisie
  - Alors l'ancien nom est conservé
- **F01-S3-AC3** : nom invalide
  - Quand je valide un nom vide
  - Alors l'ancien nom est conservé et aucun appel `PATCH` n'aboutit

### F01-S4 : Supprimer un board

**Critères d'acceptance**

- **F01-S4-AC1** : suppression confirmée
  - Étant donné un board dans la liste
  - Quand je choisis « Supprimer » et confirme dans le dialogue
  - Alors il disparaît de la liste, et `GET /api/boards/<id>` renvoie `404`
- **F01-S4-AC2** : suppression annulée
  - Quand j'annule le dialogue
  - Alors le board est toujours présent
- **F01-S4-AC3** : contenu supprimé
  - Étant donné un board contenant des éléments
  - Quand il est supprimé
  - Alors son document Yjs est supprimé de la base (test d'intégration)
- **F01-S4-AC4** : board supprimé pendant qu'un autre utilisateur l'utilise
  - Étant donné un utilisateur sur un board
  - Quand ce board est supprimé par un autre utilisateur
  - Alors un message « Ce board a été supprimé » s'affiche avec un lien vers le menu des boards

### F01-S5 : Board inexistant

**Critères d'acceptance**

- **F01-S5-AC1** : page d'erreur
  - Quand j'ouvre `/b/inexistant`
  - Alors une page « Board introuvable » s'affiche avec un lien vers le menu des boards, aucune saisie de nom n'est demandée, et aucune connexion WebSocket n'est ouverte

## Hors périmètre

- Dossiers, recherche, favoris, vignettes d'aperçu, droits d'accès.
