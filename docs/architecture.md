# Architecture

Document vivant : il décrit l'état **actuel** du code. Toute évolution de structure, de flux ou de modèle de données le met à jour dans le même commit. Les justifications sont dans les ADR.

> Tant que le code n'existe pas, ce document décrit l'architecture **cible**. L'agent l'aligne sur la réalité au fil des tickets.

## Vue d'ensemble

```
┌──────────────────────── Navigateur (apps/web) ────────────────────────┐
│  React UI (toolbar, dialogs, liste des boards)                        │
│  Zustand : état local (outil actif, viewport, sélection, édition)     │
│  Konva (react-konva) : rendu du canvas                                │
│        ▲ lit                         │ appelle                         │
│        │                             ▼                                 │
│  packages/model : Y.Doc du board, opérations, géométrie, UndoManager   │
│        │                             │ HocuspocusProvider (WebSocket)  │
└────────┼─────────────────────────────┼─────────────────────────────────┘
         │ REST /api/boards            │ ws://.../collab  (Yjs + Awareness)
┌────────▼─────────────────────────────▼──────── apps/server ────────────┐
│  Fastify : API REST des boards       Hocuspocus : synchro des Y.Doc    │
│                 └──────── SQLite (un fichier) ───────┘                 │
│                   table boards     table documents (état Yjs binaire)  │
└────────────────────────────────────────────────────────────────────────┘
```

## Structure du monorepo

```
apps/
  web/            Front React + Vite + Konva
    src/
      app/        Routage client minimal (`routes.ts`, `router.tsx`), pages (BoardListPage = menu `/`, BoardPage = `/b/:id`)
      canvas/     Stage Konva (`board-canvas.tsx`, grille de points), rendu des éléments (`board-elements.tsx`, `use-elements.ts`), sélection, déplacement et redimensionnement au pointeur (`use-select.ts`, cadre et poignées dans `selection-overlay.tsx`, positions dans `selection-handles.ts`), création et édition de post-its (`use-create.ts`), pan (`use-pan.ts`), zoom à la molette (`use-zoom.ts`)
      tools/      Raccourcis clavier (`shortcuts.ts` : outils, zoom, déplacement aux flèches, `Ctrl+Z`) ; les outils eux-mêmes arrivent avec leurs stories
      identity/   Identité locale (`identity.ts`, `localStorage`) et dialogue de nom
      components/
        ui/       Composants shadcn/ui copiés dans le dépôt (ADR-0011) : `button`, `dialog`, `input`, `label`, `toggle-group`
        board/    Composants du projet : `toolbar.tsx`, `zoom-controls.tsx`, `text-editor.tsx`, `context-bar.tsx` ; autres dialogues à venir
      lib/        `utils.ts` (`cn` de shadcn/ui), `theme-tokens.ts` (jetons de la charte exposés au canvas), client REST (`boards-api.ts`)
      index.css   Thème : import Tailwind, variables shadcn/ui `neutral`, jetons du projet
      state/      Stores Zustand (UI locale uniquement) : `viewport-store.ts` (viewport, pan et zoom), `tool-store.ts` (outil actif), `canvas-size-store.ts` (taille du canvas, ancre du zoom), `selection-store.ts` (sélection, ajout/retrait avec `toggle`), `editing-store.ts` (élément en édition)
      collab/     Connexion Hocuspocus, awareness (curseurs), contexte du document (`board-doc-context.ts`), historique d'annulation (`history-context.ts`)
      testing/    Exposition de window.__board en mode VITE_E2E, dont `getOverlayBoxes()`
  server/         Fastify + Hocuspocus
    src/
      config.ts   Configuration d'environnement validée au démarrage
      http/       Routes REST
      collab/     Configuration Hocuspocus, extension de persistance
      db/         Accès SQLite, migrations
    test/         Tests d'intégration
packages/
  model/          TypeScript pur, sans React ni Konva
    src/
      schema.ts       Types et validation (zod) des éléments, palette de couleurs
      doc.ts          Création/accès au Y.Doc d'un board
      history.ts      Historique d'annulation (`createBoardHistory`, limité à LOCAL_ORIGIN)
      ops.ts          Opérations : createElement, createSticky, updateElement, moveElements, setElementsColor, deleteElements, elementAtPoint, elementsInBox, LOCAL_ORIGIN
      resize.ts       Redimensionnement : `MIN_ELEMENT_SIZE`, `RESIZE_HANDLE_ORDER`, `isResizable`, `resizeHandlePoint`, `resizeHandleAtPoint`, `resizeBox`
      text-fit.ts     Taille de police d'un post-it qui fait tenir son texte (`fitStickyFontSize`)
      geometry.ts     Boîte englobante (`unionBounds`), rectangle de sélection (`boxFromPoints`)
      viewport.ts     Conversions coordonnées monde ↔ écran
  config/         Configs partagées (tsconfig, biome)
tooling/          Outillage du dépôt (validateur de message de commit, orchestration Docker)
e2e/              Tests Playwright
e2e-docker/       Tests Playwright de l'image Docker (`pnpm test:docker`)
Dockerfile        Image multi-étapes de l'application packagée (ADR-0010)
docker-compose.yml Lancement local (port 127.0.0.1:8080, volume board-data)
docs/             Documentation (voir AGENTS.md)
```

