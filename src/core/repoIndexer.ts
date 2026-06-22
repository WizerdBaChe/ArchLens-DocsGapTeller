import type { RepoFile, RepoIndex } from "./types";

/**
 * Pure function: RepoFile[] in, RepoIndex out. No filesystem access —
 * actual directory walking lives in src/io/fsLoader.ts. This split means
 * the indexing logic can be unit-tested with in-memory fixtures and reused
 * by any future loader (web upload, git API, etc.) without modification.
 */

function normalizePath(p: string): string {
  return p.replace(/^\.\//, "").replace(/^\/+/, "").replace(/\\/g, "/");
}

/** Derive every ancestor directory (with trailing slash) for a file path. */
function ancestorFolders(filePath: string): string[] {
  const segments = filePath.split("/").slice(0, -1);
  const folders: string[] = [];
  let acc = "";
  for (const seg of segments) {
    acc = acc ? `${acc}/${seg}` : seg;
    folders.push(`${acc}/`);
  }
  return folders;
}

function parsePackageJsonScripts(content: string): Record<string, string> {
  try {
    const parsed = JSON.parse(content);
    if (parsed && typeof parsed.scripts === "object" && parsed.scripts !== null) {
      return parsed.scripts as Record<string, string>;
    }
    return {};
  } catch {
    return {};
  }
}

export function buildRepoIndex(files: RepoFile[]): RepoIndex {
  const paths: string[] = [];
  const folderSet = new Set<string>();
  let scripts: Record<string, string> = {};
  let hasPackageJson = false;

  for (const file of files) {
    const normalized = normalizePath(file.path);
    paths.push(normalized);
    for (const folder of ancestorFolders(normalized)) {
      folderSet.add(folder);
    }
    if (normalized === "package.json" && file.content) {
      hasPackageJson = true;
      scripts = parsePackageJsonScripts(file.content);
    }
  }

  return {
    paths,
    folders: Array.from(folderSet),
    scripts,
    hasPackageJson,
  };
}
