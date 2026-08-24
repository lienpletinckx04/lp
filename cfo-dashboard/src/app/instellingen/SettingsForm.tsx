"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Settings = Record<string, unknown>;

const MONTHS = ["2026-09", "2026-10", "2026-11", "2026-12"];

export default function SettingsForm({ initial }: { initial: Settings }) {
  const router = useRouter();
  const [values, setValues] = useState<Settings>(initial);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const mrrTargets = (values.mrrTargets ?? {}) as Record<string, number>;
  const marketing = (values.marketing ?? {}) as Record<string, number>;

  function num(key: string) {
    return Number(values[key] ?? 0);
  }
  function setNum(key: string, v: string) {
    setValues({ ...values, [key]: Number(v) });
  }

  async function save() {
    setSaving(true);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ updates: values }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {saved && <div className="chip-ok rounded-lg px-4 py-2 text-sm font-medium">Instellingen opgeslagen.</div>}

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">MRR-doelpad (Voorsprong)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {MONTHS.map((m) => (
            <div key={m}>
              <label className="mb-1 block text-xs text-muted">{m}</label>
              <input
                type="number"
                value={mrrTargets[m] ?? 0}
                onChange={(e) =>
                  setValues({ ...values, mrrTargets: { ...mrrTargets, [m]: Number(e.target.value) } })
                }
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Pipeline & sales</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Audits/maand doel" value={num("auditTargetPerMonth")} onChange={(v) => setNum("auditTargetPerMonth", v)} />
          <Field label="Audit→traject doel %" value={num("auditToTrajectConversionTarget")} onChange={(v) => setNum("auditToTrajectConversionTarget", v)} />
          <Field label="Audit→traject alarm %" value={num("auditToTrajectConversionAlarm")} onChange={(v) => setNum("auditToTrajectConversionAlarm", v)} />
          <Field label="Workshops doel tegen dec." value={num("workshopTargetByDec")} onChange={(v) => setNum("workshopTargetByDec", v)} />
          <Field label="Voorstel opvolg-alarm (dagen)" value={num("proposalFollowupDays")} onChange={(v) => setNum("proposalFollowupDays", v)} />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Financieel</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="BTW %" value={num("btwPct")} onChange={(v) => setNum("btwPct", v)} />
          <Field label="Belastingreserve %" value={num("taxReservePct")} onChange={(v) => setNum("taxReservePct", v)} />
          <Field label="Buffer (EUR)" value={num("bufferAmount")} onChange={(v) => setNum("bufferAmount", v)} />
          <Field label="Vaste kosten/maand" value={num("costsFixedMonthly")} onChange={(v) => setNum("costsFixedMonthly", v)} />
          <Field label="Variabele kosten/maand" value={num("costsVariableMonthly")} onChange={(v) => setNum("costsVariableMonthly", v)} />
          <Field label="Factuur amber (dagen)" value={num("invoiceAmberDays")} onChange={(v) => setNum("invoiceAmberDays", v)} />
          <Field label="Factuur rood (dagen)" value={num("invoiceRedDays")} onChange={(v) => setNum("invoiceRedDays", v)} />
          <Field label="Concentratierisico alarm %" value={num("concentrationAlarmPct")} onChange={(v) => setNum("concentrationAlarmPct", v)} />
          <Field label="Runway alarm (maanden)" value={num("runwayAlarmMonths")} onChange={(v) => setNum("runwayAlarmMonths", v)} />
          <Field label="MRR-doel alarm %" value={num("mrrTargetAlarmPct")} onChange={(v) => setNum("mrrTargetAlarmPct", v)} />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Capaciteit & churn</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Field label="Beschikbare werkdagen/week" value={num("availableWorkdaysPerWeek")} onChange={(v) => setNum("availableWorkdaysPerWeek", v)} />
          <Field label="Backlog alarm (weken)" value={num("backlogAlarmWeeks")} onChange={(v) => setNum("backlogAlarmWeeks", v)} />
          <Field label="Churn alarm %" value={num("churnAlarmPct")} onChange={(v) => setNum("churnAlarmPct", v)} />
        </div>
      </section>

      <section className="card p-4">
        <h2 className="mb-3 text-sm font-semibold text-ink">Marketingfunnel (handmatig — Phase 2)</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {(
            [
              ["emailListSize", "E-maillijst grootte"],
              ["emailListGrowthMonthly", "Groei e-maillijst/maand"],
              ["openRatePct", "Open rate %"],
              ["hubFreeMembers", "Hub free leden"],
              ["challengeParticipants", "Challenge deelnemers"],
              ["challengeConversionTargetPct", "Challenge conversie doel %"],
              ["webinarSignups", "Webinar aanmeldingen"],
              ["webinarAttendance", "Webinar opkomst"],
              ["webinarConversionPct", "Webinar conversie %"],
            ] as [string, string][]
          ).map(([key, label]) => (
            <div key={key}>
              <label className="mb-1 block text-xs text-muted">{label}</label>
              <input
                type="number"
                value={marketing[key] ?? 0}
                onChange={(e) => setValues({ ...values, marketing: { ...marketing, [key]: Number(e.target.value) } })}
              />
            </div>
          ))}
          <div>
            <label className="mb-1 block text-xs text-muted">Totaal Hub-leden (voor conversie)</label>
            <input type="number" value={num("hubTotalLeden")} onChange={(e) => setNum("hubTotalLeden", e.target.value)} />
          </div>
        </div>
      </section>

      <button
        onClick={save}
        disabled={saving}
        className="w-fit rounded-md bg-accent px-5 py-2 text-sm font-medium text-white disabled:opacity-60"
      >
        {saving ? "Opslaan…" : "Instellingen opslaan"}
      </button>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs text-muted">{label}</label>
      <input type="number" value={value} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}
