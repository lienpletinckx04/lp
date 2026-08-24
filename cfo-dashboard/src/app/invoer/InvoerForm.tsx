"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Deal = {
  id: string;
  customer: string;
  type: string;
  amount: number;
  stage: string;
  lastContact: string;
};

const STAGES = ["gesprek", "voorstel", "akkoord", "gewonnen", "verloren"];
const DEAL_TYPES = ["audit", "traject", "workshop"];
const PIJLERS = ["voorsprong", "audit", "traject", "retainer", "workshop", "challenge", "other"];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function InvoerForm({
  deals,
  lastCashAmount,
}: {
  deals: Deal[];
  lastCashAmount: number;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const [cash, setCash] = useState(String(lastCashAmount || ""));
  const [days, setDays] = useState({ billable: "", content: "", product: "", admin: "" });
  const [newDeal, setNewDeal] = useState({ customer: "", type: "audit", amount: "", stage: "gesprek" });
  const [tx, setTx] = useState({ customer: "", amount: "", pijler: "audit", date: todayISO(), note: "" });
  const [inv, setInv] = useState({ customer: "", amount: "", sentAt: todayISO(), note: "" });

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  async function saveCash() {
    if (!cash) return;
    setBusy(true);
    await fetch("/api/cash", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: todayISO(), amount: Number(cash) }),
    });
    setBusy(false);
    flash("Cashpositie opgeslagen.");
    router.refresh();
  }

  async function saveDays() {
    const entries = Object.entries(days)
      .filter(([, v]) => v)
      .map(([type, v]) => ({ date: todayISO(), type, count: Number(v) }));
    if (entries.length === 0) return;
    setBusy(true);
    await fetch("/api/days", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entries }),
    });
    setBusy(false);
    setDays({ billable: "", content: "", product: "", admin: "" });
    flash("Dagen gelogd.");
    router.refresh();
  }

  async function addDeal() {
    if (!newDeal.customer || !newDeal.amount) return;
    setBusy(true);
    await fetch("/api/deals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newDeal),
    });
    setBusy(false);
    setNewDeal({ customer: "", type: "audit", amount: "", stage: "gesprek" });
    flash("Deal toegevoegd.");
    router.refresh();
  }

  async function moveDealStage(id: string, stage: string) {
    setBusy(true);
    await fetch("/api/deals", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage }),
    });
    setBusy(false);
    flash("Deal bijgewerkt.");
    router.refresh();
  }

  async function saveTx() {
    if (!tx.amount) return;
    setBusy(true);
    await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(tx),
    });
    setBusy(false);
    setTx({ customer: "", amount: "", pijler: "audit", date: todayISO(), note: "" });
    flash("Transactie toegevoegd.");
    router.refresh();
  }

  async function saveInv() {
    if (!inv.amount || !inv.customer) return;
    setBusy(true);
    await fetch("/api/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(inv),
    });
    setBusy(false);
    setInv({ customer: "", amount: "", sentAt: todayISO(), note: "" });
    flash("Factuur toegevoegd.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {toast && (
        <div className="chip-ok rounded-lg px-4 py-2 text-sm font-medium">{toast}</div>
      )}

      {/* Cash */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">1. Cashpositie vandaag</h2>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="decimal"
            placeholder="Saldo in EUR"
            value={cash}
            onChange={(e) => setCash(e.target.value)}
          />
          <button
            onClick={saveCash}
            disabled={busy}
            className="shrink-0 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            Opslaan
          </button>
        </div>
      </section>

      {/* Days */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">2. Gewerkte dagen — deze week</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(["billable", "content", "product", "admin"] as const).map((type) => (
            <div key={type}>
              <label className="mb-1 block text-xs capitalize text-muted">{type}</label>
              <input
                type="number"
                step="0.5"
                inputMode="decimal"
                placeholder="0"
                value={days[type]}
                onChange={(e) => setDays({ ...days, [type]: e.target.value })}
              />
            </div>
          ))}
        </div>
        <button
          onClick={saveDays}
          disabled={busy}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Dagen loggen
        </button>
      </section>

      {/* Pipeline */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">3. Pipeline</h2>
        <div className="mb-4 flex flex-col gap-2">
          {deals
            .filter((d) => d.stage !== "gewonnen" && d.stage !== "verloren")
            .map((d) => (
              <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border p-2">
                <div className="text-sm">
                  <span className="font-medium text-ink">{d.customer}</span>{" "}
                  <span className="text-muted capitalize">· {d.type} · €{d.amount}</span>
                </div>
                <select
                  value={d.stage}
                  onChange={(e) => moveDealStage(d.id, e.target.value)}
                  className="w-auto"
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          {deals.filter((d) => d.stage !== "gewonnen" && d.stage !== "verloren").length === 0 && (
            <p className="text-sm text-muted">Geen open deals.</p>
          )}
        </div>
        <h3 className="mb-2 text-xs font-medium uppercase text-muted">Nieuwe deal</h3>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            placeholder="Klant"
            value={newDeal.customer}
            onChange={(e) => setNewDeal({ ...newDeal, customer: e.target.value })}
          />
          <select value={newDeal.type} onChange={(e) => setNewDeal({ ...newDeal, type: e.target.value })}>
            {DEAL_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Bedrag"
            value={newDeal.amount}
            onChange={(e) => setNewDeal({ ...newDeal, amount: e.target.value })}
          />
          <select value={newDeal.stage} onChange={(e) => setNewDeal({ ...newDeal, stage: e.target.value })}>
            {STAGES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={addDeal}
          disabled={busy}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Deal toevoegen
        </button>
      </section>

      {/* Manual transaction */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">4. Losse transactie (niet-Stripe)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input placeholder="Klant" value={tx.customer} onChange={(e) => setTx({ ...tx, customer: e.target.value })} />
          <input
            type="number"
            placeholder="Bedrag"
            value={tx.amount}
            onChange={(e) => setTx({ ...tx, amount: e.target.value })}
          />
          <select value={tx.pijler} onChange={(e) => setTx({ ...tx, pijler: e.target.value })}>
            {PIJLERS.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <input type="date" value={tx.date} onChange={(e) => setTx({ ...tx, date: e.target.value })} />
        </div>
        <button
          onClick={saveTx}
          disabled={busy}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Transactie toevoegen
        </button>
      </section>

      {/* Manual invoice */}
      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">5. Losse factuur (niet-Stripe)</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <input
            placeholder="Klant"
            value={inv.customer}
            onChange={(e) => setInv({ ...inv, customer: e.target.value })}
          />
          <input
            type="number"
            placeholder="Bedrag"
            value={inv.amount}
            onChange={(e) => setInv({ ...inv, amount: e.target.value })}
          />
          <input type="date" value={inv.sentAt} onChange={(e) => setInv({ ...inv, sentAt: e.target.value })} />
          <input
            placeholder="Notitie"
            value={inv.note}
            onChange={(e) => setInv({ ...inv, note: e.target.value })}
          />
        </div>
        <button
          onClick={saveInv}
          disabled={busy}
          className="mt-3 rounded-md bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
        >
          Factuur toevoegen
        </button>
      </section>
    </div>
  );
}
