import type { DocsGapReport } from "../core/types";
import { wrap } from "../schema/archlensSchema";

/**
 * 匯出時包進 ArchLens 系列共用信封（kind: "docsgap"），讓 CLI 與 web 的 JSON 輸出
 * 與 web/diff/dependency 一致（Layer B）。完整報告保留在 `payload`，下游讀 `.payload`。
 */
export function toJson(report: DocsGapReport): string {
  const envelope = wrap("docsgap", report, {
    product: "docsgap",
    generatedAt: report.generatedAt,
  });
  return JSON.stringify(envelope, null, 2);
}
