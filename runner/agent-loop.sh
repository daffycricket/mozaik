#!/usr/bin/env bash
# Boucle exécutée dans le conteneur : une session OpenCode par ticket,
# publication de la branche de run après chaque session, consommation par session,
# arrêt explicite si le fournisseur n'a plus de crédit, synthèse finale.
set -uo pipefail

: "${OPENCODE_MODEL:?OPENCODE_MODEL doit valoir provider/model}"
: "${RUN_BRANCH:?RUN_BRANCH manquant}"
MAX_SESSIONS="${MAX_SESSIONS:-80}"
SESSION_TIMEOUT="${SESSION_TIMEOUT:-4h}"
MAX_IDLE="${MAX_IDLE:-2}"
COST_CURRENCY="${COST_CURRENCY:-USD}"
# Messages d'erreur signalant un crédit épuisé (expression régulière, insensible à la casse)
CREDIT_ERROR_PATTERNS="${CREDIT_ERROR_PATTERNS:-insufficient[_ ]quota|insufficient[_ ]credit|credit balance|out of credits|payment required|billing|exceeded your current quota|quota exceeded|no credits}"
LOGS=/run-logs
SESSIONS_TSV="$LOGS/sessions.tsv"
export OPENCODE_CONFIG=/runner/opencode/opencode.json
export OPENCODE_CONFIG_DIR=/runner/opencode
export GUARD_LOG="$LOGS/guard.jsonl"
EVENTS="$LOGS/events.jsonl"

PROMPT="Lis AGENTS.md et applique sa boucle de travail pour un seul ticket : reprends le ticket in-progress s'il y en a un, sinon prends le premier ticket éligible du backlog. Mène-le jusqu'à son intégration dans main, puis termine la session. Tu es autonome : ne pose aucune question."

cd /workspace
mkdir -p "$LOGS"
echo "start=$(date -Is)" >> "$LOGS/run.meta"
echo "model=$OPENCODE_MODEL" >> "$LOGS/run.meta"
[ -f "$SESSIONS_TSV" ] || printf 'session\tdebut\tduree_s\texit\tticket\tin\tout\treasoning\tcache_read\tcache_write\tcout\tmain\n' > "$SESSIONS_TSV"

log() { echo "$*" | tee -a "$LOGS/loop.log"; }
commit_runner() { git -c user.name=runner -c user.email=runner@localhost commit -q --no-verify "$@"; }
count_lines() { [ -f "$1" ] && wc -l < "$1" | tr -d ' ' || echo 0; }

# Ajoute des événements (tableau JSON) au journal de la branche courante, dans un commit de l'outillage.
# Le travail non commité de l'agent est mis de côté (stash) : la session suivante le reprendrait de toute façon depuis le dernier commit.
journal_commit() {
  local events="$1" keep_worktree="${2:-no}"
  [ "$(echo "$events" | jq 'length' 2>/dev/null || echo 0)" -gt 0 ] || return 0
  echo "$events" | jq -c '.[]' >> "$EVENTS"
  if [ "$keep_worktree" != "yes" ] && [ -n "$(git status --porcelain 2>/dev/null)" ]; then
    git stash push -u -q -m "runner: travail non commité, session $i" >/dev/null 2>&1 || true
  fi
  if echo "$events" | node /runner/run-checks.mjs journal; then
    if [ "$keep_worktree" != "yes" ]; then
      git add docs/journal.md
      commit_runner -m "chore(run): RUN#0 journal" -m "Événements de l'outillage, session $i.

Refs: RUN
Plan-Step: 0/0" || true
    fi
    log "   journal : $(echo "$events" | jq 'length') événement(s) ($(echo "$events" | jq -r '[.[].type] | join(", ")'))"
  else
    log "   journal : écriture impossible (docs/journal.md introuvable ou modifié) ; événements conservés dans events.jsonl"
  fi
}
remaining() { git show main:docs/backlog.md 2>/dev/null | grep -Eq '\| (todo|in-progress) \|'; }
main_sha() { git rev-parse --short main 2>/dev/null || echo none; }
any_sha() { git rev-parse HEAD 2>/dev/null || echo none; }

