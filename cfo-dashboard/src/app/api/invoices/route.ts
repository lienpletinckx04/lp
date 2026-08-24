import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const inv = await prisma.invoice.create({
    data: {
      customer: body.customer,
      amount: Number(body.amount) || 0,
      sentAt: body.sentAt ? new Date(body.sentAt) : new Date(),
      status: body.status ?? "open",
      source: "manual",
      note: body.note ?? null,
    },
  });
  return NextResponse.json({ ok: true, inv });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ ok: false, error: "id vereist" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.status) {
    data.status = body.status;
    if (body.status === "paid") data.paidAt = new Date();
  }
  const inv = await prisma.invoice.update({ where: { id: body.id }, data });
  return NextResponse.json({ ok: true, inv });
}
