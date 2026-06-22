import "./styles.css";
import {
  analyzeProject,
  toCsv,
  toJson,
  toMarkdown,
  DEFAULT_SCAN_OPTIONS,
  type DocsGapReport,
} from "../../src/browser";
import { LoaderError, loadFromFileList, loadFromZipFile } from "./browserLoader";
import { renderDetail, renderFilters, renderIssueList, renderSummary, type DashboardState } from "./ui";
import {
  SUPPORTED_LOCALES,
  applyStaticTranslations,
  getLocale,
  getTranslations,
  onLocaleChange,
  setLocale,
  type Locale,
} from "./i18n";

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}

function formatBytes(n: number): string {
  // Byte-size units are conventionally left untranslated even in
  // localized UIs (KB/MB read fine in both languages here).
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

type PickedSource = { kind: "zip"; file: File } | { kind: "folder"; fileList: FileList };
type SourceInfo = { name: string; fileCount: number | null };

let pickedSource: PickedSource | null = null;
let dashboardState: DashboardState | null = null;
let currentSourceInfo: SourceInfo | null = null;

function describeError(e: unknown): string {
  const t = getTranslations().picker;
  if (e instanceof LoaderError) {
    switch (e.code) {
      case "TOO_MANY_FILES_ZIP":
        return t.errorTooManyFilesZip(e.detail.count, e.detail.max);
      case "TOO_MANY_FILES_FOLDER":
        return t.errorTooManyFilesFolder(e.detail.count, e.detail.max);
      case "NO_FILES_IN_FOLDER":
        return t.errorNoFilesInFolder;
    }
  }
  return t.errorAnalyzeGeneric;
}

// ---------------------------------------------------------------------------
// Picker (onboarding) state transitions
// ---------------------------------------------------------------------------

function showPickerEmpty(): void {
  $("pickerEmpty").hidden = false;
  $("pickerSelected").hidden = true;
  $("pickerLoading").hidden = true;
  $("pickerError").hidden = true;
  pickedSource = null;
}

function showPickerSelected(name: string, meta: string): void {
  $("pickerEmpty").hidden = true;
  $("pickerSelected").hidden = false;
  $("pickerLoading").hidden = true;
  $("pickerError").hidden = true;
  $("selectedName").textContent = name;
  $("selectedMeta").textContent = meta;
}

function showPickerLoading(label: string): void {
  $("pickerEmpty").hidden = true;
  $("pickerSelected").hidden = true;
  $("pickerLoading").hidden = false;
  $("pickerError").hidden = true;
  $("loadingLabel").textContent = label;
}

function showPickerError(message: string): void {
  $("pickerLoading").hidden = true;
  $("pickerError").hidden = false;
  $("pickerError").textContent = message;
  // Let the user retry from whichever state they were in.
  if (pickedSource) $("pickerSelected").hidden = false;
  else $("pickerEmpty").hidden = false;
}

function onZipPicked(file: File): void {
  if (!file.name.toLowerCase().endsWith(".zip")) {
    showPickerError(getTranslations().picker.errorNotZip);
    return;
  }
  pickedSource = { kind: "zip", file };
  showPickerSelected(file.name, formatBytes(file.size));
}

function onFolderPicked(fileList: FileList): void {
  if (fileList.length === 0) return;
  pickedSource = { kind: "folder", fileList };
  const rootName = fileList[0].webkitRelativePath.split("/")[0] || "project";
  showPickerSelected(rootName, getTranslations().picker.selectedFilesCount(fileList.length));
}

async function runAnalysis(): Promise<void> {
  if (!pickedSource) return;
  const t = getTranslations().picker;
  showPickerLoading(pickedSource.kind === "zip" ? t.loadingZip : t.loadingGeneric);

  try {
    const opts = DEFAULT_SCAN_OPTIONS;
    const loaded =
      pickedSource.kind === "zip"
        ? await loadFromZipFile(pickedSource.file, opts)
        : await loadFromFileList(pickedSource.fileList, opts);

    const report = analyzeProject({ files: loaded.files }, opts);
    showDashboard(report, { name: loaded.name, fileCount: loaded.fileCount });
  } catch (e) {
    showPickerError(describeError(e));
  }
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

function renderHeaderMeta(): void {
  if (!dashboardState || !currentSourceInfo) return;
  const t = getTranslations().dashboard;
  const sourceLabel =
    currentSourceInfo.fileCount === null
      ? currentSourceInfo.name
      : t.sourceScanned(currentSourceInfo.name, currentSourceInfo.fileCount);
  $("headerMeta").textContent = t.headerMeta(dashboardState.report.repoIndex.scriptCount, sourceLabel);
}

function showDashboard(report: DocsGapReport, sourceInfo: SourceInfo): void {
  $("onboarding").hidden = true;
  $("reportView").hidden = false;
  $("resetBtn").hidden = false;
  $("dlMenu").hidden = false;
  $("headerMeta").hidden = false;

  currentSourceInfo = sourceInfo;
  dashboardState = {
    report,
    activeTypes: new Set(report.issues.map((i) => i.type)),
    selected: report.issues.length ? 0 : -1,
  };

  renderHeaderMeta();
  renderAll();
}

function renderAll(): void {
  if (!dashboardState) return;
  renderSummary(dashboardState.report);
  renderFilters(dashboardState, () => renderAll());
  renderIssueList(dashboardState, onSelectIssue);
  renderDetail(dashboardState);
}

function onSelectIssue(idx: number): void {
  if (!dashboardState) return;
  dashboardState.selected = idx;
  renderIssueList(dashboardState, onSelectIssue);
  renderDetail(dashboardState);
}

function resetToOnboarding(): void {
  dashboardState = null;
  currentSourceInfo = null;
  $("onboarding").hidden = false;
  $("reportView").hidden = true;
  $("resetBtn").hidden = true;
  $("dlMenu").hidden = true;
  $("headerMeta").hidden = true;
  ($("dlOptions") as HTMLElement).hidden = true;
  ($("zipInput") as HTMLInputElement).value = "";
  ($("folderInput") as HTMLInputElement).value = "";
  ($("jsonInput") as HTMLInputElement).value = "";
  showPickerEmpty();
}

// ---------------------------------------------------------------------------
// Language switcher
// ---------------------------------------------------------------------------

function renderLangButtons(): void {
  const container = $("langSwitcher");
  const active = getLocale();
  container.setAttribute("aria-label", getTranslations().lang.switchLabel);
  container.innerHTML = SUPPORTED_LOCALES.map((l) =>
    `<button type="button" class="lang-switcher__btn${l.code === active ? " is-active" : ""}" ` +
    `data-lang="${l.code}" aria-pressed="${l.code === active}">${l.label}</button>`
  ).join("");
  container.querySelectorAll<HTMLButtonElement>(".lang-switcher__btn").forEach((btn) => {
    btn.addEventListener("click", () => setLocale(btn.getAttribute("data-lang") as Locale));
  });
}

function setupLangSwitch(): void {
  renderLangButtons();
  onLocaleChange(() => {
    renderLangButtons();
    applyStaticTranslations();
    renderHeaderMeta();
    if (dashboardState) renderAll();
  });
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

applyStaticTranslations();
setupLangSwitch();

$("zipBtn").addEventListener("click", () => ($("zipInput") as HTMLInputElement).click());
$("zipInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (file) onZipPicked(file);
});

$("folderBtn").addEventListener("click", () => ($("folderInput") as HTMLInputElement).click());
$("folderInput").addEventListener("change", (e) => {
  const fileList = (e.target as HTMLInputElement).files;
  if (fileList && fileList.length) onFolderPicked(fileList);
});

$("analyzeBtn").addEventListener("click", () => void runAnalysis());
$("changeSourceBtn").addEventListener("click", showPickerEmpty);

const pickerCard = $("pickerCard");
["dragenter", "dragover"].forEach((evt) =>
  pickerCard.addEventListener(evt, (e) => { e.preventDefault(); pickerCard.classList.add("dragover"); })
);
["dragleave", "drop"].forEach((evt) =>
  pickerCard.addEventListener(evt, (e) => { e.preventDefault(); pickerCard.classList.remove("dragover"); })
);
pickerCard.addEventListener("drop", (e) => {
  // Drag & drop only supports zip files reliably cross-browser; folders go
  // through the explicit "Choose a folder" button (webkitdirectory input).
  const file = (e as DragEvent).dataTransfer?.files?.[0];
  if (!file) return;
  if (file.name.toLowerCase().endsWith(".zip")) {
    onZipPicked(file);
  } else {
    showPickerError(getTranslations().picker.errorDragNotZip);
  }
});

$("loadExistingBtn").addEventListener("click", () => ($("jsonInput") as HTMLInputElement).click());
$("jsonInput").addEventListener("change", (e) => {
  const file = (e.target as HTMLInputElement).files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const report = JSON.parse(String(reader.result)) as DocsGapReport;
      if (!report || !report.summary || !report.issues) {
        throw new Error(getTranslations().picker.errorInvalidReport);
      }
      showDashboard(report, { name: file.name, fileCount: null });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      showPickerError(getTranslations().picker.errorReadReport(detail));
    }
  };
  reader.readAsText(file);
});

