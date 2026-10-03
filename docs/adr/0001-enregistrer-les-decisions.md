# ADR-0001 : Enregistrer les décisions d'architecture

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Le projet est développé majoritairement par un agent autonome qui redémarre souvent sans mémoire des sessions précédentes. Sans trace écrite, les décisions sont rediscutées ou contredites.

## Décision

Une décision par fichier (ADR, format allégé), dans le répertoire `docs/adr/`, gabarit `template.md`, index dans `README.md`.

## Conséquences

- L'agent lit les ADR liés au ticket avant de coder et cite les ADR dans les commits quand c'est pertinent.
- Petit coût d'écriture à chaque décision structurante.
