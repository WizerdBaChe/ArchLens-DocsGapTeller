import type { DocsGapReport, Issue, IssueType } from "../../src/browser";
import { getTranslations } from "./i18n";

const ICONS: Record<string, string> = {
  "dead-path": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 6M15 9l-6 6"/></svg>',
  "stale-command": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9l3 3-3 3M13 15h4"/></svg>',
  "missing-script": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9.5 13l4 4M13.5 13l-4 4"/></svg>',
  "uncovered-folder": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  "uncovered-file-group": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>',
  "ambiguous-reference": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.8.4-1 .9-1 1.7"/><path d="M12 17h.01"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8.5 12.5l2.5 2.5 5-5"/></svg>',
};

interface TypeMeta {
  label: string;
  color: string;
  nextStep: string;
}

/**
 * Built fresh from the active locale's dictionary on every call (cheap —
 * it's just object literals), so a language switch only needs to re-run
 * the render functions below, never touch this mapping by hand.
 */
function getTypeMeta(): Record<string, TypeMeta> {
  const t = getTranslations().issueTypes;
  return {
    "dead-path": { label: t.deadPath.label, color: "var(--danger)", nextStep: t.deadPath.nextStep },
    "stale-command": { label: t.staleCommand.label, color: "var(--warning)", nextStep: t.staleCommand.nextStep },
    "missing-script": { label: t.missingScript.label, color: "var(--warning)", nextStep: t.missingScript.nextStep },
    "uncovered-folder": { label: t.uncoveredFolder.label, color: "var(--info)", nextStep: t.uncoveredFolder.nextStep },
    "uncovered-file-group": { label: t.uncoveredFileGroup.label, color: "var(--info)", nextStep: t.uncoveredFileGroup.nextStep },
    "ambiguous-reference": { label: t.ambiguousReference.label, color: "var(--caution)", nextStep: t.ambiguousReference.nextStep },
  };
}

export interface DashboardState {
  report: DocsGapReport;
  activeTypes: Set<string>;
  selected: number;
}

function $(id: string): HTMLElement {
  const el = document.getElementById(id);
  if (!el) throw new Error(`missing #${id}`);
  return el;
}
function escapeHtml(s: string): string {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c] as string));
}

function statCard(cls: string, label: string, value: number, pct: number, caption: string): string {
  return (
    `<div class="stat ${cls}"><div class="label">${label}</div>` +
    `<div class="value">${value}</div>` +
    `<div class="caption">${caption}</div>` +
    `<div class="bar" style="width:${pct}%"></div></div>`
  );
}

export function renderSummary(report: DocsGapReport): void {
  const t = getTranslations().dashboard;
  const s = report.summary;
  const max = Math.max(s.deadPaths, s.staleCommands, s.uncoveredFolders, s.warnings, 1);
  const pct = (n: number) => Math.max(4, Math.round((n / max) * 100));
  $("summary").innerHTML =
    '<div class="scan-beam"></div>' +
    statCard("dead", t.statDeadPaths, s.deadPaths, pct(s.deadPaths), t.captionDeadPaths) +
    statCard("stale", t.statStaleCommands, s.staleCommands, pct(s.staleCommands), t.captionStaleCommands) +
    statCard("uncovered", t.statUncoveredFolders, s.uncoveredFolders, pct(s.uncoveredFolders), t.captionUncoveredFolders) +
    statCard("warn", t.statWarnings, s.warnings, pct(s.warnings), t.captionWarnings);
}

export function renderFilters(state: DashboardState, onChange: () => void): void {
  const typeMeta = getTypeMeta();
  const counts: Record<string, number> = {};
  state.report.issues.forEach((i) => { counts[i.type] = (counts[i.type] || 0) + 1; });

  let html = "";
  (Object.keys(typeMeta) as IssueType[]).forEach((type) => {
    if (!counts[type]) return;
    const meta = typeMeta[type];
    const active = state.activeTypes.has(type);
    html += `<button class="chip" data-type="${type}" aria-pressed="${active}" style="--chip-color:${meta.color}; color:${active ? meta.color : ""}">` +
      `${ICONS[type]}<span>${meta.label}</span><span class="count">${counts[type]}</span></button>`;
  });
  $("filters").innerHTML = html;

  $("filters").querySelectorAll<HTMLButtonElement>(".chip").forEach((chip) => {
    chip.addEventListener("click", () => {
      const type = chip.getAttribute("data-type")!;
      if (state.activeTypes.has(type)) state.activeTypes.delete(type);
      else state.activeTypes.add(type);
      onChange();
    });
  });
}

