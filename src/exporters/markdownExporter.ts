import type { DocsGapReport, Issue, IssueType } from "../core/types";

const TYPE_LABEL: Record<IssueType, string> = {
  "dead-path": "Dead Path",
  "stale-command": "Stale Command",
  "missing-script": "Missing Script",
  "uncovered-folder": "Uncovered Folder",
  "uncovered-file-group": "Uncovered File Group",
  "ambiguous-reference": "Ambiguous Reference",
};

function renderGroup(type: IssueType, issues: Issue[]): string {
  if (issues.length === 0) return "";
  const lines = [`### ${TYPE_LABEL[type]} (${issues.length})`, ""];
  for (const issue of issues) {
    const location = issue.docPath ? `${issue.docPath}${issue.line ? `:${issue.line}` : ""}` : "(repo)";
    lines.push(`- **${issue.reference}** — ${issue.reason} \`[${location}]\``);
  }
  lines.push("");
  return lines.join("\n");
}

export function toMarkdown(report: DocsGapReport): string {
  const { summary, issues, repoIndex, generatedAt } = report;

  const byType = (type: IssueType) => issues.filter((i) => i.type === type);

  const sections = [
    "# ArchLens DocsGap Report",
    "",
    `Generated: ${generatedAt}`,
    "",
    "## Summary",
    "",
    `| Dead Paths | Stale Commands | Uncovered Folders | Warnings |`,
    `|---|---|---|---|`,
    `| ${summary.deadPaths} | ${summary.staleCommands} | ${summary.uncoveredFolders} | ${summary.warnings} |`,
    "",
    `Scanned ${repoIndex.fileCount} repo files, ${repoIndex.scriptCount} package.json scripts` +
      (repoIndex.hasPackageJson ? "" : " (no package.json found)") +
      ".",
    "",
    "## Issues",
    "",
    renderGroup("dead-path", byType("dead-path")),
    renderGroup("stale-command", byType("stale-command")),
    renderGroup("missing-script", byType("missing-script")),
    renderGroup("uncovered-folder", byType("uncovered-folder")),
    renderGroup("uncovered-file-group", byType("uncovered-file-group")),
    renderGroup("ambiguous-reference", byType("ambiguous-reference")),
  ];

  if (issues.length === 0) {
    sections.push("No drift detected. Docs and repo structure are in sync. 🎉");
  }

  return sections.filter((s) => s !== "").join("\n");
}
