import { computeDashboard } from "@/lib/metrics";
import { eur, pct, num } from "@/lib/format";
import StatTile from "@/components/StatTile";
import SectionTitle from "@/components/SectionTitle";
import AlertsBar from "@/components/AlertsBar";
import ProgressBar from "@/components/ProgressBar";
import RevenueByPijlerChart from "@/components/RevenueByPijlerChart";
import MrrChart from "@/components/MrrChart";
import SyncButton from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const d = await computeDashboard();

  return (
    <div className="pb-8">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-ink">Weekoverzicht</h1>
          <p className="text-sm text-muted">
            Gegenereerd {new Date(d.generatedAt).toLocaleString("nl-BE")}
          </p>
        </div>
        <SyncButton />
      </div>

      <div className="mt-4">
        <AlertsBar alerts={d.alerts} />
      </div>

      {/* Section 1: Cash & profit */}
      <SectionTitle title="1 — Cash & winst" subtitle="Cashpositie, omzet, marges en reserves" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile
          label="Cashpositie"
          value={eur(d.section1.cashToday)}
          sub={d.section1.cashDate ? new Date(d.section1.cashDate).toLocaleDateString("nl-BE") : "geen data"}
        />
        <StatTile
          label="Runway"
          value={Number.isFinite(d.section1.runwayMonths) ? `${num(d.section1.runwayMonths)} mnd` : "∞"}
          tone={d.section1.runwayMonths < 4 ? "bad" : "good"}
        />
        <StatTile label="Omzet deze maand" value={eur(d.section1.revenueThisMonth)} />
        <StatTile label="Omzet vorige maand" value={eur(d.section1.revenueLastMonth)} />
        <StatTile label="Omzet zelfde maand vorig jaar" value={eur(d.section1.revenueSameMonthLastYear)} />
        <StatTile label="Aandeel recurring" value={pct(d.section1.recurringShareThisMonth)} />
        <StatTile label="Kosten/maand" value={eur(d.section1.costsMonthly)} sub={`vast ${eur(d.section1.costsFixed)} · variabel ${eur(d.section1.costsVariable)}`} />
        <StatTile label="Brutomarge" value={pct(d.section1.grossMargin)} />
        <StatTile label="BTW-reserve" value={eur(d.section1.btwReserve)} />
        <StatTile label="Belastingreserve" value={eur(d.section1.taxReserve)} />
        <StatTile label="Buffer" value={eur(d.section1.bufferAmount)} />
        <StatTile
          label="Echt beschikbaar"
          value={eur(d.section1.reallyAvailableCash)}
          tone={d.section1.reallyAvailableCash < 0 ? "bad" : "good"}
        />
      </div>

      <div className="mt-4 card p-4">
        <div className="mb-2 text-sm font-medium text-ink">Omzet per pijler — 12 maanden</div>
        <RevenueByPijlerChart data={d.section1.monthlyByPijler} />
      </div>

      <div className="mt-4 card overflow-hidden">
        <div className="border-b border-border px-4 py-2 text-sm font-medium text-ink">Openstaande facturen</div>
        {d.section1.outstandingInvoices.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted">Geen openstaande facturen.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="px-4 py-2">Klant</th>
                  <th className="px-4 py-2">Bedrag</th>
                  <th className="px-4 py-2">Verzonden</th>
                  <th className="px-4 py-2">Dagen open</th>
                </tr>
              </thead>
              <tbody>
                {d.section1.outstandingInvoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-border">
                    <td className="px-4 py-2">{inv.customer}</td>
                    <td className="px-4 py-2 tabular-nums">{eur(inv.amount)}</td>
                    <td className="px-4 py-2">{new Date(inv.sentAt).toLocaleDateString("nl-BE")}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          inv.severity === "red" ? "chip-red" : inv.severity === "amber" ? "chip-amber" : "chip-ok"
                        }`}
                      >
                        {inv.daysOpen} dagen
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Voorsprong */}
      <SectionTitle title="2 — Voorsprong (recurring engine)" subtitle="MRR, leden, churn en LTV" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="MRR" value={eur(d.section2.mrr)} sub={`doel deze maand: ${eur(d.section2.currentMonthTarget)}`} />
        <StatTile
          label="Actieve leden"
          value={String(d.section2.activeMemberCount)}
          sub={`founder ${d.section2.membersByPlan.founder} · regular ${d.section2.membersByPlan.regular} · jaar ${d.section2.membersByPlan.annual}`}
        />
        <StatTile label="Nieuw deze maand" value={String(d.section2.newMembersThisMonth)} tone="good" />
        <StatTile label="Opzeggingen deze maand" value={String(d.section2.canceledThisMonth)} tone={d.section2.canceledThisMonth > 0 ? "warn" : "default"} />
        <StatTile label="Netto groei" value={String(d.section2.netGrowthThisMonth)} tone={d.section2.netGrowthThisMonth >= 0 ? "good" : "bad"} />
        <StatTile
          label="Churn"
          value={pct(d.section2.churnPct)}
          tone={d.section2.churnPct > d.section2.churnAlarmPct ? "bad" : "good"}
          sub={`alarm boven ${d.section2.churnAlarmPct}%`}
        />
        <StatTile label="ARPU" value={eur(d.section2.arpu, { maximumFractionDigits: 2 })} />
        <StatTile label="LTV" value={eur(d.section2.ltv)} />
        <StatTile
          label="Free → paid conversie"
          value={d.section2.hubTotalLeden > 0 ? pct(d.section2.freeToPaidConversionPct) : "—"}
          sub="Hub-integratie: Phase 2, gebruikt handmatig ingevoerd totaal Hub-leden"
        />
        <StatTile label="Aandeel jaarplan" value={pct(d.section2.annualShare)} />
      </div>
      <div className="mt-4 card p-4">
        <div className="mb-2 text-sm font-medium text-ink">MRR vs doelpad</div>
        <MrrChart data={d.section2.mrrByMonth} />
      </div>

      {/* Section 3: Pipeline & sales */}
      <SectionTitle title="3 — Pipeline & sales" subtitle="Audits, trajecten, workshops en voorstellen" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="Gewogen pipeline" value={eur(d.section3.weightedPipeline)} />
        <StatTile
          label="Audits deze maand"
          value={`${d.section3.auditsBookedThisMonth} geboekt / ${d.section3.auditsDeliveredThisMonth} geleverd`}
          sub={`doel: ${d.section3.auditTargetPerMonth}/maand · gepland: ${d.section3.auditsPlanned}`}
        />
        <StatTile
          label="Audit → traject conversie"
          value={pct(d.section3.auditToTrajectConversionPct)}
          tone={d.section3.auditToTrajectConversionPct < d.section3.auditToTrajectConversionAlarm ? "bad" : "good"}
          sub={`doel ${d.section3.auditToTrajectConversionTarget}% · rolling 3 mnd`}
        />
        <StatTile label="Gem. trajectwaarde" value={eur(d.section3.avgTrajectDealValue)} />
        <StatTile
          label="Workshops geboekt (2 kwartalen)"
          value={String(d.section3.workshopsBookedNext2Quarters)}
          sub={`doel: ${d.section3.workshopTargetByDec} tegen dec.`}
        />
      </div>
      <div className="mt-4 card overflow-hidden">
        <div className="border-b border-border px-4 py-2 text-sm font-medium text-ink">Open voorstellen</div>
        {d.section3.openProposals.length === 0 ? (
          <div className="px-4 py-4 text-sm text-muted">Geen open voorstellen.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-muted">
                  <th className="px-4 py-2">Klant</th>
                  <th className="px-4 py-2">Type</th>
                  <th className="px-4 py-2">Bedrag</th>
                  <th className="px-4 py-2">Dagen sinds contact</th>
                </tr>
              </thead>
              <tbody>
                {d.section3.openProposals.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-2">{p.customer}</td>
                    <td className="px-4 py-2 capitalize">{p.type}</td>
                    <td className="px-4 py-2 tabular-nums">{eur(p.amount)}</td>
                    <td className="px-4 py-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          p.daysSinceContact > d.section3.proposalFollowupDays ? "chip-amber" : "chip-ok"
                        }`}
                      >
                        {p.daysSinceContact} dagen
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 4: Capacity & delivery */}
      <SectionTitle title="4 — Capaciteit & levering" subtitle="Bezetting, omzet per gewerkte dag, backlog" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile
          label="Dagen deze maand"
          value={num(d.section4.totalDaysWorkedThisMonth)}
          sub={`billable ${num(d.section4.daysByType.billable)} · content ${num(d.section4.daysByType.content)} · product ${num(d.section4.daysByType.product)} · admin ${num(d.section4.daysByType.admin)}`}
        />
        <StatTile label="Bezettingsgraad" value={pct(d.section4.utilizationPct)} sub={`op basis van ${num(d.section4.availableWorkdaysThisMonth)} beschikbare dagen`} />
        <StatTile label="Omzet per gewerkte dag" value={eur(d.section4.revenuePerWorkedDay, { maximumFractionDigits: 2 })} />
        <StatTile
          label="Backlog"
          value={`${num(d.section4.backlogWeeks)} weken`}
          tone={d.section4.backlogWeeks > d.section4.backlogAlarmWeeks ? "warn" : "good"}
          sub={`${num(d.section4.backlogDays)} dagen verkocht, nog niet geleverd`}
        />
      </div>

      {/* Section 5: Marketing funnel (Phase 2 stub) */}
      <SectionTitle title="5 — Marketingfunnel" subtitle="Handmatige invoer — automatisering volgt in Phase 2" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        <StatTile label="E-maillijst" value={String(d.section5.marketing.emailListSize ?? 0)} sub="Phase 2: Brevo" />
        <StatTile label="Open rate" value={pct(Number(d.section5.marketing.openRatePct ?? 0))} sub="Phase 2: Brevo" />
        <StatTile label="Hub free leden" value={String(d.section5.marketing.hubFreeMembers ?? 0)} sub="Phase 2: Hub" />
        <StatTile label="Challenge deelnemers" value={String(d.section5.marketing.challengeParticipants ?? 0)} sub={`doel conversie ${d.section5.marketing.challengeConversionTargetPct ?? 10}%`} />
        <StatTile label="Webinar aanmeldingen" value={String(d.section5.marketing.webinarSignups ?? 0)} sub="Phase 2" />
        <StatTile label="Webinar opkomst" value={String(d.section5.marketing.webinarAttendance ?? 0)} sub="Phase 2" />
      </div>

      {/* Section 7: Monthly goals */}
      <SectionTitle title="7 — Maanddoelen" />
      <div className="card grid grid-cols-1 gap-5 p-4 sm:grid-cols-2">
        <ProgressBar label="MRR-doelpad" value={d.section2.mrr} target={d.section2.currentMonthTarget} format={(n) => eur(n)} />
        <ProgressBar
          label="Audits/maand"
          value={d.section3.auditsBookedThisMonth}
          target={d.section3.auditTargetPerMonth}
          format={(n) => n.toFixed(0)}
        />
        <ProgressBar
          label="Audit → traject conversie"
          value={d.section3.auditToTrajectConversionPct}
          target={d.section3.auditToTrajectConversionTarget}
          format={(n) => `${n.toFixed(0)}%`}
        />
        <ProgressBar
          label="Workshops cumulatief (tegen dec.)"
          value={d.section3.workshopsBookedByDec}
          target={d.section3.workshopTargetByDec}
          format={(n) => n.toFixed(0)}
        />
        <ProgressBar
          label="Churn (lager is beter)"
          value={d.section2.churnPct}
          target={d.section2.churnAlarmPct}
          format={(n) => `${n.toFixed(1)}%`}
          invert
        />
      </div>
    </div>
  );
}
