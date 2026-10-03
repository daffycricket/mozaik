# ADR-0011 : Design system shadcn/ui sur Base UI, avec Tailwind CSS

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

L'interface hors canvas (menu des boards, en-tête, barre d'outils, barre contextuelle, contrôles de zoom, dialogues) doit être cohérente, accessible et rapide à produire, sans que l'agent invente un style à chaque story. Le projet ne veut pas définir lui-même une direction visuelle complète.

## Décision

- **shadcn/ui** (MIT) : les composants sont copiés dans le dépôt par la CLI (`pnpm dlx shadcn@latest add <composant>`) dans `apps/web/src/components/ui/`, et deviennent du code du projet.
- Primitives **Base UI** (MIT, défaut de shadcn/ui depuis juillet 2026), couleur de base **`neutral`**, mode clair uniquement.
- **Tailwind CSS v4** via `@tailwindcss/vite`, thème porté par les variables CSS de shadcn/ui.
- Icônes **lucide-react** (ISC).
- Le thème shadcn/ui est utilisé **sans modification**. Seuls les jetons propres au projet (canvas, sélection, mise en page, palette des éléments) sont ajoutés (voir `design/charte.md`).
- Un composant n'est ajouté que lorsqu'une story en a besoin.

## Conséquences

- L'apparence de l'interface découle des valeurs par défaut de shadcn/ui ; `design/charte.md` ne décrit que ce qui est propre au projet.
- Le canvas Konva n'est pas couvert par le design system : ses éléments (post-its, formes, sélection, poignées, curseurs distants) utilisent les jetons du projet, lus par un module TypeScript.
- Les fichiers de `components/ui/` peuvent être adaptés au besoin d'une story ; ils restent soumis au lint et aux tests comme le reste du code.
