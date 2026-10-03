# Navigation

## Écrans et routes

| Écran | Route | Story |
|---|---|---|
| Menu des boards | `/` | F01-S1, F01-S2 |
| Board | `/b/:id` | F01-S1 et suivantes |
| Board introuvable | `/b/:id` (id inexistant) | F01-S5 |
| Board supprimé | message affiché sur `/b/:id` | F01-S4 |

Dialogues (pas de route propre) : saisie du nom (F10-S1), confirmation de suppression (F01-S4). Le renommage se fait en place dans l'en-tête du board (F01-S3).

## Transitions

```
                ┌───────────────────────────── « ← Boards » / Précédent ─────────────────────────────┐
                ▼                                                                                     │
  ┌──────────────────────┐  clic sur un board    ┌───────────────────────┐  nom validé   ┌───────────┴────┐
  │  /  Menu des boards  │ ────────────────────> │ Dialogue de nom       │ ────────────> │ /b/:id  Board  │
  │                      │  « Nouveau board »    │ (seulement si aucun   │               │                │
  │                      │ ────────────────────> │  nom mémorisé)        │               │                │
  └──────────────────────┘                       └───────────┬───────────┘               └───────┬────────┘
            ▲                                    « Retour    │                                   │ board supprimé
            │                                    aux boards »│                                   ▼ par un autre
            └────────────────────────────────────────────────┘                     ┌──────────────────────────┐
            ▲                                                                       │ « Ce board a été         │
            └────────────────────── lien « Retour aux boards » ──────────────────── │   supprimé »             │
            ▲                                                                       └──────────────────────────┘
            │                                     ┌──────────────────────────┐
            └──────── lien « Retour aux boards » ─│ /b/:id inexistant :      │
                                                  │ « Board introuvable »    │
                                                  └──────────────────────────┘

  URL /b/:id ouverte directement (lien partagé) ──> même chemin : dialogue de nom si besoin, puis Board.
```

## Règles

- Chaque passage du menu à un board, ou d'un board au menu, ajoute une entrée dans l'historique du navigateur : Précédent depuis un board revient au menu, Suivant y retourne.
- Le dialogue de nom n'ajoute pas d'entrée d'historique. Précédent pendant le dialogue revient à l'écran d'origine (menu, ou page précédente pour une URL directe).
- Recharger `/b/:id` réaffiche le même board, sans dialogue si le nom est mémorisé. Recharger `/` réaffiche le menu.
- Créer un board mène directement à ce board ; Précédent revient au menu, qui affiche le nouveau board en tête de liste.
- Après une suppression depuis le menu, on reste sur le menu.
- Le titre de l'onglet du navigateur est « Boards » sur le menu et « <nom du board> » sur un board.
