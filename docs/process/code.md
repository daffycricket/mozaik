# Standards de code et de qualité

Règles d'écriture du code, valables pour tous les paquets. Ce qui est vérifiable automatiquement l'est par `pnpm lint` et `pnpm typecheck` (section « Qualité automatisée ») ; le reste s'applique à chaque étape, avant le commit. Tests : `process/testing.md`. Architecture : `architecture.md`.

## 1. Principes

- **Le plus simple qui satisfait les critères d'acceptance.** Pas d'abstraction, d'option ou de paramètre « pour plus tard ». Le périmètre est strict (AGENTS.md §13).
- **Lisible avant d'être astucieux.** Un nom explicite vaut mieux qu'un commentaire.
- **Pas de code mort** : pas de code commenté, de fonction inutilisée, d'export inutilisé. Git garde l'historique.
- **Pas de `TODO` dans le code.** Une dette est signalée dans les points ouverts du rapport du ticket ; l'humain en fait une carte.

## 2. TypeScript

- `strict: true`, plus `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noUnusedLocals`, `noUnusedParameters`. Modules ESM.
- Interdits : `any` explicite, `@ts-ignore`. `@ts-expect-error` seulement avec un commentaire qui explique pourquoi.
- Assertion non nulle `!` : à éviter ; préférer un garde explicite qui lève une erreur parlante.
- Pas d'`enum` : unions de littéraux (`type Tool = 'select' | 'hand' | ...`) et objets `as const`.
- Données venant de l'extérieur (requête HTTP, document Yjs distant, `localStorage`, variables d'environnement) : typées `unknown` puis validées par un schéma zod. Les types se déduisent des schémas (`z.infer`), pas l'inverse.
- `import type` pour les imports de types.
- Exports nommés uniquement, sauf quand un outil impose un export par défaut (fichiers de configuration).

## 3. Nommage et fichiers

| Élément | Convention | Exemple |
|---|---|---|
| Identifiants, fichiers, commentaires | Anglais | `createElement`, `board-list.tsx` |
| Fichiers | `kebab-case` | `context-bar.tsx`, `fractional-order.ts` |
| Composants React | `PascalCase`, un composant exporté par fichier | `ContextBar` |
| Hooks | `useXxx` | `useSelection` |
| Booléens | `is`, `has`, `can` | `isEditing`, `canUndo` |
| Constantes de configuration | `UPPER_SNAKE_CASE` | `MAX_ZOOM` |
| Tests | à côté du code : `*.test.ts(x)` ; intégration : `*.int.test.ts` ; e2e : `e2e/**/*.spec.ts` | `geometry.test.ts` |

- Le vocabulaire suit `glossary.md` : un même concept porte le même nom partout (`sticky`, `arrow`, `viewport`, `peer`).
- Taille indicative : un fichier au-delà de 300 lignes ou une fonction au-delà de 50 lignes se découpe, sauf justification.
- Imports dans `apps/web` : alias `@/` vers `src/`. Pas de chemins relatifs remontant de plus d'un niveau (`../../`).

## 4. Frontières entre modules

- `packages/model` est du TypeScript pur : aucun import de React, Konva, du DOM, de Node ou du réseau. Les sources d'aléa et de temps (génération d'identifiants, horloge) sont injectées, pour que tout soit testable de façon déterministe.
- `apps/web` et `apps/server` dépendent de `packages/model`, jamais l'un de l'autre.
- Dans `apps/web` : les composants Konva ne contiennent pas de logique métier ; ils lisent l'état et appellent des opérations de `packages/model` ou des actions de store.
- Dans `apps/server` : l'accès SQLite est confiné à `src/db/` ; les routes valident, appellent, répondent.

## 5. Modèle partagé (Yjs)

