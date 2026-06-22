import type { DocsGapReport } from "../core/types";

export function toJson(report: DocsGapReport): string {
  return JSON.stringify(report, null, 2);
}
