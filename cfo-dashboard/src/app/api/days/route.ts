import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const entries: { date: string; type: string; count: number }[] = body.entries ?? [];
  const created = [];
  for (const e of entries) {
    if (!e.count || Number(e.count) === 0) continue;
    created.push(
      await prisma.dayEntry.create({
        data: { date: new Date(e.date), type: e.type, count: Number(e.count) },
      })
    );
  }
  return NextResponse.json({ ok: true, created: created.length });
}
