import type { Translations } from "./types";

export const zhTW: Translations = {
  meta: {
    title: "ArchLens DocsGap",
    description: "找出你的文件與程式碼結構之間的落差——完全在瀏覽器內執行,不會上傳任何東西。",
  },

  lang: {
    switchLabel: "語言",
  },

  topbar: {
    downloadReport: "下載報告 ▾",
    downloadJson: "JSON",
    downloadMarkdown: "Markdown",
    downloadCsv: "CSV",
    analyzeAnother: "分析另一個專案",
  },

  onboarding: {
    heroTitle: "找出文件騙了你的地方。",
    heroSub: "失效路徑、過期指令、沒人寫文件的資料夾——透過比對文件與真實的 repo 結構抓出來。",
    reassuranceProject: "你專案的程式碼與 README",
    reassurancePrivacy: "留在這台裝置上——不會上傳任何東西",
    reassuranceOutput: "一份待修正的落差清單",
    dropZip: "把專案的 .zip 拖到這裡",
    chooseZip: "選擇 .zip 檔案",
    chooseFolder: "選擇資料夾",
    changeSource: "選擇其他來源",
    analyzeProject: "開始分析",
    loadExisting: "已經有 CI 產生的 docsgap-report.json?改用這個載入 →",
  },

  picker: {
    selectedFilesCount: (n) => `已選取 ${n} 個檔案`,
    loadingZip: "解壓縮並分析中…",
    loadingGeneric: "分析中…",
    errorNotZip: "這個檔案看起來不是 .zip。請選擇你專案的壓縮檔。",
    errorDragNotZip: "拖放在這裡只支援 .zip 檔案——資料夾請改用「選擇資料夾」按鈕。",
    errorAnalyzeGeneric: "分析這個專案時發生問題。",
    errorInvalidReport: "不是有效的 DocsGap 報告",
    errorReadReport: (detail) => `無法把這個檔案讀取為 docsgap-report.json:${detail}`,
    errorNoFilesInFolder: "選取的資料夾裡沒有任何檔案。",
    errorTooManyFilesZip: (count, max) =>
      `這個 zip 包含 ${count} 個檔案,超過這個瀏覽器內工具設計能處理的上限(${max})。請確認沒有把 node_modules 一起壓進去,或改用較小的專案。`,
    errorTooManyFilesFolder: (count, max) =>
      `這個資料夾包含 ${count} 個檔案,超過這個瀏覽器內工具設計能處理的上限(${max})。請確認選取的資料夾沒有包含 node_modules,或改選較小的專案資料夾。`,
  },

  dashboard: {
    headerMeta: (scriptCount, sourceLabel) => `${scriptCount} 個 scripts · ${sourceLabel}`,
    sourceScanned: (name, fileCount) => `${name} · 已掃描 ${fileCount} 個檔案`,
    statDeadPaths: "失效路徑",
    statStaleCommands: "過期指令",
    statUncoveredFolders: "未涵蓋資料夾",
    statWarnings: "警告",
    captionDeadPaths: "文件指向這裡,但程式碼不在了",
    captionStaleCommands: "照著打不會動",
    captionUncoveredFolders: "有程式碼但文件完全沒提到",
    captionWarnings: "找到了,但容易被誤讀",
    noIssuesMatchFilter: "沒有問題符合目前的篩選條件。",
    successMessageHtml: "沒有偵測到落差。<br>文件與 repo 結構是同步的。",
    selectIssuePrompt: "點選左側的項目來查看詳情。",
    sourceContextLabel: "原始內容",
    contextLabel: "說明",
    noSourceNote: "這個問題是直接比對 repo 結構得出的——沒有對應的單一文件行數可以指向。",
    nextStepLabel: "下一步",
    repoStructureLoc: "repo 結構",
  },

  issueTypes: {
    deadPath: {
      label: "失效路徑",
      nextStep: "打開文件裡這一行,修正或移除這個參照——這個路徑已經不存在了。",
    },
    staleCommand: {
      label: "過期指令",
      nextStep: "更新文件裡的指令,或在 package.json 補上/改名對應的 script。",
    },
    missingScript: {
      label: "缺少 Script",
      nextStep: "補上含有這個 script 的 package.json,或從文件移除這個指令。",
    },
    uncoveredFolder: {
      label: "未涵蓋的資料夾",
      nextStep: "在文件裡補一小段說明,介紹這個資料夾的用途。",
    },
    uncoveredFileGroup: {
      label: "未涵蓋的群組",
      nextStep: "在文件裡補一小段說明,介紹這群檔案的用途。",
    },
    ambiguousReference: {
      label: "模糊的參照",
      nextStep: "把文件裡的裸檔名換成完整路徑,避免讀者(以及這個工具)要猜。",
    },
  },
};
