/**
 * archlensSchema.ts — VENDOR 副本（請勿在此檔改格式）
 *
 * 來源（單一事實來源）：D:\AIWork\ArchLens_Series\packages\schema\archlens-schema.ts
 * 這是 ArchLens 系列共用交換信封的複製品。要改信封格式：先改上述來源，再同步此副本。
 * 之後正式套件化為 `@archlens/schema` 時，本檔可移除、改為版本依賴。
 *
 * 對應系列層 AGENTS.md 的 Layer B（資料可組合）。
 */

/** 信封格式版本。 */
export const ARCHLENS_ENVELOPE_VERSION = "1.0";

export type ArchlensKind = "tree" | "graph" | "diff" | "docsgap";
export type TreeNodeType = "file" | "dir";

export interface TreeNode {
  path: string;
  type: TreeNodeType;
  contentHash?: string;
}

export interface TreePayload {
  root?: string;
  nodes: TreeNode[];
}

export interface ArchlensSource {
  product?: string;
  generatedAt?: string;
  name?: string;
  [key: string]: unknown;
}

export interface ArchlensEnvelope<K extends ArchlensKind = ArchlensKind, P = unknown> {
  archlens: string;
  kind: K;
  source?: ArchlensSource;
  payload: P;
}

export type TreeEnvelope = ArchlensEnvelope<"tree", TreePayload>;
export type GraphEnvelope = ArchlensEnvelope<"graph">;
export type DocsgapEnvelope = ArchlensEnvelope<"docsgap">;

export function wrap<K extends ArchlensKind, P>(
  kind: K,
  payload: P,
  source?: ArchlensSource,
): ArchlensEnvelope<K, P> {
  return {
    archlens: ARCHLENS_ENVELOPE_VERSION,
    kind,
    ...(source ? { source } : {}),
    payload,
  };
}

export function wrapTree(
  nodes: TreeNode[],
  source?: ArchlensSource,
  root?: string,
): TreeEnvelope {
  return wrap("tree", root ? { root, nodes } : { nodes }, source);
}

export function isArchlensEnvelope(value: unknown): value is ArchlensEnvelope {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return typeof v.archlens === "string" && typeof v.kind === "string" && "payload" in v;
}

export function isTreeEnvelope(value: unknown): value is TreeEnvelope {
  if (!isArchlensEnvelope(value) || value.kind !== "tree") return false;
  const payload = (value as TreeEnvelope).payload as Partial<TreePayload> | undefined;
  return !!payload && Array.isArray(payload.nodes);
}
