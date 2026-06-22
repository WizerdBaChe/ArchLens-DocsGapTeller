import { unzip } from "fflate";
import { isDocPath, isIgnoredPath, type ScanOptions } from "../../src/browser";

/**
 * Turns a zip file or a browser folder selection into the flat
 * `{path, content}[]` shape that `analyzeProject()` expects. This is the
 * browser equivalent of `src/io/fsLoader.ts` — same role, different
 * source (File API instead of Node's `fs`).
 *
 * Errors are thrown as `LoaderError` with a machine-readable `code` rather
 * than a hardcoded English string, so this module stays language-agnostic
 * — `web/src/main.ts` maps the code to the active locale's message.
 */

export type LoaderErrorCode = "TOO_MANY_FILES_ZIP" | "TOO_MANY_FILES_FOLDER" | "NO_FILES_IN_FOLDER";

export class LoaderError extends Error {
  constructor(public code: LoaderErrorCode, public detail: Record<string, number> = {}) {
    super(code);
    this.name = "LoaderError";
  }
}

export interface LoadedSource {
  name: string;
  fileCount: number;
  files: Array<{ path: string; content: string }>;
}

const MAX_RAW_ENTRIES = 20000;

/**
 * Zips/folders almost always have a single wrapping top-level directory
 * (the project name). Strip it so paths line up with the project root,
 * the same way the CLI sees them when pointed at a repo directory.
 */
function stripCommonRoot(paths: string[]): (path: string) => string {
  const withSlash = paths.filter((p) => p.includes("/"));
  if (withSlash.length === 0 || withSlash.length !== paths.length) {
    return (p) => p;
  }
  const firstSegment = paths[0].split("/")[0];
  const allShareRoot = paths.every((p) => p.split("/")[0] === firstSegment);
  if (!allShareRoot) return (p) => p;
  const prefixLen = firstSegment.length + 1;
  return (p) => p.slice(prefixLen);
}

function shouldReadContent(path: string, opts: Required<ScanOptions>): boolean {
  return path.split("/").pop() === "package.json" || isDocPath(path, opts.docsRoots);
}

export async function loadFromZipFile(
  file: File,
  opts: Required<ScanOptions>
): Promise<LoadedSource> {
  const buffer = new Uint8Array(await file.arrayBuffer());

  const entries = await new Promise<Record<string, Uint8Array>>((resolve, reject) => {
    unzip(buffer, (err, data) => {
      if (err) reject(err);
      else resolve(data);
    });
  });

  const rawPaths = Object.keys(entries).filter((p) => !p.endsWith("/"));
  if (rawPaths.length > MAX_RAW_ENTRIES) {
    throw new LoaderError("TOO_MANY_FILES_ZIP", { count: rawPaths.length, max: MAX_RAW_ENTRIES });
  }

  const strip = stripCommonRoot(rawPaths);
  const files: Array<{ path: string; content: string }> = [];

  for (const rawPath of rawPaths) {
    const path = strip(rawPath);
    if (isIgnoredPath(path, opts.ignorePaths)) continue;
    const content = shouldReadContent(path, opts) ? new TextDecoder().decode(entries[rawPath]) : "";
    files.push({ path, content });
  }

  return { name: file.name, fileCount: files.length, files };
}

export async function loadFromFileList(
  fileList: FileList,
  opts: Required<ScanOptions>
): Promise<LoadedSource> {
  const allFiles = Array.from(fileList);
  if (allFiles.length === 0) {
    throw new LoaderError("NO_FILES_IN_FOLDER");
  }
  if (allFiles.length > MAX_RAW_ENTRIES) {
    throw new LoaderError("TOO_MANY_FILES_FOLDER", { count: allFiles.length, max: MAX_RAW_ENTRIES });
  }

  const rawPaths = allFiles.map((f) => f.webkitRelativePath || f.name);
  const strip = stripCommonRoot(rawPaths);
  const rootName = rawPaths[0]?.split("/")[0] ?? "project";

  const files: Array<{ path: string; content: string }> = [];
  for (let i = 0; i < allFiles.length; i++) {
    const path = strip(rawPaths[i]);
    if (isIgnoredPath(path, opts.ignorePaths)) continue;
    const content = shouldReadContent(path, opts) ? await allFiles[i].text() : "";
    files.push({ path, content });
  }

  return { name: rootName, fileCount: files.length, files };
}