Règle de dépendance : `apps/* → packages/model`. `packages/model` ne dépend d'aucune app. `apps/web` et `apps/server` ne s'importent jamais mutuellement.

## Modèle de données

### Board (métadonnées, SQLite, API REST)

| Champ | Type | Notes |
|---|---|---|
| `id` | string (nanoid 12) | Utilisé dans l'URL `/b/:id` et comme nom du document Hocuspocus |
| `name` | string (1 à 100 caractères) | |
| `createdAt`, `updatedAt` | ISO 8601 | `updatedAt` mis à jour aussi lors des écritures Hocuspocus |

### Document Yjs d'un board

Un `Y.Doc` par board, contenant :

- `elements : Y.Map<Y.Map<unknown>>` : clé = id de l'élément, valeur = `Y.Map` de ses propriétés (une propriété par clé, pour que deux utilisateurs modifiant deux propriétés différentes du même élément ne se gênent pas).
- `meta : Y.Map` : version du schéma (`schemaVersion`).

`updateElement` n'écrit que les propriétés présentes dans le patch (et les bornes dérivées d'une flèche quand ses extrémités changent) : deux utilisateurs qui déplacent et recolorient le même élément en même temps appliquent bien les deux modifications (F09-S1-AC2, ADR-0004).

Propriétés communes à tous les éléments :

| Propriété | Type | Notes |
|---|---|---|
| `id` | string | nanoid |
| `type` | `'sticky' \| 'rect' \| 'ellipse' \| 'text' \| 'arrow'` | |
| `x`, `y` | number | Coordonnées monde du coin haut-gauche |
| `width`, `height` | number | > 0 |
| `zIndex` | string | Clé d'indexation fractionnaire (`fractional-indexing`) : avancer ou reculer d'un plan sans renuméroter les autres éléments |
| `createdBy` | string | Id client de l'auteur |

Propriétés spécifiques :

| Type | Propriétés |
|---|---|
| `sticky` | `text: string`, `color: PaletteColor` (palette de 10 couleurs, `features/README.md`) |
| `rect`, `ellipse` | aucune (style fixe) |
| `text` | `text: string`, `color: PaletteColor` (taille de police fixe : 20) |
| `arrow` | `x1, y1, x2, y2: number` (départ, arrivée). `x, y, width, height` sont dérivés et recalculés |

Le texte est une `string` remplacée en bloc (dernier écrivain gagne au niveau de la propriété). L'édition concurrente caractère par caractère d'un même texte n'est pas un besoin MVP (ADR-0004).

### Présence (Yjs Awareness, non persistée)

```ts
type PresenceState = {
  user: { id: string; name: string; color: string }
  cursor: { x: number; y: number } | null   // coordonnées monde
}
```

L'identité est locale : nom saisi juste avant l'entrée dans le premier board, stocké dans `localStorage` avec un id aléatoire, couleur attribuée de façon déterministe à partir de l'id. Le curseur est envoyé au plus toutes les 50 ms et interpolé à l'affichage chez les autres (FL-4).

## Flux principaux

**Modification locale** : événement pointeur → outil actif → fonction de `packages/model/ops` dans `doc.transact(fn, LOCAL_ORIGIN)` → Yjs émet la mise à jour → (a) le rendu Konva se met à jour via l'observation du document, sans attendre le serveur (FL-1), (b) le provider envoie la mise à jour au serveur. Pendant un glisser, les positions intermédiaires sont écrites au plus toutes les 50 ms (FL-4).

**Sélection** (F07-S1) : la sélection est un état local (Zustand), jamais écrite dans le document Yjs. Avec l'outil Sélection, un clic sélectionne l'élément sous le pointeur (le plus haut), Shift+clic l'ajoute ou le retire, un glisser depuis une zone vide trace un rectangle qui sélectionne les éléments entièrement contenus (`elementsInBox`), `Ctrl+A` sélectionne tout et Échap ou un clic dans le vide désélectionne. Le cadre et ses huit poignées (`selectionHandles`, tailles divisées par le zoom) sont dessinés par `selection-overlay.tsx`.

