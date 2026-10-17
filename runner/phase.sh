#!/usr/bin/env bash
# Point d'entrée du conteneur : une phase d'un ticket (lancé par mzk.sh).
# Variables : MZK_PHASE (spec, spec-review, design, tech-review, dev, review, merge, verify),
# MZK_TICKET, MZK_BASE (commit de main d'où part la branche), OPENCODE_MODEL, MAX_SESSIONS, MAX_FIX.
# Écrit dans /run-logs : sessions.tsv, checks.jsonl, guard.jsonl, <phase>-NNN.jsonl, phase-result.json.
# Ne pousse rien et ne touche pas à Trello : c'est le rôle de mzk.sh, sur l'hôte.
set -uo pipefail

: "${MZK_PHASE:?}" "${MZK_TICKET:?}" "${MZK_BASE:?}"
PHASE="$MZK_PHASE"; T="$MZK_TICKET"
MODEL="${OPENCODE_MODEL:-}"
MAX_SESSIONS="${MAX_SESSIONS:-3}"
MAX_FIX="${MAX_FIX:-2}"
SESSION_TIMEOUT="${SESSION_TIMEOUT:-4h}"
STALL_TIMEOUT="${STALL_TIMEOUT:-3600}"
LOGS=/run-logs
TSV="$LOGS/sessions.tsv"
RESULT="$LOGS/phase-result.json"
export OPENCODE_CONFIG=/runner/opencode/opencode.json
export OPENCODE_CONFIG_DIR=/runner/opencode
export GUARD_LOG="$LOGS/guard.jsonl"
export MZK_PHASE MZK_TICKET RUN_LOGS="$LOGS"

cd /workspace
mkdir -p "$LOGS"
[ -f "$TSV" ] || printf 'phase\tsession\tmodele\tduree_s\texit\tin\tout\treasoning\tcache_read\tcout\tverification\tcouverture\n' > "$TSV"
log() { echo "$*" | tee -a "$LOGS/loop.log"; }
count_lines() { [ -f "$1" ] && wc -l < "$1" | tr -d ' ' || echo 0; }

usage_of() {
  [ -s "$1" ] || { printf '0\t0\t0\t0\t0'; return 0; }
  jq -R -s -r '
    [split("\n")[] | fromjson? | select(type=="object" and .type=="step_finish") | .part] as $p
    | "\($p|map(.tokens.input // 0)|add // 0)\t\($p|map(.tokens.output // 0)|add // 0)\t\($p|map(.tokens.reasoning // 0)|add // 0)\t\($p|map(.tokens.cache.read // 0)|add // 0)\t\(($p|map(.cost // 0)|add // 0)*10000|round/10000)"' "$1" 2>/dev/null \
    || printf '0\t0\t0\t0\t0'
}

