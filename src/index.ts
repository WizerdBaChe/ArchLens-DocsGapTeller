import type { DocsGapReport, ScanOptions } from "./core/types";
import { DEFAULT_SCAN_OPTIONS } from "./core/types";
import { parseDocFiles } from "./core/docsParser";
import { buildRepoIndex } from "./core/repoIndexer";
import { matchDrift } from "./core/driftMatcher";
import { buildReport } from "./core/reportBuilder";
import { loadDocFiles, loadRepoFiles } from "./io/fsLoader";

export * from "./core/types";
export { parseDocFiles, parseDocFile, classifyInlineSpan } from "./core/docsParser";
export { buildRepoIndex } from "./core/repoIndexer";
export { matchDrift } from "./core/driftMatcher";
export { buildReport } from "./core/reportBuilder";
export { toJson } from "./exporters/jsonExporter";
export { toCsv } from "./exporters/csvExporter";
export { toMarkdown } from "./exporters/markdownExporter";
export { loadDocFiles, loadRepoFiles } from "./io/fsLoader";

/**
 * High-level entry point: scan a repo directory on disk and produce a
 * complete DocsGapReport. This is the function the CLI calls; a future
 * web backend or VS Code extension can call the same lower-level pieces
 * (loadRepoFiles / parseDocFiles / matchDrift / buildReport) directly if
 * it needs a different orchestration (e.g. streaming, incremental scans).
 */
export function scanRepo(rootDir: string, options: ScanOptions = {}): DocsGapReport {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options };

  const repoFiles = loadRepoFiles(rootDir, opts.ignorePaths);
  const repoIndex = buildRepoIndex(repoFiles);

  const { docs, warnings: docWarnings } = loadDocFiles(rootDir, opts.docsRoots);
  const docRefs = parseDocFiles(docs);

  const warnings = [...docWarnings];
  if (!repoIndex.hasPackageJson && opts.checkScripts) {
    warnings.push("package.json not found at repo root — command/script checks were skipped where applicable");
  }

  const issues = matchDrift(docRefs, repoIndex, opts);
  return buildReport(docRefs, repoIndex, issues, warnings);
}
