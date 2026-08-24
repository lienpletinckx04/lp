import { prisma } from "./db";
import { getSettings } from "./settings";

export const PIJLERS = [
  "voorsprong",
  "audit",
  "traject",
  "retainer",
  "workshop",
  "challenge",
  "other",
] as const;

const STAGE_PROB: Record<string, number> = {
  gesprek: 0.25,
  voorstel: 0.5,
  akkoord: 0.8,
  gewonnen: 1,
  verloren: 0,
};

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function addMonths(d: Date, n: number) {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
function daysBetween(a: Date, b: Date) {
  return Math.floor((a.getTime() - b.getTime()) / 86400000);
}

export async function computeDashboard() {
  const settings = await getSettings();
  const now = new Date();
  const monthStart = startOfMonth(now);
  const lastMonthStart = addMonths(monthStart, -1);
  const nextMonthStart = addMonths(monthStart, 1);
  const sameMonthLastYearStart = new Date(now.getFullYear() - 1, now.getMonth(), 1);
  const sameMonthLastYearEnd = new Date(now.getFullYear() - 1, now.getMonth() + 1, 1);
  const twelveMonthsAgo = addMonths(monthStart, -11);

  const [transactions, invoices, deals, members, days, cashSnapshots] = await Promise.all([
    prisma.transaction.findMany({ orderBy: { date: "asc" } }),
    prisma.invoice.findMany({ orderBy: { sentAt: "asc" } }),
    prisma.deal.findMany({ orderBy: { lastContact: "desc" } }),
    prisma.member.findMany(),
    prisma.dayEntry.findMany({ orderBy: { date: "asc" } }),
    prisma.cashSnapshot.findMany({ orderBy: { date: "desc" }, take: 1 }),
  ]);

  // ---------- SECTION 1: Cash & profit ----------
  const cashToday = cashSnapshots[0]?.amount ?? 0;
  const cashDate = cashSnapshots[0]?.date ?? null;

  const revenueThisMonth = sumInRange(transactions, monthStart, nextMonthStart);
  const revenueLastMonth = sumInRange(transactions, lastMonthStart, monthStart);
  const revenueSameMonthLastYear = sumInRange(
    transactions,
    sameMonthLastYearStart,
    sameMonthLastYearEnd
  );

  // revenue by pijler, 12 months trailing
  const monthlyByPijler: { month: string; [k: string]: number | string }[] = [];
  for (let i = 0; i < 12; i++) {
    const mStart = addMonths(twelveMonthsAgo, i);
    const mEnd = addMonths(mStart, 1);
    const row: { month: string; [k: string]: number | string } = { month: monthKey(mStart) };
    for (const p of PIJLERS) {
      row[p] = sumInRange(
        transactions.filter((t) => t.pijler === p),
        mStart,
        mEnd
      );
    }
    monthlyByPijler.push(row);
  }

  const recurringThisMonth = sumInRange(
    transactions.filter((t) => t.pijler === "voorsprong"),
    monthStart,
    nextMonthStart
  );
  const recurringShareThisMonth = revenueThisMonth > 0 ? (recurringThisMonth / revenueThisMonth) * 100 : 0;
  const recurringLastMonth = sumInRange(
    transactions.filter((t) => t.pijler === "voorsprong"),
    lastMonthStart,
    monthStart
  );
  const recurringShareLastMonth = revenueLastMonth > 0 ? (recurringLastMonth / revenueLastMonth) * 100 : 0;
  const twoMonthsAgoStart = addMonths(monthStart, -2);
  const revenueTwoMonthsAgo = sumInRange(transactions, twoMonthsAgoStart, lastMonthStart);
  const recurringTwoMonthsAgo = sumInRange(
    transactions.filter((t) => t.pijler === "voorsprong"),
    twoMonthsAgoStart,
    lastMonthStart
  );
  const recurringShareTwoMonthsAgo =
    revenueTwoMonthsAgo > 0 ? (recurringTwoMonthsAgo / revenueTwoMonthsAgo) * 100 : 0;
  const recurringShareDeclining2Months =
    recurringShareThisMonth < recurringShareLastMonth && recurringShareLastMonth < recurringShareTwoMonthsAgo;

  const costsFixed = Number(settings.costsFixedMonthly ?? 0);
  const costsVariable = Number(settings.costsVariableMonthly ?? 0);
  const costsMonthly = costsFixed + costsVariable;
  const grossMargin = revenueThisMonth > 0 ? ((revenueThisMonth - costsVariable) / revenueThisMonth) * 100 : 0;

  const runwayMonths = costsMonthly > 0 ? cashToday / costsMonthly : Infinity;

  // reserves
  const btwPct = Number(settings.btwPct ?? 21);
  const taxReservePct = Number(settings.taxReservePct ?? 25);
  const bufferAmount = Number(settings.bufferAmount ?? 0);
  const invoicedNotRemitted = invoices
    .filter((i) => !i.paidAt || true) // BTW reserve based on invoiced (sent) revenue not yet remitted; simplified: all sent invoices this + last quarter
    .filter((i) => i.sentAt >= addMonths(monthStart, -3))
    .reduce((s, i) => s + i.amount, 0);
  const btwReserve = invoicedNotRemitted * (btwPct / (100 + btwPct)); // VAT portion assuming amount incl. BTW
  const taxReserve = revenueThisMonth * (taxReservePct / 100);
  const reallyAvailableCash = cashToday - btwReserve - taxReserve - bufferAmount;

  const outstandingInvoices = invoices
    .filter((i) => i.status !== "paid" && i.status !== "canceled")
    .map((i) => {
      const days = daysBetween(now, i.sentAt);
      const severity = days > 30 ? "red" : days > 14 ? "amber" : "ok";
      return { ...i, daysOpen: days, severity };
    })
    .sort((a, b) => b.daysOpen - a.daysOpen);

  // ---------- SECTION 2: Voorsprong / recurring engine ----------
  const activeMembers = members.filter((m) => m.status === "active");
  const mrr = activeMembers.reduce((s, m) => s + m.amount, 0);
  const membersByPlan = {
    founder: activeMembers.filter((m) => m.plan === "founder").length,
    regular: activeMembers.filter((m) => m.plan === "regular").length,
    annual: activeMembers.filter((m) => m.plan === "annual").length,
  };
  const newMembersThisMonth = members.filter(
    (m) => m.startedAt >= monthStart && m.startedAt < nextMonthStart
  ).length;
  const canceledThisMonth = members.filter(
    (m) => m.canceledAt && m.canceledAt >= monthStart && m.canceledAt < nextMonthStart
  ).length;
  const netGrowthThisMonth = newMembersThisMonth - canceledThisMonth;
  const activeAtStartOfMonth = members.filter(
    (m) => m.startedAt < monthStart && (!m.canceledAt || m.canceledAt >= monthStart)
  ).length;
  const churnPct = activeAtStartOfMonth > 0 ? (canceledThisMonth / activeAtStartOfMonth) * 100 : 0;
  const arpu = activeMembers.length > 0 ? mrr / activeMembers.length : 0;
  const ltv = churnPct > 0 ? arpu * (100 / churnPct) : arpu * 24; // fallback: assume 24mo lifetime if no churn yet
  const annualShare = activeMembers.length > 0 ? (membersByPlan.annual / activeMembers.length) * 100 : 0;
  const hubTotalLeden = Number(settings.hubTotalLeden ?? 0);
  const freeToPaidConversionPct = hubTotalLeden > 0 ? (activeMembers.length / hubTotalLeden) * 100 : 0;

  const mrrByMonth: { month: string; mrr: number; target: number }[] = [];
  const mrrTargets = (settings.mrrTargets ?? {}) as Record<string, number>;
  for (let i = 0; i < 12; i++) {
    const mStart = addMonths(twelveMonthsAgo, i);
    const mEnd = addMonths(mStart, 1);
    const activeAtMonthEnd = members.filter(
      (m) => m.startedAt < mEnd && (!m.canceledAt || m.canceledAt >= mEnd)
    );
    const key = monthKey(mStart);
    mrrByMonth.push({
      month: key,
      mrr: activeAtMonthEnd.reduce((s, m) => s + m.amount, 0),
      target: mrrTargets[key] ?? 0,
    });
  }
  const currentMonthTarget = mrrTargets[monthKey(monthStart)] ?? 0;
  const mrrBelowTargetPct = currentMonthTarget > 0 ? ((currentMonthTarget - mrr) / currentMonthTarget) * 100 : 0;

  // ---------- SECTION 3: Pipeline & sales ----------
  const openDeals = deals.filter((d) => d.stage !== "gewonnen" && d.stage !== "verloren");
  const weightedPipeline = openDeals.reduce(
    (s, d) => s + d.amount * (STAGE_PROB[d.stage] ?? 0),
    0
  );
  const auditsBookedThisMonth = deals.filter(
    (d) => d.type === "audit" && d.createdAt >= monthStart && d.createdAt < nextMonthStart
  ).length;
  const auditsDeliveredThisMonth = deals.filter(
    (d) =>
      d.type === "audit" &&
      d.stage === "gewonnen" &&
      d.closedAt &&
      d.closedAt >= monthStart &&
      d.closedAt < nextMonthStart
  ).length;
  const auditsPlanned = deals.filter((d) => d.type === "audit" && openDeals.includes(d)).length;

  const threeMonthsAgo = addMonths(monthStart, -3);
  const auditsWonLast3Months = deals.filter(
    (d) => d.type === "audit" && d.stage === "gewonnen" && d.closedAt && d.closedAt >= threeMonthsAgo
  );
  const trajectenWonLast3Months = deals.filter(
    (d) => d.type === "traject" && d.stage === "gewonnen" && d.closedAt && d.closedAt >= threeMonthsAgo
  );
  const auditToTrajectConversionPct =
    auditsWonLast3Months.length > 0
      ? (trajectenWonLast3Months.length / auditsWonLast3Months.length) * 100
      : 0;
  const avgTrajectDealValue =
    trajectenWonLast3Months.length > 0
      ? trajectenWonLast3Months.reduce((s, d) => s + d.amount, 0) / trajectenWonLast3Months.length
      : 0;

  const decemberEnd = new Date(now.getFullYear(), 11, 31);
  const workshopsBookedNext2Quarters = deals.filter(
    (d) => d.type === "workshop" && (d.stage === "akkoord" || d.stage === "gewonnen")
  ).length;
  const workshopsBookedByDec = deals.filter(
    (d) =>
      d.type === "workshop" &&
      (d.stage === "gewonnen" || d.stage === "akkoord") &&
      (!d.closedAt || d.closedAt <= decemberEnd)
  ).length;

  const openProposals = deals
    .filter((d) => d.stage === "voorstel")
    .map((d) => ({ ...d, daysSinceContact: daysBetween(now, d.lastContact) }))
    .sort((a, b) => b.daysSinceContact - a.daysSinceContact);

  // ---------- SECTION 4: Capacity & delivery ----------
  const daysThisMonth = days.filter((d) => d.date >= monthStart && d.date < nextMonthStart);
  const daysByType = {
    billable: sumCount(daysThisMonth, "billable"),
    content: sumCount(daysThisMonth, "content"),
    product: sumCount(daysThisMonth, "product"),
    admin: sumCount(daysThisMonth, "admin"),
  };
  const totalDaysWorkedThisMonth = Object.values(daysByType).reduce((a, b) => a + b, 0);
  const availableWorkdaysPerWeek = Number(settings.availableWorkdaysPerWeek ?? 4);
  const weeksInMonth = 52 / 12;
  const availableWorkdaysThisMonth = availableWorkdaysPerWeek * weeksInMonth;
  const utilizationPct =
    availableWorkdaysThisMonth > 0 ? (daysByType.billable / availableWorkdaysThisMonth) * 100 : 0;
  const revenuePerWorkedDay = totalDaysWorkedThisMonth > 0 ? revenueThisMonth / totalDaysWorkedThisMonth : 0;

  const backlogDays = openDeals
    .filter((d) => d.stage === "akkoord" || d.stage === "gewonnen")
    .reduce((s, d) => s + (d.deliveredDays ?? 0), 0);
  const backlogWeeks = availableWorkdaysPerWeek > 0 ? backlogDays / availableWorkdaysPerWeek : 0;
  const backlogAlarmWeeks = Number(settings.backlogAlarmWeeks ?? 6);

  // ---------- SECTION 5: Marketing funnel (Phase 2 stub, manual entry) ----------
  const marketing = (settings.marketing ?? {}) as Record<string, number>;

  // ---------- concentration risk ----------
  const quarterStart = addMonths(monthStart, -((monthStart.getMonth() % 3)));
  const quarterTransactions = transactions.filter((t) => t.date >= quarterStart);
  const quarterRevenue = quarterTransactions.reduce((s, t) => s + t.amount, 0);
  const byCustomer: Record<string, number> = {};
  for (const t of quarterTransactions) {
    if (!t.customer) continue;
    byCustomer[t.customer] = (byCustomer[t.customer] ?? 0) + t.amount;
  }
  let topCustomer = "";
  let topCustomerAmount = 0;
  for (const [c, amt] of Object.entries(byCustomer)) {
    if (amt > topCustomerAmount) {
      topCustomer = c;
      topCustomerAmount = amt;
    }
  }
  const concentrationPct = quarterRevenue > 0 ? (topCustomerAmount / quarterRevenue) * 100 : 0;
  const concentrationAlarmPct = Number(settings.concentrationAlarmPct ?? 30);

  // ---------- SECTION 6: Alerts ----------
  const invoiceAmberDays = Number(settings.invoiceAmberDays ?? 14);
  const proposalFollowupDays = Number(settings.proposalFollowupDays ?? 7);
  const runwayAlarmMonths = Number(settings.runwayAlarmMonths ?? 4);
  const churnAlarmPct = Number(settings.churnAlarmPct ?? 5);
  const mrrTargetAlarmPct = Number(settings.mrrTargetAlarmPct ?? 15);
  const auditToTrajectConversionAlarm = Number(settings.auditToTrajectConversionAlarm ?? 30);

  const alerts: { id: string; severity: "red" | "amber"; message: string }[] = [];
  if (churnPct > churnAlarmPct) {
    alerts.push({
      id: "churn",
      severity: "red",
      message: `Churn deze maand ${churnPct.toFixed(1)}% (> ${churnAlarmPct}%)`,
    });
  }
  if (Number.isFinite(runwayMonths) && runwayMonths < runwayAlarmMonths) {
    alerts.push({
      id: "runway",
      severity: "red",
      message: `Runway nog maar ${runwayMonths.toFixed(1)} maanden (< ${runwayAlarmMonths})`,
    });
  }
  const oldInvoices = outstandingInvoices.filter((i) => i.daysOpen > invoiceAmberDays);
  if (oldInvoices.length > 0) {
    alerts.push({
      id: "invoices",
      severity: oldInvoices.some((i) => i.daysOpen > 30) ? "red" : "amber",
      message: `${oldInvoices.length} openstaande factu(u)r(en) > ${invoiceAmberDays} dagen`,
    });
  }
  if (concentrationPct > concentrationAlarmPct && topCustomer) {
    alerts.push({
      id: "concentration",
      severity: "amber",
      message: `${topCustomer} is ${concentrationPct.toFixed(0)}% van omzet dit kwartaal (concentratierisico)`,
    });
  }
  if (recurringShareDeclining2Months) {
    alerts.push({
      id: "recurring-declining",
      severity: "amber",
      message: `Aandeel recurring omzet daalt 2 maanden op rij`,
    });
  }
  const staleProposals = openProposals.filter((p) => p.daysSinceContact > proposalFollowupDays);
  if (staleProposals.length > 0) {
    alerts.push({
      id: "proposals",
      severity: "amber",
      message: `${staleProposals.length} voorstel(len) > ${proposalFollowupDays} dagen zonder opvolging`,
    });
  }
  if (backlogWeeks > backlogAlarmWeeks) {
    alerts.push({
      id: "backlog",
      severity: "amber",
      message: `Backlog ${backlogWeeks.toFixed(1)} weken werk (> ${backlogAlarmWeeks})`,
    });
  }
  if (currentMonthTarget > 0 && mrrBelowTargetPct > mrrTargetAlarmPct) {
    alerts.push({
      id: "mrr-target",
      severity: "red",
      message: `MRR ${mrrBelowTargetPct.toFixed(0)}% onder doel voor deze maand (>${mrrTargetAlarmPct}%)`,
    });
  }

  return {
    settings,
    generatedAt: now.toISOString(),
    section1: {
      cashToday,
      cashDate,
      runwayMonths,
      revenueThisMonth,
      revenueLastMonth,
      revenueSameMonthLastYear,
      monthlyByPijler,
      recurringShareThisMonth,
      costsFixed,
      costsVariable,
      costsMonthly,
      grossMargin,
      btwReserve,
      taxReserve,
      bufferAmount,
      reallyAvailableCash,
      outstandingInvoices,
    },
    section2: {
      mrr,
      mrrByMonth,
      currentMonthTarget,
      membersByPlan,
      activeMemberCount: activeMembers.length,
      newMembersThisMonth,
      canceledThisMonth,
      netGrowthThisMonth,
      churnPct,
      churnAlarmPct,
      arpu,
      ltv,
      freeToPaidConversionPct,
      hubTotalLeden,
      annualShare,
    },
    section3: {
      weightedPipeline,
      auditsBookedThisMonth,
      auditsDeliveredThisMonth,
      auditsPlanned,
      auditTargetPerMonth: Number(settings.auditTargetPerMonth ?? 3),
      auditToTrajectConversionPct,
      auditToTrajectConversionTarget: Number(settings.auditToTrajectConversionTarget ?? 40),
      auditToTrajectConversionAlarm,
      avgTrajectDealValue,
      workshopsBookedNext2Quarters,
      workshopsBookedByDec,
      workshopTargetByDec: Number(settings.workshopTargetByDec ?? 6),
      openProposals,
      proposalFollowupDays,
    },
    section4: {
      daysByType,
      totalDaysWorkedThisMonth,
      availableWorkdaysThisMonth,
      utilizationPct,
      revenuePerWorkedDay,
      backlogDays,
      backlogWeeks,
      backlogAlarmWeeks,
    },
    section5: { marketing },
    alerts,
    concentration: { topCustomer, concentrationPct, concentrationAlarmPct },
    openDealsCount: openDeals.length,
    allDeals: deals,
  };
}

function sumInRange(items: { date: Date; amount: number }[], start: Date, end: Date) {
  return items
    .filter((t) => t.date >= start && t.date < end)
    .reduce((s, t) => s + t.amount, 0);
}

function sumCount(items: { type: string; count: number }[], type: string) {
  return items.filter((d) => d.type === type).reduce((s, d) => s + d.count, 0);
}
