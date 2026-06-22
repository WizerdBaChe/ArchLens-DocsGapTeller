# ArchLens DocsGap — Tasks & Roadmap

## Done — Milestone 3: visibility bug fix + i18n + README split

Triggered by a real bug report after a visual check in an actual browser
(Milestone 2's onboarding had never been checked outside jsdom, which can't
render real layout):

| # | Task | Notes |
|---|------|-------|
| 1 | Fixed `[hidden]`-vs-class-`display` cascade bug | every onboarding state (empty/selected/loading) and the dashboard were rendering stacked on top of each other from page load; root cause + fix documented in DEV_README "Known heuristics" #10 |
| 2 | Tightened the onboarding reassurance row so it stays one line on typical desktop widths | smaller font/padding/gap, shorter copy, `white-space: nowrap` per pill |
| 3 | Upgraded the visibility test methodology to check `getComputedStyle(el).display`, not `el.hidden` | the boolean-only check is exactly what let bug #1 ship undetected |
| 4 | `web/src/i18n/` — pluggable language module (English + Traditional Chinese) | shared `Translations` contract + one file per locale + a registry; see DEV_README "Internationalization" |
| 5 | Language switcher in the topbar, persisted via `localStorage` | always visible, on both onboarding and dashboard; switching while the dashboard is open re-renders it live |
| 6 | `browserLoader.ts` errors restructured as `LoaderError` with a `code`, translated in `main.ts` | keeps the loader language-agnostic, consistent with `core/`'s "doesn't know who's calling it" principle |
| 7 | Split docs: `README.md` (user-facing, GitHub homepage) vs `DEV_README.md` (engineering reference) | previous single README mixed both audiences |

## Backlog surfaced by Milestone 3

