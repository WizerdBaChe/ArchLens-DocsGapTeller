import type { Translations } from "./types";

export const en: Translations = {
  meta: {
    title: "ArchLens DocsGap",
    description: "Find where your docs and code have drifted apart — entirely in your browser, nothing uploaded.",
  },

  lang: {
    switchLabel: "Language",
  },

  topbar: {
    downloadReport: "Download report ▾",
    downloadJson: "JSON",
    downloadMarkdown: "Markdown",
    downloadCsv: "CSV",
    analyzeAnother: "Analyze another project",
  },

  onboarding: {
    heroTitle: "Find where your docs lied.",
    heroSub: "Dead paths, stale commands, undocumented folders — spotted by comparing your docs against the real repo.",
    reassuranceProject: "Your project's code & README",
    reassurancePrivacy: "Stays on this device — nothing is uploaded",
    reassuranceOutput: "A list of mismatches to fix",
    dropZip: "Drop a .zip of your project here",
    chooseZip: "Choose .zip file",
    chooseFolder: "Choose a folder",
    changeSource: "Choose a different source",
    analyzeProject: "Analyze project",
    loadExisting: "Already have a docsgap-report.json from CI? Load it instead →",
  },

  picker: {
    selectedFilesCount: (n) => `${n} files selected`,
    loadingZip: "Unzipping & analyzing…",
    loadingGeneric: "Analyzing…",
    errorNotZip: "That doesn't look like a .zip file. Please choose a zipped copy of your project.",
    errorDragNotZip: "Drag & drop only works with .zip files here — use \u201cChoose a folder\u201d for an unzipped project.",
    errorAnalyzeGeneric: "Something went wrong while analyzing this project.",
    errorInvalidReport: "not a valid DocsGap report",
    errorReadReport: (detail) => `Could not read this file as a DocsGap report.json: ${detail}`,
    errorNoFilesInFolder: "No files found in the selected folder.",
    errorTooManyFilesZip: (count, max) =>
      `This zip contains ${count} files, which is more than this in-browser tool is designed for (${max}). Make sure you didn't zip node_modules, or scan a smaller folder.`,
    errorTooManyFilesFolder: (count, max) =>
      `This folder contains ${count} files, which is more than this in-browser tool is designed for (${max}). Make sure you didn't select a folder that includes node_modules, or pick a smaller project folder.`,
  },

  dashboard: {
    headerMeta: (scriptCount, sourceLabel) => `${scriptCount} scripts · ${sourceLabel}`,
    sourceScanned: (name, fileCount) => `${name} · ${fileCount} files scanned`,
    statDeadPaths: "Dead paths",
    statStaleCommands: "Stale commands",
    statUncoveredFolders: "Uncovered folders",
    statWarnings: "Warnings",
    captionDeadPaths: "docs point here, code doesn't",
    captionStaleCommands: "won't run as written",
    captionUncoveredFolders: "code with no doc mentions",
    captionWarnings: "found, but easy to misread",
    noIssuesMatchFilter: "No issues match the active filters.",
    successMessageHtml: "No drift detected.<br>Docs and repo structure are in sync.",
    selectIssuePrompt: "Select an issue on the left to inspect it.",
    sourceContextLabel: "Source context",
    contextLabel: "Context",
    noSourceNote: "This issue comes from comparing the repo tree directly — it has no single doc line to point to.",
    nextStepLabel: "Next step",
    repoStructureLoc: "repo structure",
  },

  issueTypes: {
    deadPath: {
      label: "Dead path",
      nextStep: "Open the doc at this line and fix or remove the reference — the file no longer exists at this path.",
    },
    staleCommand: {
      label: "Stale command",
      nextStep: "Update the command in your docs, or add/rename the matching script in package.json.",
    },
    missingScript: {
      label: "Missing script",
      nextStep: "Add a package.json with this script, or remove the command from your docs.",
    },
    uncoveredFolder: {
      label: "Uncovered folder",
      nextStep: "Add a short section to your docs explaining what this folder is for.",
    },
    uncoveredFileGroup: {
      label: "Uncovered group",
      nextStep: "Add a short section to your docs covering this group of files.",
    },
    ambiguousReference: {
      label: "Ambiguous ref",
      nextStep: "Replace the bare filename in your docs with its full path so readers aren't left guessing.",
    },
  },
};
