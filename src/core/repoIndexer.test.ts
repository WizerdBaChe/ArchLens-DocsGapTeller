import { test } from "node:test";
import assert from "node:assert/strict";
import { buildRepoIndex } from "./repoIndexer";

test("buildRepoIndex: collects paths and derives ancestor folders", () => {
  const index = buildRepoIndex([
    { path: "src/app.ts" },
    { path: "src/utils/helper.ts" },
    { path: "README.md" },
  ]);

  assert.deepEqual(index.paths.sort(), ["README.md", "src/app.ts", "src/utils/helper.ts"].sort());
  assert.ok(index.folders.includes("src/"));
  assert.ok(index.folders.includes("src/utils/"));
});

test("buildRepoIndex: parses package.json scripts when present", () => {
  const index = buildRepoIndex([
    { path: "package.json", content: JSON.stringify({ scripts: { dev: "vite", build: "vite build" } }) },
  ]);

  assert.equal(index.hasPackageJson, true);
  assert.deepEqual(index.scripts, { dev: "vite", build: "vite build" });
});

test("buildRepoIndex: hasPackageJson is false when package.json is absent", () => {
  const index = buildRepoIndex([{ path: "src/app.ts" }]);
  assert.equal(index.hasPackageJson, false);
  assert.deepEqual(index.scripts, {});
});

test("buildRepoIndex: tolerates malformed package.json without throwing", () => {
  const index = buildRepoIndex([{ path: "package.json", content: "{not valid json" }]);
  assert.equal(index.hasPackageJson, true);
  assert.deepEqual(index.scripts, {});
});
