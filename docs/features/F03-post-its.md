# F03 : Post-its

- ADR liés : ADR-0004
- Dépend de : F02

## Objectif

L'utilisateur pose des post-its colorés et y écrit du texte, l'élément de base d'un atelier.

## Règles métier

- Taille par défaut : 200 × 200 unités monde. Taille minimale : 50 × 50.
- Couleur : une des 10 couleurs de la palette commune ([README](README.md#palette-de-couleurs)), teinte « fond ». Défaut : `yellow`.
- Texte : 0 à 2 000 caractères, multi-ligne, centré. Couleur du texte : `#111827`, sauf sur un post-it `black` où il est blanc (contraste ≥ 4,5:1). La taille de police est réduite automatiquement pour que le texte tienne dans le post-it (minimum 10 px à zoom 100 %).

## Stories

### F03-S1 : Créer un post-it

**Critères d'acceptance**

- **F03-S1-AC1** : création par clic avec l'outil
  - Étant donné l'outil Post-it actif (`N`)
  - Quand je clique sur le canvas au point monde P
  - Alors un post-it jaune de 200 × 200 centré sur P est créé, sélectionné, et l'outil revient à Sélection
- **F03-S1-AC2** : création par double-clic
  - Étant donné l'outil Sélection
  - Quand je double-clique sur une zone vide
  - Alors un post-it est créé à cet endroit et passe directement en édition de texte
- **F03-S1-AC3** : ordre d'affichage
  - Quand je crée un post-it par-dessus un élément existant
  - Alors le nouveau post-it est affiché au-dessus
- **F03-S1-AC4** : fluidité
  - La création respecte FL-1 (F00)

### F03-S2 : Écrire dans un post-it

**Critères d'acceptance**

- **F03-S2-AC1** : entrer en édition
  - Étant donné un post-it
  - Quand je double-clique dessus ou appuie sur Entrée quand il est seul sélectionné
  - Alors une zone de saisie (`data-testid="text-editor"`) apparaît sur le post-it avec le texte existant
- **F03-S2-AC2** : valider
  - Quand je saisis « Idée 1 », puis Échap ou clic en dehors
  - Alors le texte du post-it est « Idée 1 » dans le document
- **F03-S2-AC3** : multi-ligne
  - Quand je saisis Shift+Entrée pendant l'édition
  - Alors un retour à la ligne est inséré
- **F03-S2-AC4** : ajustement de police
  - Étant donné un texte long qui déborde à la taille de police par défaut
  - Alors la taille de police affichée diminue sans descendre sous 10 px (test unitaire de la fonction de calcul)
- **F03-S2-AC5** : fluidité
  - La saisie respecte FL-1, FL-5 et FL-6 (F00), y compris quand un autre utilisateur modifie le board pendant la saisie

### F03-S3 : Changer la couleur

**Critères d'acceptance**

- **F03-S3-AC1** : barre contextuelle
  - Étant donné un ou plusieurs post-its sélectionnés
  - Quand je choisis `blue` dans la barre contextuelle (`data-testid="color-blue"`)
  - Alors tous les post-its sélectionnés deviennent bleus
- **F03-S3-AC2** : palette complète
  - Alors la barre contextuelle propose exactement les 10 couleurs de la palette commune, la couleur courante étant signalée (`aria-pressed="true"`)
- **F03-S3-AC3** : fluidité
  - Le changement de couleur respecte FL-1 (F00)

## Hors périmètre

- Auteur affiché, votes, réactions, tags, mémorisation de la dernière couleur utilisée, couleur du texte du post-it.
