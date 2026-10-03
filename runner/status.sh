#!/usr/bin/env bash
# État d'un run, depuis la machine hôte : conteneur, boucle, Git, backlog, contrôles, consommation.
# Usage : runner/status.sh [run-id ou fragment]   (défaut : le run le plus récent)
set -uo pipefail

RUNNER="$(cd "$(dirname "$0")" && pwd)"
RUNS="$RUNNER/runs"
RUN_ID=$(ls -1 "$RUNS" 2>/dev/null | grep -F -- "${1:-}" | sort | tail -1)
[ -n "$RUN_ID" ] || { echo "Aucun run trouvé dans runner/runs${1:+ pour « $1 »}"; exit 1; }
W="$RUNS/$RUN_ID/workspace"; L="$RUNS/$RUN_ID/logs"
meta() { grep "^$1=" "$L/run.meta" 2>/dev/null | tail -1 | cut -d= -f2-; }

echo "=== Run $RUN_ID ($(meta model))"

echo; echo "--- État"
PROJECT=$(meta project)
STATUS=""
if command -v docker >/dev/null 2>&1 && [ -n "$PROJECT" ]; then
  STATUS=$(docker ps -a --filter "name=${PROJECT}-agent-1" --format '{{.Status}}' 2>/dev/null | head -1)
fi
case "$STATUS" in
  Up*)     echo "EN COURS (conteneur : $STATUS)" ;;
  Exited*) echo "TERMINÉ (conteneur : $STATUS)" ;;
  *)       echo "conteneur introuvable ou Docker indisponible" ;;
esac
[ -n "$(meta stop_reason)" ] && echo "Arrêt : $(meta stop_reason)"

echo; echo "--- Boucle (dernières lignes de loop.log)"
tail -6 "$L/loop.log" 2>/dev/null || echo "pas encore de loop.log"

echo; echo "--- Git"
echo "branche de travail de l'agent (locale) : $(git -C "$W" --no-pager branch --show-current 2>/dev/null)"
echo "publiée sur GitHub : run/$RUN_ID (= main de l'agent, poussé après chaque session)"
# Commits du run uniquement : tout ce qui suit le commit « RUN#0 init » (sans pager)
INIT=$(git -C "$W" --no-pager log --all --format=%H --grep='RUN#0 init' -1 2>/dev/null)
if [ -n "$INIT" ]; then
  N=$(git -C "$W" rev-list --count --all "^$INIT" 2>/dev/null)
  echo "commits du run : $N (les 20 plus récents, toutes branches)"
  git -C "$W" --no-pager log --oneline --decorate --all "^$INIT" -20 2>/dev/null
fi

echo; echo "--- Backlog (copie de travail)"
if [ -f "$W/docs/backlog.md" ]; then
  for st in done in-progress blocked todo; do
    printf '%s : %s\n' "$st" "$(grep -Ec "\| $st \|" "$W/docs/backlog.md")"
  done
  grep -E '\| (in-progress|blocked) \|' "$W/docs/backlog.md" | awk -F'|' '{gsub(/ +$/,"",$3); gsub(/ +$/,"",$4); print "  " $3 " :" $4 " (" $7 ")"}' | sed 's/  */ /g'
fi
echo "plans : $(ls "$W/docs/plans" 2>/dev/null | grep -vE '^(README|_template)' | tr '\n' ' ')"

echo; echo "--- Contrôles et vérification indépendante"
python3 - "$L/events.jsonl" <<'PY'
import json, sys
try:
    rows = [json.loads(l) for l in open(sys.argv[1]) if l.strip()]
except FileNotFoundError:
    rows = []
if not rows:
    print("aucun événement")
for e in rows[-8:]:
    print(f"[{e.get('type')}] {e.get('ticket')} | à revoir : {e.get('review')} | {e.get('summary')[:220]}")
PY

echo; echo "--- Consommation par session (tokens)"
python3 - "$L" <<'PY'
import glob, json, os, sys
logs = sys.argv[1]
print(f"{'session':>7} {'in':>10} {'out':>9} {'reasoning':>10} {'cache lu':>12} {'coût':>8}")
tot = [0, 0, 0, 0, 0.0]
for f in sorted(glob.glob(os.path.join(logs, "session-*.jsonl"))):
    t = [0, 0, 0, 0, 0.0]
    for line in open(f, errors="replace"):
        try:
            e = json.loads(line)
        except ValueError:
            continue
        if isinstance(e, dict) and e.get("type") == "step_finish":
            p = e.get("part", {}); k = p.get("tokens", {})
            t[0] += k.get("input", 0); t[1] += k.get("output", 0); t[2] += k.get("reasoning", 0)
            t[3] += k.get("cache", {}).get("read", 0); t[4] += p.get("cost", 0) or 0
    tot = [a + b for a, b in zip(tot, t)]
    n = os.path.basename(f)[8:11]
    print(f"{n:>7} {t[0]:>10,} {t[1]:>9,} {t[2]:>10,} {t[3]:>12,} {t[4]:>8.4f}")
print(f"{'total':>7} {tot[0]:>10,} {tot[1]:>9,} {tot[2]:>10,} {tot[3]:>12,} {tot[4]:>8.4f}")
PY

echo; echo "Fichiers : runner/runs/$RUN_ID/logs (loop.log, session-*.jsonl, verify-*.log), RUN-SUMMARY.md dans workspace/ en fin de run."