- [ ] **Commit the visibility + i18n jsdom test harnesses as permanent regression tests** — both were run manually during this build, not checked in (same open item as Milestone 2's harness).
- [ ] **A real-browser visual check pass** — jsdom can verify *which* element is visible but not *where it lands*; the reassurance-row width fix was reasoned about, not visually confirmed, since this environment has no real layout engine available.
- [ ] **More languages** — the i18n module is built to make this a small diff (one new locale file + two registry lines); next candidates depend on who actually uses the tool.
- [ ] **Update the live URL placeholder in README.md** once the repo is actually deployed to GitHub Pages.

## Done — Milestone 2: in-browser analysis + onboarding redesign + GitHub Pages

Triggered by a real UX problem found after Milestone 1 shipped: the original
viewer required users to already have a `docsgap-report.json`, with no
explanation of where that file comes from — a first-time user had no idea
what to do. Fix wasn't a copy change, it was an architecture change: move
the analysis itself into the browser so the JSON step disappears entirely
for the common case.

| # | Task | Notes |
|---|------|-------|
| 1 | `src/browser.ts` — browser-safe public API (`analyzeProject`) | zero Node deps; reuses `core/` untouched |
| 2 | `web/src/browserLoader.ts` — zip (fflate) + folder (`webkitdirectory`) loader | the browser equivalent of `fsLoader.ts`; includes root-stripping + ignore-prefiltering + a 20k-file safety cap |
| 3 | New onboarding: pick zip/folder → confirm → **Analyze project** | replaces the old "upload a JSON" entry point; visual reassurance row (icon + short label, not a tutorial) explains input/privacy/output in one glance |
| 4 | Dashboard ported to `web/src/ui.ts` + per-card captions + "Next step" guidance in the detail panel | same visual language as Milestone 1, now also answers "what do I do about this" |
| 5 | "Already have a report.json from CI?" secondary path kept | same JSON-upload flow as before, now a secondary link instead of the only entry point |
| 6 | Download report (JSON/CSV/MD) from the dashboard | needed now that analysis happens fresh in-browser with no CLI-produced files by default |
| 7 | Vite build (`web/vite.config.ts`, relative `base` for GH Pages subpaths) | `npm run build:web` / `dev:web` / `typecheck:web` |
| 8 | `.github/workflows/deploy.yml` — build + deploy to GitHub Pages on push to `main` | requires one manual one-time setting: repo Settings → Pages → Source → GitHub Actions |
| 9 | End-to-end validation: synthetic zip (with a wrapping folder, to test root-stripping) driven through jsdom against the real built bundle | confirmed correct issue counts, correct path resolution post-root-stripping, detail panel, reset, JSON fallback path, and download menu wiring |
| 10 | README + this roadmap updated | new "Architecture" section explains the `index.ts` vs `browser.ts` front-door split |

## Backlog surfaced by Milestone 2

- [ ] **Commit a permanent jsdom/Playwright regression test for the web app** — the validation harness used during this build (synthetic zip → analyze → assert issue counts/root-stripping → reset → JSON fallback → download) was run manually, not checked in.
- [ ] **Streaming/lazy zip reading** for very large projects — current implementation decompresses the whole archive into memory at once (`fflate.unzip`); fine for typical repos, not ideal much past the 20k-file cap.
- [ ] **Folder drag-and-drop** — currently drag & drop only accepts `.zip`; revisit if `DataTransferItem.webkitGetAsEntry()` / the File System Access API are worth the added complexity for full folder drop support.
- [ ] **Multiple top-level roots in one zip** (e.g. a zip containing several sibling projects) — root-stripping currently assumes one shared wrapping folder.

## Done — Milestone 1 (CLI + standalone JSON viewer)

| # | Task | Notes |
|---|------|-------|
| 1 | Project skeleton (core / io / exporters / cli, types.ts as the shared contract) | low-coupling layering, see README "Architecture" |
| 2 | `docsParser`: path / command / link / heading extraction | line-tracked, skips non-shell code blocks |
| 3 | `repoIndexer`: repo file index + `package.json` scripts | pure function, no fs access |
| 4 | `driftMatcher`: dead-path / stale-command / missing-script / uncovered-folder / ambiguous-reference | see README "Known heuristics" |
| 5 | `reportBuilder` + JSON / CSV / Markdown exporters | matches the RPD appendix schema |
| 6 | CLI (`scan` command, exit code 2 on drift found) | zero runtime deps |
| 7 | Fixture repo + 25 unit tests (`node --test`), full CLI run validated against fixture | all passing |
| 8 | Standalone JSON viewer (summary cards, filterable issue list, doc/repo detail panel) | superseded as the primary entry point by Milestone 2's web app, kept as a zero-build fallback |
| 9 | README + roadmap | |
| 10 | Packaged for delivery | zip with prebuilt `dist/` so it runs with zero `npm install` |

## Answers chosen for the RPD's "下一步最應該先確認的 5 個問題"

These were open questions in the RPD. Concrete choices were made to ship an
MVP rather than leaving them unresolved — revisit any of them if they don't
fit your repos:

1. **Docs scope**: `README.md` + everything under `docs/` (recursively, `.md` only). Configurable via `--docs`.
2. **Path extraction patterns supported**: inline `` `code spans` ``, fenced ```` ```bash ```` blocks, and `[text](relative/path)` markdown links. Plain prose mentions (no backticks/links) are intentionally NOT scanned — too high a false-positive risk for an MVP.
3. **Command validation**: both — `npm/pnpm/yarn run <script>` is checked against `package.json` scripts, AND `node <file>` / `python(3) <file>` targets are checked for file existence. Everything else (`git`, `docker`, `make`, ...) is extracted but not verified.
4. **Uncovered-folder definition**: a folder is "uncovered" if no doc reference resolves to that folder or anything inside it, reported at the shallowest untouched level per branch. Minimum file count is configurable (`uncoveredFolderMinFiles`, default 1).
5. **Machine-readable CI output**: yes — `--format json` plus a non-zero exit code (2) when issues exist, so a CI step can gate on it directly without a wrapper script.

## Backlog (not in this MVP — from the RPD's "次要功能" / "以後再做")

Roughly in the order they'd add the most value next:

- [ ] **Coverage score** — a single 0–100 "docs trust" number per repo (RPD explicitly allowed cutting this from MVP; revisit once the issue taxonomy has been used on a few real repos and feels stable).
- [ ] **`uncovered-file-group`** — flag groups of same-extension files (e.g. "12 new `.tsx` components, 0 mentioned") as a complement to folder-level coverage.
- [ ] **Grouped issue view in the viewer** — collapse by file/folder instead of a flat list, useful once repos produce 50+ issues.
- [ ] **Fix-suggestion drafts** — e.g. propose the corrected path for an `ambiguous-reference` (the resolved suffix match is already computed internally — `driftMatcher` would just need to surface it as a `suggestedFix` field instead of folding it into `reason`).
- [ ] **Monorepo support** — merge `scripts` from workspace `package.json` files, not just the root one.
- [ ] **CI gate packaging** — ship a ready-made GitHub Action wrapping the existing exit-code behavior.
- [ ] **VS Code extension** — RPD's "方案 C"; would reuse `scanRepo()` / `matchDrift()` as-is, only the loader and the rendering surface would be new.
- [ ] **Permanent jsdom regression test for the viewer** — the smoke test used during this build (file load → render → filter → click → reset) was run manually and not committed; worth adding to `tests/` if the viewer grows more interactive states.

## Explicitly out of scope (per RPD section F.3 "暫不考慮")

- Automatic doc editing / auto-PR generation
- Multi-language natural-language understanding of doc prose
- Cross-repo documentation relationship analysis
