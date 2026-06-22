# ArchLens DocsGap — Engineering Reference

This is the **developer-facing** doc: architecture, build/test/deploy
internals, known heuristics, and how to extend the tool. If you just want to
*use* DocsGap, see [README.md](./README.md) instead — this file assumes
you're building or modifying it.

A documentation drift checker. It cross-references your docs (README / `docs/`)
against the real repo structure and `package.json` scripts, and reports:

- **Dead paths** — files/folders mentioned in docs that no longer exist
- **Stale commands** — `npm run <script>` (or `node`/`python` targets) that don't resolve
- **Missing scripts** — a script command is referenced but `package.json` itself is missing
- **Uncovered folders** — folders with real code that are never mentioned anywhere in the docs
- **Ambiguous references** — a bare filename that only matches a file somewhere else in the tree

No execution of any command happens — everything is static text + filesystem comparison, by design (see `Known heuristics & limitations` below).

There are three ways to use it, all built on the same `core/` logic:

| | What it is | Where it runs |
|---|---|---|
| **Web app** (`web/`) | Drop a `.zip` or pick a project folder, click "Analyze project" | Entirely in your browser — nothing is uploaded anywhere |
| **CLI** (`src/cli/`) | `archlens-docsgap scan ./repo` | Locally / in CI, exit code gates on drift found |
| **Standalone viewer** (`_archive/viewer-milestone1/index.html`) | A single dependency-free HTML file that reads a `docsgap-report.json` | Anywhere, fully offline, zero build step — archived; not the primary entry point |

## Local development

```bash
npm install
npm run dev:web      # opens a local dev server with hot reload
```

Flow: drop a `.zip` of your project (or pick a folder) → **Analyze project** →
browse the dashboard. Already have a `docsgap-report.json` from a CI run?
There's a secondary link on the onboarding screen to load that instead — same
dashboard, no re-analysis needed.

Everything — unzipping, parsing, comparing against the repo — runs
client-side via the same `core/` functions the CLI uses (see `src/browser.ts`).
Nothing about your project ever leaves the browser tab.

### Deploying to GitHub Pages

`.github/workflows/deploy.yml` builds and deploys `web/` automatically on
every push to `main`. One-time setup required on GitHub's side (can't be
done from a workflow file):

1. Repo **Settings → Pages → Build and deployment → Source**: select **GitHub Actions**.
2. If your default branch isn't `main`, update the `branches:` list in `deploy.yml`.

After that, `git push` to `main` is enough — the Action builds `web/dist` and
publishes it.

## CLI

Requires Node.js >= 18. No install needed to just run the prebuilt CLI:

```bash
node dist/cli/index.js scan ./your-repo --format json,md,csv --out ./report
```

Try it immediately against the bundled fixture repo:

```bash
node dist/cli/index.js scan tests/fixtures/sample-repo --format json,md --out /tmp/demo
cat /tmp/demo/docsgap-report.md
```

To rebuild from source instead:

```bash
npm install
npm run build
npm test
```

### CLI usage

```
archlens-docsgap scan <repoPath> [options]

  --out <dir>            Output directory (default: ./docsgap-report)
  --format <list>        Comma-separated: json,md,csv (default: json,md)
  --docs <list>          Comma-separated docs roots (default: README.md,docs/)
  --ignore <list>        Comma-separated path prefixes to ignore
  --no-check-scripts     Skip npm/yarn/pnpm script + node/python target checks
```

Exit code is `2` when issues were found (so CI can gate on it), `1` on a hard
error (bad path, etc.), `0` when the scan ran clean.

## Standalone viewer (`_archive/viewer-milestone1/index.html`)

A minimal, zero-build, single-file alternative to the web app — useful if you
specifically want a no-JS-bundle, no-tooling option, or want to view a
`report.json` without even the small Vite-built bundle. Open it in any
browser and drag a `docsgap-report.json` onto it. No server required.

Archived from `viewer/index.html` (Milestone 1); see `_archive/README.md` for
restore instructions.

## Architecture

```
src/
  core/            pure functions, zero I/O, zero framework deps
    types.ts         the single shared contract every module depends on
    docsParser.ts     markdown text -> DocRef[]
    repoIndexer.ts    RepoFile[] -> RepoIndex (paths, folders, scripts)
    driftMatcher.ts   (DocRef[], RepoIndex) -> Issue[]   <- all "what counts as drift" lives here
    reportBuilder.ts  (DocRef[], RepoIndex, Issue[]) -> DocsGapReport
  io/
    fsLoader.ts       Node-only: the ONLY module allowed to touch the filesystem
  exporters/
    jsonExporter.ts / csvExporter.ts / markdownExporter.ts
  cli/
    index.ts          arg parsing + wiring only, no business logic
  index.ts            Node-oriented public API (scanRepo + re-exports) — what the CLI calls
  browser.ts          browser-safe public API (analyzeProject + re-exports) — what web/ calls
                       NEVER imports io/fsLoader; this boundary is what makes web/ possible
                       without rewriting any analysis logic
web/                  the in-browser app (Vite + vanilla TS, no framework)
  index.html
  vite.config.ts
  src/
    main.ts           onboarding state machine + dashboard wiring
    browserLoader.ts  zip (fflate) / folder (webkitdirectory) -> the same flat file shape
                       fsLoader.ts uses — this is "fsLoader.ts for the browser"
    ui.ts             dashboard rendering (summary/filters/list/detail) — pure DOM, no framework
    styles.css
    i18n/             pluggable language registry — see "Internationalization (i18n)" below
      types.ts          the Translations contract every locale file must satisfy
      en.ts / zh-TW.ts  one dictionary per language
      index.ts          registry, locale persistence, data-i18n attribute application
_archive/             development-phase artefacts (archived, gitignored — see _archive/README.md)
  viewer-milestone1/  Milestone 1 standalone viewer (superseded by web/)
  orgFile/            original MVP delivery zip
tests/
  fixtures/sample-repo/   a tiny repo with one of every issue type, used by both
                          manual CLI runs and as the basis for unit test fixtures
.github/workflows/
  deploy.yml          builds web/ and deploys it to GitHub Pages on push to main
```

