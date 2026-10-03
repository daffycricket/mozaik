# ADR-0002 : Monorepo pnpm, TypeScript strict, Node LTS

- Statut : Accepted
- Date : 2026-10-03
- Décideurs : humain

## Contexte

Le front, le serveur et le modèle de données partagent des types et de la logique (schéma des éléments, opérations sur le document Yjs). Les bibliothèques de référence du domaine (Yjs, Hocuspocus, Konva) sont en JavaScript/TypeScript.

## Décision

pnpm workspaces, TypeScript en mode `strict`, Node.js 24 LTS, modules ESM. Versions exactes des dépendances fixées à la dernière stable au moment du bootstrap (T-001) et verrouillées par `pnpm-lock.yaml`.

## Conséquences

- `packages/model` est importé par les deux apps via le protocole `workspace:*`.
