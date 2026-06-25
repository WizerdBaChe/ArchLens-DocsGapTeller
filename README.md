# ArchLens DocsGap

**找出文件與程式碼的落差 — 死連結、過時指令、沒人寫到的資料夾。**  
**Find the gap between your docs and your code — dead links, stale commands, folders nobody documented.**

所有分析完全在瀏覽器中執行 — 你的原始碼永遠不會離開你的電腦。  
Everything runs entirely in your browser — your source code never leaves your machine.

---

**語言 / Language:** 繁體中文 | [English](#english-version)

---

## 繁體中文

### 功能介紹

你的 README 說一套，你的程式碼做另一套。**DocsGap 找出那個落差**——它拿你的文件（README / `docs/`）跟真實的 repo 結構與 `package.json` scripts 交叉比對，回報：

| | 問題 | 意義 |
|---|---|---|
| 🔴 | **死路徑（Dead path）** | 文件指向一個已經不存在的檔案或資料夾 |
| 🟠 | **過時指令（Stale command）** | 文件裡的 `npm run ...` 對不到 `package.json` 裡任何 script |
| 🟣 | **模糊引用（Ambiguous reference）** | 文件裡的純檔名只在樹的別處存在 |
| 🔵 | **未覆蓋資料夾（Uncovered folder）** | 有真實程式碼、卻在文件裡完全沒被提到的資料夾 |

點任一結果，可看到是文件裡哪一行造成的，以及一句白話的修正建議。**完全不執行任何指令**——一切都是靜態文字 + 檔案系統比對。

這是 [ArchLens 系列](../AGENTS.md) 的 `verify`（驗證）階段：它**消費** `tree`、**產生** `docsgap`。

無需帳號。無需伺服器。無需上傳。100% 瀏覽器端。

---

### 使用方式

不必安裝、不必註冊、不上傳任何東西：

1. 把專案打包成 `.zip` 拖進來，或選一個專案資料夾。
2. 點 **Analyze project（分析專案）**。
3. 得到一份可以馬上去修的文件 / 程式碼落差清單。

🌐 UI 支援**繁體中文**與**英文**——用右上角的語言切換按鈕切換。

---

### 其他使用方式

- **CLI** — 在本機使用，或讓 CI pipeline 在偵測到文件漂移時擋下（以 exit code 把關）。
- **獨立離線檢視器** — 單一 HTML 檔、零安裝，用來開啟別人傳給你的 `docsgap-report.json`。

兩者都記載於 [DEV_README.md](./DEV_README.md)。

---

### 為什麼需要它

文件變過時，不是因為沒人寫，而是因為程式碼往前走之後沒人回頭重新檢查。新隊友（或未來的你）最後在 debug 一份 README，而不是真正的問題。DocsGap 把「這還是真的嗎？」從用猜的，變成大約十秒就能查證的事。

---

### 隱私

所有分析都在你的瀏覽器中執行（使用 File System Access API 與 JSZip）。沒有後端、沒有分析追蹤、沒有上傳步驟——你的原始碼永遠不會離開你的裝置。

---

### 開發者 & 貢獻者

架構、本機設定與測試說明，請參閱 [DEV_README.md](./DEV_README.md)。本 repo 採「核心邏輯完全不知道自己被誰呼叫」的架構，刻意讓它容易擴充——新的問題類型、新語言、新前端（CLI / web / 未來的 IDE plugin）都接到同一小組純函式上。

---

## English Version

### What It Does

Your README says one thing. Your code does another. **DocsGap finds the gap** —
it compares your documentation (README / `docs/`) against your actual repo
structure and `package.json` scripts, and reports:

| | Issue | Meaning |
|---|---|---|
| 🔴 | **Dead path** | Your docs point to a file or folder that no longer exists |
| 🟠 | **Stale command** | An `npm run ...` command that doesn't match any script in `package.json` |
| 🟣 | **Ambiguous reference** | A bare filename in your docs that only exists somewhere else in the tree |
| 🔵 | **Uncovered folder** | Real code with zero mention anywhere in your docs |

Click any result to see exactly which line in your docs caused it, and a
plain-language suggestion for what to do about it. **Nothing is ever executed** —
it's all static text + filesystem comparison, by design.

This is the `verify` stage of the [ArchLens suite](../AGENTS.md): it **consumes**
a `tree` and **produces** a `docsgap`.

No account needed. No server. No upload. 100% browser-side.

---

### How to Use

No install, no account, nothing uploaded:

1. Drop a `.zip` of your project, or pick a project folder.
2. Click **Analyze project**.
3. Get a list of doc/code mismatches you can go fix right now.

🌐 The UI supports **English** and **Traditional Chinese (繁體中文)** — use the
language switcher in the top-right corner.

---

### Other Ways to Use It

- **As a CLI**, for local use or to gate a CI pipeline on doc drift (exit code).
- **As a standalone offline viewer** — a single HTML file, no install, for
  opening a `docsgap-report.json` someone sent you.

Both are documented in [DEV_README.md](./DEV_README.md).

---

### Why This Exists

Docs don't go stale because nobody wrote them — they go stale because nobody
re-checks them after the code moves on. A new teammate (or future you) ends up
debugging a README instead of the actual problem. DocsGap turns "is this still
true?" from a guess into something you can check in about ten seconds.

---

### Privacy

Everything runs client-side in your browser (using the File System Access API and
JSZip). There is no backend, no analytics, and no upload step — your source code
never leaves your device.

---

### For Developers & Contributors

See [DEV_README.md](./DEV_README.md) for architecture, local setup, and testing
notes. This repo is built with a strict "core logic knows nothing about where
it's called from" architecture, specifically so it's easy to extend — new issue
types, new languages, new front-ends (CLI / web / future IDE plugin) all plug
into the same small set of pure functions.
