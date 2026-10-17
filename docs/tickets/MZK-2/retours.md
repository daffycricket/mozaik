# Retours MZK-2 : Mesures FL-1 gonflées par l'attente des tests

## Tech review : 2026-10-17

- [impl] Risque « Seuils » du plan : ne jamais modifier un seuil de F00 dans ce ticket (B-004-AC1 exige des seuils inchangés), même dans les planchers de calibrage. Si une mesure dépasse son seuil après le correctif, décrire un bug dans le rapport (qualification secondaire si le dépassement préexiste au ticket) au lieu d'ajuster le seuil.
