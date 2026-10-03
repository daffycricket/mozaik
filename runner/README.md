# Lancer une construction par un agent

Ce dossier permet de lancer la construction complète de l'application, à partir du contexte (`AGENTS.md`, `docs/`), par un agent OpenCode autonome, dans un conteneur Docker. Chaque lancement (« run ») part de zéro, avec le fournisseur et le modèle choisis, et est publié sur **sa propre branche** du dépôt distant. `main` ne contient que le contexte et cet outillage ; les branches de run ne sont jamais fusionnées.

## Prérequis

- Docker avec Docker Compose, sur n'importe quelle machine (poste, VPS).
- Git, et un clone de ce dépôt avec `origin` en **https**.
- Une clé API pour chaque fournisseur de modèle utilisé.
- Un jeton autorisé à pousser sur ce dépôt.
- Recommandé : protéger `main` sur le dépôt distant (pas de push direct, pas de force-push), et limiter le jeton à ce seul dépôt. Aucun run ne pourra alors modifier le contexte.

## Lancer un run

```bash
git clone https://<hôte>/<compte>/<dépôt>.git miro-app-context && cd miro-app-context
cp runner/.env.example runner/.env      # clés API, jeton de push
runner/start-run.sh <provider>/<model> [label]
```

Le modèle s'écrit au format OpenCode `provider/model` (liste : `opencode models`). Le label est facultatif et distingue plusieurs runs d'un même modèle.

## Fournisseurs et modèles

Le modèle se passe à `start-run.sh` au format `provider/model`. Deux cas :

- **Fournisseur intégré à OpenCode** (Anthropic, OpenAI, etc.) : renseigner sa clé dans `runner/.env` sous le nom de variable attendu par OpenCode.
- **Fournisseur déclaré dans `runner/opencode/opencode.json`** (point de terminaison compatible OpenAI) : l'URL, la clé (lue dans une variable de `.env`) et la liste des modèles y sont décrites. Déjà déclarés :

| Fournisseur (`provider`) | URL | Clé (`.env`) | Exemples de `--model` |
|---|---|---|---|
| `umans` | `https://api.code.umans.ai/v1` | `UMANS_API_KEY` | `umans/umans-coder`, `umans/umans-kimi-k2.7`, `umans/umans-glm-5.2` |
| `scw` (Scaleway Generative APIs) | `https://api.scaleway.ai/v1` | `SCW_SECRET_KEY` | `scw/<model-id>` |
| `scw-managed` (Scaleway Managed Inference) | `SCW_MANAGED_BASE_URL` (point de terminaison du déploiement) | `SCW_SECRET_KEY` | `scw-managed/<model-id>` |

Pour Scaleway, remplacer `<model-id-a-remplacer>` dans `opencode/opencode.json` par les identifiants réels. Liste des modèles disponibles :

```bash
curl -s https://api.scaleway.ai/v1/models -H "Authorization: Bearer $SCW_SECRET_KEY" | jq -r '.data[].id'
```

Ajouter un autre fournisseur compatible OpenAI : copier un bloc de `provider` dans `opencode/opencode.json`, changer l'identifiant, `baseURL`, la variable de clé et les modèles, puis ajouter la variable dans `.env`. Optionnel mais utile : indiquer pour chaque modèle `"limit": { "context": …, "output": … }`, pour qu'OpenCode gère correctement la taille du contexte.

Vérifier un fournisseur avant un long run : `MAX_SESSIONS=1 runner/start-run.sh <provider>/<model> test` (une seule session, puis consulter `logs/loop.log`, `logs/session-001.err` et `logs/session-001.jsonl`).

## Déroulement

1. **Préparation** (`start-run.sh`, sur la machine) :
   - clone le contexte au commit courant de `main` (ou de `CONTEXT_REF`) dans `runner/runs/<run-id>/workspace/`, sans remote ;
   - premier commit `chore(run): RUN#0 init` : retire `runner/` et `.devcontainer/`, ajoute `RUN.md` (modèle, date, commit de contexte, branche) ;
   - démarre le conteneur en arrière-plan.
