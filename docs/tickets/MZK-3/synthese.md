# Synthèse : MZK-3 Bouton pour recadrer la vue sur tout le contenu

## Spec review : 2026-10-17

### Ce que j'ai compris

La carte demande d'ajouter un bouton dans les contrôles de zoom, en bas à droite du board, qui fait exactement ce que fait déjà le raccourci `Shift+1` : recadrer la vue sur tout le contenu. Ton retour porte uniquement sur la façon de décrire l'interface : la phase spec avait créé une règle d'écran séparée pour ce bouton, alors que la règle qui fixe déjà la composition et l'ordre des contrôles de zoom existait.

### Ce qui change

Le bouton de recadrage est désormais décrit dans la règle existante des contrôles de zoom (UI-BOARD-5), qui devient la règle unique du groupe : dans l'ordre −, pourcentage, +, puis le bouton de recadrage, avec une icône explicite et une infobulle qui rappelle `Shift+1`. La règle séparée créée en spec (UI-BOARD-13) est supprimée et son numéro n'est pas réutilisé. Le critère d'acceptance du ticket et la maquette du board ne changent pas : ils décrivaient déjà le bouton comme une variante du recadrage au clavier.

### Ce que tu dois trancher

Rien de bloquant : ton retour est appliqué. Restent mes deux hypothèses de la spec, toujours valables et maintenant rattachées à la règle unique : le bouton est placé après « + », à droite du groupe (la carte ne précise pas le côté), et son icône est `maximize` avec une infobulle « Recadrer sur tout le contenu (Shift+1) » (la carte demande une « icône explicite » sans la nommer).
