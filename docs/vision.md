# Vision

## Le produit

**Mozaik** (identifiant technique `mozaik`, préfixe des paquets `@mozaik/`) est un tableau blanc collaboratif open source, de type Miro : un espace de travail visuel infini où plusieurs personnes posent et organisent ensemble des post-its, des formes, du texte et des flèches, en voyant les modifications et les curseurs des autres en temps réel.

## Principes

1. **Collaboration temps réel** : tout ce qui est sur le board est partagé et synchronisé, sans conflit (CRDT). Chacun voit où sont les autres (curseurs) et suit leurs déplacements.
2. **Fluidité** : l'expérience doit être fluide, pas seulement fonctionnelle. Exigences mesurables dans [features/F00-fluidite.md](features/F00-fluidite.md).
3. **Ouvert** : pas d'authentification ; chacun saisit un simple nom, et n'importe qui peut ouvrir n'importe quel board.
4. **Périmètre strict** : seul ce qui est décrit dans `features/` est développé.
5. **Licences permissives** uniquement dans les dépendances.

## Périmètre

Voir le détail dans [features/README.md](features/README.md).

| ID | Fonctionnalité |
|---|---|
| F00 | Fluidité (exigences transverses) |
| F01 | Menu des boards : créer, lister, ouvrir, revenir au menu, renommer, supprimer, URL partageable |
| F02 | Canvas infini : déplacement (pan) et zoom |
| F03 | Post-its, 10 couleurs |
| F04 | Formes (rectangle, ellipse) |
| F05 | Texte libre, 10 couleurs |
| F06 | Flèches libres |
| F07 | Sélection, déplacement, redimensionnement, avancer/reculer dans le plan |
| F08 | Supprimer, annuler/rétablir, dupliquer, copier/coller |
| F09 | Collaboration temps réel et persistance |
| F10 | Saisie du nom avant l'entrée dans un board, curseurs des autres utilisateurs |

Tout ce qui n'est pas dans ce tableau et dans les fichiers `features/` est hors périmètre. Chaque fichier de fonctionnalité liste explicitement ce qu'il exclut.

## Exigences non fonctionnelles

| Exigence | Cible mesurable |
|---|---|
| Navigateur | Chromium récent (desktop, souris). Firefox et WebKit non bloquants. |
| Fluidité | FL-1 à FL-8 ([F00](features/F00-fluidite.md)). |
| Volume | 300 éléments par board. Aucune exigence au-delà dans un premier temps. |
| Utilisateurs simultanés | 5 clients sur un même board sans perte de modification (intégration). |
| Persistance | Aucune modification perdue au rechargement ni au redémarrage du serveur (intégration). |
| Exécution | Locale uniquement : `pnpm dev` pour développer, `docker compose up` pour lancer l'application packagée (ADR-0010). Pas de déploiement. |
| Accessibilité | Barre d'outils et dialogues utilisables au clavier, libellés ARIA. |