2. **Boucle** (`agent-loop.sh`, dans le conteneur) : une session OpenCode par ticket (`opencode run --auto`). L'agent choisit lui-même le ticket dans le backlog, commite chaque étape localement et intègre le ticket dans le `main` local. **Après chaque session**, quelle qu'en soit l'issue, la boucle pousse ce `main` vers la branche distante `run/<run-id>`.
3. **Fin** : la boucle s'arrête dans l'un des cas suivants, puis commite `RUN-SUMMARY.md` et pousse une dernière fois. La raison de l'arrêt est écrite dans la synthèse et dans le message du commit.

| Raison d'arrêt | Ce qui est publié |
|---|---|
| L'agent commite son bilan (`RUN#0 bilan`) | `main` du run + synthèse |
| Plus aucun ticket `todo` ou `in-progress` | `main` du run + synthèse |
| **Crédit épuisé chez le fournisseur** | Le travail **en l'état** : branche de ticket en cours, travail non commité compris, dans un commit `chore(run): RUN#0 stopped, provider credit exhausted` (session, branche, dernière erreur), puis la synthèse |
| Garde-fou : `MAX_IDLE` sessions sans commit, ou `MAX_SESSIONS` atteint | `main` du run + synthèse |

**Crédit épuisé** : détecté dans les événements d'erreur d'OpenCode (statut HTTP 402, ou message correspondant à `CREDIT_ERROR_PATTERNS` : « insufficient quota », « credit balance », « payment required », « billing »…). Une limite de débit (429, « rate limit ») n'arrête pas le run tant qu'elle est passagère : OpenCode réessaie en silence. Si elle persiste sans aucune activité de l'agent pendant `QUOTA_WAIT` secondes (15 min par défaut), la boucle interrompt la session et traite le cas comme un crédit épuisé : c'est la forme que prend la fin de quota d'un abonnement (umans : « You've reached the request rate limit for your account »). Les erreurs de fournisseur sont lues dans le log d'OpenCode (`opencode-data/log/`), car elles n'apparaissent pas dans la sortie JSON pendant les réessais. Si un fournisseur formule son erreur autrement, ajouter son message à `CREDIT_ERROR_PATTERNS` dans `.env`. Si la branche de ticket en cours ne prolonge pas la branche publiée, le travail est poussé sur `run/<run-id>-stopped`.

## Consommation (tokens et coût)

Chaque session est lancée avec `opencode run --format json`. La boucle additionne les événements `step_finish` (tokens et coût calculés par OpenCode) :

- **par session** : une ligne dans `logs/loop.log` (`tokens in, out, reasoning, cache_read, cache_write, coût`) et dans `logs/sessions.tsv` ;
- **pour le run** : un tableau session par session avec une ligne de total dans `RUN-SUMMARY.md`, plus la sortie de `opencode stats` pour recoupement.

Le coût vaut 0 si OpenCode ne connaît pas le tarif du modèle, ce qui est le cas des fournisseurs déclarés dans `opencode/opencode.json` (umans, Scaleway). Renseigner le tarif par million de tokens dans la déclaration du modèle :

```json
"umans-coder": {
  "name": "Umans Coder",
  "cost": { "input": 0.0, "output": 0.0, "cache_read": 0.0 }
}
```

Les montants sont dans la devise des tarifs saisis ; `COST_CURRENCY` (`.env`) n'est que le libellé affiché (`USD` par défaut, mettre `EUR` si les tarifs saisis sont en euros). Ne pas mélanger les devises entre runs à comparer.

L'agent n'a ni remote ni jeton : le jeton n'est utilisé que par la boucle et n'est pas transmis à OpenCode.

| Variable | Défaut | Rôle |
|---|---|---|
| `MAX_SESSIONS` | 80 | Nombre maximal de sessions |
| `SESSION_TIMEOUT` | 4h | Durée maximale d'une session |
| `MAX_IDLE` | 2 | Arrêt après ce nombre de sessions consécutives sans nouveau commit |
| `CONTEXT_REF` | main | Branche ou tag du contexte à utiliser |
| `TNR_REPLAY` | 1 | Rejeu des tests hérités modifiés (`0` pour le désactiver) |
| `REPLAY_TIMEOUT_MS` | 1200000 | Durée maximale de chaque étape du rejeu |
| `VERIFY_INDEPENDENT` | 1 | Vérification indépendante de `main` après chaque session (`0` pour la désactiver) |
| `QUOTA_WAIT` | 900 | Secondes sans activité de l'agent, avec une erreur de limite de débit ou de quota dans le log OpenCode, avant de traiter le cas comme un crédit épuisé |
| `STALL_TIMEOUT` | 3600 | Secondes sans aucune activité de l'agent avant d'interrompre la session (le run continue avec la session suivante) |
| `VERIFY_TIMEOUT_MS` | 1800000 | Durée maximale de chaque commande de la vérification indépendante |
| `OPENCODE_VERSION` | latest | Version d'OpenCode installée dans l'image |

