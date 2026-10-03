# F06 : Flèches

- ADR liés : ADR-0004
- Dépend de : F07-S2

## Objectif

L'utilisateur trace des flèches sur le canvas pour indiquer des liens ou des flux.

## Règles métier

- Une flèche est un segment droit entre deux points du canvas, avec une pointe à l'extrémité d'arrivée.
- Une flèche est **libre** : elle n'est pas attachée aux éléments qu'elle relie visuellement. Déplacer un post-it ne déplace pas la flèche.
- Style fixe : trait `#1f2937`, épaisseur 2. Longueur minimale : 10 unités ; un glisser plus court ne crée rien.
- Une flèche se sélectionne, se déplace, s'ordonne, se supprime et se copie comme les autres éléments (F07, F08). Elle n'a pas de poignées de redimensionnement mais deux poignées d'extrémité.

## Stories

### F06-S1 : Tracer une flèche

**Critères d'acceptance**

- **F06-S1-AC1** : tracé
  - Étant donné l'outil Flèche (`A`)
  - Quand je fais glisser de A à B
  - Alors une flèche de A vers B est créée, sélectionnée, et l'outil revient à Sélection
- **F06-S1-AC2** : tracé trop court
  - Quand je fais glisser sur moins de 10 unités
  - Alors aucune flèche n'est créée
- **F06-S1-AC3** : indépendance
  - Étant donné une flèche tracée d'un post-it à un autre
  - Quand je déplace un des post-its
  - Alors la flèche ne bouge pas
- **F06-S1-AC4** : fluidité
  - Pendant le glisser, la flèche en cours de tracé suit le pointeur en respectant FL-1 et FL-2 (F00)

### F06-S2 : Modifier une flèche

**Critères d'acceptance**

- **F06-S2-AC1** : déplacer une extrémité
  - Étant donné une flèche sélectionnée
  - Quand je fais glisser sa poignée d'arrivée vers C
  - Alors l'arrivée de la flèche est en C et le départ n'a pas bougé
- **F06-S2-AC2** : déplacer la flèche entière
  - Quand je fais glisser le corps de la flèche
  - Alors ses deux extrémités se déplacent du même vecteur

## Hors périmètre

- Flèches attachées aux éléments, tracés coudés ou courbes, libellés, couleurs, pointes aux deux extrémités.
