import { prisma } from "@/lib/db";
import InvoerForm from "./InvoerForm";

export const dynamic = "force-dynamic";

export default async function InvoerPage() {
  const [deals, lastCash] = await Promise.all([
    prisma.deal.findMany({ orderBy: { lastContact: "desc" }, take: 30 }),
    prisma.cashSnapshot.findFirst({ orderBy: { date: "desc" } }),
  ]);

  return (
    <div className="pb-8">
      <h1 className="text-xl font-semibold text-ink">Maandagochtend-routine</h1>
      <p className="mb-4 text-sm text-muted">
        5 minuten: cash, gewerkte dagen, pipeline-updates en losse transacties/facturen.
      </p>
      <InvoerForm
        deals={deals.map((d) => ({ ...d, lastContact: d.lastContact.toISOString() }))}
        lastCashAmount={lastCash?.amount ?? 0}
      />
    </div>
  );
}
