/**
 * The shared contract every locale file must satisfy.
 *
 * To add a new language: create `web/src/i18n/<code>.ts` implementing this
 * interface, then register it in `web/src/i18n/index.ts` (two lines: the
 * import and one entry in `DICTIONARIES` + `SUPPORTED_LOCALES`). Nothing
 * else in the app needs to change — same low-coupling pattern as
 * `core/types.ts` for the analysis engine.
 *
 * Interpolated strings are functions, not templates, so word order and
 * (the lack of) pluralization can differ correctly per language.
 */
export interface Translations {
  meta: {
    title: string;
    description: string;
  };

  lang: {
    /** aria-label on the language <select> */
    switchLabel: string;
  };

  topbar: {
    downloadReport: string;
    downloadJson: string;
    downloadMarkdown: string;
    downloadCsv: string;
    analyzeAnother: string;
  };

  onboarding: {
    heroTitle: string;
    heroSub: string;
    reassuranceProject: string;
    reassurancePrivacy: string;
    reassuranceOutput: string;
    dropZip: string;
    chooseZip: string;
    chooseFolder: string;
    changeSource: string;
    analyzeProject: string;
    loadExisting: string;
  };

  picker: {
    selectedFilesCount: (n: number) => string;
    loadingZip: string;
    loadingGeneric: string;
    errorNotZip: string;
    errorDragNotZip: string;
    errorAnalyzeGeneric: string;
    errorInvalidReport: string;
    errorReadReport: (detail: string) => string;
    errorNoFilesInFolder: string;
    errorTooManyFilesZip: (count: number, max: number) => string;
    errorTooManyFilesFolder: (count: number, max: number) => string;
  };

  dashboard: {
    headerMeta: (scriptCount: number, sourceLabel: string) => string;
    sourceScanned: (name: string, fileCount: number) => string;
    statDeadPaths: string;
    statStaleCommands: string;
    statUncoveredFolders: string;
    statWarnings: string;
    captionDeadPaths: string;
    captionStaleCommands: string;
    captionUncoveredFolders: string;
    captionWarnings: string;
    noIssuesMatchFilter: string;
    successMessageHtml: string;
    selectIssuePrompt: string;
    sourceContextLabel: string;
    contextLabel: string;
    noSourceNote: string;
    nextStepLabel: string;
    repoStructureLoc: string;
  };

  issueTypes: {
    deadPath: { label: string; nextStep: string };
    staleCommand: { label: string; nextStep: string };
    missingScript: { label: string; nextStep: string };
    uncoveredFolder: { label: string; nextStep: string };
    uncoveredFileGroup: { label: string; nextStep: string };
    ambiguousReference: { label: string; nextStep: string };
  };
}
