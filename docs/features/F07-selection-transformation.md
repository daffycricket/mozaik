# F07 : Sélection, déplacement, redimensionnement, ordre

- ADR liés : ADR-0003, ADR-0004
- Dépend de : F03

## Objectif

L'utilisateur sélectionne un ou plusieurs éléments pour les déplacer, les redimensionner ou changer leur ordre d'affichage.

## Règles métier

- La sélection est locale à chaque utilisateur (diffusée en présence, F10, mais pas dans le document).
- Un déplacement ou un redimensionnement produit une seule entrée d'annulation, quelle que soit sa durée.
- Pendant un glisser, les positions intermédiaires sont envoyées au document au plus toutes les 50 ms, pour que les autres voient le mouvement.
- Les flèches n'ont pas de poignées de redimensionnement (elles ont deux poignées d'extrémité, F06-S2).
- Le texte libre ne se redimensionne pas : sa taille suit son contenu (F05).

## Stories

### F07-S1 : Sélectionner

**Critères d'acceptance**

- **F07-S1-AC1** : clic
  - Quand je clique sur un élément avec l'outil Sélection
  - Alors il est le seul sélectionné et entouré d'un cadre avec poignées
- **F07-S1-AC2** : ajout à la sélection
  - Quand je clique sur un autre élément avec Shift
  - Alors il est ajouté (ou retiré s'il était déjà sélectionné)
- **F07-S1-AC3** : rectangle de sélection
  - Quand je fais glisser depuis une zone vide
  - Alors tous les éléments entièrement contenus dans le rectangle sont sélectionnés
- **F07-S1-AC4** : tout sélectionner, désélectionner
  - Quand j'appuie sur `Ctrl+A`, puis sur Échap ou clic dans le vide
  - Alors tous les éléments sont sélectionnés, puis aucun

### F07-S2 : Déplacer

**Critères d'acceptance**

- **F07-S2-AC1** : glisser
  - Étant donné deux éléments sélectionnés
  - Quand je fais glisser l'un d'eux de (dx, dy) en coordonnées écran
  - Alors les deux se déplacent de (dx/zoom, dy/zoom) en coordonnées monde
- **F07-S2-AC2** : flèches du clavier
  - Quand j'appuie sur une flèche (Shift+flèche)
  - Alors la sélection se déplace de 1 (10) unité(s) monde
- **F07-S2-AC3** : une seule annulation
  - Quand je fais un long glisser puis `Ctrl+Z`
  - Alors les éléments reviennent à leur position de départ en une seule annulation
- **F07-S2-AC4** : fluidité locale
  - Le glisser respecte FL-1, FL-2 et FL-3 (F00) sur un board de 300 éléments
- **F07-S2-AC5** : fluidité vue par les autres
  - Étant donné deux utilisateurs
  - Quand l'utilisateur 1 déplace un élément pendant 1 s
  - Alors l'utilisateur 2 voit le mouvement de façon continue (FL-4), et ce mouvement ne perturbe pas ce que l'utilisateur 2 est en train de faire (FL-5)

### F07-S3 : Redimensionner

**Critères d'acceptance**

- **F07-S3-AC1** : poignée d'angle
  - Étant donné un rectangle sélectionné
  - Quand je fais glisser la poignée bas-droite
  - Alors sa largeur et sa hauteur changent, son coin haut-gauche reste fixe
- **F07-S3-AC2** : proportions
  - Quand je redimensionne avec Shift
  - Alors le rapport largeur/hauteur est conservé
- **F07-S3-AC3** : taille minimale
  - Quand je réduis en dessous de la taille minimale du type
  - Alors la taille est bornée à ce minimum
- **F07-S3-AC4** : fluidité
  - Le redimensionnement respecte FL-1 et FL-2 (F00)

### F07-S4 : Avancer et reculer dans le plan

En tant qu'utilisateur, je veux faire passer un élément devant ou derrière les éléments qu'il chevauche, afin de régler ce qui est visible.

**Critères d'acceptance**

- **F07-S4-AC1** : avancer d'un plan
  - Étant donné trois éléments A, B, C superposés dans cet ordre (A en dessous) et A sélectionné
  - Quand j'appuie sur `]` ou clique sur « Avancer » (`data-testid="order-forward"`)
  - Alors l'ordre devient B, A, C
- **F07-S4-AC2** : reculer d'un plan
  - Étant donné C sélectionné dans B, A, C
  - Quand j'appuie sur `[` ou clique sur « Reculer » (`data-testid="order-backward"`)
  - Alors l'ordre devient B, C, A
- **F07-S4-AC3** : limites
  - Quand l'élément est déjà tout devant (ou tout derrière) et que je l'avance (ou le recule)
  - Alors rien ne change et le bouton correspondant est désactivé
- **F07-S4-AC4** : sélection multiple
  - Étant donné plusieurs éléments sélectionnés
  - Quand je les avance ou les recule
  - Alors chacun avance ou recule d'un plan et leur ordre relatif est conservé
- **F07-S4-AC5** : ordre concurrent
  - Étant donné deux utilisateurs qui avancent chacun un élément différent au même moment
  - Alors les deux clients convergent vers le même ordre (test d'intégration sur `packages/model`)

## Hors périmètre

- Mettre directement au premier plan ou à l'arrière-plan, rotation, groupes, alignement et distribution, magnétisme, verrouillage.
