#!/usr/bin/env bash
# Clôture un run interrompu (conteneur arrêté à la main, machine éteinte, plantage) :
# commit du travail en l'état sur la branche courante, entrée au journal, RUN-SUMMARY.md, publication.
# Usage : runner/finalize.sh <run-id ou fragment> [motif]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNNER="$ROOT/runner"
RUN_ID=$(ls -1 "$RUNNER/runs" 2>/dev/null | grep -F -- "${1:?Usage : runner/finalize.sh <run-id ou fragment> [motif]}" | sort | tail -1)
[ -n "$RUN_ID" ] || { echo "Aucun run trouvé pour « $1 »"; exit 1; }
RUN_DIR="$RUNNER/runs/$RUN_ID"
meta() { grep "^$1=" "$RUN_DIR/logs/run.meta" 2>/dev/null | tail -1 | cut -d= -f2-; }

if grep -q '^stop_reason=' "$RUN_DIR/logs/run.meta" 2>/dev/null; then
  echo "Run déjà clôturé : $(meta stop_reason)"; exit 1
fi
PROJECT=$(meta project)
if [ -n "$(docker ps -q --filter "name=${PROJECT}-agent-1" --filter status=running)" ]; then
  echo "Le conteneur ${PROJECT}-agent-1 tourne encore : l'arrêter d'abord (docker stop ${PROJECT}-agent-1)."; exit 1
fi

set -a; . "$RUNNER/.env"; set +a
RUN_REMOTE="${RUN_REMOTE:-$(git -C "$ROOT" remote get-url origin 2>/dev/null || true)}"
export RUN_DIR RUN_REMOTE RUN_BRANCH="$(meta branch)" OPENCODE_MODEL="$(meta model)"
docker compose -f "$RUNNER/compose.yml" -p "$PROJECT" run --rm --no-deps --build \
  -e FINALIZE=1 -e STOP_REASON_OVERRIDE="${2:-arrêt manuel du conteneur}" agent
echo "Run clôturé : runner/status.sh $RUN_ID"
