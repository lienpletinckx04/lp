import { prisma } from "./db";

// Default settings — used to seed the DB and as fallback when a key is missing.
// Keys marked "Phase 2/3" are manual-entry stubs until the real integration lands.
export const DEFAULT_SETTINGS: Record<string, unknown> = {
  // --- Section 1/2: recurring revenue & goals ---
  mrrTargets: {
    "2026-09": 900,
    "2026-10": 1600,
    "2026-11": 2300,
    "2026-12": 3000,
  },
  // --- Section 3: pipeline & sales targets ---
  auditTargetPerMonth: 3,
  auditToTrajectConversionTarget: 40, // %
  auditToTrajectConversionAlarm: 30, // %
  workshopTargetByDec: 6,
  proposalFollowupDays: 7,

  // --- churn ---
  churnAlarmPct: 5,

  // --- finance ---
  btwPct: 21,
  taxReservePct: 25,
  bufferAmount: 3000,
  costsFixedMonthly: 1200,
  costsVariableMonthly: 300,
  invoiceAmberDays: 14,
  invoiceRedDays: 30,
  concentrationAlarmPct: 30,

  // --- capacity ---
  availableWorkdaysPerWeek: 4,
  backlogAlarmWeeks: 6,

  // --- alerts ---
  runwayAlarmMonths: 4,
  mrrTargetAlarmPct: 15, // alarm if MRR >15% below target

  // --- Phase 2/3 stubs: funnel / marketing (manual entry for now) ---
  hubTotalLeden: 0, // TODO Phase 2: sync from Hub/membership platform for free->paid conversion
  marketing: {
    emailListSize: 0, // TODO Phase 2: Brevo API
    emailListGrowthMonthly: 0, // TODO Phase 2: Brevo API
    openRatePct: 0, // TODO Phase 2: Brevo API
    hubFreeMembers: 0, // TODO Phase 2: Hub integration
    challengeParticipants: 0, // TODO Phase 2: challenge funnel tool
    challengeConversionTargetPct: 10,
    webinarSignups: 0, // TODO Phase 2: Google Calendar / webinar tool
    webinarAttendance: 0, // TODO Phase 2
    webinarConversionPct: 0, // TODO Phase 2
  },

  // --- Phase 3 stubs, not yet used anywhere but reserved ---
  integrations: {
    brevoApiKey: "", // TODO Phase 2
    googleCalendarConnected: false, // TODO Phase 2
    accountingFeedConnected: false, // TODO Phase 3
    bankFeedConnected: false, // TODO Phase 3
    ga4PropertyId: "", // TODO Phase 3
    instagramConnected: false, // TODO Phase 3
  },
};

export type SettingsMap = Record<string, unknown>;

export async function getSettings(): Promise<SettingsMap> {
  const rows = await prisma.setting.findMany();
  const stored: SettingsMap = {};
  for (const row of rows) {
    try {
      stored[row.key] = JSON.parse(row.value);
    } catch {
      stored[row.key] = row.value;
    }
  }
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function getSetting<T = unknown>(key: string): Promise<T> {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) return DEFAULT_SETTINGS[key] as T;
  try {
    return JSON.parse(row.value) as T;
  } catch {
    return row.value as unknown as T;
  }
}

export async function setSetting(key: string, value: unknown) {
  const json = JSON.stringify(value);
  await prisma.setting.upsert({
    where: { key },
    update: { value: json },
    create: { key, value: json },
  });
}
