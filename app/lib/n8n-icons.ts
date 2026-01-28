import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

type IconUrl = string | { light?: string; dark?: string };
type NodeTypeDef = { name: string; iconUrl?: IconUrl };

const require = createRequire(import.meta.url);
const resolvedPkg = require.resolve("n8n-nodes-base/package.json");
const pkgDir =
  resolvedPkg.includes("[project]") || resolvedPkg.startsWith("file://")
    ? path.join(process.cwd(), "node_modules", "n8n-nodes-base")
    : path.dirname(resolvedPkg);
const nodesJsonPath = path.join(pkgDir, "dist/types/nodes.json");

let nodeIconPathMap: Map<string, string> | null = null;
const dataUrlCache = new Map<string, string>();

function loadNodeIconPathMap(): Map<string, string> {
  if (nodeIconPathMap) return nodeIconPathMap;
  if (!existsSync(nodesJsonPath)) {
    nodeIconPathMap = new Map();
    return nodeIconPathMap;
  }
  const raw = JSON.parse(readFileSync(nodesJsonPath, "utf8")) as NodeTypeDef[];
  const map = new Map<string, string>();
  for (const node of raw) {
    if (!node?.name || !node?.iconUrl) continue;
    const iconUrl = pickIconUrl(node.iconUrl);
    if (!iconUrl) continue;
    const iconPath = resolveIconPath(iconUrl);
    if (iconPath) map.set(node.name, iconPath);
  }
  nodeIconPathMap = map;
  return map;
}

function pickIconUrl(iconUrl: IconUrl): string | null {
  if (typeof iconUrl === "string") return iconUrl;
  return iconUrl.light || iconUrl.dark || null;
}

function resolveIconPath(iconUrl: string): string | null {
  const cleaned = iconUrl.replace(/^icons\/n8n-nodes-base\//, "");
  const candidate1 = path.join(pkgDir, cleaned);
  if (existsSync(candidate1)) return candidate1;
  const candidate2 = path.join(pkgDir, iconUrl);
  if (existsSync(candidate2)) return candidate2;
  return null;
}

function toDataUrl(filePath: string): string | null {
  if (dataUrlCache.has(filePath)) return dataUrlCache.get(filePath)!;
  const ext = path.extname(filePath).toLowerCase();
  const mime =
    ext === ".svg"
      ? "image/svg+xml"
      : ext === ".png"
        ? "image/png"
        : ext === ".jpg" || ext === ".jpeg"
          ? "image/jpeg"
          : "application/octet-stream";
  const base64 = readFileSync(filePath).toString("base64");
  const dataUrl = `data:${mime};base64,${base64}`;
  dataUrlCache.set(filePath, dataUrl);
  return dataUrl;
}

function normalizeType(type: string): string {
  const trimmed = type.trim();
  const last = trimmed.split(".").pop();
  return last || trimmed;
}

export function getIconDataUrlForType(type: string): string | null {
  if (!type) return null;
  const map = loadNodeIconPathMap();
  const key = normalizeType(type);
  const iconPath = map.get(key);
  if (!iconPath) return null;
  return toDataUrl(iconPath);
}