Exemple : `MAX_SESSIONS=40 runner/start-run.sh <provider>/<model> court`.

## Garde-fous et contrôles

Deux mécanismes rendent les règles d'`AGENTS.md` applicables, quel que soit le modèle. Tout ce qu'ils détectent est écrit dans `docs/journal.md` de la branche du run (types `garde-fou`, `contrôle`, `run`, commit `chore(run): RUN#0 journal`), dans `logs/events.jsonl`, et récapitulé dans `RUN-SUMMARY.md`.

**Garde-fou OpenCode** (`opencode/plugins/guard.js`), avant chaque appel d'outil de l'agent. Refusé, avec un message qui explique la règle et quoi faire à la place :

| Interdit | Règle |
|---|---|
| `git push`, `git remote add/set-url/rename` | Git local uniquement |
| `--no-verify`, `git commit -n`, `core.hooksPath` vidé ou pointé vers `/dev/null` (le lire ou l'installer reste permis) | Pas de contournement des hooks |
| `git reset --hard`, `rebase`, `commit --amend`, `filter-branch`… **sur `main`** | Pas de réécriture de `main` (autorisé sur une branche de ticket) |
| `git branch -D/-f main`, suppression de `.git` | Intégrité du dépôt |
| Modification de `RUN.md` ou `RUN-SUMMARY.md` (outil d'édition ou commande shell) | Fichiers de l'outillage |
| Suppression ou déplacement d'un fichier de test présent sur `main` (`rm`, `git rm`, `mv`, `git mv`, dossier entier, suppression par patch) | Tests de non-régression |

Chaque refus est aussi écrit dans `logs/guard.jsonl`. Le plugin est installé dans l'image, propriété de root, hors du dépôt de travail : l'agent ne peut pas le modifier.

**Contrôles après chaque session** (`run-checks.mjs`), sur les commits ajoutés à `main` pendant la session. Ils ne bloquent rien, ils constatent :

| Contrôle | Écart signalé |
|---|---|
| Historique de `main` | Réécrit, ou commit de fusion au lieu d'un fast-forward |
| Format des commits | Sujet hors format, trailers `Refs`, `Plan-Step` ou `Tests` absents |
| Backlog | Tableau des tickets illisible ou statut invalide |
| Journal | Colonne « À revoir » modifiée, entrée supprimée |
| Fichiers de l'outillage | `RUN.md` ou `RUN-SUMMARY.md` modifié par l'agent |
| Tests | `skip`, `only`, `fixme` ajoutés |
| Tests hérités (présents sur `main` avant la session) | Fichier supprimé, cas de test disparus, assertions en baisse ; modification non justifiée (ni spec modifiée dans la session ou ticket `bug`, ni entrée `test` au journal citant le fichier) |
| Rejeu des tests hérités modifiés | Leur version d'avant la session est exécutée sur le nouveau code (worktree temporaire) : un échec sans changement de spec signale une régression probablement masquée |
| Session | Garde-fou non chargé, session en erreur ou hors délai |

**Vérification indépendante** (`run-checks.mjs verify`), après chaque session qui a fait avancer `main`. La boucle, et non l'agent, rejoue sur un worktree propre de `main` : `pnpm install --frozen-lockfile`, puis `lint`, `typecheck`, `test:cov` (à défaut `test:unit` et `test:int`), `test:e2e`, `ac:check`. Elle compare la couverture mesurée au dernier trailer `Coverage:` de la session (tolérance 0,5 point) et au seuil de 80 %. Un script absent (début de run) est signalé, pas compté comme un échec.

- Réussite : entrée `contrôle` « À revoir : non ».
- Échec : entrée `contrôle` « À revoir : oui », et la consigne de chaque session suivante signale l'échec tant qu'une nouvelle vérification n'a pas réussi. `AGENTS.md` impose alors de corriger d'abord par un ticket `bug`.
- Sortie des commandes (200 dernières lignes de chacune) : `logs/verify-<session>.log`.

Durée ajoutée par session : installation (rapide grâce au cache pnpm partagé) et exécution complète des tests, e2e compris.

Les refus du garde-fou et les écarts relevés par les contrôles sont marqués « À revoir : oui ». Leur nombre par run est un indicateur de discipline du modèle.

Les événements d'une session sont commités sur la branche courante en fin de session. Si c'était une branche de ticket jamais intégrée, ils restent visibles dans `RUN-SUMMARY.md` et `logs/events.jsonl`.

## Suivre et évaluer un run

Clore un run interrompu (conteneur arrêté à la main, Mac éteint, plantage) : `runner/finalize.sh <run-id ou fragment> [motif]`. Il relance l'image en mode clôture, sans nouvelle session : commit du travail en l'état sur la branche courante (`chore(run): RUN#0 stopped, run interrupted`), entrée `run` au journal, sessions non comptabilisées ajoutées à la consommation, `RUN-SUMMARY.md`, publication. Il refuse si le conteneur tourne encore ou si le run est déjà clos.

État d'un run à tout moment : `runner/status.sh [run-id ou fragment]` (par défaut le run le plus récent). Il affiche : en cours ou terminé (et motif d'arrêt), dernières lignes de la boucle, branche et commits de l'agent, statuts du backlog et ticket en cours, derniers contrôles et vérifications indépendantes, tokens par session (y compris la session en cours).

Suivre en direct : `docker logs -f <projet>-agent-1` (le nom du projet est affiché au lancement et noté dans `logs/run.meta`), ou la branche `run/<run-id>` sur le dépôt distant, mise à jour après chaque ticket. La boucle n'écrit qu'une ligne au début et quelques lignes à la fin de chaque session : pendant une session, l'activité de l'agent est dans `logs/session-<n>.jsonl` (`tail -f`), et ses commits dans `git -C runner/runs/<run-id>/workspace log --oneline --all`.

Évaluer, depuis n'importe quel poste :

```bash
git fetch
git switch run/<run-id>
docker compose up --build        # application sur http://localhost:8080
git diff main..run/<run-id>      # tout ce que l'agent a produit
```

Dans la branche : `RUN.md`, `RUN-SUMMARY.md`, `docs/backlog.md` (statuts), `docs/journal.md` (décisions, colonne « À revoir »), `docs/plans/`, `docs/test-reports/`, et l'historique de tous les commits.

Sur la machine du run, `runner/runs/<run-id>/logs/` garde en plus les événements complets de chaque session (`session-NNN.jsonl`, sortie d'erreur dans `session-NNN.err`) et `sessions.tsv`, trop volumineux pour Git.

## Limites connues

- **Pas de Docker dans le conteneur** : la construction de l'image de l'application (`pnpm test:docker`) n'est pas exécutée par l'agent ; les rapports indiquent « Docker : non vérifié ». La vérifier avec `docker compose up --build` sur la branche du run.
- **Commits non intégrés** : seul le `main` local est publié. Le travail d'un ticket interrompu en cours de session n'apparaît sur la branche qu'une fois intégré par une session suivante.
- **Jeton** : retiré de l'environnement d'OpenCode, mais présent dans le conteneur ; un agent qui le chercherait activement pourrait le trouver. D'où la protection de `main` et le jeton limité recommandés.
- **Permissions** : l'agent exécute toutes ses commandes sans confirmation (`opencode/opencode.json` : `"permission": "allow"`). Le conteneur est la barrière d'isolation : il n'a accès qu'au dossier du run et aux caches.
- **Caches partagés entre runs** : navigateurs Playwright et magasin pnpm, pour accélérer. Ils n'influencent pas le comportement de l'agent.
- **Coût** : aucun plafond de dépense n'est appliqué par OpenCode ; le fixer chez le fournisseur.

## Travailler à la main dans le même environnement

`.devcontainer/devcontainer.json` ouvre ce dépôt dans la même image (VS Code, Cursor, ou CLI `devcontainer`), avec OpenCode, pnpm et les dépendances Playwright installés.
