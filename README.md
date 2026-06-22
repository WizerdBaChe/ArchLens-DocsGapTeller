# ArchLens DocsGap

Your README says one thing. Your code does another.

**DocsGap finds the gap** — it compares your documentation against your
actual repo and flags dead links, outdated commands, and code nobody wrote
a word about.

## Try it

**[Open ArchLens DocsGap →](https://<your-username>.github.io/<your-repo>/)**
*(update this link once you've deployed — see DEV_README.md)*

No install, no account, nothing uploaded:

1. Drop a `.zip` of your project, or pick a project folder.
2. Click **Analyze project**.
3. Get a list of doc/code mismatches you can go fix right now.

Your code stays in your browser tab the entire time — there's no server
behind this, no upload, nothing leaves your machine.

🌐 English / 繁體中文 — use the language switcher in the top-right corner.

## What it catches

| | Issue | Meaning |
|---|---|---|
| 🔴 | **Dead path** | Your docs point to a file or folder that no longer exists |
| 🟠 | **Stale command** | An `npm run ...` command that doesn't match any script in `package.json` |
| 🟣 | **Ambiguous reference** | A bare filename in your docs that only exists somewhere else in the tree |
| 🔵 | **Uncovered folder** | Real code with zero mention anywhere in your docs |

Click any result to see exactly which line in your docs caused it, and a
plain-language suggestion for what to do about it.

## Other ways to use it

- **As a CLI**, for local use or to gate a CI pipeline on doc drift.
- **As a standalone offline viewer** — a single HTML file, no install,
  for opening a `docsgap-report.json` someone sent you.

Both are documented in [DEV_README.md](./DEV_README.md).

## Why this exists

Docs don't go stale because nobody wrote them — they go stale because
nobody re-checks them after the code moves on. A new teammate (or future
you) ends up debugging a README instead of the actual problem. DocsGap
turns "is this still true?" from a guess into something you can check in
about ten seconds.

## Privacy

Everything runs client-side in your browser. There is no backend, no
analytics, and no upload step — your source code never leaves your device.

## Contributing

This repo is built with a strict "core logic knows nothing about where it's
called from" architecture, specifically so it's easy to extend — new issue
types, new languages, new front-ends (CLI/web/future IDE plugin) all plug
into the same small set of pure functions. See
[DEV_README.md](./DEV_README.md) for the architecture, local setup, and
testing notes.

## License

MIT
