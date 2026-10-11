# F08 : Supprimer, dupliquer, copier/coller, annuler/rétablir

- ADR liés : ADR-0004
- Dépend de : F07

## Objectif

L'utilisateur manipule rapidement le contenu du board avec les opérations d'édition standard.

## Règles métier

- Annuler/rétablir ne concerne que les modifications de l'utilisateur local (`Y.UndoManager` limité à l'origine locale).
- Copier/coller utilise le presse-papiers système au format `application/json` préfixé, avec un repli en mémoire si l'accès est refusé.
- Coller ou dupliquer décale les copies de (+20, +20) et sélectionne les copies.

## Stories

### F08-S1 : Supprimer

**Critères d'acceptance**

- **F08-S1-AC1** : touche Suppr
  - Étant donné une sélection de 3 éléments
  - Quand j'appuie sur Suppr ou Retour arrière
  - Alors les 3 éléments sont supprimés du document
- **F08-S1-AC2** : pas de suppression pendant la saisie
  - Étant donné un texte en cours d'édition
  - Quand j'appuie sur Retour arrière
  - Alors un caractère est effacé et l'élément n'est pas supprimé
- **F08-S1-AC3** : fluidité
  - La suppression respecte FL-1 (F00)

### F08-S2 : Annuler et rétablir

**Critères d'acceptance**

- **F08-S2-AC1** : annuler, rétablir
  - Étant donné que j'ai créé puis déplacé un post-it
  - Quand j'appuie sur `Ctrl+Z` deux fois puis `Ctrl+Shift+Z`
  - Alors le déplacement est annulé, puis la création, puis la création est rétablie
- **F08-S2-AC2** : isolation entre utilisateurs
  - Étant donné que l'utilisateur 1 crée A et l'utilisateur 2 crée B
  - Quand l'utilisateur 1 fait `Ctrl+Z`
  - Alors A est supprimé et B existe toujours, chez les deux utilisateurs
- **F08-S2-AC3** : boutons
  - Les boutons `undo` et `redo` de la barre d'outils sont désactivés quand il n'y a rien à annuler ou rétablir

### F08-S3 : Dupliquer, copier, coller

**Critères d'acceptance**

- **F08-S3-AC1** : dupliquer
  - Étant donné un post-it, un texte et une flèche sélectionnés
  - Quand j'appuie sur `Ctrl+D`
  - Alors trois nouveaux éléments identiques sont créés, décalés de (20, 20), au-dessus des originaux, et seuls les nouveaux éléments sont sélectionnés
- **F08-S3-AC2** : copier/coller dans le même board
  - Quand je fais `Ctrl+C` puis `Ctrl+V`
  - Alors le résultat est identique à la duplication
- **F08-S3-AC3** : copier/coller entre boards
  - Quand je copie dans le board 1 et colle dans le board 2
  - Alors les éléments apparaissent dans le board 2 avec de nouveaux identifiants

## Hors périmètre

- Coller du texte brut ou des images depuis l'extérieur.
