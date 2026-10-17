# Synthèse : MZK-3 Bouton pour recadrer la vue sur tout le contenu

## Spec review : 2026-10-17

### Ce que j'ai compris

La carte demande d'ajouter un bouton dans les contrôles de zoom, en bas à droite du board, qui fait exactement ce que fait déjà le raccourci `Shift+1` : recadrer la vue sur tout le contenu. Ton retour porte uniquement sur la façon de décrire l'interface : la phase spec avait créé une règle d'écran séparée pour ce bouton, alors que la règle qui fixe déjà la composition et l'ordre des contrôles de zoom existait.

### Ce qui change

Le bouton de recadrage est désormais décrit dans la règle existante des contrôles de zoom (UI-BOARD-5), qui devient la règle unique du groupe : dans l'ordre −, pourcentage, +, puis le bouton de recadrage, avec une icône explicite et une infobulle qui rappelle `Shift+1`. La règle séparée créée en spec (UI-BOARD-13) est supprimée et son numéro n'est pas réutilisé. Le critère d'acceptance du ticket et la maquette du board ne changent pas : ils décrivaient déjà le bouton comme une variante du recadrage au clavier.

### Ce que tu dois trancher

Rien de bloquant : ton retour est appliqué. Restent mes deux hypothèses de la spec, toujours valables et maintenant rattachées à la règle unique : le bouton est placé après « + », à droite du groupe (la carte ne précise pas le côté), et son icône est `maximize` avec une infobulle « Recadrer sur tout le contenu (Shift+1) » (la carte demande une « icône explicite » sans la nommer).

## Design : 2026-10-17

### Ce que j'ai compris

Le bouton demandé doit se comporter exactement comme le raccourci `Shift+1` déjà en place : recadrer la vue sur tout le contenu, avec les mêmes règles de marge, de dézoom, de board vide et de bornes de zoom. Pour éviter que les deux déclencheurs divergent un jour, je ne duplique pas la logique : je l'extrais dans une petite fonction partagée que le raccourci et le bouton appellent tous les deux.

### Ce qui change

Le plan tient en une étape. J'ajoute un bouton `zoom-fit` après les boutons + et −, avec l'icône « maximize » et une infobulle qui rappelle `Shift+1`, et je fais lire le document du board au composant par le contexte, comme la barre contextuelle. Côté tests, j'étends les tests existants de la règle des contrôles de zoom pour inclure le nouveau bouton, et j'ajoute des tests qui cliquent dessus sur un contenu plus petit, plus grand, un board vide et un contenu qui atteint la borne de zoom, en réutilisant les scénarios déjà écrits pour le raccourci. La documentation d'architecture est mise à jour ; aucun ADR n'est nécessaire, aucune donnée ne change.

### Ce que tu dois trancher

Un seul point : l'infobulle. La charte et la fiche composants demandent le composant Tooltip de shadcn/ui, mais il n'existe pas encore dans le projet et tous les boutons icône actuels utilisent l'infobulle native du navigateur. J'ai prévu de suivre la spec et d'ajouter le composant Tooltip, avec un repli sur l'infobulle native si son ajout s'avère impossible en dev. Dis-moi si tu préfères qu'on s'en tienne à l'infobulle native partout.
