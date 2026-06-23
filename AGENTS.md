# ArchLens DocsGap — 產品層 AI 指引

本檔是 **ArchLens 系列** 的一員。系列層指引（mission、痛點↔產品對照表、共用 schema、scope 慣例）在上層
[`../AGENTS.md`](../AGENTS.md)，AI session 會自動一併繼承。**先讀那份。**

## 本產品負責（`[product:docsgap]`，stage: verify）

比對文件 vs 實際 repo，找出落差：死連結（dead path）、過時指令（stale command）、模糊參照（ambiguous reference）、未覆蓋資料夾（uncovered folder）。輸出 `docsgap`。
架構原則：core 純函式不知道自己被誰呼叫（CLI / web / 未來 IDE 外掛共用同一組函式）。

## 不屬於本產品的需求 → 請指向姊妹產品

- 純目錄樹 / 餵 AI 的 context → **web**（`ArchLens-Web/`）。需要樹時應消費 web 產出的 `tree`。
- import / 依賴 / 耦合 / 循環依賴 → **dependency**（`ArchLens-DependencyTeller/`）。
- 版本之間結構怎麼變了 → **diff**（`ArchLens-DiffTeller/`）。

## 資料契約

輸入消費系列共用的 `tree`；DependencyTeller 的檔案清單可與本產品的「未覆蓋資料夾」交叉比對。
輸出包進共用信封 `{ "archlens": "1.0", "kind": "docsgap", ... }`（見系列層 AGENTS.md 的 Layer B）。
