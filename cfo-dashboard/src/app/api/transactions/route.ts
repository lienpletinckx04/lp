import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const tx = await prisma.transaction.create({
    data: {
      date: body.date ? new Date(body.date) : new Date(),
      amount: Number(body.amount) || 0,
      pijler: body.pijler ?? "other",
      source: "manual",
      customer: body.customer ?? null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json({ ok: true, tx });
}
