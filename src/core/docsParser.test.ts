import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyInlineSpan, parseDocFile } from "./docsParser";

test("classifyInlineSpan: detects npm commands", () => {
  assert.deepEqual(classifyInlineSpan("npm run dev"), { type: "command", value: "npm run dev" });
});

test("classifyInlineSpan: detects file paths", () => {
  assert.deepEqual(classifyInlineSpan("src/app.ts"), { type: "path", value: "src/app.ts" });
});

test("classifyInlineSpan: detects bare filename with extension as path", () => {
  assert.deepEqual(classifyInlineSpan("README.md"), { type: "path", value: "README.md" });
});

test("classifyInlineSpan: skips prose phrases", () => {
  assert.equal(classifyInlineSpan("press enter to continue"), null);
});

test("classifyInlineSpan: skips bare version numbers", () => {
  assert.equal(classifyInlineSpan("v1.2.3"), null);
  assert.equal(classifyInlineSpan("3.11"), null);
});

test("classifyInlineSpan: skips bare dotfiles (likely 'create this file' instructions)", () => {
  assert.equal(classifyInlineSpan(".env"), null);
  assert.equal(classifyInlineSpan(".eslintrc.json"), null);
});

test("classifyInlineSpan: skips ALL_CAPS tokens with no extension or slash", () => {
  assert.equal(classifyInlineSpan("DATABASE_URL"), null);
});

test("parseDocFile: extracts command, path, heading, and link refs with line numbers", () => {
  const refs = parseDocFile({
    path: "README.md",
    content: [
      "# Title",
      "Run `npm run dev` and see `src/app.ts`.",
      "[guide](docs/guide.md)",
      "```bash",
      "$ npm run build",
      "```",
    ].join("\n"),
  });

  assert.deepEqual(
    refs.map((r) => ({ type: r.type, value: r.value, line: r.line })),
    [
      { type: "heading", value: "Title", line: 1 },
      { type: "command", value: "npm run dev", line: 2 },
      { type: "path", value: "src/app.ts", line: 2 },
      { type: "link", value: "docs/guide.md", line: 3 },
      { type: "command", value: "npm run build", line: 5 },
    ]
  );
});

test("parseDocFile: ignores non-shell fenced code blocks", () => {
  const refs = parseDocFile({
    path: "README.md",
    content: ["```ts", "const x = require('src/app.ts');", "```"].join("\n"),
  });
  assert.equal(refs.length, 0);
});
