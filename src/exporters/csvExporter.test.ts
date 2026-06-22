import { test } from "node:test";
import assert from "node:assert/strict";
import { toCsv } from "./csvExporter";
import type { DocsGapReport } from "../core/types";

function makeReport(issues: DocsGapReport["issues"]): DocsGapReport {
  return {
    generatedAt: "2026-01-01T00:00:00.000Z",
    repoIndex: { fileCount: 1, scriptCount: 0, hasPackageJson: false },
    docRefs: [],
    summary: { deadPaths: 0, staleCommands: 0, uncoveredFolders: 0, warnings: 0 },
    issues,
    warnings: [],
  };
}

test("toCsv: escapes commas and quotes in reasons", () => {
  const csv = toCsv(
    makeReport([
      {
        type: "dead-path",
        docPath: "README.md",
        line: 1,
        reference: "a,b",
        reason: 'contains a "quote", and a comma',
      },
    ])
  );
  const lines = csv.split("\n");
  assert.equal(lines[0], "type,docPath,line,reference,reason");
  assert.equal(lines[1], 'dead-path,README.md,1,"a,b","contains a ""quote"", and a comma"');
});
