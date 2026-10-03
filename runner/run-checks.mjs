// Contrôles après chaque session (niveau 3) et écriture des événements dans docs/journal.md.
//
//   node run-checks.mjs check --before <sha> --session <n> --ticket <id> --exit <code> --guard-offset <k>
//       -> écrit sur stdout un tableau JSON d'événements {type, ticket, summary, link, review}
//   node run-checks.mjs journal < events.json
//       -> insère les événements en tête du tableau « Entrées » de docs/journal.md
//
// Aucun contrôle ne bloque : les écarts sont constatés et tracés.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const GUARD_LOG = process.env.GUARD_LOG || "/run-logs/guard.jsonl";
const RUNNER_EMAIL = "runner@localhost";
const STATUSES = new Set(["todo", "in-progress", "blocked", "done"]);
const SUBJECT_RE =
  /^(feat|fix|test|refactor|chore|docs|perf|build|revert)(\([a-z0-9-]+\))?: (F\d{2}-S\d+|T-\d{3}|B-\d{3}|RUN)#\d+ \S/;
const TEST_FILE_RE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const TITLE_RE = /\b(?:it|test)(?:\.(?:only|skip|fixme|concurrent|fails))?\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
const ASSERT_RE = /\bexpect(?:\.soft|\.poll)?\s*\(|\bassert(?:\.\w+)?\s*\(/g;
const SPEC_PATHS = ["docs/features", "docs/design/ecrans.md"];
const REPLAY = process.env.TNR_REPLAY !== "0";
const REPLAY_TIMEOUT_MS = Number(process.env.REPLAY_TIMEOUT_MS || 20 * 60 * 1000);
const DISABLED_TEST_RE = /\b(it|test|describe)\.(skip|only|fixme)\s*\(|\bx(it|describe)\s*\(|\btest\.fixme\s*\(/;

function git(...args) {
  try {
    return execFileSync("git", args, { stdio: ["ignore", "pipe", "ignore"] }).toString();
  } catch {
    return null;
  }
}
const ok = (...args) => git(...args) !== null;
const arg = (name, def = "") => {
  const i = process.argv.indexOf(`--${name}`);
  return i > 0 ? process.argv[i + 1] : def;
};

function check() {
  const before = arg("before");
  const session = arg("session", "?");
  const ticket = arg("ticket", "RUN") || "RUN";
  const exit = Number(arg("exit", "0"));
  const guardOffset = Number(arg("guard-offset", "0"));
  const link = `session ${String(session).padStart(3, "0")} (logs du run)`;
  const ev = [];
  const add = (type, summary, review = "oui", t = ticket) => ev.push({ type, ticket: t, summary, link, review });

  // Garde-fou : chargement et refus de la session
  const guardLines = existsSync(GUARD_LOG) ? readFileSync(GUARD_LOG, "utf8").split("\n").filter(Boolean).slice(guardOffset) : [];
  const guard = guardLines.map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  if (!guard.some((g) => g.event === "loaded")) add("run", "Le garde-fou OpenCode ne s'est pas chargé pendant cette session : les interdits n'ont pas été appliqués.");
  for (const g of guard.filter((g) => g.event === "blocked")) add("garde-fou", `Bloqué (${g.tool}) : ${g.detail}. Règle : ${g.rule}`);

  // Fin de session anormale
  if (exit === 124) add("run", "Session interrompue : délai maximal atteint (SESSION_TIMEOUT).", "non");
  else if (exit !== 0) add("run", `Session terminée en erreur (code ${exit}).`, "non");

  const mainNow = git("rev-parse", "main")?.trim();
  if (!before || !mainNow || before === mainNow) return ev;

  // Historique de main : pas de réécriture, pas de fusion
  if (!ok("merge-base", "--is-ancestor", before, "main")) {
    add("contrôle", `L'historique de main a été réécrit (le commit ${before.slice(0, 7)} n'en fait plus partie).`);
    return ev;
  }
  const merges = (git("rev-list", "--merges", `${before}..main`) || "").trim();
  if (merges) add("contrôle", `Commit(s) de fusion sur main (${merges.split("\n").length}) : l'intégration doit se faire en fast-forward.`);

  // Format des commits ajoutés sur main par l'agent
  const log = git("log", "--format=%H%x1f%ae%x1f%s%x1f%b%x1e", `${before}..main`) || "";
  const bad = [];
  for (const rec of log.split("\x1e").map((r) => r.trim()).filter(Boolean)) {
    const [sha, email, subject, body = ""] = rec.split("\x1f");
    if (email === RUNNER_EMAIL) continue;
    const problems = [];
    if (!SUBJECT_RE.test(subject)) problems.push("sujet hors format");
    if (!/^Refs: /m.test(body)) problems.push("trailer Refs absent");
    if (!/^Plan-Step: /m.test(body)) problems.push("trailer Plan-Step absent");
    const isPlanOrRevert = /#0 /.test(subject) || subject.startsWith("revert");
    if (!isPlanOrRevert && !/^Tests: /m.test(body)) problems.push("trailer Tests absent");
    if (problems.length) bad.push(`${sha.slice(0, 7)} « ${subject.slice(0, 60)} » (${problems.join(", ")})`);
  }
  if (bad.length) add("contrôle", `Commit(s) non conforme(s) à process/git.md : ${bad.slice(0, 5).join(" ; ")}${bad.length > 5 ? ` ; et ${bad.length - 5} autre(s)` : ""}.`);

  // Backlog : tableau des tickets lisible et statuts valides (si modifié pendant la session)
  const backlogChanged = !ok("diff", "--quiet", before, "main", "--", "docs/backlog.md");
  const backlog = backlogChanged ? git("show", "main:docs/backlog.md") || "" : "| 0 | - | - | - | - | todo | |";
  const rows = backlog.split("\n").filter((l) => /^\|\s*\d+\s*\|/.test(l));
  const invalid = rows.filter((l) => !STATUSES.has((l.split("|")[6] || "").trim()));
  if (!rows.length) add("contrôle", "Le tableau des tickets de docs/backlog.md est introuvable ou illisible.");
  else if (invalid.length) add("contrôle", `Statut invalide dans docs/backlog.md : ${invalid.slice(0, 3).map((l) => l.split("|")[2]?.trim()).join(", ")}.`);

  // Journal : la colonne « À revoir » n'est modifiée que par l'humain
  const reviewMap = (txt) => {
    const m = new Map();
    for (const l of (txt || "").split("\n")) {
      const cells = l.split("|");
      if (cells.length < 8 || !/^\d{4}-\d{2}-\d{2}$/.test(cells[1].trim())) continue;
      m.set(cells.slice(1, 6).join("|").trim(), cells[6].trim());
    }
    return m;
  };
  const jBefore = reviewMap(git("show", `${before}:docs/journal.md`));
  const jAfter = reviewMap(git("show", "main:docs/journal.md"));
  const changed = [...jBefore].filter(([k, v]) => jAfter.has(k) && jAfter.get(k) !== v).length;
  const removed = [...jBefore.keys()].filter((k) => !jAfter.has(k)).length;
  const newRevu = [...jAfter].filter(([k, v]) => !jBefore.has(k) && v === "revu").length;
  if (changed || removed || newRevu) add("contrôle", `docs/journal.md : ${changed} valeur(s) « À revoir » modifiée(s), ${removed} entrée(s) supprimée(s), ${newRevu} entrée(s) créée(s) avec « revu ». Seul l'humain modifie cette colonne.`);

  // Fichiers de l'outillage
  if (!ok("diff", "--quiet", before, "main", "--", "RUN.md")) add("contrôle", "RUN.md a été modifié par l'agent.");
  const summaryAuthors = (git("log", "--format=%ae", `${before}..main`, "--", "RUN-SUMMARY.md") || "").split("\n").filter(Boolean);
  if (summaryAuthors.some((a) => a !== RUNNER_EMAIL)) add("contrôle", "RUN-SUMMARY.md a été créé ou modifié par l'agent.");

  // Tests désactivés ajoutés
  const diff = git("diff", "-U0", `${before}..main`, "--", "*.test.*", "*.spec.*", "*.int.test.*") || "";
  const disabled = diff.split("\n").filter((l) => l.startsWith("+") && !l.startsWith("+++") && DISABLED_TEST_RE.test(l));
  if (disabled.length) add("contrôle", `${disabled.length} test(s) désactivé(s) ou isolé(s) ajouté(s) (skip, only, fixme) : vérifier qu'un ticket de dette existe.`);

  // Tests de non-régression : tests présents sur main avant la session
  for (const e of inheritedTestChecks(before, ticket)) add(e.type, e.summary, e.review);

  return ev;
}

const titlesOf = (src) => [...(src || "").matchAll(TITLE_RE)].map((m) => m[2]);
const assertionsOf = (src) => ((src || "").match(ASSERT_RE) || []).length;

// Inventaire, légitimité et rejeu des tests hérités modifiés pendant la session
function inheritedTestChecks(before, ticket) {
  const out = [];
  const inherited = (git("ls-tree", "-r", "--name-only", before) || "").split("\n").filter((f) => TEST_FILE_RE.test(f));
  const changed = new Set((git("diff", "--name-only", before, "main") || "").split("\n").filter(Boolean));
  const touched = inherited.filter((f) => changed.has(f));
  if (!touched.length) return out;

  // Légitimité : la spec a changé dans la session (ou ticket bug), et le journal contient une entrée « test » qui cite le fichier
  const specChanged = ticket.startsWith("B-") || !ok("diff", "--quiet", before, "main", "--", ...SPEC_PATHS);
  const journalDiff = git("diff", "-U0", before, "main", "--", "docs/journal.md") || "";
  const testRows = journalDiff.split("\n").filter((l) => l.startsWith("+|") && /\|\s*test\s*\|/.test(l));
  const cited = (f) => testRows.some((r) => r.includes(f) || r.includes(f.split("/").pop()));

  const suspicious = [];
  for (const f of touched) {
    const oldSrc = git("show", `${before}:${f}`);
    const newSrc = git("show", `main:${f}`);
    const problems = [];
    if (newSrc === null) problems.push("fichier supprimé");
    else {
      const lost = titlesOf(oldSrc).filter((t) => !titlesOf(newSrc).includes(t));
      if (lost.length) problems.push(`${lost.length} test(s) disparu(s) : ${lost.slice(0, 3).map((t) => `« ${t.slice(0, 50)} »`).join(", ")}`);
      const a0 = assertionsOf(oldSrc), a1 = assertionsOf(newSrc);
      if (a1 < a0) problems.push(`assertions ${a0} -> ${a1}`);
    }
    const legit = specChanged && cited(f);
    const why = legit ? "justifiée (spec modifiée et entrée test au journal)"
      : `non justifiée (${[!specChanged && "aucune spec modifiée dans la session", !cited(f) && "aucune entrée test au journal qui cite ce fichier"].filter(Boolean).join(", ")})`;
    if (!legit) suspicious.push(f);
    out.push({
      type: "contrôle",
      review: legit && !problems.length ? "non" : "oui",
      summary: `Test hérité modifié : ${f}, modification ${why}${problems.length ? ` ; ${problems.join(" ; ")}` : ""}.`,
    });
  }

  // Rejeu : les versions d'avant la session des tests hérités modifiés, exécutées sur le nouveau code
  if (REPLAY) {
    for (const r of replay(before, touched.filter((f) => git("show", `main:${f}`) !== null))) {
      if (r.status === "error") {
        out.push({ type: "run", review: "non", summary: `Rejeu des tests hérités impossible : ${r.detail}.` });
      } else if (r.status === "fail") {
        const legit = !suspicious.includes(r.file);
        out.push({
          type: "contrôle",
          review: "oui",
          summary: legit
            ? `Rejeu : l'ancienne version de ${r.file} échoue sur le nouveau code ; changement de comportement couvert par une spec modifiée dans la session.`
            : `Rejeu : l'ancienne version de ${r.file} échoue sur le nouveau code alors qu'aucune spec n'a changé. Régression probablement masquée en modifiant le test.`,
        });
      }
    }
  }
  return out;
}

// Exécute les anciennes versions des fichiers de test dans un worktree temporaire de main
function replay(before, files) {
  if (!files.length) return [];
  const dir = mkdtempSync(join(tmpdir(), "tnr-replay-"));
  const run = (cmd, args, timeout = REPLAY_TIMEOUT_MS) =>
    spawnSync(cmd, args, { cwd: dir, timeout, stdio: "ignore", env: { ...process.env, CI: "true" } });
  try {
    if (!ok("worktree", "add", "--detach", dir, "main")) return [{ status: "error", detail: "création du worktree" }];
    for (const f of files) writeFileSync(join(dir, f), git("show", `${before}:${f}`));
    const install = run("pnpm", ["install", "--frozen-lockfile", "--prefer-offline"]);
    if (install.status !== 0) return [{ status: "error", detail: "pnpm install dans le worktree" }];
    return files.map((f) => {
      const e2e = f.startsWith("e2e") || /\.spec\.[cm]?[jt]sx?$/.test(f);
      const res = e2e
        ? run("pnpm", ["exec", "playwright", "test", f])
        : run("pnpm", ["exec", "vitest", "run", f]);
      if (res.error) return { file: f, status: "error", detail: `${f} : ${res.error.code || res.error.message}` };
      return { file: f, status: res.status === 0 ? "pass" : "fail" };
    });
  } finally {
    git("worktree", "remove", "--force", dir);
    rmSync(dir, { recursive: true, force: true });
  }
}

function journal() {
  const events = JSON.parse(readFileSync(0, "utf8") || "[]");
  if (!events.length) return;
  const file = "docs/journal.md";
  const lines = readFileSync(file, "utf8").split("\n");
  const h = lines.findIndex((l) => /^\|\s*Date\s*\|\s*Ticket\s*\|/.test(l));
  if (h < 0) throw new Error("tableau « Entrées » introuvable dans docs/journal.md");
  let at = h + 2;
  if (/^\|(\s*\|){6}\s*$/.test(lines[at] || "")) lines.splice(at, 1); // ligne vide du gabarit
  const date = new Date().toISOString().slice(0, 10);
  const clean = (s) => String(s).replace(/\|/g, "/").replace(/\s+/g, " ").trim();
  const rows = events.map((e) => `| ${date} | ${clean(e.ticket)} | ${clean(e.type)} | ${clean(e.summary)} | ${clean(e.link)} | ${clean(e.review)} |`);
  lines.splice(at, 0, ...rows.reverse());
  writeFileSync(file, lines.join("\n"));
}

const cmd = process.argv[2];
if (cmd === "check") process.stdout.write(JSON.stringify(check()));
else if (cmd === "journal") journal();
else { console.error("usage: run-checks.mjs check|journal"); process.exit(2); }
