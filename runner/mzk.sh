#!/usr/bin/env bash
# Mozaik : une commande par phase d'un ticket MZK-<n>.
# Usage : runner/mzk.sh <commande> <MZK-n> [options]   (aide : runner/mzk.sh help)
#
# Se lance depuis ta copie de mozaik sur main (macOS ou Linux, bash 3.2+). L'image de l'agent est
# construite à partir de ce dossier runner/ ; chaque ticket a son propre clone, hors de cette copie.
# La publication (git push en SSH) et Trello sont faits ici, jamais par l'agent.
set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
REPO="$(cd "$HERE/.." && pwd)"
LIB="$HERE/lib.mjs"
COMPOSE="$HERE/compose.yml"

die() { echo "mzk: $*" >&2; exit 1; }
info() { echo "mzk: $*"; }
usage() {
  cat <<'USAGE'
Usage : runner/mzk.sh <commande> <MZK-n> [options]

Phases (dans l'ordre du workflow) :
  spec <id> [--model m] [--title t --type bug|feat|change|tech --file demande.md]
  spec-review <id> [--model m] [--file retours.txt]
  design <id> [--model m]
  tech-review <id> [--model m] [--file retours.txt]
  dev <id> [--model m] [--restart]
  review <id> [--model m] [--file retours.txt]
  merge <id> [--model m] [--accept-red <lien de la carte bug>] [--allow-runner-changes]
Outils :
  run <id> [--reset] [--port 8081]   lance la branche du ticket en local (recette avant merge)
  status <id>                        état du ticket (branche, commits, dernière phase)
  clean <id> [--force]               supprime le clone d'un ticket mergé

À lancer depuis ta copie de mozaik sur main, sans modification non commitée dans runner/
(sinon : --allow-tooling-branch, pour tester une évolution de l'outillage).
Sans Trello configuré (TRELLO_KEY, TRELLO_TOKEN, TRELLO_BOARD dans runner/.env), la demande
et les retours sont lus dans --file, et les déplacements de carte sont à faire à la main.
USAGE
}

CMD="${1:-help}"; shift || true
case "$CMD" in help|-h|--help) usage; exit 0 ;; esac
RAW_ID="${1:-}"; [ -n "$RAW_ID" ] || { usage; exit 1; }; shift
T="MZK-${RAW_ID#MZK-}"
case "${T#MZK-}" in ''|*[!0-9]*) die "identifiant invalide : $RAW_ID (attendu MZK-<n>)" ;; esac

MODEL=""; TITLE=""; TYPE=""; FILE=""; RESTART=0; ACCEPT_RED=""; RESET=0; PORT=8081
ALLOW_TOOLING_BRANCH=0; ALLOW_RUNNER_CHANGES=0; FORCE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --model) MODEL="$2"; shift 2 ;;
    --title) TITLE="$2"; shift 2 ;;
    --type) TYPE="$2"; shift 2 ;;
    --file) FILE="$2"; shift 2 ;;
    --restart) RESTART=1; shift ;;
    --accept-red) ACCEPT_RED="$2"; shift 2 ;;
    --reset) RESET=1; shift ;;
    --port) PORT="$2"; shift 2 ;;
    --allow-tooling-branch) ALLOW_TOOLING_BRANCH=1; shift ;;
    --allow-runner-changes) ALLOW_RUNNER_CHANGES=1; shift ;;
    --force) FORCE=1; shift ;;
    *) die "option inconnue : $1" ;;
  esac
done

case "$REPO" in */MZK-[0-9]*/workspace) die "mzk.sh lancé depuis le clone d'un ticket ($REPO) : lance-le depuis ta copie de mozaik sur main" ;; esac
[ -f "$HERE/.env" ] || die "runner/.env manquant (copier runner/.env.example)"
set -a; . "$HERE/.env"; set +a
command -v node >/dev/null || die "node est requis sur l'hôte"
TICKETS_DIR="${MZK_TICKETS_DIR:-$(dirname "$REPO")/mozaik-tickets}"
mkdir -p "$TICKETS_DIR"
TICKETS_DIR="$(cd "$TICKETS_DIR" && pwd)"

