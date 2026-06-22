/**
 * Browser-safe public API.
 *
 * This file exists as a deliberate boundary: everything it exports is a
 * pure function with zero Node dependencies, so it's safe to bundle into
 * a static site with Vite/esbuild and run entirely client-side.
 *
 * It must NEVER import from `./io/fsLoader` (which uses Node's `fs`/`path`)
 * or from `./index` (the CLI-oriented entry point that does). The Node CLI
 * and the browser app are two separate front doors onto the same `core/`
 * logic — see README "Architecture".
 */

export * from "./core/types";
export { parseDocFiles, parseDocFile, classifyInlineSpan } from "./core/docsParser";
export { buildRepoIndex } from "./core/repoIndexer";
export { matchDrift } from "./core/driftMatcher";
export { buildReport } from "./core/reportBuilder";
export { toJson } from "./exporters/jsonExporter";
export { toCsv } from "./exporters/csvExporter";
export { toMarkdown } from "./exporters/markdownExporter";

import type { DocFile, RepoFile, ScanOptions } from "./core/types";
import { DEFAULT_SCAN_OPTIONS } from "./core/types";
import { parseDocFiles } from "./core/docsParser";
import { buildRepoIndex } from "./core/repoIndexer";
import { matchDrift } from "./core/driftMatcher";
import { buildReport } from "./core/reportBuilder";

export interface AnalyzeInput {
  /** Every file in the project, path + raw text content. */
  files: Array<{ path: string; content: string }>;
}

/** Shared with web/src/browserLoader.ts so "what counts as ignored" has one definition. */
export function isIgnoredPath(path: string, ignorePaths: string[]): boolean {
  return ignorePaths.some((ignore) => {
    const normalized = ignore.replace(/\/+$/, "");
    return path === normalized || path.startsWith(`${normalized}/`);
  });
}

/** Shared with web/src/browserLoader.ts so it knows which files are worth reading as text. */
export function isDocPath(path: string, docsRoots: string[]): boolean {
  if (!path.toLowerCase().endsWith(".md")) return false;
  return docsRoots.some((root) => (root.endsWith("/") ? path.startsWith(root) : path === root));
}

/**
 * The browser equivalent of `scanRepo()` in index.ts — same pipeline, but
 * takes already-loaded in-memory files instead of reading from disk. The
 * caller (web/src/browserLoader.ts) is responsible for turning a zip or a
 * picked folder into this shape.
 */
export function analyzeProject(input: AnalyzeInput, options: ScanOptions = {}) {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options };

  const relevantFiles = input.files.filter((f) => !isIgnoredPath(f.path, opts.ignorePaths));

  const repoFiles: RepoFile[] = relevantFiles.map((f) => ({
    path: f.path,
    content: f.path.split("/").pop() === "package.json" ? f.content : undefined,
  }));
  const repoIndex = buildRepoIndex(repoFiles);

  const docFiles: DocFile[] = relevantFiles.filter((f) => isDocPath(f.path, opts.docsRoots));

  const warnings: string[] = [];
  if (docFiles.length === 0) {
    warnings.push("no doc files were found under the configured docs roots");
  }
  if (!repoIndex.hasPackageJson && opts.checkScripts) {
    warnings.push("package.json not found at repo root — command/script checks were skipped where applicable");
  }

  const docRefs = parseDocFiles(docFiles);
  const issues = matchDrift(docRefs, repoIndex, opts);
  return buildReport(docRefs, repoIndex, issues, warnings);
}