base_prompt() {
  local common="Ticket $T, branche $(git branch --show-current). Lis AGENTS.md en entier avant toute action. Tu es autonome : ne pose aucune question à l'humain, n'attends aucune réponse."
  case "$PHASE" in
    spec) echo "$common Phase SPEC : applique AGENTS.md §7 à la demande de docs/tickets/$T/ticket.md. La sous-section « Spec » de la section $T de docs/journal.md est ouverte : remplis son tableau (hypothèses, questions, éléments de spec ajoutés, modifiés ou supprimés). Ne commite pas." ;;
    spec-review) echo "$common Phase SPEC REVIEW : applique AGENTS.md §10 aux remarques de la dernière section de docs/tickets/$T/retours.md, en mettant à jour la spec du ticket. La sous-section « Spec review » de la section $T du journal est ouverte : remplis son tableau. Ne commite pas." ;;
    design) echo "$common Phase DESIGN : applique AGENTS.md §8 et écris docs/tickets/$T/plan.md. La sous-section « Design » de la section $T du journal est ouverte : remplis son tableau. Ne commite pas." ;;
    tech-review) echo "$common Phase TECH REVIEW : applique AGENTS.md §10 aux remarques de la dernière section de docs/tickets/$T/retours.md, en mettant à jour docs/tickets/$T/plan.md. La sous-section « Tech review » de la section $T du journal est ouverte : remplis son tableau. Ne commite pas." ;;
    dev) echo "$common Phase DEV : applique AGENTS.md §9 au plan docs/tickets/$T/plan.md, une étape = un commit. Les étapes déjà commitées sont dans git log --oneline $MZK_BASE..HEAD : continue à la suivante. La sous-section « Dev » de la section $T du journal est ouverte. Exécute pnpm install si node_modules est absent. Termine la session quand la dernière étape est commitée." ;;
    review) echo "$common Phase REVIEW : applique AGENTS.md §10 aux remarques de la dernière section de docs/tickets/$T/retours.md ; chaque correction est un commit d'étape (AGENTS.md §9). La sous-section « Review » de la section $T du journal est ouverte. Mets à jour la synthèse du rapport. Exécute pnpm install si node_modules est absent." ;;
    merge) echo "$common Phase MERGE : applique AGENTS.md §11. $(if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then echo "Un rebase sur main est en cours et s'est arrêté sur des conflits : résous-les, git add, puis git rebase --continue, jusqu'à la fin du rebase."; else echo "Le rebase sur main est terminé mais la vérification a échoué : corrige par un commit supplémentaire."; fi) Après le rebase, ajoute à la fin de la section $T de docs/journal.md une sous-section « ### Merge : $(date -u +%F) » avec le tableau du journal, et trace chaque résolution (« À revoir : oui »). Exécute pnpm install si node_modules est absent." ;;
  esac
}

run_verify() {
  local out
  out=$(node /runner/checks.mjs verify --ticket "$T" --since "$MZK_BASE" --session "$1" --phase "$PHASE" 2>>"$LOGS/verify-errors.log" || echo '{"ok":false,"failures":["vérification impossible"]}')
  VERIFY_OK=$(echo "$out" | jq -r '.ok')
  VERIFY_FAILURES=$(echo "$out" | jq -r '.failures | join(" ; ")')
  COVERAGE=$(echo "$out" | jq -r 'if .coverage then "\(.coverage.lines) / \(.coverage.branches)" else "—" end')
  if [ "$VERIFY_OK" = true ]; then log "   vérification : verte ($COVERAGE)"; else log "   vérification : échec ($VERIFY_FAILURES)"; fi
}

VERIFY_OK=""; VERIFY_FAILURES="${MZK_VERIFY_FAILURES:-}"; COVERAGE="—"
COMPLETE=false

# Vérification seule (merge sans conflit) : pas d'agent
if [ "$PHASE" = verify ]; then
  run_verify 0
  jq -n --arg p verify --argjson ok "$([ "$VERIFY_OK" = true ] && echo true || echo false)" --arg f "$VERIFY_FAILURES" --arg c "$COVERAGE" \
    '{phase:$p, verify:(if $ok then "ok" else "failed" end), failures:$f, coverage:$c, complete:$ok, agentChanges:false}' > "$RESULT"
  exit 0
fi

PROMPT="$(base_prompt)"
start_head=$(git rev-parse HEAD 2>/dev/null || echo none)
prev=$(ls "$LOGS"/"$PHASE"-*.jsonl 2>/dev/null | wc -l | tr -d ' ')
fixes=0
case "$PHASE" in spec|spec-review|design|tech-review) MAX_SESSIONS=1 ;; esac

for s in $(seq 1 "$MAX_SESSIONS"); do
  n=$(printf '%03d' $((prev + s)))
  json="$LOGS/$PHASE-$n.jsonl"; err="$LOGS/$PHASE-$n.err"
  before=$(git rev-parse HEAD)
  goff=$(count_lines "$GUARD_LOG")
  prompt="$PROMPT"
  [ -z "$VERIFY_FAILURES" ] || prompt="$PROMPT

ATTENTION : la vérification indépendante de la branche a échoué : $VERIFY_FAILURES. Le détail (sortie de chaque commande) est dans le plus récent des fichiers /run-logs/verify-*.log. Applique AGENTS.md §9, point 5 : corrige d'abord cet échec."
  [ "$s" -eq 1 ] || [ -n "$VERIFY_FAILURES" ] || prompt="$PROMPT

