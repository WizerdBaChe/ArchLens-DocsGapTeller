import type { DocRef, DocsGapReport, Issue, RepoIndex, ReportSummary } from "./types";

function buildSummary(issues: Issue[]): ReportSummary {
  const summary: ReportSummary = {
    deadPaths: 0,
    staleCommands: 0,
    uncoveredFolders: 0,
    warnings: 0,
  };
  for (const issue of issues) {
    switch (issue.type) {
      case "dead-path":
        summary.deadPaths += 1;
        break;
      case "stale-command":
      case "missing-script":
        summary.staleCommands += 1;
        break;
      case "uncovered-folder":
      case "uncovered-file-group":
        summary.uncoveredFolders += 1;
        break;
      case "ambiguous-reference":
        summary.warnings += 1;
        break;
    }
  }
  return summary;
}

export function buildReport(
  docRefs: DocRef[],
  repoIndex: RepoIndex,
  issues: Issue[],
  warnings: string[] = []
): DocsGapReport {
  return {
    generatedAt: new Date().toISOString(),
    repoIndex: {
      fileCount: repoIndex.paths.length,
      scriptCount: Object.keys(repoIndex.scripts).length,
      hasPackageJson: repoIndex.hasPackageJson,
    },
    docRefs,
    summary: buildSummary(issues),
    issues,
    warnings,
  };
}
