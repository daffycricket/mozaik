# MZK-2 : Mesures FL-1 gonflées par l'attente des tests

- Carte : (aucune)
- Type : bug
- Branche : `ticket/MZK-2-mesures-fl-1-gonflees-par-l`

## Demande

Copie du texte de la carte au lancement de la phase spec, sans modification.

> Les mesures de fluidité FL-1 (action → effet local) de plusieurs tests e2e mesurent le délai d'attente du test, pas la réaction de l'application.
> 
> Constat : quand l'effet est attendu avec expect.poll, la première nouvelle vérification n'a lieu qu'au bout de 100 ms. Si l'effet n'est pas visible à la toute première vérification, la mesure gagne environ 100 ms. Exemple sur MZK-1 : [F06-S2-AC3] a mesuré 160,1 ms (seuil 150 ms) et fait échouer la vérification ; avec page.waitForFunction (vérification à chaque image), la même mesure tombe à 49-69 ms.
> 
> Attendu : chaque mesure FL-1 date l'effet à l'image près, quel que soit le test. Les seuils de F00, le nombre d'exécutions et la médiane ne changent pas. Aucun test ne doit être affaibli.
> 
> Périmètre : tous les tests de fluidité qui utilisent measureActionToEffect (e2e/support/action-effect.ts), à inventorier.
