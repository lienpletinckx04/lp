import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getStripe, inferPlan, inferPijler } from "@/lib/stripe";

export const dynamic = "force-dynamic";

// Manual "Sync now" endpoint. Pulls active/recent Stripe subscriptions into
// Member rows and recent charges/invoices into Transaction/Invoice rows.
// Safe to call with no Stripe key configured — returns a clear message.
export async function POST() {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json(
      { ok: false, message: "STRIPE_SECRET_KEY is niet ingesteld — sync overgeslagen." },
      { status: 200 }
    );
  }

  let membersSynced = 0;
  let transactionsSynced = 0;
  let invoicesSynced = 0;

  // --- Subscriptions -> Members ---
  for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
    const customer =
      typeof sub.customer === "string" ? sub.customer : sub.customer?.id ?? "unknown";
    let customerName = customer;
    try {
      const cust = await stripe.customers.retrieve(
        typeof sub.customer === "string" ? sub.customer : sub.customer.id
      );
      if (cust && !("deleted" in cust && cust.deleted)) {
        customerName = (cust as { name?: string; email?: string }).name ??
          (cust as { name?: string; email?: string }).email ??
          customer;
      }
    } catch {
      // ignore, fall back to customer id
    }

    const price = sub.items.data[0]?.price;
    const amount = price?.unit_amount ? price.unit_amount / 100 : 0;
    const plan = inferPlan(price?.nickname);
    const status = sub.status === "active" || sub.status === "trialing" ? "active" : sub.status === "past_due" ? "past_due" : "canceled";

    await prisma.member.upsert({
      where: { stripeSubscriptionId: sub.id },
      update: {
        customer: customerName,
        plan,
        amount,
        status,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      },
      create: {
        customer: customerName,
        stripeSubscriptionId: sub.id,
        plan,
        amount,
        startedAt: new Date(sub.start_date * 1000),
        status,
        canceledAt: sub.canceled_at ? new Date(sub.canceled_at * 1000) : null,
      },
    });
    membersSynced++;
  }

  // --- Charges -> Transactions (last 100) ---
  const charges = await stripe.charges.list({ limit: 100 });
  for (const charge of charges.data) {
    if (charge.status !== "succeeded") continue;
    const existing = await prisma.transaction.findFirst({ where: { externalId: charge.id } });
    if (existing) continue;
    await prisma.transaction.create({
      data: {
        date: new Date(charge.created * 1000),
        amount: charge.amount / 100,
        pijler: inferPijler(charge.description),
        source: "stripe",
        customer:
          typeof charge.billing_details?.email === "string" ? charge.billing_details.email : null,
        externalId: charge.id,
        note: charge.description ?? undefined,
      },
    });
    transactionsSynced++;
  }

  // --- Invoices -> Invoice rows ---
  const stripeInvoices = await stripe.invoices.list({ limit: 100 });
  for (const inv of stripeInvoices.data) {
    if (!inv.id) continue;
    const status = inv.status === "paid" ? "paid" : inv.status === "open" ? "open" : "canceled";
    const customerName =
      inv.customer_name ?? inv.customer_email ?? (typeof inv.customer === "string" ? inv.customer : "unknown");
    await prisma.invoice.upsert({
      where: { id: `stripe_${inv.id}` },
      update: {
        status,
        paidAt: inv.status === "paid" && inv.status_transitions?.paid_at
          ? new Date(inv.status_transitions.paid_at * 1000)
          : null,
      },
      create: {
        id: `stripe_${inv.id}`,
        customer: customerName,
        amount: (inv.amount_due ?? 0) / 100,
        sentAt: new Date((inv.created ?? Date.now() / 1000) * 1000),
        paidAt:
          inv.status === "paid" && inv.status_transitions?.paid_at
            ? new Date(inv.status_transitions.paid_at * 1000)
            : null,
        status,
        source: "stripe",
        externalId: inv.id,
      },
    });
    invoicesSynced++;
  }

  return NextResponse.json({
    ok: true,
    membersSynced,
    transactionsSynced,
    invoicesSynced,
  });
}