# L'outillage exécuté est celui de cette copie : elle doit être une copie de travail sur main, à jour,
# sans modification de runner/, et jamais le clone d'un ticket (que l'agent peut modifier).
case "$REPO/" in "$TICKETS_DIR"/*) die "mzk.sh lancé depuis le clone d'un ticket ($REPO) : lance-le depuis ta copie de mozaik sur main" ;; esac
git -C "$REPO" rev-parse --git-dir >/dev/null 2>&1 || die "$REPO n'est pas un dépôt Git"
if [ "$ALLOW_TOOLING_BRANCH" = 1 ]; then
  info "outillage pris sur $(git -C "$REPO" branch --show-current) @ $(git -C "$REPO" rev-parse --short HEAD), modifications locales comprises (--allow-tooling-branch)"
else
  [ "$(git -C "$REPO" branch --show-current)" = main ] || die "ta copie $REPO n'est pas sur main (option --allow-tooling-branch pour tester un outillage non mergé)"
  [ -z "$(git -C "$REPO" status --porcelain -- runner)" ] || die "runner/ a des modifications non commitées dans $REPO (option --allow-tooling-branch pour les tester)"
  git -C "$REPO" pull -q --ff-only || die "impossible de mettre à jour $REPO depuis origin/main (git pull --ff-only)"
fi
MOZAIK_REMOTE="${MOZAIK_REMOTE:-$(git -C "$REPO" remote get-url origin)}"
MODEL="${MODEL:-${MOZAIK_MODEL:-umans/umans-deepseek-v4.1-flash}}"
TD="$TICKETS_DIR/$T"
WS="$TD/workspace"
TODAY="$(date -u +%Y-%m-%d)"
JOURNAL="docs/journal.md"
TRELLO=0
if [ -n "${TRELLO_KEY:-}" ] && [ -n "${TRELLO_TOKEN:-}" ] && [ -n "${TRELLO_BOARD:-}" ] && [ "${MZK_NO_TRELLO:-0}" != 1 ]; then TRELLO=1; fi
REPO_PATH="$(echo "$MOZAIK_REMOTE" | sed -E 's#^(git@github\.com:|https://github\.com/)##; s#\.git$##')"

lib() { node "$LIB" "$@"; }
g() { git -C "$WS" "$@"; }
runner_commit() { g -c user.name=mozaik-runner -c user.email=runner@localhost commit -q --no-verify "$@"; }
branch() { g branch --show-current; }
base_sha() { g merge-base origin/main HEAD; }
next_k() { echo $(( $(g rev-list --count "$(base_sha)..HEAD") + 1 )); }

# ---------- Trello ----------
card_list() { [ "$TRELLO" = 1 ] && lib trello-card --ticket "$T" | node -e 'let s="";process.stdin.on("data",d=>s+=d).on("end",()=>console.log(JSON.parse(s).list))' || echo ""; }
require_list() { # require_list "Liste1|Liste2"
  [ "$TRELLO" = 1 ] || { info "Trello non configuré : vérifie toi-même que la carte $T est dans « ${1//|/ » ou « } »."; return 0; }
  local cur; cur="$(card_list)"
  case "|$1|" in *"|$cur|"*) ;; *) die "la carte $T est dans « $cur », attendu : « ${1//|/ » ou « } »" ;; esac
}
move() {
  if [ "$TRELLO" = 1 ]; then lib trello-move --ticket "$T" --list "$1" && info "carte $T -> $1"
  else info "Trello non configuré : déplace la carte $T vers « $1 »."; fi
}
comment() { # comment <fichier>
  if [ "$TRELLO" = 1 ]; then lib trello-comment --ticket "$T" --text-file "$1"
  else info "Trello non configuré : commentaire non publié ($1)"; sed 's/^/    /' "$1"; echo; fi
}
links() {
  echo "Branche : https://github.com/$REPO_PATH/tree/$(branch)"
  echo "Diff : https://github.com/$REPO_PATH/compare/main...$(branch)"
}

# ---------- Espace de travail ----------
prepare_ws() {
  [ -d "$WS/.git" ] || die "pas d'espace de travail pour $T (lancer d'abord : mzk.sh spec $T)"
  [ -z "$(g status --porcelain)" ] || die "travail non commité dans $WS : à examiner avant de continuer"
  g fetch -q origin
  local b; b="$(branch)"
  case "$b" in ticket/"$T"-*) ;; *) die "branche courante inattendue dans $WS : $b" ;; esac
  if g rev-parse -q --verify "origin/$b" >/dev/null && [ "$(g rev-parse HEAD)" != "$(g rev-parse "origin/$b")" ]; then
    g merge-base --is-ancestor HEAD "origin/$b" && g merge -q --ff-only "origin/$b" \
      || g merge-base --is-ancestor "origin/$b" HEAD \
      || die "la branche locale et origin/$b ont divergé : à résoudre à la main"
  fi
  g branch -q -f main origin/main
}
fix_perms() { mkdir -p "$TD/logs" "$TD/opencode-data"; chmod -R a+rwX "$TD"; }

run_container() { # run_container <phase> [verify_failures]
  fix_perms
  local drift; drift="$(lib image-drift --dockerfile "$HERE/Dockerfile" --package "$WS/package.json")"
  [ -z "$drift" ] || info "versions de l'image à mettre à jour (runner/README.md, « Versions de l'image ») : $(echo "$drift" | tr '\n' ';')"
  docker volume create mozaik-agent-pw-browsers >/dev/null
  docker volume create mozaik-agent-pnpm-store >/dev/null
  local project; project="mzk-$(echo "$T" | tr 'A-Z' 'a-z')"
  TICKET_DIR="$TD" MZK_PHASE="$1" MZK_TICKET="$T" MZK_BASE="$(base_sha)" OPENCODE_MODEL="$MODEL" \
  MZK_VERIFY_FAILURES="${2:-}" \
    docker compose -f "$COMPOSE" -p "$project" run --rm --build agent
  [ -f "$TD/logs/phase-result.json" ] || die "le conteneur n'a pas écrit phase-result.json (voir $TD/logs/loop.log)"
}
result() { node -e 'const r=require(process.argv[1]);console.log(r[process.argv[2]]??"")' "$TD/logs/phase-result.json" "$1"; }

journal_open() { lib journal-open --file "$WS/$JOURNAL" --ticket "$T" --title "${CARD_NAME:-}" --type "${TYPE:-}" \
  --branch "$(branch)" --card "${CARD_URL:-}" --phase "$1" --date "$TODAY"; }
journal_files() { lib journal-files --file "$WS/$JOURNAL" --ticket "$T" --files "$1"; }
changed_files() { # fichiers modifiés depuis <sha>, commités ou non, hors journal
  { g diff --name-only "$1"; g ls-files --others --exclude-standard; } | grep -v "^$JOURNAL\$" | sort -u
}

# Commit d'une phase documentaire, publication, commentaire
finish_doc_phase() { # finish_doc_phase <scope> <titre de phase> <description anglaise> <liste suivante>
  local scope="$1" phase="$2" desc="$3" next="$4" start files k
  start="$(g rev-parse HEAD)"
  files="$(changed_files "$start")"
  journal_files "$files"
  [ -n "$files" ] || info "aucun fichier modifié par l'agent pendant la phase $phase"
  k="$(next_k)"
  g add -A
  runner_commit -m "docs($scope): $T#$k $desc" -m "Refs: $T"
  g push -q -u origin "$(branch)"
  info "publié : $(branch) @ $(g rev-parse --short HEAD)"
  { echo "[mozaik] Phase $phase terminée."; echo; links; echo;
    lib journal-subsection --file "$WS/$JOURNAL" --ticket "$T" --phase "$phase"; } > "$TD/logs/comment.md"
  comment "$TD/logs/comment.md"
  [ -z "$next" ] || move "$next"
}

collect_retours() { # collect_retours <titre de phase>
  local cfile="$TD/logs/comments.json"
  if [ "$TRELLO" = 1 ]; then lib trello-comments --ticket "$T" > "$cfile"
  elif [ -n "$FILE" ]; then node -e 'const fs=require("fs");console.log(JSON.stringify([{text:fs.readFileSync(process.argv[1],"utf8")}]))' "$FILE" > "$cfile"
  else die "aucun retour : sans Trello, passe les retours avec --file <fichier>"; fi
  node -e 'process.exit(require(process.argv[1]).length?0:1)' "$cfile" || die "aucun commentaire humain depuis le dernier passage du script"
  lib retours-append --file "$WS/docs/tickets/$T/retours.md" --ticket "$T" --title "${CARD_NAME:-}" \
    --phase "$1" --date "$TODAY" --comments "$cfile"
}

load_card() {
  CARD_NAME=""; CARD_URL=""
  if [ -f "$WS/docs/tickets/$T/ticket.md" ]; then
    CARD_NAME="$(sed -n "1s/^# $T : //p" "$WS/docs/tickets/$T/ticket.md")"
    CARD_URL="$(sed -n 's/^- Carte : //p' "$WS/docs/tickets/$T/ticket.md" | head -1)"
    TYPE="$(sed -n 's/^- Type : //p' "$WS/docs/tickets/$T/ticket.md" | head -1)"
  fi
}

# Après une phase de code (dev, review) : métriques, contrôles, publication, PR, bugs, carte
finish_code_phase() { # finish_code_phase <titre de phase> <sha de départ>
  local phase="$1" start="$2" files k ok complete bugs n i title qual body
  ok="$(result verify)"; complete="$(result complete)"
  files="$(changed_files "$start")"
  journal_files "$files"
  lib rapport-runner --file "$WS/docs/tickets/$T/rapport.md" --ticket "$T" \
    --sessions "$TD/logs/sessions.tsv" --checks "$TD/logs/checks.jsonl"
  k="$(next_k)"
  g add -A
  runner_commit -m "docs($(echo "$phase" | tr 'A-Z' 'a-z')): $T#$k record runner metrics and checks" -m "Refs: $T"
  g push -q -u origin "$(branch)"
  info "publié : $(branch) @ $(g rev-parse --short HEAD) ; vérification : $ok ; plan terminé : $complete"

  # Bugs décrits par l'agent
  bugs="$(lib bugs --file "$WS/docs/tickets/$T/rapport.md")"
  n="$(node -e 'console.log(JSON.parse(process.argv[1]).length)' "$bugs")"
  local blocking=0
  i=0
  while [ "$i" -lt "$n" ]; do
    title="$(node -e 'console.log(JSON.parse(process.argv[1])[process.argv[2]].title)' "$bugs" "$i")"
    qual="$(node -e 'console.log(JSON.parse(process.argv[1])[process.argv[2]].qualification)' "$bugs" "$i")"
    [ "$qual" = secondaire ] || blocking=1
    node -e 'const b=JSON.parse(process.argv[1])[process.argv[2]];console.log(`Bug décrit par l agent pendant ${process.argv[3]}.\n\n${b.body}`)' "$bugs" "$i" "$T" > "$TD/logs/bug-$i.md"
    if [ "$TRELLO" = 1 ]; then
      info "carte bug créée : $(lib trello-create --list Inbox --name "Bug ($qual) : $title" --desc-file "$TD/logs/bug-$i.md")"
    else info "Trello non configuré : crée la carte bug « $title » ($qual), description dans $TD/logs/bug-$i.md"; fi
    i=$((i + 1))
  done

  # Pull request
  local pr=""
  if command -v gh >/dev/null && gh auth status >/dev/null 2>&1; then
    lib rapport-section --file "$WS/docs/tickets/$T/rapport.md" --title "Synthèse de l'agent" > "$TD/logs/pr-body.md"
    { echo; lib rapport-section --file "$WS/docs/tickets/$T/rapport.md" --title "Métriques du runner"; } >> "$TD/logs/pr-body.md"
    if pr="$(gh pr view "$(branch)" --repo "$REPO_PATH" --json url -q .url 2>/dev/null)"; then
      gh pr edit "$(branch)" --repo "$REPO_PATH" --body-file "$TD/logs/pr-body.md" >/dev/null
    else
      pr="$(gh pr create --repo "$REPO_PATH" --base main --head "$(branch)" --title "$T : ${CARD_NAME:-$T}" --body-file "$TD/logs/pr-body.md")"
    fi
    info "pull request : $pr"
  else
    info "gh absent ou non authentifié : ouvre la PR à la main : https://github.com/$REPO_PATH/compare/main...$(branch)?expand=1"
  fi

  { echo "[mozaik] Phase $phase terminée : vérification $ok, plan terminé : $complete."; echo; links;
    [ -z "$pr" ] || echo "Pull request : $pr"; echo;
    lib rapport-section --file "$WS/docs/tickets/$T/rapport.md" --title "Synthèse de l'agent"; } > "$TD/logs/comment.md"
  comment "$TD/logs/comment.md"
  if [ "$complete" = true ] && [ "$ok" = ok ]; then move Review
  elif [ "$complete" = true ] && [ "$blocking" = 0 ] && [ "$n" -gt 0 ]; then move Review; info "vérification rouge due à un bug secondaire : carte en Review"
  else info "phase incomplète ou vérification rouge : la carte reste en Dev (relancer : mzk.sh dev $T)"; fi
}

# ---------- Commandes ----------
cmd_spec() {
  [ ! -d "$WS/.git" ] || die "$T a déjà une branche ($WS) : utilise spec-review pour faire évoluer la spec"
  local text card_json
  if [ "$TRELLO" = 1 ]; then
    require_list "Triage"
    card_json="$(lib trello-card --ticket "$T")"
    CARD_NAME="$(node -e 'console.log(JSON.parse(process.argv[1]).name)' "$card_json")"
    CARD_URL="$(node -e 'console.log(JSON.parse(process.argv[1]).url)' "$card_json")"
    text="$(node -e 'console.log(JSON.parse(process.argv[1]).desc)' "$card_json")"
  else
    [ -n "$TITLE" ] && [ -n "$FILE" ] || die "sans Trello : --title et --file sont obligatoires"
    CARD_NAME="$TITLE"; CARD_URL=""; text="$(cat "$FILE")"
  fi
  [ -n "$TITLE" ] && CARD_NAME="$TITLE"
  case "${TYPE:-}" in bug|feat|change|tech) ;; "") TYPE=feat; info "type non précisé : feat (option --type)" ;; *) die "type invalide : $TYPE" ;; esac
  move "Spec"
  mkdir -p "$TD"
  git clone -q "$MOZAIK_REMOTE" "$WS"
  local b="ticket/$T-$(lib slug --title "$CARD_NAME")"
  g switch -q -c "$b" origin/main
  mkdir -p "$WS/docs/tickets/$T"
  {
    echo "# $T : $CARD_NAME"; echo
    echo "- Carte : ${CARD_URL:-(aucune)}"; echo "- Type : $TYPE"; echo "- Branche : \`$b\`"; echo
    echo "## Demande"; echo
    echo "Copie du texte de la carte au lancement de la phase spec, sans modification."; echo
    printf '%s\n' "$text" | sed 's/^/> /'
  } > "$WS/docs/tickets/$T/ticket.md"
  journal_open "Spec"
  run_container spec
  finish_doc_phase spec "Spec" "write specification" "Spec review"
}

cmd_spec_review() {
  prepare_ws; load_card
  require_list "Spec review"
  collect_retours "Spec review"
  journal_open "Spec review"
  run_container spec-review
  finish_doc_phase spec-review "Spec review" "apply spec review feedback" ""
}

cmd_design() {
  prepare_ws; load_card
  require_list "Spec review|Design"
  info "entrées validées (spec) : $(lib journal-validate --file "$WS/$JOURNAL" --ticket "$T" --phases "Spec,Spec review")"
  move "Design"
  journal_open "Design"
  run_container design
  finish_doc_phase design "Design" "write implementation plan" "Tech review"
}

cmd_tech_review() {
  prepare_ws; load_card
  require_list "Tech review"
  collect_retours "Tech review"
  journal_open "Tech review"
  run_container tech-review
  finish_doc_phase tech-review "Tech review" "apply tech review feedback" ""
}

start_code_phase() { # start_code_phase <titre> <phases validées>
  local n k
  n="$(lib journal-validate --file "$WS/$JOURNAL" --ticket "$T" --phases "$2")"
  journal_open "$1"
  k="$(next_k)"
  g add -A
  runner_commit -m "docs($(echo "$1" | tr 'A-Z' 'a-z')): $T#$k open $(echo "$1" | tr 'A-Z' 'a-z') phase" -m "Refs: $T"
  info "phase $1 ouverte ($n entrée(s) validée(s))"
}

cmd_dev() {
  prepare_ws; load_card
  require_list "Tech review|Dev"
  if [ "$RESTART" = 1 ]; then
    local from
    from="$(g log --format='%H %s' "$(base_sha)..HEAD" | grep -E " docs\((design|tech-review)\): $T#" | head -1 | cut -d' ' -f1)"
    [ -n "$from" ] || die "--restart : aucun commit de design trouvé"
    g reset -q --hard "$from"
    lib journal-open --file "$WS/$JOURNAL" --ticket "$T" --phase "Dev" --date "$TODAY" >/dev/null
    lib journal-row --file "$WS/$JOURNAL" --ticket "$T" --cells "décision	branche	Redémarrage du dev depuis $(g rev-parse --short HEAD) (dernier commit de design), à la demande de l'humain	humain	non"
    g add -A; runner_commit -m "docs(dev): $T#$(next_k) restart development from design" -m "Refs: $T"
    FORCE_PUSH=1
  fi
  move "Dev"
  [ "$RESTART" = 1 ] || start_code_phase "Dev" "Design,Tech review"
  local start; start="$(g rev-parse HEAD)"
  rm -f "$TD/logs/phase-result.json"
  run_container dev
  if [ "${FORCE_PUSH:-0}" = 1 ]; then g push -q --force-with-lease origin "$(branch)"; fi
  finish_code_phase "Dev" "$start"
}

cmd_review() {
  prepare_ws; load_card
  require_list "Review"
  collect_retours "Review"
  move "Dev"
  start_code_phase "Review" ""
  local start; start="$(g rev-parse HEAD)"
  rm -f "$TD/logs/phase-result.json"
  run_container review
  finish_code_phase "Review" "$start"
}

cmd_merge() {
  prepare_ws; load_card
  require_list "Review"
  local tooling
  tooling="$(g diff --name-only origin/main...HEAD -- runner)"
  if [ -n "$tooling" ]; then
    [ "$ALLOW_RUNNER_CHANGES" = 1 ] || die "la branche modifie l'outillage runner/ ($(echo "$tooling" | tr '\n' ' ')) : merge refusé (option --allow-runner-changes si c'est voulu)"
    info "la branche modifie runner/ : merge autorisé par --allow-runner-changes"
  fi
  local b old agent=0 status
  b="$(branch)"; old="$(g rev-parse HEAD)"
  rm -f "$TD/logs/phase-result.json"
  if g rebase -q origin/main >/dev/null 2>&1; then
    info "rebase sans conflit sur origin/main"
    run_container verify
    if [ "$(result verify)" != ok ] && [ -z "$ACCEPT_RED" ]; then
      info "vérification rouge après rebase : $(result failures) ; correction par l'agent"
      run_container merge "$(result failures)"; agent=1
    fi
  else
    info "conflits pendant le rebase : résolution par l'agent"
    run_container merge; agent=1
    if [ -d "$WS/.git/rebase-merge" ] || [ -d "$WS/.git/rebase-apply" ]; then
      g rebase --abort
      echo "[mozaik] Merge impossible : l'agent n'a pas terminé le rebase. Résolution humaine nécessaire (voir $TD/logs)." > "$TD/logs/comment.md"
      comment "$TD/logs/comment.md"; die "rebase non terminé : branche remise dans son état d'origine"
    fi
  fi
  status="$(result verify)"
  if [ "$old" != "$(g rev-parse HEAD)" ]; then g push -q --force-with-lease="$b:$old" origin "$b"; info "branche rebasée publiée"; fi
  if [ "$agent" = 1 ]; then
    { echo "[mozaik] Rebase corrigé par l'agent (vérification : $status). Reteste la branche (mzk.sh run $T) puis relance mzk.sh merge $T."; echo; links; } > "$TD/logs/comment.md"
    comment "$TD/logs/comment.md"; info "arrêt avant le merge : retest humain demandé"; return 0
  fi
  if [ "$status" != ok ] && [ -z "$ACCEPT_RED" ]; then die "vérification rouge ($(result failures)) : pas de merge (option --accept-red <carte> pour un bug secondaire connu)"; fi

  local head; head="$(g rev-parse --short HEAD)"
  g switch -q main
  g merge -q --no-ff --no-commit "$b" >/dev/null || die "merge impossible (inattendu après rebase)"
  lib journal-validate --file "$WS/$JOURNAL" --ticket "$T" --phases "Dev,Review,Merge" >/dev/null
  {
    echo "### Merge : $TODAY"; echo
    echo "Tête de branche intégrée : \`$head\` ($b). Rebase sans conflit, vérification : $( [ "$status" = ok ] && echo verte || echo "rouge, acceptée par l'humain (bug secondaire : $ACCEPT_RED)" )."
  } > "$TD/logs/merge-block.md"
  lib journal-append --file "$WS/$JOURNAL" --ticket "$T" --block-file "$TD/logs/merge-block.md"
  g add "$JOURNAL"
  runner_commit -m "Merge branch '$b'" -m "$T : ${CARD_NAME:-}

Refs: $T"
  g push -q origin main
  info "main @ $(g rev-parse --short HEAD) publié"
  g switch -q "$b"
  { echo "[mozaik] Mergé dans main ($(g rev-parse --short main))."; } > "$TD/logs/comment.md"
  comment "$TD/logs/comment.md"
  move "Done"
  if [ -n "${MOZAIK_DEPLOY_CMD:-}" ]; then
    info "déploiement en recette : $MOZAIK_DEPLOY_CMD"
    MOZAIK_DIR="$WS" MOZAIK_REF="$(g rev-parse main)" bash -c "$MOZAIK_DEPLOY_CMD"
  else info "MOZAIK_DEPLOY_CMD non défini : pas de déploiement en recette"; fi
}

cmd_run() {
  [ -d "$WS/.git" ] || die "pas d'espace de travail pour $T"
  local dir="/tmp/mozaik-$T" project; project="mozaik-$(echo "$T" | tr 'A-Z' 'a-z')"
  [ -d "$dir/.git" ] || git clone -q "$WS" "$dir"
  git -C "$dir" fetch -q origin
  git -C "$dir" checkout -q -B "$(branch)" "origin/$(branch)"
  [ "$RESET" = 0 ] || docker compose -f "$dir/docker-compose.yml" -p "$project" down -v
  # Un conteneur de ce projet encore lancé libère son port en étant recréé ; tout autre occupant bloque
  docker compose -f "$dir/docker-compose.yml" -p "$project" down >/dev/null 2>&1 || true
  # Docker refuse un port publié par un autre conteneur, même si l'hôte le voit libre : les deux sont vérifiés
  local holder; holder="$(docker ps --filter "publish=$PORT" --format '{{.Names}}' 2>/dev/null | tr '\n' ' ' | sed 's/ $//')"
  if [ -n "$holder" ] || ! lib port-free --port "$PORT"; then
    die "le port $PORT est déjà utilisé${holder:+ (conteneur : $holder)} : relance avec --port <n>, ou arrête l'occupant"
  fi
  info "application de la branche $(branch) sur http://localhost:$PORT (arrêt : docker compose -p $project down)"
  (cd "$dir" && MOZAIK_PORT="$PORT" docker compose -p "$project" up --build)
}

cmd_clean() {
  [ -d "$TD" ] || die "rien à supprimer : $TD n'existe pas"
  if [ -d "$WS/.git" ] && [ "$FORCE" = 0 ]; then
    g fetch -q origin
    g merge-base --is-ancestor HEAD origin/main || die "la branche de $T n'est pas mergée dans main (option --force pour supprimer quand même)"
  fi
  local project; project="mozaik-$(echo "$T" | tr 'A-Z' 'a-z')"
  if [ -d "/tmp/mozaik-$T" ]; then
    docker compose -f "/tmp/mozaik-$T/docker-compose.yml" -p "$project" down -v >/dev/null 2>&1 || true
    rm -rf "/tmp/mozaik-$T"
  fi
  rm -rf "$TD"
  info "clone et journaux de $T supprimés ($TD)"
}

cmd_status() {
  [ -d "$WS/.git" ] || die "pas d'espace de travail pour $T"
  echo "Branche : $(branch)"
  echo "Commits depuis main :"; g log --oneline "$(base_sha)..HEAD" | sed 's/^/  /'
  [ ! -f "$TD/logs/phase-result.json" ] || echo "Dernière phase : $(cat "$TD/logs/phase-result.json")"
  [ "$TRELLO" = 0 ] || echo "Carte : $(card_list)"
}

case "$CMD" in
  spec) cmd_spec ;;
  spec-review) cmd_spec_review ;;
  design) cmd_design ;;
  tech-review) cmd_tech_review ;;
  dev) cmd_dev ;;
  review) cmd_review ;;
  merge) cmd_merge ;;
  run) cmd_run ;;
  status) cmd_status ;;
  clean) cmd_clean ;;
  *) usage; exit 1 ;;
esac
