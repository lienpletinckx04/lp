import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const date = new Date(body.date ?? new Date());
  date.setHours(0, 0, 0, 0);
  const amount = Number(body.amount);
  if (Number.isNaN(amount)) {
    return NextResponse.json({ ok: false, error: "amount vereist" }, { status: 400 });
  }
  const snapshot = await prisma.cashSnapshot.upsert({
    where: { date },
    update: { amount, note: body.note ?? null },
    create: { date, amount, note: body.note ?? null },
  });
  return NextResponse.json({ ok: true, snapshot });
}