- Toute écriture dans le document passe par une fonction de `packages/model/ops`, exécutée dans `doc.transact(fn, LOCAL_ORIGIN)`. Jamais d'écriture Yjs directe depuis un composant.
- Une action utilisateur = une transaction (et donc une entrée d'annulation), y compris pour une sélection multiple.
- Lecture : les composants s'abonnent à l'élément dont ils ont besoin (abonnement par élément), pas au document entier, pour ne re-rendre que ce qui change.
- L'état partagé vit dans Yjs, l'état local d'interface (outil actif, viewport, édition en cours) dans Zustand. On ne recopie pas l'état partagé dans Zustand.
- Les données lues depuis le document sont validées par le schéma de l'élément ; un élément invalide est ignoré à l'affichage et signalé en console d'erreur, sans faire planter le board.

## 6. React et interface

- Composants fonctionnels et hooks. Pas de `useEffect` pour calculer une valeur dérivée : la calculer au rendu ou avec `useMemo`.
- Composants d'interface : ceux de shadcn/ui indiqués dans `design/composants.md` ; apparence par les classes du thème et les jetons de `design/charte.md`, jamais de valeur en dur. Style en ligne seulement pour des positions calculées (surimpressions sur le canvas).
- Textes affichés à l'utilisateur : en français, tels que dans `design/` et les stories.
- Raccourcis clavier : déclarés dans un module unique, désactivés pendant l'édition d'un texte et dans les dialogues.
- Accessibilité : rôles et `aria-label` de `design/composants.md`, focus visible, tout est utilisable au clavier hors canvas.
- `data-testid` : ceux de `design/composants.md`, stables, jamais générés dynamiquement.

## 7. Performance et fluidité

- Aucun travail coûteux dans les gestionnaires de déplacement du pointeur : pas d'allocation inutile, pas de recherche linéaire répétée, pas d'écriture Yjs à chaque événement (au plus toutes les 50 ms, cf. `architecture.md`).
- Le rendu Konva ne redessine que les éléments modifiés. Les éléments statiques ne sont pas recréés à chaque rendu.
- Toute optimisation se justifie par une mesure de F00, pas par intuition.

## 8. Serveur

- Chaque route Fastify déclare ses schémas zod d'entrée et de sortie. Erreurs au format `{ error: { code, message } }`, codes HTTP conformes à `architecture.md`.
- Configuration lue et validée une seule fois au démarrage (`PORT`, `DATABASE_PATH`, `STATIC_DIR`) ; arrêt immédiat avec un message clair si elle est invalide.
- Requêtes SQL paramétrées uniquement. Schéma de base versionné par des migrations numérotées, appliquées au démarrage.
- Arrêt propre sur `SIGTERM` / `SIGINT` : fermeture des connexions WebSocket, enregistrement des documents en attente, fermeture de la base.
- Journalisation par le logger de Fastify (structuré). Pas de `console.log` côté serveur.

## 9. Erreurs et journalisation

- Aucune erreur avalée silencieusement : une erreur est traitée, ou remontée, ou journalisée avec son contexte.
- Côté client : `console.error` / `console.warn` pour les anomalies ; pas de `console.log` dans le code commité.
- Un échec réseau ou serveur n'empêche jamais l'édition locale (l'action reste visible, cf. FL-1).

## 10. Sécurité

- Toute entrée est validée (API, WebSocket, `localStorage`). Les noms de board et d'utilisateur ont les longueurs définies dans les stories.
- Le texte saisi s'affiche comme du texte : pas de `dangerouslySetInnerHTML`, pas d'`eval`, pas de construction de HTML par concaténation.
- Aucun secret dans le code ni dans les fichiers commités.

## 11. Dépendances

- Licence permissive uniquement (AGENTS.md §4). Vérifier la licence avant l'ajout, et la tracer dans le journal (entrée `décision`).
- Ajouter une dépendance seulement si elle évite une quantité significative de code ; jamais deux bibliothèques pour le même besoin.
- Versions verrouillées par `pnpm-lock.yaml` ; pas de version flottante sans raison.

## 12. Commentaires

- Un commentaire explique **pourquoi** (contrainte, choix non évident, renvoi à un ADR ou à un critère), pas **ce que** fait le code.
- Les fonctions exportées de `packages/model` ont un commentaire TSDoc d'une ou deux lignes.

## 13. Qualité automatisée

Mis en place par T-001 (et T-006 pour les couleurs), vérifié par `pnpm lint` et `pnpm typecheck`, donc par `pnpm verify` :

| Contrôle | Outil |
|---|---|
| Options TypeScript de la section 2 | `tsconfig` partagé (`packages/config`) |
| Règles recommandées, `noExplicitAny`, `noNonNullAssertion`, `noConsole` (sauf `warn` et `error` côté client), imports et variables inutilisés | Biome |
| `packages/model` n'importe ni React, ni Konva, ni Node, ni le DOM ; les apps ne s'importent pas entre elles | Biome `noRestrictedImports` par paquet |
| Pas de couleur en dur hors du thème et des jetons | vérification de T-006 |
| Formatage | Biome (format), appliqué avant chaque commit |

## 14. Avant chaque commit d'étape

- [ ] Le code respecte ce document ; aucune règle contournée sans commentaire justificatif.
- [ ] Aucun code mort, `TODO`, `console.log` ou fichier temporaire.
- [ ] Les noms suivent le glossaire.
- [ ] `pnpm verify` est vert.

## 15. Évolution du modèle de données

Les boards déjà enregistrés (documents Yjs persistés dans SQLite) doivent rester lisibles après chaque ticket. La phase design décide, dans l'analyse d'impact du plan, si un changement du modèle est compatible ou demande une migration.

- **Préférer un changement compatible** : un champ ajouté avec une valeur par défaut, lu comme absent dans les anciens boards, ne demande pas de migration.
- **Migration** pour tout changement incompatible (renommage, suppression, changement de structure) :
  - chaque board porte un numéro de version de format ; un board sans numéro est en version 1 ;
  - les migrations sont déclarées dans un registre unique et ordonné, et appliquées par le serveur au chargement d'un board ;
  - une fixture de board de la version précédente (avec tous les types d'éléments) est ajoutée aux fixtures de test, et un test charge chaque fixture, applique les migrations et vérifie le résultat ;
  - le client et le serveur vérifient la version du format à la connexion, et le client se recharge si elle a changé, pour qu'un onglet resté ouvert sur l'ancienne version n'écrive pas l'ancien format.
- La première migration crée l'ADR qui décrit ce mécanisme ; les suivantes s'y conforment.