$("resetBtn").addEventListener("click", resetToOnboarding);

const dlBtn = $("dlBtn");
const dlOptions = $("dlOptions");
dlBtn.addEventListener("click", () => {
  const expanded = dlBtn.getAttribute("aria-expanded") === "true";
  dlBtn.setAttribute("aria-expanded", String(!expanded));
  dlOptions.hidden = expanded;
});
document.addEventListener("click", (e) => {
  if (!dlOptions.hidden && !$("dlMenu").contains(e.target as Node)) {
    dlOptions.hidden = true;
    dlBtn.setAttribute("aria-expanded", "false");
  }
});
dlOptions.querySelectorAll<HTMLButtonElement>("button").forEach((btn) => {
  btn.addEventListener("click", () => {
    if (!dashboardState) return;
    const format = btn.getAttribute("data-format")!;
    const writers: Record<string, () => { content: string; ext: string; mime: string }> = {
      json: () => ({ content: toJson(dashboardState!.report), ext: "json", mime: "application/json" }),
      md: () => ({ content: toMarkdown(dashboardState!.report), ext: "md", mime: "text/markdown" }),
      csv: () => ({ content: toCsv(dashboardState!.report), ext: "csv", mime: "text/csv" }),
    };
    const { content, ext, mime } = writers[format]();
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `docsgap-report.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
    dlOptions.hidden = true;
    dlBtn.setAttribute("aria-expanded", "false");
  });
});
