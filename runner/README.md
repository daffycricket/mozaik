# Outillage des phases

Ce dossier fait évoluer Mozaik ticket par ticket : chaque évolution est un ticket `MZK-<n>` (numéro court de sa carte Trello), traité sur sa branche `ticket/MZK-<n>-<slug>` en phases successives. Un humain lance chaque phase ; un agent OpenCode la réalise dans un conteneur ; le script publie, commente la carte et la déplace.

Règles suivies par l'agent : [AGENTS.md](../AGENTS.md) et [docs/process/](../docs/process/). Décision : [ADR-0014](../docs/adr/0014-outillage-dans-le-depot-produit.md).

## Deux copies du dépôt

```
~/devs/mozaik/                       ta copie, toujours sur main
  runner/                            outillage relu et mergé : sert à construire l'image
~/devs/mozaik-tickets/MZK-42/
  workspace/                         clone du ticket, sur ticket/MZK-42-... : l'agent y travaille
  logs/, opencode-data/              journaux de la phase, sessions OpenCode
```

- Tu lances toujours `runner/mzk.sh` depuis ta copie sur `main`. Le script refuse si ta copie n'est pas sur `main`, si `runner/` y a des modifications non commitées, ou s'il est lancé depuis le clone d'un ticket. Il met ta copie à jour (`git pull --ff-only`) avant chaque phase.
- L'image de l'agent est construite depuis ta copie ; le clone du ticket est monté dans le conteneur sous `/workspace`. Le `runner/` du clone n'est jamais exécuté.
- Pour tester une évolution de l'outillage non mergée : `--allow-tooling-branch`.

## Prérequis

- Docker avec Docker Compose ; sur l'hôte, `git` avec un accès SSH au dépôt, `node` 18 ou plus. Facultatif : `gh` authentifié, pour ouvrir les pull requests.
- `runner/.env`, copié de [.env.example](.env.example) : clés des fournisseurs, version d'OpenCode, Trello, commande de déploiement en recette. Ignoré par Git : le dépôt est public.
- Board Trello avec les colonnes : Inbox, Triage, Spec, Spec review, Design, Tech review, Dev, Review, Done, Rejeté.

## Workflow

| Commande | Carte attendue | Ce qui se passe | Carte après |
|---|---|---|---|
| `runner/mzk.sh spec MZK-42` | Triage | Clone, branche, `docs/tickets/MZK-42/ticket.md`, spec écrite par l'agent (hypothèses `H`, questions `Q`), commit, push, commentaire | Spec review |
| `runner/mzk.sh spec-review MZK-42` | Spec review | Tes commentaires (depuis le dernier commentaire `[mozaik]`) vont dans `retours.md`, l'agent met la spec à jour | Spec review |
| `runner/mzk.sh design MZK-42` | Spec review | Valide les entrées « À revoir » de la spec ; `plan.md` et ADR par l'agent | Tech review |
| `runner/mzk.sh tech-review MZK-42` | Tech review | Retours appliqués au plan | Tech review |
| `runner/mzk.sh dev MZK-42 [--restart]` | Tech review (ou Dev) | Valide le design ; l'agent exécute le plan (une étape = un commit) ; vérification indépendante, métriques, PR, bugs décrits créés en Inbox | Review si plan terminé et vérification verte (ou rouge à cause d'un bug secondaire), sinon Dev |
| `runner/mzk.sh run MZK-42 [--reset]` | Review | Lance la branche en local pour la tester (`--reset` efface les données de test) | inchangée |
| `runner/mzk.sh review MZK-42` | Review | Retours de recette appliqués par l'agent sur la même branche | Review |
| `runner/mzk.sh merge MZK-42` | Review | Refus si la branche modifie `runner/` ; rebase sur `main`, vérification ; si l'agent a dû intervenir, arrêt pour retest ; sinon merge commit, push de `main`, déploiement en recette | Done |
| `runner/mzk.sh clean MZK-42` | Done | Supprime le clone et les journaux du ticket mergé | inchangée |

Options : `--model provider/model` (défaut : `MOZAIK_MODEL`, sinon `umans/umans-deepseek-v4.1-flash`) ; `merge --accept-red <carte>` pour un bug secondaire connu ; `merge --allow-runner-changes` ; `clean --force`.

Spec à revoir en profondeur après la recette : `spec-review`, puis `design`, puis `dev`. Approche technique à revoir : `tech-review`, puis `dev`. Abandon : fermer la PR, passer la carte en Rejeté, `clean --force`.

### Sans Trello

Tant que `TRELLO_*` n'est pas renseigné (ou avec `MZK_NO_TRELLO=1`), le script affiche les déplacements de carte et les commentaires qu'il aurait publiés :

```bash
runner/mzk.sh spec MZK-1 --title "Confirmer avant une suppression multiple" --type change --file demande.md
runner/mzk.sh spec-review MZK-1 --file retours.txt      # une remarque par ligne, préfixée [spec], [impl] ou [règle]
```

## Fichiers

| Fichier | Rôle | Où il s'exécute |
|---|---|---|
| `mzk.sh` | Commandes par phase : Git, publication SSH, Trello, PR, déploiement, contrôles de la copie | hôte |
| `lib.mjs` | Journal, rapport, retours, API Trello ; tests : `node --test runner/lib.test.mjs` | hôte |
| `compose.yml`, `Dockerfile` | Image `mozaik-agent-runner` (Node 24, pnpm, OpenCode, Chromium) et conteneur d'une phase | hôte |
| `phase.sh` | Sessions OpenCode de la phase, contrôles, vérification indépendante, avancement du plan | conteneur |
| `checks.mjs` | Contrôles après session (outillage, format des commits, plan et spec intacts, journal, tests désactivés, tests hérités et rejeu) et vérification indépendante de la branche | conteneur |
| `opencode/opencode.json` | Fournisseurs et modèles | conteneur |
| `opencode/plugins/guard.js` | Garde-fou : pas de push, de remote, de changement de branche, de merge, de réécriture, ni d'écriture dans `runner/` ; écritures limitées aux fichiers de la phase | conteneur |

## Faire évoluer l'outillage

Jamais par l'agent. Commits humains sans ticket, de scope `runner` (`chore(runner): ...`), sur une branche relue en pull request puis mergée. Pour tester avant le merge : `--allow-tooling-branch`, et sans Docker ni modèle, avec un faux `docker` sur le `PATH` et un dépôt Git local comme `MOZAIK_REMOTE`.

## Sécurité

- L'agent ne reçoit ni jeton Git ni clés Trello : `phase.sh` les retire de l'environnement d'OpenCode, et la publication se fait sur l'hôte, en SSH.
- Les commentaires du script sur la carte commencent par `[mozaik]` : les commentaires suivants sont lus comme des retours humains.
- La recette n'a pas d'authentification : n'y mettre que des données de test.

## Limites connues

- Non testé de bout en bout à la date de création : conteneur réel, sessions OpenCode, Trello, `gh` et rebase avec conflits n'ont été exercés qu'en lecture de code ou avec un faux Docker.
- Version d'OpenCode figée à 1.18.34 (`OPENCODE_VERSION`) : le garde-fou et `opencode run --auto --format json` n'ont pas été vérifiés sur une version plus récente.
- Le garde-fou ne reconnaît pas toutes les écritures par le shell dans `runner/` : le contrôle de fin de session et le refus au merge les rattrapent.
- Un seul ticket à la fois : le projet Compose et les ports ne sont pas isolés pour des tickets en parallèle.
