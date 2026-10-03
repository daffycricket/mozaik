# Design

Référence d'ergonomie et d'apparence de l'application. Les maquettes sont en texte (ASCII) : elles fixent la **structure** (quels éléments, où, dans quel ordre, quels états), pas le pixel.

| Fichier | Contenu |
|---|---|
| [navigation.md](navigation.md) | Écrans, routes, transitions, comportement de Précédent et du rechargement |
| [ecrans.md](ecrans.md) | Maquettes de chaque écran et dialogue, et règles d'ergonomie vérifiables `UI-*` |
| [composants.md](composants.md) | Composants : composant shadcn/ui utilisé, `data-testid`, états, clavier |
| [charte.md](charte.md) | Thème shadcn/ui utilisé et jetons propres au projet (canvas, sélection, mise en page) |

Règles :

- Ces fichiers n'ajoutent aucune fonctionnalité : chaque élément d'interface correspond à une story de `docs/features/`. En cas d'écart, la story fait foi et le design est corrigé (entrée `spec` dans le journal).
- Les règles `UI-*` de `ecrans.md` sont des critères d'acceptance : chacune est rattachée à une story et couverte par un test e2e (voir `process/testing.md`, « Conformité aux maquettes »).
- Design system : **shadcn/ui** sur Base UI, thème par défaut `neutral`, mode clair (ADR-0011). Avant de créer un composant sur mesure, l'agent utilise le composant shadcn/ui indiqué dans `composants.md`.
- Toute valeur visuelle du code vient du thème shadcn/ui (classes Tailwind du thème) ou des jetons de `charte.md`. Pas de valeur en dur.
