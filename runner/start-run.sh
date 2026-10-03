#!/usr/bin/env bash
# Lance une construction from scratch dans un conteneur isolé.
# Usage : runner/start-run.sh <provider/model> [label]
#
# Le run part du commit courant de la branche CONTEXT_REF (main par défaut)
# du dépôt de contexte, et est publié sur la branche distante run/<run-id>.
set -euo pipefail

MODEL="${1:?Usage : runner/start-run.sh <provider/model> [label]}"
LABEL="${2:-}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNNER="$ROOT/runner"
CONTEXT_REF="${CONTEXT_REF:-main}"

[ -f "$RUNNER/.env" ] || { echo "runner/.env manquant (copier runner/.env.example)"; exit 1; }
set -a; . "$RUNNER/.env"; set +a

SLUG="$(echo "$MODEL" | tr '/:' '--' | tr -cd 'A-Za-z0-9._-')"
RUN_ID="$(date +%Y%m%d-%H%M%S)-${SLUG}${LABEL:+-$LABEL}"
RUN_BRANCH="run/$RUN_ID"
RUN_DIR="$RUNNER/runs/$RUN_ID"
WS="$RUN_DIR/workspace"
mkdir -p "$RUN_DIR"/{logs,opencode-data}

# Dépôt distant de publication : RUN_REMOTE dans .env, sinon origin du dépôt de contexte
RUN_REMOTE="${RUN_REMOTE:-$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)}"
if [ -z "$RUN_REMOTE" ] || [ -z "${GIT_PUSH_TOKEN:-}" ]; then
  echo "Attention : RUN_REMOTE ou GIT_PUSH_TOKEN absent, le run ne sera pas publié (résultats en local seulement)."
fi
case "$RUN_REMOTE" in
  https://*|"") ;;
  *) echo "RUN_REMOTE doit être une URL https:// (push par jeton) : $RUN_REMOTE"; exit 1 ;;
esac

# Avertir si le main local n'est pas à jour avec le distant
if git -C "$ROOT" rev-parse --verify -q "origin/$CONTEXT_REF" >/dev/null; then
  if [ "$(git -C "$ROOT" rev-parse "$CONTEXT_REF")" != "$(git -C "$ROOT" rev-parse "origin/$CONTEXT_REF")" ]; then
    echo "Attention : $CONTEXT_REF local diffère de origin/$CONTEXT_REF (faire git pull ?)."
  fi
fi

# Espace de travail : clone du contexte, branche locale main, sans remote
git clone --quiet --branch "$CONTEXT_REF" "$ROOT" "$WS"
CONTEXT_SHA="$(git -C "$WS" rev-parse HEAD)"
git -C "$WS" checkout -q -B main
git -C "$WS" remote remove origin

# Premier commit du run : retrait de l'outillage, métadonnées du run
git -C "$WS" rm -rq --ignore-unmatch runner .devcontainer
# Retirer du README la section propre au dépôt de contexte (entre les marqueurs runner:start/end)
awk '/<!-- runner:start -->/{skip=1} !skip{print} /<!-- runner:end -->/{skip=0}' "$WS/README.md" | cat -s > "$WS/README.md.tmp" && mv "$WS/README.md.tmp" "$WS/README.md"
git -C "$WS" add README.md
cat > "$WS/RUN.md" <<META
# Run $RUN_ID

| Clé | Valeur |
|---|---|
| Modèle | \`$MODEL\` |
| Label | ${LABEL:-aucun} |
| Démarrage | $(date -u +%Y-%m-%dT%H:%M:%SZ) |
| Contexte | \`$CONTEXT_REF\` @ \`$CONTEXT_SHA\` |
| Branche | \`$RUN_BRANCH\` |

Fichier géré par l'outillage du run. La synthèse finale est dans \`RUN-SUMMARY.md\`.
META
git -C "$WS" add RUN.md
git -C "$WS" -c user.name=runner -c user.email=runner@localhost commit -q --no-verify \
  -m "chore(run): RUN#0 init $RUN_ID" -m "Refs: RUN
Plan-Step: 0/0"

{
  echo "run_id=$RUN_ID"
  echo "branch=$RUN_BRANCH"
  echo "context_commit=$CONTEXT_SHA"
} > "$RUN_DIR/logs/run.meta"

# Le conteneur tourne sous l'utilisateur node (uid 1000) : rendre le dossier du run accessible
chmod -R a+rwX "$RUN_DIR"

# Nom de projet Docker Compose : minuscules, chiffres, tirets et soulignés uniquement
PROJECT="miro-$(echo "$RUN_ID" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9_\n-' '-')"
echo "project=$PROJECT" >> "$RUN_DIR/logs/run.meta"

export RUN_DIR RUN_BRANCH RUN_REMOTE OPENCODE_MODEL="$MODEL"
# Caches partagés entre runs (navigateurs Playwright, store pnpm) : créés une fois, hors projet Compose
docker volume create miro-agent-pw-browsers >/dev/null
docker volume create miro-agent-pnpm-store >/dev/null
docker compose -f "$RUNNER/compose.yml" -p "$PROJECT" up --build -d
echo "Run lancé : $RUN_ID"
echo "Branche   : $RUN_BRANCH"
echo "État      : runner/status.sh $RUN_ID"
echo "Suivre    : docker logs -f $PROJECT-agent-1"
echo "Détail    : tail -f runner/runs/$RUN_ID/logs/loop.log"
echo "Local     : runner/runs/$RUN_ID/"