# Publication d'une référence locale vers la branche distante du run.
# L'URL avec jeton n'est jamais enregistrée dans la configuration du dépôt.
publish() {
  local ref="${1:-main}"
  if [ -z "${RUN_REMOTE:-}" ] || [ -z "${GIT_PUSH_TOKEN:-}" ]; then
    log "   publication désactivée (RUN_REMOTE ou GIT_PUSH_TOKEN absent)"
    return 0
  fi
  local url="https://${GIT_PUSH_USER:-x-access-token}:${GIT_PUSH_TOKEN}@${RUN_REMOTE#https://}"
  if git push -q "$url" "$ref:refs/heads/$RUN_BRANCH" >/dev/null 2>&1; then
    log "   publié : $RUN_BRANCH @ $(git rev-parse --short "$ref")"
  elif git push -q "$url" "$ref:refs/heads/$RUN_BRANCH-stopped" >/dev/null 2>&1; then
    log "   publication non linéaire : poussé sur $RUN_BRANCH-stopped"
  else
    log "   échec de publication de $RUN_BRANCH"
  fi
}

# Consommation d'une session, lue dans les événements JSON d'OpenCode (step_finish)
usage_of() {
  [ -s "$1" ] || { printf '0\t0\t0\t0\t0\t0'; return 0; }
  jq -R -s -r '
    [split("\n")[] | fromjson? | select(type=="object" and .type=="step_finish") | .part] as $p
    | [ ($p|map(.tokens.input // 0)|add // 0),
        ($p|map(.tokens.output // 0)|add // 0),
        ($p|map(.tokens.reasoning // 0)|add // 0),
        ($p|map(.tokens.cache.read // 0)|add // 0),
        ($p|map(.tokens.cache.write // 0)|add // 0),
        ($p|map(.cost // 0)|add // 0) ]
    | "\(.[0])\t\(.[1])\t\(.[2])\t\(.[3])\t\(.[4])\t\(.[5]*10000|round/10000)"' "$1" 2>/dev/null \
    || printf '0\t0\t0\t0\t0\t0'
}

# Crédit épuisé ? Événements d'erreur JSON (statut 402 ou message reconnu) et sortie d'erreur
credit_exhausted() {
  local json="$1" err="$2"
  jq -R -s -e --arg re "$CREDIT_ERROR_PATTERNS" '
    [split("\n")[] | fromjson? | select(type=="object" and .type=="error") | .error]
    | any(.data.statusCode == 402 or ((.data.message // .name // "") | test($re; "i")))' "$json" >/dev/null 2>&1 \
  || grep -Eiq "$CREDIT_ERROR_PATTERNS" "$err" 2>/dev/null
}
last_error() {
  jq -R -s -r '[split("\n")[] | fromjson? | select(type=="object" and .type=="error") | .error.data.message // .error.name] | last // empty' "$1" 2>/dev/null \
    | head -c 300
}

STOP_REASON=""
VERIFY_FAILURES=""
idle=0
i=0
while [ "$i" -lt "$MAX_SESSIONS" ]; do
  i=$((i + 1))
  if ! remaining; then
    STOP_REASON="plus aucun ticket todo ou in-progress"
    break
  fi
  n=$(printf '%03d' "$i")
  json="$LOGS/session-$n.jsonl"; err="$LOGS/session-$n.err"
  before="$(any_sha) $(main_sha)"
  before_main=$(git rev-parse main 2>/dev/null || echo "")
  guard_offset=$(count_lines "$GUARD_LOG")
  t0=$(date +%s); d0=$(date -Is)
  log "== session $i $d0 main=$(main_sha)"
  prompt="$PROMPT"
  if [ -n "$VERIFY_FAILURES" ]; then
    prompt="$PROMPT

ATTENTION : la vérification indépendante de main par l'outillage a échoué après la dernière session qui a modifié main : $VERIFY_FAILURES. Le détail est dans docs/journal.md (dernière entrée « contrôle »). Applique AGENTS.md section 6, « Vérification indépendante » : corrige d'abord cet échec par un ticket bug."
  fi
  # Le jeton de publication n'est pas transmis à l'agent
  env -u GIT_PUSH_TOKEN timeout "$SESSION_TIMEOUT" \
    opencode run --auto --format json --model "$OPENCODE_MODEL" "$prompt" > "$json" 2> "$err"
  code=$?
  dur=$(( $(date +%s) - t0 ))
  # Ticket de la session : celui des commits ajoutés (sur main ou sur la branche courante), sinon la branche
  ticket=$(git log --format=%s "${before_main:-HEAD}..HEAD" 2>/dev/null | grep -oE '(F[0-9]{2}-S[0-9]+|T-[0-9]{3}|B-[0-9]{3})#' | head -1 | tr -d '#')
  [ -n "$ticket" ] || ticket=$(git log --format=%s "${before_main:-main}..main" 2>/dev/null | grep -oE '(F[0-9]{2}-S[0-9]+|T-[0-9]{3}|B-[0-9]{3})#' | head -1 | tr -d '#')
  [ -n "$ticket" ] || ticket=$(git branch --show-current 2>/dev/null | sed -E 's#^[a-z]+/##; s#-[a-z].*$##')
  usage=$(usage_of "$json")
  printf '%s\t%s\t%s\t%s\t%s\t%s\t%s\n' "$i" "$d0" "$dur" "$code" "${ticket:-main}" "$usage" "$(main_sha)" >> "$SESSIONS_TSV"
  IFS=$'\t' read -r t_in t_out t_re t_cr t_cw t_cost <<< "$usage"
  log "   exit=$code durée=${dur}s ticket=${ticket:-main} tokens in=$t_in out=$t_out reasoning=$t_re cache_read=$t_cr cache_write=$t_cw coût=$t_cost $COST_CURRENCY"

  # Contrôles de fin de session (niveau 3) et refus du garde-fou (niveau 2)
  events=$(node /runner/run-checks.mjs check --before "$before_main" --session "$i" \
    --ticket "${ticket:-RUN}" --exit "$code" --guard-offset "$guard_offset" 2>/dev/null || echo '[]')

  if credit_exhausted "$json" "$err"; then
    STOP_REASON="crédit épuisé chez le fournisseur ($(last_error "$json"))"
    log "!! $STOP_REASON"
    PENDING_EVENTS="$events"
    break
  fi

  # Vérification indépendante de main (niveau 4), si main a avancé pendant la session
  verify_out=$(node /runner/run-checks.mjs verify --before "$before_main" --session "$i" \
    --ticket "${ticket:-RUN}" 2>>"$LOGS/verify-errors.log" || echo '{"events":[],"failures":[]}')
  if [ "$(echo "$verify_out" | jq '.events | length' 2>/dev/null || echo 0)" -gt 0 ]; then
    VERIFY_FAILURES=$(echo "$verify_out" | jq -r '.failures | join(" ; ")')
    if [ -n "$VERIFY_FAILURES" ]; then log "   vérification indépendante : échec ($VERIFY_FAILURES)"
    else log "   vérification indépendante : réussie"; fi
    events=$(jq -s 'add' <<< "$events $(echo "$verify_out" | jq -c '.events')")
  fi

  journal_commit "$events"

  publish main
  if git log -1 --format=%s main 2>/dev/null | grep -q 'RUN#0 bilan'; then
    STOP_REASON="bilan final commité par l'agent"
    break
  fi
  if [ "$(any_sha) $(main_sha)" = "$before" ]; then
    idle=$((idle + 1))
    if [ "$idle" -ge "$MAX_IDLE" ]; then
      STOP_REASON="aucun commit depuis $idle sessions"
      break
    fi
  else
    idle=0
  fi
done
[ -n "$STOP_REASON" ] || STOP_REASON="nombre maximal de sessions atteint ($MAX_SESSIONS)"
log "Arrêt : $STOP_REASON"

{
  echo "end=$(date -Is)"
  echo "sessions=$i"
  echo "stop_reason=$STOP_REASON"
} >> "$LOGS/run.meta"

# Événement de fin de run, ajouté au journal de la branche publiée
end_event() {
  local review="non"
  [[ "$STOP_REASON" == crédit* || "$STOP_REASON" == aucun* || "$STOP_REASON" == nombre* ]] && review="oui"
  jq -n --arg s "Fin du run après $i session(s) : $STOP_REASON." --arg r "$review" \
    '[{type:"run", ticket:"RUN", summary:$s, link:"RUN-SUMMARY.md", review:$r}]'
}

# Crédit épuisé : le travail est conservé en l'état, sur la branche courante, avec un commit dédié
if [[ "$STOP_REASON" == crédit* ]]; then
  CUR=$(git branch --show-current 2>/dev/null || echo detached)
  journal_commit "${PENDING_EVENTS:-[]}" yes
  journal_commit "$(end_event)" yes
  git add -A
  commit_runner --allow-empty -m "chore(run): RUN#0 stopped, provider credit exhausted" -m "Run interrompu : crédit épuisé chez le fournisseur.
Session : $i
Branche de travail : $CUR
Dernière erreur : $(last_error "$LOGS/session-$(printf '%03d' "$i").jsonl")
Le travail non commité de la session est inclus tel quel dans ce commit.

Refs: RUN
Plan-Step: 0/0"
  PUBLISH_REF=HEAD
else
  git stash push -u -q -m "runner: travail non commité en fin de run" >/dev/null 2>&1 || true
  git switch -q main 2>/dev/null || true
  journal_commit "$(end_event)" yes
  PUBLISH_REF=main
fi

# Synthèse finale
{
  echo "# Synthèse du run"
  echo
  sed 's/^/- /' "$LOGS/run.meta"
  echo
  echo "## Consommation"
  echo
  echo "| Session | Début | Durée (s) | Exit | Ticket | Tokens in | Tokens out | Reasoning | Cache lu | Cache écrit | Coût ($COST_CURRENCY) |"
  echo "|---|---|---|---|---|---|---|---|---|---|---|"
  tail -n +2 "$SESSIONS_TSV" | awk -F'\t' '{printf "| %s | %s | %s | %s | %s | %s | %s | %s | %s | %s | %s |\n",$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11}'
  tail -n +2 "$SESSIONS_TSV" | awk -F'\t' -v cur="$COST_CURRENCY" '
    {d+=$3; a+=$6; b+=$7; c+=$8; e+=$9; f+=$10; g+=$11}
    END {printf "| **Total** | | %d | | | %d | %d | %d | %d | %d | %.4f |\n", d,a,b,c,e,f,g}'
  echo
  echo "Coûts calculés par OpenCode à partir des tarifs connus du modèle (0 si le tarif n'est pas renseigné dans \`opencode.json\`)."
  echo
  echo "## Garde-fous et contrôles"
  echo
  if [ -s "$EVENTS" ]; then
    echo "| Type | Ticket | Résumé | À revoir |"
    echo "|---|---|---|---|"
    jq -r '"| \(.type) | \(.ticket) | \(.summary | gsub("\\|"; "/")) | \(.review) |"' "$EVENTS"
    echo
    echo "Totaux : $(jq -s 'map(.type) | group_by(.) | map("\(.[0]) \(length)") | join(", ")' -r "$EVENTS")."
  else
    echo "Aucun événement."
  fi
  echo
  echo "## Tickets (backlog de main)"
  for st in done in-progress blocked todo; do
    echo "- $st : $(git show main:docs/backlog.md 2>/dev/null | grep -Ec "\| $st \|" || true)"
  done
  echo
  echo "## Journal"
  echo "- entrées à revoir : $(git show main:docs/journal.md 2>/dev/null | grep -Ec '\| oui \|$' || true)"
  echo
  echo "## Git"
  echo "- commits sur main : $(git rev-list --count main 2>/dev/null || echo 0)"
  echo "- branche publiée : $(git rev-parse --abbrev-ref "$PUBLISH_REF" 2>/dev/null) @ $(git rev-parse --short "$PUBLISH_REF")"
  echo
  echo "## Sessions"
  echo '```'
  cat "$LOGS/loop.log"
  echo '```'
  echo
  echo "## opencode stats"
  echo '```'
  opencode stats --models 2>&1 || true
  echo '```'
} > RUN-SUMMARY.md
cp RUN-SUMMARY.md "$LOGS/summary.md"
git add RUN-SUMMARY.md docs/journal.md
commit_runner -m "docs(run): RUN#0 summary" -m "Arrêt : $STOP_REASON

Refs: RUN
Plan-Step: 0/0" || true
publish "$PUBLISH_REF"
log "Fin du run. Synthèse : RUN-SUMMARY.md"
