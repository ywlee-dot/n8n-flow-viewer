// app/api/workflow/route.ts
import { NextResponse } from "next/server";
import { ghGetJsonFile } from "@/lib/github";
import { getIconDataUrlForType } from "@/lib/n8n-icons";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const rawPath = searchParams.get("path") || "";
  const path = rawPath.replace(/^\/+/, "");

  if (!path || path.includes("..") || path.includes("\\") || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!path.toLowerCase().endsWith(".json")) {
    return NextResponse.json({ error: "Only .json allowed" }, { status: 400 });
  }

  const wf = await ghGetJsonFile(path);
  const iconMap: Record<string, string> = {};
  for (const node of wf?.nodes || []) {
    const type = node?.type || "";
    if (!type || iconMap[type]) continue;
    const icon = getIconDataUrlForType(type);
    if (icon) iconMap[type] = icon;
  }
  return NextResponse.json({ workflow: wf, iconMap }, { headers: { "Cache-Control": "s-maxage=30" } });
}