**Why this split:** every module only knows about the shared types in
`core/types.ts`, never about each other's internals. Concretely:

- Swapping the markdown parser (e.g. to a real AST-based one later) only
  touches `docsParser.ts` — `driftMatcher.ts` still just sees `DocRef[]`.
- Adding a new issue type means editing `types.ts` (add to `IssueType`) and
  `driftMatcher.ts` (the rule) — parser, indexer, exporters, the CLI, and the
  web app don't need to change.
- **The web app exists without rewriting any analysis logic.** `browser.ts`
  and `index.ts` are two separate front doors onto the same `core/` —
  the only genuinely new code for the web app was the loader
  (`web/src/browserLoader.ts`, the browser equivalent of `fsLoader.ts`) and
  the UI itself. `docsParser` / `repoIndexer` / `driftMatcher` /
  `reportBuilder` are untouched, byte-for-byte the same functions the CLI
  calls.
- A future VS Code extension can reuse `analyzeProject()` or the individual
  pure functions directly the same way.

## Internationalization (i18n)

The web app supports English and Traditional Chinese via a small, deliberately
plug-in-style module under `web/src/i18n/`:

- `types.ts` defines the `Translations` contract (every UI string the app
  needs, grouped by area: onboarding, picker, dashboard, issue types, ...).
  Interpolated strings are **functions**, not template literals, so word
  order and pluralization can differ correctly per language.
- `en.ts` / `zh-TW.ts` each implement that contract — one file per language,
  no shared state between them.
- `index.ts` is the registry: tracks the active locale (persisted to
  `localStorage`), exposes `getTranslations()` / `setLocale()` /
  `onLocaleChange()`, and `applyStaticTranslations()` which walks every
  element with a `data-i18n="path.to.key"` attribute and sets its text from
  the active dictionary.

**To add a new language:** create `web/src/i18n/<code>.ts` implementing
`Translations`, then add one entry each to `DICTIONARIES` and
`SUPPORTED_LOCALES` in `index.ts`. Nothing else changes — the `<select>` in
the topbar is populated from `SUPPORTED_LOCALES` at runtime, and `ui.ts`
(dashboard rendering) and `main.ts` (onboarding/error strings) already pull
every string through `getTranslations()`, never a hardcoded literal.

Two coupling notes worth knowing if you touch this:

- `web/src/browserLoader.ts` deliberately does **not** import the i18n
  module. It throws a structured `LoaderError` with a `code` field instead
  of an English string; `main.ts` maps the code to a translated message.
  This keeps the loader (like the rest of `core/`) language-agnostic.
- Static markup text (anything in `web/index.html`) is translated via
  `data-i18n` attributes + `applyStaticTranslations()`. Dynamically
  generated text (dashboard labels, error messages) is translated by
  calling `getTranslations()` directly at render time. A language switch
  re-runs both: `applyStaticTranslations()` for the markup, and a full
  dashboard re-render (`renderAll()`) if a report is currently showing.

## Testing

CLI / core:

```bash
npm run build
npm test       # node's built-in test runner, runs dist/**/*.test.js
```

25 unit tests cover the parser's classification rules, the indexer, and
every drift-matching rule (including the folder-coverage edge cases). The
CLI itself was additionally validated end-to-end against
`tests/fixtures/sample-repo`.

Web app:

```bash
npm run typecheck:web   # tsc --noEmit against web/src with DOM lib
npm run build:web       # Vite production build
```

