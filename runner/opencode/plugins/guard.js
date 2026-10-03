// Garde-fou OpenCode du run (niveau 2).
// Chargé depuis le dossier de configuration de l'outillage (/runner/opencode),
// hors du dépôt de travail et non modifiable par l'agent.
// Chaque appel d'outil interdit est refusé : l'agent reçoit une erreur qui
// explique la règle et quoi faire à la place. Chaque refus est journalisé dans
// /run-logs/guard.jsonl ; la boucle du run le reporte ensuite dans docs/journal.md.
import { appendFileSync } from "node:fs";
import { execSync, execFileSync } from "node:child_process";
import { isAbsolute, relative } from "node:path";

const LOG = process.env.GUARD_LOG || "/run-logs/guard.jsonl";
const PROTECTED_FILES = /(^|\/)RUN(-SUMMARY)?\.md$/;
const TEST_FILE = /\.(test|spec)\.[cm]?[jt]sx?$/;
const REMOVE_OR_MOVE = /(^|[\s;&|(])(rm|unlink|mv|git\s+rm|git\s+mv)\s/;

function record(entry) {
  try {
    appendFileSync(LOG, JSON.stringify({ ts: new Date().toISOString(), ...entry }) + "\n");
  } catch {
    // le journal du garde-fou ne doit jamais faire échouer l'agent
  }
}

function currentBranch(cwd) {
  try {
    return execSync("git branch --show-current", { cwd, stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return "";
  }
}

// Règles sur les commandes shell : [motif, règle, que faire à la place, seulement sur main ?]
const BASH_RULES = [
  [/\bgit\s+push\b/, "Interdit de pousser (AGENTS.md §6, Git local uniquement).", "Commite localement ; la publication est faite par l'outillage du run.", false],
  [/\bgit\s+remote\s+(add|set-url|rename)\b/, "Interdit d'ajouter ou de modifier un remote (AGENTS.md §6).", "Travaille sans remote.", false],
  [/(--no-verify\b|\bgit\s+commit\b[^;&|]*\s-n\b)/, "Interdit de contourner les hooks Git (process/git.md).", "Corrige le message ou le code pour que le hook l'accepte.", false],
  // Lire core.hooksPath ou l'installer (husky) reste permis ; le vider ou le pointer vers /dev/null est refusé
  [/\bgit\b[^;&|]*core\.hooksPath(\s*=\s*|\s+)(\/dev\/null|''|"")/, "Interdit de désactiver les hooks Git (process/git.md).", "Laisse les hooks en place.", false],
  [/\bgit\b[^;&|]*core\.hooksPath=(\s|$)/, "Interdit de désactiver les hooks Git (process/git.md).", "Laisse les hooks en place.", false],
  [/\brm\b[^;&|]*(^|\s|\/)\.git(\s|\/|$)/, "Interdit de supprimer le dépôt Git.", "Utilise git restore / git revert pour revenir en arrière.", false],
  [/\bgit\s+(reset\s+--hard|rebase|commit\s+--amend|filter-branch|filter-repo|update-ref|replace)\b/, "Interdit de réécrire l'historique de main (process/git.md).", "Sur main, annule avec git revert ; réécris seulement sur ta branche de ticket.", true],
  [/\bgit\s+branch\s+(-D|-f|--force|-M)\s+main\b/, "Interdit de supprimer ou forcer la branche main.", "Laisse main intacte.", false],
];

// Commande shell qui écrit dans RUN.md ou RUN-SUMMARY.md
const WRITES_PROTECTED = /(>>?|\btee\b|\bsed\s+-i|\bperl\s+-i|\brm\b|\bmv\b|\bcp\b|\btruncate\b)[^;&|]*\bRUN(-SUMMARY)?\.md\b|\bRUN(-SUMMARY)?\.md\b[^;&|]*\s(>>?)\s/;

// Fichiers de test présents sur main sous un chemin (fichier ou dossier)
function inheritedTestsUnder(p, cwd) {
  try {
    const rel = isAbsolute(p) ? relative(cwd, p) : p;
    if (!rel || rel.startsWith("..")) return [];
    const out = execFileSync("git", ["ls-tree", "-r", "--name-only", "main", "--", rel], { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString();
    return out.split("\n").filter((f) => TEST_FILE.test(f));
  } catch {
    return [];
  }
}

// Commande shell qui supprime ou déplace un test hérité (présent sur main)
function inheritedTestsRemoved(cmd, cwd) {
  if (!REMOVE_OR_MOVE.test(cmd)) return [];
  const tokens = cmd.split(/[\s;&|()]+/).filter((t) => t && !t.startsWith("-") && !/^(rm|unlink|mv|git|sudo|xargs)$/.test(t));
  return [...new Set(tokens.flatMap((t) => inheritedTestsUnder(t.replace(/^['"]|['"]$/g, ""), cwd)))];
}

function deny(entry) {
  record({ event: "blocked", ...entry });
  throw new Error(`[garde-fou du run] Refusé : ${entry.rule} ${entry.instead}`);
}

export const RunGuard = async ({ directory }) => {
  record({ event: "loaded", directory });
  return {
    "tool.execute.before": async (input, output) => {
      const tool = String(input?.tool || "");
      const args = output?.args || {};

      if (tool === "bash") {
        const cmd = String(args.command || "");
        for (const [re, rule, instead, mainOnly] of BASH_RULES) {
          if (!re.test(cmd)) continue;
          if (mainOnly && currentBranch(directory) !== "main") continue;
          deny({ tool, detail: cmd.slice(0, 300), rule, instead });
        }
        const removedTests = inheritedTestsRemoved(cmd, directory);
        if (removedTests.length) {
          deny({ tool, detail: `${cmd.slice(0, 200)} -> ${removedTests.slice(0, 5).join(", ")}`, rule: "Interdit de supprimer ou déplacer un test des tickets précédents (process/testing.md, tests de non-régression).", instead: "Garde le fichier ; si la spec a changé dans ce ticket, adapte le test et trace-le dans le journal (type test)." });
        }
        if (WRITES_PROTECTED.test(cmd)) {
          deny({ tool, detail: cmd.slice(0, 300), rule: "RUN.md et RUN-SUMMARY.md appartiennent à l'outillage du run (AGENTS.md §6).", instead: "Ne les modifie pas." });
        }
        return;
      }

      // Outils d'édition de fichiers : tout argument qui ressemble à un chemin
      const paths = Object.entries(args)
        .filter(([k, v]) => typeof v === "string" && /path|file/i.test(k))
        .map(([, v]) => v);
      const patchText = typeof args.patchText === "string" ? args.patchText : typeof args.patch === "string" ? args.patch : "";
      const touchesProtected =
        paths.some((p) => PROTECTED_FILES.test(p)) ||
        /^\*\*\* (Update|Add|Delete) File: .*\bRUN(-SUMMARY)?\.md$/m.test(patchText);
      const deletedInPatch = [...patchText.matchAll(/^\*\*\* Delete File: (.+)$/gm)].map((m) => m[1].trim());
      const deletedTests = deletedInPatch.flatMap((f) => inheritedTestsUnder(f, directory));
      if (deletedTests.length) {
        deny({ tool, detail: deletedTests.slice(0, 5).join(", "), rule: "Interdit de supprimer un test des tickets précédents (process/testing.md, tests de non-régression).", instead: "Garde le fichier ; si la spec a changé dans ce ticket, adapte le test et trace-le dans le journal (type test)." });
      }
      if (touchesProtected) {
        deny({ tool, detail: paths.join(", ").slice(0, 300) || "patch", rule: "RUN.md et RUN-SUMMARY.md appartiennent à l'outillage du run (AGENTS.md §6).", instead: "Ne les modifie pas." });
      }
    },
  };
};
