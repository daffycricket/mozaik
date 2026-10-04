# Charte visuelle

L'interface utilise **shadcn/ui** avec son thème par défaut, couleur de base `neutral`, mode clair (ADR-0011). Ce fichier ne décrit que ce qui s'y ajoute.

## Ce qui vient de shadcn/ui, sans modification

- Les variables de thème : `--background`, `--foreground`, `--card`, `--popover`, `--primary`, `--secondary`, `--muted`, `--accent`, `--destructive`, `--border`, `--input`, `--ring`, `--radius` et leurs couples `-foreground`.
- Typographie (police sans-serif par défaut de Tailwind), tailles, espacements, ombres et animations des composants.
- Le mode sombre n'est pas utilisé.

Dans le code, ces valeurs s'utilisent par les classes Tailwind du thème (`bg-background`, `text-muted-foreground`, `border`, `bg-primary`, `text-destructive`, `rounded-lg`, `shadow-md`…), jamais par une valeur en dur.

## Jetons propres au projet

Déclarés une seule fois dans le fichier CSS du thème (à côté des variables shadcn/ui), exposés au canvas Konva par un module TypeScript.

| Variable | Valeur | Usage |
|---|---|---|
| `--canvas-bg` | `#FAFAFA` | Fond du canvas |
| `--canvas-dot` | `#D4D4D8` | Points de la grille |
| `--selection` | `#2563EB` | Cadre de sélection, poignées, cadre de la zone de saisie de texte, rectangle de sélection |
| `--selection-fill` | `rgba(37, 99, 235, 0.08)` | Intérieur du rectangle de sélection |
| `--handle-fill` | `#FFFFFF` | Fond des poignées de sélection |
| `--shape-stroke` | `#1F2937` | Trait des formes et des flèches |
| `--cursor-label-text` | `#FFFFFF` | Texte de l'étiquette du curseur distant |
| `--header-height-menu` | 56 px | En-tête du menu |
| `--header-height-board` | 48 px | En-tête du board |
| `--float-gap` | 12 px | Distance des barres flottantes aux bords |
| `--control-size` | 32 px | Boutons d'outil et boutons icône |

La palette des 10 couleurs des post-its et des textes est définie dans `features/README.md` ; les couleurs des utilisateurs dans F10.

## Conventions

- Conteneurs flottants (barre d'outils, barre contextuelle, zoom) : fond `bg-background`, bordure `border`, `rounded-lg`, `shadow-md`.
- Icônes : `lucide-react`, taille 18 px. Chaque bouton icône a un `aria-label` et une infobulle (composant Tooltip) qui indique le raccourci, ex. « Post-it (N) ».
- Aucune animation sur les éléments du canvas : ils suivent immédiatement le pointeur (F00). Les composants shadcn/ui gardent leurs animations par défaut.
- Cible : desktop, souris et clavier, largeur minimale 1024 px.
