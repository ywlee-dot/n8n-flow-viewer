// app/api/workflows/route.ts
import { NextResponse } from "next/server";
import { ghListDir } from "@/lib/github";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const team = searchParams.get("team") || "";

  // 간단한 path 방어
  if (!team || team.includes("..") || team.includes("\\") || team.startsWith("/")) {
    return NextResponse.json({ error: "Invalid team" }, { status: 400 });
  }

  const items = await ghListDir(team);
  const workflows = items
    .filter((x) => x.type === "file" && x.name.toLowerCase().endsWith(".json"))
    .map((x) => ({ name: x.name, path: x.path }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ workflows }, { headers: { "Cache-Control": "s-maxage=30" } });
}
