import type { DocsGapReport } from "../core/types";

const HEADERS = ["type", "docPath", "line", "reference", "reason"];

function csvEscape(value: string | number | undefined): string {
  const str = value === undefined ? "" : String(value);
  if (/[",\n]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function toCsv(report: DocsGapReport): string {
  const rows = [HEADERS.join(",")];
  for (const issue of report.issues) {
    rows.push(
      [issue.type, issue.docPath, issue.line, issue.reference, issue.reason]
        .map(csvEscape)
        .join(",")
    );
  }
  return rows.join("\n");
}
