import { NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/db";
import { getStripe, inferPijler, inferPlan } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Stripe webhook: checkout.session.completed, invoice.paid,
// customer.subscription.updated / .deleted. Verifies the signature with
// STRIPE_WEBHOOK_SECRET. If Stripe isn't configured this just 200s.
export async function POST(req: Request) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json(
      { ok: false, message: "Stripe niet geconfigureerd." },
      { status: 200 }
    );
  }

  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    if (!sig) throw new Error("missing signature");
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Invalid signature: ${err}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.amount_total) {
        await prisma.transaction.create({
          data: {
            date: new Date(),
            amount: session.amount_total / 100,
            pijler: "other", // TODO: map from line items/metadata for accurate pijler
            source: "stripe",
            customer: session.customer_details?.email ?? undefined,
            externalId: session.id,
            note: "checkout.session.completed",
          },
        });
      }
      break;
    }
    case "invoice.paid": {
      const inv = event.data.object as Stripe.Invoice;
      await prisma.invoice.upsert({
        where: { id: `stripe_${inv.id}` },
        update: { status: "paid", paidAt: new Date() },
        create: {
          id: `stripe_${inv.id}`,
          customer: inv.customer_name ?? inv.customer_email ?? "unknown",
          amount: (inv.amount_paid ?? 0) / 100,
          sentAt: new Date((inv.created ?? Date.now() / 1000) * 1000),
          paidAt: new Date(),
          status: "paid",
          source: "stripe",
          externalId: inv.id ?? undefined,
        },
      });
      break;
    }
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const price = sub.items.data[0]?.price;
      const status =
        sub.status === "active" || sub.status === "trialing"
          ? "active"
          : sub.status === "past_due"
          ? "past_due"
          : "canceled";
      await prisma.member.upsert({
        where: { stripeSubscriptionId: sub.id },
        update: {
          status,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
          amount: price?.unit_amount ? price.unit_amount / 100 : undefined,
          plan: inferPlan(price?.nickname),
        },
        create: {
          customer: typeof sub.customer === "string" ? sub.customer : sub.customer.id,
          stripeSubscriptionId: sub.id,
          plan: inferPlan(price?.nickname),
          amount: price?.unit_amount ? price.unit_amount / 100 : 0,
          startedAt: new Date(sub.start_date * 1000),
          status,
          canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
        },
      });
      break;
    }
    default:
      break;
  }

  return NextResponse.json({ ok: true });
}

// silence unused import lint in case inferPijler isn't used in every branch
void inferPijler;
