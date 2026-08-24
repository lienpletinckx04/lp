"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SyncButton() {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const router = useRouter();

  async function sync() {
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch("/api/stripe/sync", { method: "POST" });
      const data = await res.json();
      if (data.ok === false) {
        setMsg(data.message ?? "Sync overgeslagen.");
      } else {
        setMsg(
          `Gesynct: ${data.membersSynced ?? 0} leden, ${data.transactionsSynced ?? 0} transacties, ${data.invoicesSynced ?? 0} facturen.`
        );
        router.refresh();
      }
    } catch {
      setMsg("Sync mislukt.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={sync}
        disabled={loading}
        className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
      >
        {loading ? "Bezig…" : "Sync met Stripe"}
      </button>
      {msg && <span className="text-xs text-muted">{msg}</span>}
    </div>
  );
}
