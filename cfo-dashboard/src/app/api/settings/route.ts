import { NextResponse } from "next/server";
import { getSettings, setSetting } from "@/lib/settings";

export async function GET() {
  const settings = await getSettings();
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const body = await req.json();
  const updates: Record<string, unknown> = body.updates ?? {};
  for (const [key, value] of Object.entries(updates)) {
    await setSetting(key, value);
  }
  return NextResponse.json({ ok: true });
}
