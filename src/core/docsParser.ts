import type { DocFile, DocRef } from "./types";

/**
 * Pure function: markdown text in, DocRef[] out.
 * No filesystem access here on purpose — keeps this module unit-testable
 * in isolation and reusable from CLI, a future web backend, or a VS Code
 * extension without changing a single line.
 */

const COMMAND_VERBS = new Set([
  "npm", "pnpm", "yarn", "npx",
  "node", "python", "python3", "pip", "pip3",
  "go", "cargo", "make",
  "docker", "docker-compose",
  "git", "bash", "sh", "zsh",
  "brew", "winget", "apt", "apt-get",
]);

const CODE_FENCE_COMMAND_LANGS = new Set([
  "bash", "sh", "shell", "zsh", "console", "cmd", "powershell", "ps1",
]);

const VERSION_PATTERN = /^v?\d+(\.\d+){1,3}$/i;

interface ClassifiedSpan {
  type: "path" | "command";
  value: string;
}

/** Classify a single inline `code span` (already unwrapped of backticks). */
export function classifyInlineSpan(raw: string): ClassifiedSpan | null {
  const value = raw.trim();
  if (!value) return null;

  const firstToken = value.split(/\s+/)[0];
  if (COMMAND_VERBS.has(firstToken) || firstToken.startsWith("./") || firstToken.startsWith("../")) {
    return { type: "command", value };
  }

  // Anything else with whitespace is treated as prose, not a reference,
  // to avoid false positives (e.g. "press enter to continue").
  if (/\s/.test(value)) return null;

  if (VERSION_PATTERN.test(value)) return null;

  // Bare dotfiles (".env", ".eslintrc.json", ...) with no directory are
  // very commonly "create this file" setup instructions rather than a
  // claim that the file already exists in the repo. Checking them
  // reliably would need intent detection this tool deliberately avoids,
  // so we skip them to keep the false-positive rate low.
  if (/^\.[\w.-]+$/.test(value) && !value.includes("/")) return null;

  const looksLikePath = /[\\/]/.test(value) || /\.[a-zA-Z0-9]{1,8}$/.test(value);
  if (looksLikePath) {
    return { type: "path", value };
  }
  return null;
}

function stripPromptPrefix(line: string): string {
  return line.replace(/^\s*[$>]\s*/, "");
}

function normalizeLinkTarget(target: string): string | null {
  const trimmed = target.trim();
  if (!trimmed) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)) return null; // http(s)://, etc.
  if (trimmed.startsWith("mailto:")) return null;
  if (trimmed.startsWith("#")) return null; // in-page anchor only
  // strip trailing anchor / query, keep the path portion
  return trimmed.split("#")[0].split("?")[0];
}

export function parseDocFile(doc: DocFile): DocRef[] {
  const refs: DocRef[] = [];
  const lines = doc.content.split(/\r?\n/);

  let inCodeBlock = false;
  let codeBlockLang = "";

  lines.forEach((rawLine, idx) => {
    const lineNo = idx + 1;
    const fenceMatch = rawLine.match(/^\s*```\s*([\w-]*)/);

    if (fenceMatch) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = fenceMatch[1].toLowerCase();
      } else {
        inCodeBlock = false;
        codeBlockLang = "";
      }
      return;
    }

    if (inCodeBlock) {
      if (CODE_FENCE_COMMAND_LANGS.has(codeBlockLang)) {
        const cmd = stripPromptPrefix(rawLine).trim();
        if (cmd && !cmd.startsWith("#")) {
          refs.push({
            docPath: doc.path,
            type: "command",
            value: cmd,
            line: lineNo,
            context: rawLine,
          });
        }
      }
      return; // never scan non-shell code block contents for refs
    }

    // Headings
    const headingMatch = rawLine.match(/^(#{1,6})\s+(.*)/);
    if (headingMatch) {
      refs.push({
        docPath: doc.path,
        type: "heading",
        value: headingMatch[2].trim(),
        line: lineNo,
        context: rawLine,
      });
    }

    // Inline code spans: `value`
    const spanRegex = /`([^`\n]+)`/g;
    let spanMatch: RegExpExecArray | null;
    while ((spanMatch = spanRegex.exec(rawLine)) !== null) {
      const classified = classifyInlineSpan(spanMatch[1]);
      if (classified) {
        refs.push({
          docPath: doc.path,
          type: classified.type,
          value: classified.value,
          line: lineNo,
          context: rawLine,
        });
      }
    }

    // Markdown links: [text](target)
    const linkRegex = /\[([^\]]*)\]\(([^)]+)\)/g;
    let linkMatch: RegExpExecArray | null;
    while ((linkMatch = linkRegex.exec(rawLine)) !== null) {
      const target = normalizeLinkTarget(linkMatch[2]);
      if (target) {
        refs.push({
          docPath: doc.path,
          type: "link",
          value: target,
          line: lineNo,
          context: rawLine,
        });
      }
    }
  });

  return refs;
}

export function parseDocFiles(docs: DocFile[]): DocRef[] {
  return docs.flatMap(parseDocFile);
}
