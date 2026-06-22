import * as fs from "fs";
import * as path from "path";
import type { DocFile, RepoFile } from "../core/types";

/**
 * The only module in this project allowed to touch the filesystem.
 * Everything it returns is plain data (RepoFile[] / DocFile[]), so the
 * rest of the pipeline never needs to know whether the source was a local
 * disk, a future web upload, or an in-memory test fixture.
 */

function toPosix(p: string): string {
  return p.split(path.sep).join("/");
}

function isIgnored(relPath: string, ignorePaths: string[]): boolean {
  return ignorePaths.some((ignore) => {
    const normalizedIgnore = ignore.replace(/\/+$/, "");
    return relPath === normalizedIgnore || relPath.startsWith(`${normalizedIgnore}/`);
  });
}

function walk(dir: string, rootDir: string, ignorePaths: string[], out: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = toPosix(path.relative(rootDir, fullPath));
    if (isIgnored(relPath, ignorePaths)) continue;
    if (entry.isDirectory()) {
      walk(fullPath, rootDir, ignorePaths, out);
    } else if (entry.isFile()) {
      out.push(relPath);
    }
  }
}

export function loadRepoFiles(rootDir: string, ignorePaths: string[]): RepoFile[] {
  const relPaths: string[] = [];
  walk(rootDir, rootDir, ignorePaths, relPaths);

  return relPaths.map((relPath) => {
    const shouldReadContent = path.basename(relPath) === "package.json";
    let content: string | undefined;
    if (shouldReadContent) {
      try {
        content = fs.readFileSync(path.join(rootDir, relPath), "utf-8");
      } catch {
        content = undefined;
      }
    }
    return { path: relPath, content };
  });
}

export interface LoadDocsResult {
  docs: DocFile[];
  warnings: string[];
}

function listMarkdownFilesUnder(dirAbsPath: string, rootDir: string): string[] {
  const out: string[] = [];
  walk(dirAbsPath, rootDir, [], out);
  return out.filter((p) => p.toLowerCase().endsWith(".md"));
}

export function loadDocFiles(rootDir: string, docsRoots: string[]): LoadDocsResult {
  const docs: DocFile[] = [];
  const warnings: string[] = [];
  const seen = new Set<string>();

  for (const docsRoot of docsRoots) {
    const absPath = path.join(rootDir, docsRoot);
    let stat: fs.Stats;
    try {
      stat = fs.statSync(absPath);
    } catch {
      warnings.push(`docs root "${docsRoot}" not found, skipped`);
      continue;
    }

    const candidatePaths = stat.isDirectory()
      ? listMarkdownFilesUnder(absPath, rootDir)
      : [toPosix(path.relative(rootDir, absPath))];

    for (const relPath of candidatePaths) {
      if (seen.has(relPath)) continue;
      seen.add(relPath);
      try {
        const content = fs.readFileSync(path.join(rootDir, relPath), "utf-8");
        docs.push({ path: relPath, content });
      } catch {
        warnings.push(`could not read doc file "${relPath}", skipped`);
      }
    }
  }

  if (docs.length === 0) {
    warnings.push("no doc files were found under the configured docs roots");
  }

  return { docs, warnings };
}
