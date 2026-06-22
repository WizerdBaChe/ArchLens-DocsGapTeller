import type { DocRef, Issue, RepoIndex, ScanOptions } from "./types";
import { DEFAULT_SCAN_OPTIONS } from "./types";

/**
 * Pure function: (DocRef[], RepoIndex, ScanOptions) -> Issue[].
 * This is the only module that knows what counts as "drift". Parser and
 * indexer stay dumb on purpose so the matching rules can evolve (or be
 * swapped per-project) without touching extraction logic.
 */

function normalize(p: string): string {
  return p.replace(/^\.\//, "").replace(/^\/+/, "");
}

function isIgnored(p: string, ignorePaths: string[]): boolean {
  return ignorePaths.some((ignore) => p === ignore || p.startsWith(ignore));
}

interface PathResolution {
  status: "exact" | "folder" | "ambiguous" | "dead";
  resolvedPaths: string[];
}

/** Resolve a doc-mentioned path/link against the real repo index. */
function resolvePath(value: string, repoIndex: RepoIndex): PathResolution {
  const v = normalize(value);

  if (repoIndex.paths.includes(v)) {
    return { status: "exact", resolvedPaths: [v] };
  }
  if (repoIndex.folders.includes(v) || repoIndex.folders.includes(`${v}/`)) {
    return { status: "folder", resolvedPaths: [v.endsWith("/") ? v : `${v}/`] };
  }

  const suffix = `/${v}`;
  const suffixMatches = repoIndex.paths.filter((p) => p.endsWith(suffix));
  if (suffixMatches.length === 1) {
    return { status: "ambiguous", resolvedPaths: suffixMatches };
  }
  if (suffixMatches.length > 1) {
    return { status: "ambiguous", resolvedPaths: suffixMatches };
  }

  return { status: "dead", resolvedPaths: [] };
}

function issueForPathRef(ref: DocRef, resolution: PathResolution): Issue | null {
  switch (resolution.status) {
    case "exact":
    case "folder":
      return null;
    case "ambiguous":
      return {
        type: "ambiguous-reference",
        docPath: ref.docPath,
        line: ref.line,
        reference: ref.value,
        reason:
          resolution.resolvedPaths.length === 1
            ? `referenced as "${ref.value}" but only found at "${resolution.resolvedPaths[0]}" — consider using the full path`
            : `"${ref.value}" matches multiple files: ${resolution.resolvedPaths.join(", ")}`,
        sourceContext: ref.context,
      };
    case "dead":
      return {
        type: "dead-path",
        docPath: ref.docPath,
        line: ref.line,
        reference: ref.value,
        reason: "path not found in repo",
        sourceContext: ref.context,
      };
  }
}

const SCRIPT_RUNNER_PATTERN = /^(npm|pnpm)\s+run\s+([\w:.-]+)/;
const YARN_RUNNER_PATTERN = /^yarn\s+(?:run\s+)?([\w:.-]+)/;
const FILE_TARGET_VERBS = new Set(["node", "python", "python3"]);

function issueForCommandRef(ref: DocRef, repoIndex: RepoIndex): Issue | null {
  const value = ref.value;

  const npmMatch = value.match(SCRIPT_RUNNER_PATTERN);
  const yarnMatch = value.match(YARN_RUNNER_PATTERN);
  const scriptName = npmMatch?.[2] ?? yarnMatch?.[1];

  if (scriptName) {
    if (!repoIndex.hasPackageJson) {
      return {
        type: "missing-script",
        docPath: ref.docPath,
        line: ref.line,
        reference: value,
        reason: "package.json not found in repo, cannot verify this script",
        sourceContext: ref.context,
      };
    }
    if (!(scriptName in repoIndex.scripts)) {
      return {
        type: "stale-command",
        docPath: ref.docPath,
        line: ref.line,
        reference: value,
        reason: `script "${scriptName}" not found in package.json scripts`,
        sourceContext: ref.context,
      };
    }
    return null;
  }

  // node/python <file>: verify the target file exists.
  const tokens = value.split(/\s+/);
  if (FILE_TARGET_VERBS.has(tokens[0]) && tokens[1]) {
    const resolution = resolvePath(tokens[1], repoIndex);
    if (resolution.status === "dead") {
      return {
        type: "stale-command",
        docPath: ref.docPath,
        line: ref.line,
        reference: value,
        reason: `target file "${tokens[1]}" not found in repo`,
        sourceContext: ref.context,
      };
    }
  }

  // Any other shell command (git, docker, make, ...) is not independently
  // verifiable without execution, which this tool deliberately avoids.
  return null;
}

// ---------------------------------------------------------------------------
// Uncovered folders
// ---------------------------------------------------------------------------

function folderDepth(folder: string): number {
  return folder.split("/").filter(Boolean).length;
}

function parentFolder(folder: string): string | null {
  const segments = folder.split("/").filter(Boolean);
  segments.pop();
  return segments.length ? `${segments.join("/")}/` : null;
}

function isDescendantOfAny(folder: string, ancestors: Set<string>): boolean {
  let current: string | null = parentFolder(folder);
  while (current) {
    if (ancestors.has(current)) return true;
    current = parentFolder(current);
  }
  return false;
}

function findUncoveredFolders(
  docRefs: DocRef[],
  repoIndex: RepoIndex,
  ignorePaths: string[],
  minFiles: number
): Issue[] {
  const fileCountByFolder = new Map<string, number>();
  for (const p of repoIndex.paths) {
    if (isIgnored(p, ignorePaths)) continue;
    const segments = p.split("/").filter(Boolean);
    let acc = "";
    for (let i = 0; i < segments.length - 1; i++) {
      acc = acc ? `${acc}/${segments[i]}` : segments[i];
      const folder = `${acc}/`;
      fileCountByFolder.set(folder, (fileCountByFolder.get(folder) ?? 0) + 1);
    }
  }

  const touched = new Set<string>();
  for (const ref of docRefs) {
    if (ref.type !== "path" && ref.type !== "link") continue;
    const resolution = resolvePath(ref.value, repoIndex);
    for (const resolvedPath of resolution.resolvedPaths) {
      touched.add(resolvedPath);
      const segments = resolvedPath.split("/").filter(Boolean);
      let acc = "";
      for (const seg of segments) {
        acc = acc ? `${acc}/${seg}` : seg;
        touched.add(`${acc}/`);
      }
    }
  }

  const candidateFolders = Array.from(fileCountByFolder.keys())
    .filter((f) => !isIgnored(f, ignorePaths))
    .filter((f) => (fileCountByFolder.get(f) ?? 0) >= minFiles)
    .filter((f) => !touched.has(f))
    .sort((a, b) => folderDepth(a) - folderDepth(b));

  const flagged: Issue[] = [];
  const flaggedSet = new Set<string>();
  for (const folder of candidateFolders) {
    if (isDescendantOfAny(folder, flaggedSet)) continue;
    flaggedSet.add(folder);
    flagged.push({
      type: "uncovered-folder",
      reference: folder,
      reason: "folder exists but is not mentioned anywhere in the scanned docs",
    });
  }
  return flagged;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function matchDrift(
  docRefs: DocRef[],
  repoIndex: RepoIndex,
  options: ScanOptions = {}
): Issue[] {
  const opts = { ...DEFAULT_SCAN_OPTIONS, ...options };
  const issues: Issue[] = [];

  for (const ref of docRefs) {
    if (ref.type === "path" || ref.type === "link") {
      const resolution = resolvePath(ref.value, repoIndex);
      const issue = issueForPathRef(ref, resolution);
      if (issue) issues.push(issue);
    } else if (ref.type === "command" && opts.checkScripts) {
      const issue = issueForCommandRef(ref, repoIndex);
      if (issue) issues.push(issue);
    }
  }

  issues.push(
    ...findUncoveredFolders(docRefs, repoIndex, opts.ignorePaths, opts.uncoveredFolderMinFiles)
  );

  return issues;
}
