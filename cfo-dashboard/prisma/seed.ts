import { PrismaClient } from "@prisma/client";
import { DEFAULT_SETTINGS } from "../src/lib/settings";

const prisma = new PrismaClient();

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}
function monthsAgo(n: number, day = 5) {
  const d = new Date();
  d.setMonth(d.getMonth() - n, day);
  d.setHours(0, 0, 0, 0);
  return d;
}

async function main() {
  console.log("Seeding settings…");
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await prisma.setting.upsert({
      where: { key },
      update: {},
      create: { key, value: JSON.stringify(value) },
    });
  }

  console.log("Seeding cash snapshot…");
  await prisma.cashSnapshot.upsert({
    where: { date: daysAgo(0) },
    update: { amount: 6200 },
    create: { date: daysAgo(0), amount: 6200, note: "Seed data" },
  });

  console.log("Seeding members…");
  const members = [
    { customer: "Sofie V.", plan: "founder", amount: 19, startedAt: monthsAgo(8), status: "active" },
    { customer: "Karel D.", plan: "founder", amount: 19, startedAt: monthsAgo(7), status: "active" },
    { customer: "Anke P.", plan: "regular", amount: 27, startedAt: monthsAgo(5), status: "active" },
    { customer: "Bram T.", plan: "regular", amount: 27, startedAt: monthsAgo(4), status: "active" },
    { customer: "Els M.", plan: "annual", amount: 22, startedAt: monthsAgo(3), status: "active" },
    { customer: "Nico R.", plan: "regular", amount: 27, startedAt: monthsAgo(2), status: "active" },
    {
      customer: "Wouter S.",
      plan: "regular",
      amount: 27,
      startedAt: monthsAgo(6),
      status: "canceled",
      canceledAt: daysAgo(10),
    },
  ];
  for (const m of members) {
    await prisma.member.create({ data: m });
  }

  console.log("Seeding transactions (12 months trailing, by pijler)…");
  const pijlers = ["voorsprong", "audit", "traject", "retainer", "workshop", "challenge", "other"];
  for (let i = 11; i >= 0; i--) {
    const base = monthsAgo(i, 10);
    // recurring baseline that grows toward the MRR target path
    await prisma.transaction.create({
      data: { date: base, amount: 100 + (11 - i) * 15, pijler: "voorsprong", source: "manual", customer: "Voorsprong leden" },
    });
    if (i % 3 === 0) {
      await prisma.transaction.create({
        data: { date: monthsAgo(i, 14), amount: 950, pijler: "audit", source: "manual", customer: "Bakkerij Peeters" },
      });
    }
    if (i % 4 === 0) {
      await prisma.transaction.create({
        data: { date: monthsAgo(i, 18), amount: 4200, pijler: "traject", source: "manual", customer: "Studio Verlinden" },
      });
    }
    if (i % 5 === 0) {
      await prisma.transaction.create({
        data: { date: monthsAgo(i, 22), amount: 650, pijler: "workshop", source: "manual", customer: "KMO Netwerk Gooik" },
      });
    }
  }
  // A concentration example: one large customer this quarter
  await prisma.transaction.create({
    data: { date: daysAgo(20), amount: 5200, pijler: "traject", source: "manual", customer: "Studio Verlinden" },
  });
  void pijlers;

  console.log("Seeding invoices…");
  await prisma.invoice.create({
    data: {
      customer: "Bakkerij Peeters",
      amount: 950,
      sentAt: daysAgo(9),
      status: "open",
      source: "manual",
    },
  });
  await prisma.invoice.create({
    data: {
      customer: "Studio Verlinden",
      amount: 2100,
      sentAt: daysAgo(22),
      status: "open",
      source: "manual",
    },
  });
  await prisma.invoice.create({
    data: {
      customer: "KMO Netwerk Gooik",
      amount: 650,
      sentAt: daysAgo(38),
      status: "open",
      source: "manual",
    },
  });
  await prisma.invoice.create({
    data: {
      customer: "Atelier Cools",
      amount: 1200,
      sentAt: daysAgo(45),
      paidAt: daysAgo(40),
      status: "paid",
      source: "manual",
    },
  });

  console.log("Seeding deals (pipeline)…");
  await prisma.deal.create({
    data: { customer: "Hair & Co", type: "audit", amount: 950, stage: "gesprek", lastContact: daysAgo(2) },
  });
  await prisma.deal.create({
    data: { customer: "De Groene Winkel", type: "audit", amount: 950, stage: "voorstel", lastContact: daysAgo(9) },
  });
  await prisma.deal.create({
    data: {
      customer: "Yellowpulse BV",
      type: "traject",
      amount: 5800,
      stage: "voorstel",
      lastContact: daysAgo(3),
      deliveredDays: 12,
    },
  });
  await prisma.deal.create({
    data: {
      customer: "Bouwbedrijf Van Damme",
      type: "traject",
      amount: 4600,
      stage: "akkoord",
      lastContact: daysAgo(1),
      deliveredDays: 10,
    },
  });
  await prisma.deal.create({
    data: { customer: "Ondernemersclub Pajottenland", type: "workshop", amount: 650, stage: "akkoord", lastContact: daysAgo(5), deliveredDays: 1 },
  });
  await prisma.deal.create({
    data: { customer: "Atelier Cools", type: "audit", amount: 950, stage: "gewonnen", lastContact: daysAgo(40), closedAt: daysAgo(38) },
  });
  await prisma.deal.create({
    data: { customer: "Atelier Cools", type: "traject", amount: 5200, stage: "gewonnen", lastContact: daysAgo(20), closedAt: daysAgo(18) },
  });

  console.log("Seeding day entries (last 4 weeks)…");
  for (let w = 0; w < 4; w++) {
    await prisma.dayEntry.create({ data: { date: daysAgo(w * 7), type: "billable", count: 3 } });
    await prisma.dayEntry.create({ data: { date: daysAgo(w * 7 + 1), type: "content", count: 0.5 } });
    await prisma.dayEntry.create({ data: { date: daysAgo(w * 7 + 2), type: "admin", count: 0.5 } });
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
