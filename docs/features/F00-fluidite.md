# F00 : Fluidité (exigences transverses)

- ADR liés : ADR-0003, ADR-0004, ADR-0006
- S'applique à : toutes les stories qui comportent une interaction sur le canvas

## Objectif

Il ne suffit pas que l'application fonctionne : l'utilisateur doit la percevoir comme fluide. Ses actions ont un effet visible immédiat, les mouvements sont continus, rien ne saute ni ne fige, et les actions des autres arrivent sans à-coups.

Ces exigences ne portent pas sur la performance des API : elles se mesurent **dans le navigateur, du point de vue de l'utilisateur**.

## Exigences mesurables

Seuils volontairement tolérants : ils visent à détecter une expérience qui rame, pas à optimiser à la milliseconde.

| ID | Exigence | Seuil cible (e2e, Chromium, machine de dev, `workers: 1`) |
|---|---|---|
| **FL-1** | Retour local immédiat | L'effet d'une action (création, déplacement, redimensionnement, frappe, changement de couleur, suppression) est visible en ≤ 150 ms, **y compris avec 300 ms de latence réseau simulée**. L'interface n'attend jamais le serveur pour afficher une action locale. |
| **FL-2** | Images fluides | Pendant un pan, un zoom, un glisser ou un redimensionnement sur un board de 300 éléments : intervalle médian entre deux images ≤ 33 ms (≥ 30 images/s) et aucun intervalle > 200 ms. |
| **FL-3** | Pas de gel | Aucune tâche longue (`PerformanceObserver` type `longtask`) > 200 ms pendant ces interactions ni pendant l'ouverture d'un board. |
| **FL-4** | Mouvements distants continus | Quand un utilisateur A déplace un élément ou son curseur pendant 1 s, l'utilisateur B observe au moins 5 positions intermédiaires distinctes, et la dernière position arrive chez B en ≤ 500 ms. Le curseur distant est interpolé entre deux positions reçues. |
| **FL-5** | Stabilité | Une mise à jour distante ne fait jamais sauter : l'élément que je manipule, mon viewport, ma sélection, ni le texte que je saisis (contenu et position du curseur de saisie conservés). |
| **FL-6** | Saisie sans perte | En frappe rapide (`keyboard.type` sans délai, 200 caractères), aucun caractère n'est perdu ni réordonné. |
| **FL-7** | Ouverture rapide | Depuis le menu ou une URL directe (nom déjà connu), un board de 300 éléments est entièrement affiché en ≤ 3 s ; un board vide en ≤ 1 s. |
| **FL-8** | Revue visuelle | Les scénarios de fluidité sont enregistrés en vidéo par Playwright. Les vidéos restent locales (ignorées par Git) et leur chemin est cité dans le rapport de test du ticket. |

## Méthode de mesure

- Chaque mesure chiffrée (FL-1 à FL-4, FL-7) est prise sur 3 exécutions du scénario ; on retient la **médiane** des 3. Cela absorbe le bruit de la machine sans retry.
- Chaque mesure chiffrée date l'effet **à l'image près** : le délai est relevé jusqu'à la première image d'animation où l'effet devient visible, indépendamment de la méthode d'attente du test (palier de sondage d'un `expect.poll`, etc.). Le délai mesuré est celui de la réaction de l'application, pas celui de l'attente du test.
- FL-5 et FL-6 sont binaires : aucune tolérance.

## Calibrage autonome par l'agent

L'agent ajuste les seuils seul, sans demander l'humain, dans les conditions suivantes :

1. Après les mesures de référence de T-004, puis à tout moment si un seuil se révèle instable (échecs intermittents) ou inadapté à la machine.
2. Il peut assouplir un seuil jusqu'au **plancher** ci-dessous, jamais au-delà. Il peut aussi le resserrer librement.
3. Il met à jour la valeur du seuil dans ce fichier et consigne le changement (valeur avant, valeur après, mesures qui le justifient) dans une entrée `critère` de `docs/journal.md` et dans le rapport du ticket.
4. Si même le plancher n'est pas tenable, il applique la règle d'échec de la phase dev : il trace l'échec au journal et décrit un bug de performance, que le script transforme en carte Trello.

| ID | Plancher (limite d'assouplissement) |
|---|---|
| FL-1 | ≤ 300 ms |
| FL-2 | médiane ≤ 50 ms (≥ 20 images/s), aucun intervalle > 500 ms |
| FL-3 | aucune tâche longue > 500 ms |
| FL-4 | ≥ 3 positions intermédiaires par seconde, dernière position en ≤ 1 s |
| FL-7 | 300 éléments en ≤ 5 s, board vide en ≤ 2 s |

## Application

- Chaque story concernée porte un critère d'acceptance « Fluidité » qui liste les exigences FL applicables. Il est couvert par un test nommé avec l'identifiant de ce critère, comme tout autre critère.
- Les outils de mesure (échantillonnage des images, tâches longues, latence simulée, vidéos) sont fournis par le ticket T-004 et réutilisés par toutes les stories.
- Les tests de fluidité forment un projet Playwright dédié (`fluidity`), lancé par `pnpm test:e2e`.
- Un seuil non atteint est un échec de test, au même titre qu'une erreur fonctionnelle.