**Déplacement** (F07-S2) : un glisser sur un élément déjà sélectionné déplace toute la sélection de `(dx/zoom, dy/zoom)` en coordonnées monde, via `moveElements` (une transaction par écriture, `x`/`y` et les extrémités d'une flèche). Les positions intermédiaires sont écrites au plus toutes les 50 ms (FL-4) ; `stopCapturing()` encadre le glisser pour que le `Y.UndoManager` en fasse une seule entrée d'annulation. Les flèches du clavier déplacent la sélection de 1 unité monde, ou 10 avec Shift. `Ctrl+Z` annule la dernière modification locale (`useUndoShortcut`) ; le rétablissement, les boutons et l'isolation entre utilisateurs arrivent avec F08-S2.

**Redimensionnement** (F07-S3) : un appui sur une poignée du cadre, quand un seul élément redimensionnable (post-it, forme) est sélectionné, démarre un redimensionnement. `resizeBox` calcule la nouvelle boîte pure à partir de la boîte d'origine, de la poignée et du pointeur : le coin ou le côté opposé reste fixe (AC1), Shift conserve le rapport largeur/hauteur (AC2) et la taille est bornée à `MIN_ELEMENT_SIZE` (AC3). Le texte libre (taille liée au contenu) et les flèches (poignées d'extrémité, F06-S2) ne se redimensionnent pas. `updateElement` écrit `x`/`y`/`width`/`height` au plus toutes les 50 ms, `stopCapturing()` encadre le geste pour une seule entrée d'annulation.

**Édition de texte** : un double-clic sur un post-it existant, ou Entrée sur un post-it seul sélectionné, ouvre l'éditeur HTML superposé à l'élément. La saisie reste locale (état React de l'éditeur) et n'est écrite dans Yjs qu'à la validation (Entrée, Échap ou perte de focus), ce qui préserve le texte et la position du curseur malgré les mises à jour distantes (F03-S2, FL-5). La taille de police est ajustée par `fitStickyFontSize` pour que le texte tienne, sans descendre sous 10 px.

**Changement de couleur** (F03-S3) : quand la sélection contient un post-it ou un texte, la barre contextuelle (`components/board/context-bar.tsx`) apparaît centrée au-dessus du cadre de sélection (ou en dessous s'il n'y a pas la place, UI-BOARD-7) et propose les dix couleurs de la palette, la couleur courante marquée `aria-pressed`. Choisir une couleur écrit `color` sur tous les post-its et textes sélectionnés via `setElementsColor`, en une seule transaction à origine locale : l'effet est local et immédiat, sans attendre le serveur (FL-1).

**Modification distante** : serveur → provider → mise à jour appliquée au `Y.Doc` → observation → rendu. Le `Y.UndoManager` ne suit que `LOCAL_ORIGIN` : annuler n'annule jamais le travail d'un autre.

**Création d'un board** : clic sur « Nouveau board » → `POST /api/boards` → navigation vers `/b/<id>`.

**Ouverture d'un board** (depuis le menu ou une URL directe) : `GET /api/boards/:id` (404 si inexistant) → si aucun nom en `localStorage`, dialogue de nom → connexion Hocuspocus → synchronisation de l'état serveur → affichage.

**Persistance** : Hocuspocus charge l'état depuis SQLite à la première connexion (`fetch`) et l'enregistre après modification avec un debounce (`store`, 2 s, max 10 s).


## API REST

| Méthode | Route | Corps | Réponse |
|---|---|---|---|
| GET | `/api/boards` | | `200 Board[]` triés par `updatedAt` décroissant |
| POST | `/api/boards` | `{ name }` | `201 Board` |
| GET | `/api/boards/:id` | | `200 Board` ou `404` |
| PATCH | `/api/boards/:id` | `{ name }` | `200 Board` ou `404` |
| DELETE | `/api/boards/:id` | | `204` ; supprime aussi le document Yjs et déconnecte les clients |
| GET | `/api/health` | | `200 { status: 'ok' }` |
| POST | `/api/test/seed` | `{ name, elements: number }` | `201 Board` pré-rempli. **Uniquement si `NODE_ENV=test`** |
| POST | `/api/test/reset` | | `204`, vide la base. **Uniquement si `NODE_ENV=test`** |

Validation des entrées par schémas zod, erreurs au format `{ error: { code, message } }`.

## Modes d'exécution

| Mode | Commande | Front | Serveur |
|---|---|---|---|
| Développement | `pnpm dev` | Serveur Vite (port 5173), relaie `/api` et `/collab` vers le serveur Node | Node, port 3001 |
| Application packagée | `docker compose up --build` | Compilé, servi en statique par le serveur Node | Node dans un conteneur, port 3001 publié sur `127.0.0.1:8080` |

Le front utilise toujours des URL relatives (`/api`, `/collab`), identiques dans les deux modes. En mode packagé, toute route inconnue hors `/api` et `/collab` renvoie `index.html` (ADR-0010).

## Configuration

| Variable | Défaut | Usage |
|---|---|---|
| `PORT` | `3001` | Port du serveur (HTTP + WebSocket sur `/collab`) |
| `DATABASE_PATH` | `./data/board.sqlite` (Docker : `/data/board.sqlite`) | Fichier SQLite ; `:memory:` en test d'intégration |
| `STATIC_DIR` | absent (Docker : chemin de `apps/web/dist`) | Si défini, le serveur sert le front compilé depuis ce dossier |
| `VITE_E2E` | absent | Active `window.__board` |
