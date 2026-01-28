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

  console.log("[/api/workflow] start", { path });
  try {
    const wf = await ghGetJsonFile(path);
    const iconMap: Record<string, string> = {};
    for (const node of wf?.nodes || []) {
      const type = node?.type || "";
      if (!type || iconMap[type]) continue;
      const icon = getIconDataUrlForType(type);
      if (icon) iconMap[type] = icon;
    }
    console.log("[/api/workflow] success", {
      nodeCount: Array.isArray(wf?.nodes) ? wf.nodes.length : 0,
    });
    return NextResponse.json({ workflow: wf, iconMap }, { headers: { "Cache-Control": "s-maxage=30" } });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[/api/workflow] error", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
