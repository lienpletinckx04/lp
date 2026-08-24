import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const deal = await prisma.deal.create({
    data: {
      customer: body.customer,
      type: body.type,
      amount: Number(body.amount) || 0,
      stage: body.stage ?? "gesprek",
      lastContact: body.lastContact ? new Date(body.lastContact) : new Date(),
      deliveredDays: body.deliveredDays ? Number(body.deliveredDays) : null,
      note: body.note ?? null,
    },
  });
  return NextResponse.json({ ok: true, deal });
}

export async function PATCH(req: Request) {
  const body = await req.json();
  if (!body.id) return NextResponse.json({ ok: false, error: "id vereist" }, { status: 400 });
  const data: Record<string, unknown> = {};
  if (body.stage) {
    data.stage = body.stage;
    data.lastContact = new Date();
    if (body.stage === "gewonnen" || body.stage === "verloren") {
      data.closedAt = new Date();
    }
  }
  if (body.lastContact) data.lastContact = new Date(body.lastContact);
  if (body.amount !== undefined) data.amount = Number(body.amount);
  if (body.note !== undefined) data.note = body.note;
  const deal = await prisma.deal.update({ where: { id: body.id }, data });
  return NextResponse.json({ ok: true, deal });
}
