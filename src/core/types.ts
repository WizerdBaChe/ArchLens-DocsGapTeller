/**
 * Shared data contracts for ArchLens DocsGap.
 *
 * Design rule: every module (parser / indexer / matcher / exporters / cli)
 * depends ONLY on these types, never on each other's internals.
 * This is what keeps the pipeline low-coupling and swappable
 * (e.g. swapping the markdown parser later won't touch the matcher).
 */

// ---------------------------------------------------------------------------
// Inputs
// ---------------------------------------------------------------------------

export interface DocFile {
  /** Path relative to repo root, e.g. "README.md" or "docs/setup.md" */
  path: string;
  content: string;
}

export interface RepoFile {
  /** Path relative to repo root, e.g. "src/app.ts" */
  path: string;
  content?: string;
}

export interface ScanOptions {
  /** Which doc roots to scan. Defaults to ["README.md", "docs/"] */
  docsRoots?: string[];
  /** Path prefixes to ignore when indexing the repo and when computing uncovered folders */
  ignorePaths?: string[];
  /** Whether to validate `npm run <script>` / `yarn <script>` / `pnpm run <script>` against package.json scripts */
  checkScripts?: boolean;
  /** Minimum number of files a top-level folder must contain before it's eligible to be flagged "uncovered" */
  uncoveredFolderMinFiles?: number;
}

export const DEFAULT_SCAN_OPTIONS: Required<ScanOptions> = {
  docsRoots: ["README.md", "docs/"],
  ignorePaths: ["node_modules/", "dist/", "build/", ".git/", "coverage/"],
  checkScripts: true,
  uncoveredFolderMinFiles: 1,
};

// ---------------------------------------------------------------------------
// Intermediate model (post-extraction, pre-matching)
// ---------------------------------------------------------------------------

export interface RepoIndex {
  /** All file paths in the repo (normalized, no leading "./") */
  paths: string[];
  /** All top-level + second-level directory paths derived from `paths`, trailing slash included */
  folders: string[];
  /** package.json "scripts" map, if package.json exists */
  scripts: Record<string, string>;
  /** Whether package.json was found at all (distinguishes "missing" from "no scripts") */
  hasPackageJson: boolean;
}

export type DocRefType = "path" | "command" | "link" | "heading";

export interface DocRef {
  docPath: string;
  type: DocRefType;
  value: string;
  line: number;
  /** Raw context line, used by the viewer to show "why" without re-reading the file */
  context: string;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

export type IssueType =
  | "dead-path"
  | "stale-command"
  | "missing-script"
  | "uncovered-folder"
  | "uncovered-file-group"
  | "ambiguous-reference";

export interface Issue {
  type: IssueType;
  docPath?: string;
  line?: number;
  reference: string;
  reason: string;
  /** Raw doc line, when the issue originates from a doc reference */
  sourceContext?: string;
}

export interface ReportSummary {
  deadPaths: number;
  staleCommands: number;
  uncoveredFolders: number;
  warnings: number;
}

export interface DocsGapReport {
  generatedAt: string;
  repoIndex: {
    fileCount: number;
    scriptCount: number;
    hasPackageJson: boolean;
  };
  docRefs: DocRef[];
  summary: ReportSummary;
  issues: Issue[];
  /**
   * System-level notices (e.g. "docs root not found") — distinct from
   * `summary.warnings`, which only counts ambiguous-reference issues found
   * *inside* doc content. Required so missing inputs are surfaced instead
   * of silently skipped (RPD acceptance criterion).
   */
  warnings: string[];
}
