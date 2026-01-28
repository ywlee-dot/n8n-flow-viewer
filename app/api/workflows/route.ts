// app/api/workflow/route.ts
import { NextResponse } from "next/server";
import { ghGetJsonFile } from "@/lib/github";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path") || "";

  if (!path || path.includes("..") || path.includes("\\") || path.startsWith("/")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  if (!path.toLowerCase().endsWith(".json")) {
    return NextResponse.json({ error: "Only .json allowed" }, { status: 400 });
  }

  const wf = await ghGetJsonFile(path);
  return NextResponse.json({ workflow: wf }, { headers: { "Cache-Control": "s-maxage=30" } });
}