The web app's full flow (pick a zip → unzip → root-stripping → analyze →
render → click an issue → reset; plus the "load existing report.json"
fallback, the download menu, and the language switch — both the static
`data-i18n` markup and the dynamically-rendered dashboard) was validated
end-to-end during development using jsdom driving a real built bundle,
including a synthetic zip wrapped in a top-level folder specifically to
exercise the root-stripping logic. Visibility assertions check the actual
**computed** `display` value (`getComputedStyle(el).display`), not the
`.hidden` IDL boolean — checking only the boolean is what let the
`[hidden]`-vs-class-`display` cascade bug (see "Known heuristics" below)
ship undetected the first time around. That harness isn't committed to the
repo (see TASKS.md if you want it added as a permanent regression test) —
one caveat worth knowing if you rebuild it: jsdom does not execute
`<script type="module">` content, so the harness bundled `web/src/main.ts`
as an IIFE with esbuild purely for test execution; the shipped Vite/ESM
build is unaffected and is what real browsers run. jsdom also does not run
real layout (no actual flexbox box-model computation), so anything about
visual wrapping/overflow still needs a real browser check — automated tests
here can only catch *which* element is visible, never *where* it lands.

## MVP scope vs. the original RPD

Implemented (per RPD section F.4 "MVP"):

- ✅ README / `docs/` import, path & command extraction, repo comparison
- ✅ `dead-path`, `stale-command`, `missing-script`, `uncovered-folder` detection
- ✅ `ambiguous-reference` (was listed in the taxonomy but not required for MVP — implemented anyway since the suffix-match heuristic was cheap and directly reduces false "dead path" reports)
- ✅ JSON / CSV / Markdown export
- ✅ Web viewer with doc/repo cross-reference

Deferred (per RPD section F.3 "later"), unchanged from the original plan:

- ⏳ `uncovered-file-group` (grouping by file type/pattern rather than folder)
- ⏳ README coverage score
- ⏳ Fix-suggestion drafts
- ⏳ Multi-doc semantic merging / cross-repo analysis
- ⏳ CI gate packaging (the CLI's exit code already supports this; a ready-made GitHub Action is not included)

See `TASKS.md` for the fuller backlog and suggested next slice.

## Known heuristics & limitations (read before trusting a "0 issues" result)

These are the explicit trade-offs made to keep the false-positive rate low,
per the RPD's own stated risk ("最大風險是誤報過多讓人覺得吵"):

1. **Only `npm`/`pnpm`/`yarn` script commands are verified against
   `package.json`.** Other shell commands (`git`, `docker`, `make`, ad-hoc
   scripts) are extracted but never flagged — verifying them would require
   actually running them, which this tool deliberately never does.
2. **Bare dotfiles (`.env`, `.eslintrc.json`, ...) are never checked.**
   They're overwhelmingly "create this file" setup instructions rather than
   claims that the file already exists, so checking them produced
   unacceptable false positives during testing.
3. **Only the root `package.json` is read.** Monorepo / workspace
   `package.json` files at other paths are indexed as files but their
   `scripts` are not merged in.
4. **Uncovered-folder detection reports the shallowest untouched folder
   per branch**, not every nested untouched folder, to avoid redundant
   noise (e.g. it won't flag both `src/` and `src/utils/` if neither is
   mentioned — only `src/`).
5. **The uncovered-folder file-count threshold (`uncoveredFolderMinFiles`,
   default `1`) is a blunt heuristic.** The RPD itself flagged this exact
   question as unresolved ("如何定義未涵蓋模組的閾值") — this default is a
   reasonable starting point, not a researched answer. Tune via
   `ScanOptions.uncoveredFolderMinFiles` if it's too noisy for a given repo.
6. **Markdown parsing is line/regex-based, not a full CommonMark AST.** It
   correctly skips non-shell fenced code blocks and handles nested inline
   code spans, but unusual markdown (HTML blocks, footnotes, embedded
   front-matter) is not specially handled.
7. **The web app caps input at 20,000 files** (`MAX_RAW_ENTRIES` in
   `browserLoader.ts`) and decompresses the whole zip into memory at once —
   fine for typical repos, not designed for huge monorepos. If you zip a
   folder that includes `node_modules`, the cap may trip before
   `ignorePaths` filtering ever gets a chance to drop it; zip from outside
   `node_modules`, or use the CLI instead for very large repos.
8. **Drag & drop only accepts `.zip` files, not folders.** Browsers don't
   expose a reliable, cross-browser way to read a dropped folder's full
   contents via plain drag-and-drop; folder input goes through the explicit
   "Choose a folder" button (`<input webkitdirectory>`) instead, which does
   work reliably.
9. **Root-folder stripping assumes a single common wrapping folder.** If
   your zip (or selected folder) has files at multiple different top-level
   names with no shared root, paths are used as-is — this matches how most
   "zip this folder" exports behave, but isn't a real archive-format
   convention, just a heuristic.
10. **Never pair the `hidden` attribute with a class that sets `display`
    on the same element without also keeping the global
    `[hidden] { display: none !important; }` rule in `styles.css`.**
    A class-based `display` declaration has the same specificity as the
    browser's default `[hidden]` rule, and author stylesheets win that tie
    — so without the `!important` override, an element's class can silently
    keep it visible regardless of what `el.hidden = true` does in JS. This
    bit us for real once (multiple onboarding states rendering stacked on
    top of each other); the global rule at the top of `styles.css` is the
    fix. If you ever remove or scope that rule, re-verify every
    `hidden`-toggled element still actually hides — checking
    `el.hidden === true` in a test is **not** sufficient, since it only
    reflects JS intent, not the computed CSS result (see "Testing" above).