function visibleIssues(state: DashboardState): Issue[] {
  return state.report.issues.filter((i) => state.activeTypes.has(i.type));
}

export function renderIssueList(state: DashboardState, onSelect: (idx: number) => void): void {
  const t = getTranslations().dashboard;
  const typeMeta = getTypeMeta();
  const issues = visibleIssues(state);
  const container = $("issueList");

  if (state.report.issues.length === 0) {
    container.innerHTML = "";
    $("detailPane").innerHTML =
      `<div class="success-banner">${ICONS.check.replace(/currentColor/g, "var(--success)")}` +
      `<div>${t.successMessageHtml}</div></div>`;
    return;
  }

  if (issues.length === 0) {
    container.innerHTML = `<div class="empty-list">${ICONS["ambiguous-reference"]}<div>${escapeHtml(t.noIssuesMatchFilter)}</div></div>`;
    return;
  }

  container.innerHTML = issues.map((issue) => {
    const meta = typeMeta[issue.type] ?? { label: issue.type, color: "var(--info)" };
    const loc = issue.docPath ? issue.docPath + (issue.line ? `:${issue.line}` : "") : t.repoStructureLoc;
    const realIdx = state.report.issues.indexOf(issue);
    return `<button class="issue-row" data-idx="${realIdx}" style="--row-color:${meta.color}" aria-current="${realIdx === state.selected}">` +
      `<div class="row-top">${ICONS[issue.type]}<span class="ref">${escapeHtml(issue.reference)}</span></div>` +
      `<div class="reason">${escapeHtml(issue.reason)}</div>` +
      `<div class="loc">${escapeHtml(loc)}</div></button>`;
  }).join("");

  container.querySelectorAll<HTMLButtonElement>(".issue-row").forEach((row) => {
    row.addEventListener("click", () => onSelect(parseInt(row.getAttribute("data-idx")!, 10)));
  });
}

export function renderDetail(state: DashboardState): void {
  const t = getTranslations().dashboard;
  const typeMeta = getTypeMeta();
  const pane = $("detailPane");
  if (state.report.issues.length === 0) return; // success banner already rendered by renderIssueList

  if (state.selected < 0 || !state.report.issues[state.selected]) {
    pane.innerHTML = `<div class="empty-detail">${ICONS["ambiguous-reference"]}<div>${escapeHtml(t.selectIssuePrompt)}</div></div>`;
    return;
  }

  const issue = state.report.issues[state.selected];
  const meta = typeMeta[issue.type] ?? { label: issue.type, color: "var(--info)", nextStep: "" };

  let sourceHtml: string;
  if (issue.sourceContext) {
    const escaped = escapeHtml(issue.sourceContext);
    const refEsc = escapeHtml(issue.reference);
    const highlighted = escaped.split(refEsc).join(`<mark>${refEsc}</mark>`);
    sourceHtml =
      `<div class="field-label">${escapeHtml(t.sourceContextLabel)}</div>` +
      `<div class="source-block">` +
      `<div class="file-line">${escapeHtml(issue.docPath || "")}${issue.line ? ":" + issue.line : ""}</div>` +
      `<pre>${highlighted}</pre>` +
      `</div>`;
  } else {
    sourceHtml =
      `<div class="field-label">${escapeHtml(t.contextLabel)}</div>` +
      `<div class="no-source-note">${escapeHtml(t.noSourceNote)}</div>`;
  }

  pane.innerHTML =
    `<span class="detail-badge" style="--badge-color:${meta.color}">${ICONS[issue.type]}${meta.label}</span>` +
    `<h2>${escapeHtml(issue.reference)}</h2>` +
    `<p class="reason-text">${escapeHtml(issue.reason)}</p>` +
    `<div style="margin-top:24px;">${sourceHtml}</div>` +
    `<div class="next-step-block" style="margin-top:16px;"><div class="field-label">${escapeHtml(t.nextStepLabel)}</div><p>${escapeHtml(meta.nextStep)}</p></div>`;
}
