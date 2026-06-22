import { test } from "node:test";
import assert from "node:assert/strict";
import { matchDrift } from "./driftMatcher";
import { buildRepoIndex } from "./repoIndexer";
import type { DocRef } from "./types";

const repoIndex = buildRepoIndex([
  { path: "src/app.ts" },
  { path: "src/utils/helper.ts" },
  { path: "package.json", content: JSON.stringify({ scripts: { dev: "vite" } }) },
]);

function ref(partial: Partial<DocRef>): DocRef {
  return { docPath: "README.md", type: "path", value: "", line: 1, context: "", ...partial };
}

test("matchDrift: flags a missing path as dead-path", () => {
  const issues = matchDrift([ref({ type: "path", value: "src/old/legacy.ts" })], repoIndex);
  assert.equal(issues.some((i) => i.type === "dead-path" && i.reference === "src/old/legacy.ts"), true);
});

test("matchDrift: does not flag an existing exact path", () => {
  const issues = matchDrift([ref({ type: "path", value: "src/app.ts" })], repoIndex);
  assert.equal(issues.some((i) => i.reference === "src/app.ts"), false);
});

test("matchDrift: flags a bare filename that only matches via suffix as ambiguous-reference", () => {
  const issues = matchDrift([ref({ type: "path", value: "helper.ts" })], repoIndex);
  assert.equal(issues.some((i) => i.type === "ambiguous-reference" && i.reference === "helper.ts"), true);
});

test("matchDrift: flags an unknown npm script as stale-command", () => {
  const issues = matchDrift([ref({ type: "command", value: "npm run unknown-script" })], repoIndex);
  assert.equal(issues.some((i) => i.type === "stale-command"), true);
});

test("matchDrift: does not flag a known npm script", () => {
  const issues = matchDrift([ref({ type: "command", value: "npm run dev" })], repoIndex);
  assert.equal(issues.some((i) => i.type === "stale-command"), false);
});

test("matchDrift: flags npm script as missing-script when package.json absent", () => {
  const noPkgIndex = buildRepoIndex([{ path: "src/app.ts" }]);
  const issues = matchDrift([ref({ type: "command", value: "npm run dev" })], noPkgIndex);
  assert.equal(issues.some((i) => i.type === "missing-script"), true);
});

test("matchDrift: does not verify generic shell commands (git, docker, make)", () => {
  const issues = matchDrift([ref({ type: "command", value: "git status" })], repoIndex);
  assert.equal(issues.length, 1); // only the uncovered-folder issue for src/, no command issue
  assert.equal(issues[0].type, "uncovered-folder");
});

test("matchDrift: flags an entirely unmentioned top-level folder as uncovered-folder", () => {
  const issues = matchDrift([ref({ type: "path", value: "package.json" })], repoIndex);
  assert.equal(issues.some((i) => i.type === "uncovered-folder" && i.reference === "src/"), true);
});

test("matchDrift: does not flag a folder once a file directly inside it is referenced", () => {
  const flatIndex = buildRepoIndex([{ path: "src/app.ts" }, { path: "src/other.ts" }]);
  const issues = matchDrift([ref({ type: "path", value: "src/app.ts" })], flatIndex);
  assert.equal(issues.some((i) => i.type === "uncovered-folder"), false);
});

test("matchDrift: flags only the deepest untouched subfolder, not its already-touched ancestor", () => {
  // src/app.ts is referenced (touches "src/"), but src/utils/ is never mentioned —
  // the precise nested folder should be flagged, not the already-covered parent.
  const issues = matchDrift([ref({ type: "path", value: "src/app.ts" })], repoIndex);
  assert.deepEqual(
    issues.filter((i) => i.type === "uncovered-folder").map((i) => i.reference),
    ["src/utils/"]
  );
});

test("matchDrift: respects checkScripts=false to skip command validation", () => {
  const issues = matchDrift(
    [ref({ type: "command", value: "npm run unknown-script" })],
    repoIndex,
    { checkScripts: false }
  );
  assert.equal(issues.some((i) => i.type === "stale-command"), false);
});
