// app/api/teams/route.ts
import { NextResponse } from "next/server";
import { ghListDir } from "@/lib/github";

export async function GET() {
  // repo 루트에서 dir만 팀으로 취급
  const items = await ghListDir("");
  const teams = items
    .filter((x) => x.type === "dir")
    .map((x) => ({ name: x.name, path: x.path }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return NextResponse.json({ teams }, { headers: { "Cache-Control": "s-maxage=30" } });
}
