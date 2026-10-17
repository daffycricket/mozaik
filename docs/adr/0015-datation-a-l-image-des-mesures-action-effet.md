# ADR-0015 : Datation à l'image de la mesure action → effet dans l'utilitaire e2e

- Statut : Accepted
- Date : 2026-10-17
- Décideurs : agent
- Ticket : MZK-2, créé au design (avant le code)
- Raison : supprimer le biais des mesures FL-1 dû au palier de sondage de l'attente du test, pour tous les tests de fluidité
- Remplace : aucun
- Liens : F00 (« Méthode de mesure »), B-004, `process/testing.md`, `e2e/support/action-effect.ts`

## Contexte

`measureActionToEffect` datait la fin du délai au moment où le callback d'effet fourni par le test se résolvait. Quand ce callback attendait avec `expect.poll`, la première vérification n'avait lieu qu'au premier palier de sondage (100 ms par défaut) : un effet visible plus tôt était daté jusqu'à environ 100 ms trop tard, et la mesure relevait le délai d'attente du test, pas la réaction de l'application. Le biais touchait toutes les mesures action → effet (FL-1, FL-4, FL-7), à des degrés variables selon la méthode d'attente de chaque test. F00 exige désormais que chaque mesure date l'effet à la première image d'animation où il devient visible, indépendamment de la méthode d'attente du test.

## Décision

`measureActionToEffect` reçoit l'effet sous la forme d'un prédicat navigateur autonome `(arg) => boolean` accompagné d'un argument sérialisable. L'utilitaire matérialise le prédicat dans la page, l'évalue à chaque image (`page.waitForFunction`, sondage `requestAnimationFrame`) et retient le `performance.now()` de la première image où il est vrai ; le début reste l'instant qui précède immédiatement l'action. La datation est ainsi centralisée dans l'utilitaire, indépendamment de la méthode d'attente du test.

## Conséquences

- Positives : toutes les mesures action → effet sont datées à l'image, sans palier de sondage ; le biais disparaît pour FL-1, FL-4 et FL-7 sans toucher aux seuils de F00, au nombre d'exécutions ni à la médiane.
- Négatives / dettes acceptées : les prédicats doivent être autonomes (pas de fermeture sur une variable Node, pas d'import) ; la matérialisation repose sur le source du prédicat (`Function.prototype.toString`), dont la stabilité après transpilation est vérifiée par un test dédié. Les tests expriment leur effet en logique navigateur plutôt qu'avec les assertions Playwright, ce qui déplace un peu de duplication dans les specs.