Session de continuation : la session précédente s'est arrêtée avant la fin du plan."
  t0=$(date +%s); d0=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  log "== $PHASE $T session $n $d0 HEAD=$(git rev-parse --short HEAD) modèle=$MODEL"
  # Aucun secret de publication ni Trello n'est transmis à l'agent
  env -u GIT_PUSH_TOKEN -u TRELLO_KEY -u TRELLO_TOKEN -u GITHUB_TOKEN -u GH_TOKEN timeout "$SESSION_TIMEOUT" \
    opencode run --auto --format json ${MODEL:+--model "$MODEL"} "$prompt" > "$json" 2> "$err" &
  pid=$!
  while kill -0 "$pid" 2>/dev/null; do
    sleep 30
    idle_s=$(( $(date +%s) - $(stat -c %Y "$json" 2>/dev/null || date +%s) ))
    if [ "$idle_s" -ge "$STALL_TIMEOUT" ]; then
      log "   session interrompue : aucune activité depuis ${idle_s}s"
      kill -TERM "$pid" 2>/dev/null; sleep 10; kill -KILL "$pid" 2>/dev/null
      break
    fi
  done
  wait "$pid" 2>/dev/null; code=$?
  dur=$(( $(date +%s) - t0 ))
  node /runner/checks.mjs check --phase "$PHASE" --ticket "$T" --base "$MZK_BASE" --before "$before" \
    --session "$n" --exit "$code" --guard-offset "$goff" >> "$LOGS/checks.jsonl" 2>>"$LOGS/checks-errors.log" || true

  vcol="—"; COVERAGE="—"
  case "$PHASE" in
    spec|spec-review|design|tech-review) COMPLETE=true ;;
    *)
      if [ "$(git rev-parse HEAD)" != "$before" ] || [ -n "$VERIFY_FAILURES" ]; then
        if [ -d .git/rebase-merge ] || [ -d .git/rebase-apply ]; then
          VERIFY_OK=false; VERIFY_FAILURES="rebase toujours en cours"
        else
          run_verify "$n"
        fi
        vcol=$([ "$VERIFY_OK" = true ] && echo verte || echo échec)
      fi
      [ "$VERIFY_OK" = true ] && VERIFY_FAILURES=""
      if [ "$PHASE" = dev ]; then
        prog=$(node /runner/checks.mjs progress --ticket "$T" --base "$MZK_BASE")
        steps=$(echo "$prog" | jq -r '.planSteps'); last=$(echo "$prog" | jq -r '.lastStep')
        log "   avancement : étape $last / $steps du plan"
        [ "$VERIFY_OK" = true ] && [ "$last" -ge "$steps" ] && COMPLETE=true
      else
        [ "$VERIFY_OK" = true ] && COMPLETE=true
      fi
      ;;
  esac
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$PHASE" "$n" "${MODEL:-défaut}" "$dur" "$code" "$(usage_of "$json")" "$vcol" "$COVERAGE" >> "$TSV"
  log "   exit=$code durée=${dur}s"
  [ "$COMPLETE" = true ] && break
  if [ -n "$VERIFY_FAILURES" ]; then
    fixes=$((fixes + 1))
    [ "$fixes" -le "$MAX_FIX" ] || { log "   échec persistant après $MAX_FIX session(s) de correction"; break; }
  elif [ "$(git rev-parse HEAD)" = "$before" ]; then
    log "   aucun commit pendant la session : arrêt"
    break
  fi
done

changed=false
[ "$(git rev-parse HEAD)" = "$start_head" ] || changed=true
jq -n --arg p "$PHASE" --arg v "$( [ -z "$VERIFY_OK" ] && echo none || { [ "$VERIFY_OK" = true ] && echo ok || echo failed; } )" \
  --arg f "$VERIFY_FAILURES" --arg c "$COVERAGE" --argjson done "$COMPLETE" --argjson ch "$changed" \
  '{phase:$p, verify:$v, failures:$f, coverage:$c, complete:$done, agentChanges:$ch}' > "$RESULT"
log "Fin de la phase $PHASE : $(cat "$RESULT")"
