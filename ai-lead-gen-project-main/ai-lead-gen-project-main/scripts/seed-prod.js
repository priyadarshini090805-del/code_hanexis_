/**
 * Seed an EXISTING user's account with demo data so the dashboard/analytics
 * populate. Targets whatever DATABASE_URL is set (use the live Neon URL).
 *
 *   DATABASE_URL="postgres://..." SEED_EMAIL="you@example.com" node scripts/seed-prod.js
 *
 * Idempotent: skips if the user already has leads.
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const EMAIL = process.env.SEED_EMAIL || 'samyabeshv@gmail.com';
const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const FIRST = ['Aarav','Diya','Rohan','Sara','Vikram','Neha','Arjun','Priya','Karan','Meera','Aditya','Isha','Raj','Tara','Nikhil'];
const LAST = ['Sharma','Patel','Mehta','Khan','Rao','Gupta','Nair','Reddy','Iyer','Bose'];
const COMPANIES = ['Acme Corp','Globex','Initech','Umbrella','Hooli','Stark Inc','Wayne Co','Soylent','Massive Dynamic','Hooli'];
const STATUSES = ['NEW','NEW','NEW','CONTACTED','CONTACTED','QUALIFIED','QUALIFIED','CONVERTED','CONVERTED','LOST'];

async function main() {
  const user = await prisma.user.findUnique({ where: { email: EMAIL } });
  if (!user) throw new Error(`User ${EMAIL} not found. Register first, then run again.`);
  console.log('User:', user.email);

  const existing = await prisma.lead.count({ where: { userId: user.id } });
  if (existing > 0) {
    console.log(`ℹ️  ${existing} leads already exist for this user — skipping (delete them to reseed).`);
    return;
  }

  // 1) Leads spread across the last 14 days
  const leads = [];
  for (let i = 0; i < 15; i++) {
    const fn = FIRST[i % FIRST.length];
    const ln = LAST[i % LAST.length];
    const createdAt = new Date(now - (14 - (i % 14)) * DAY);
    const lead = await prisma.lead.create({
      data: {
        userId: user.id,
        firstName: fn,
        lastName: ln,
        email: `${fn}.${ln}.${i}@demo-lead.com`.toLowerCase(),
        company: COMPANIES[i % COMPANIES.length],
        jobTitle: ['CTO','Head of Growth','Founder','VP Sales','Marketing Lead'][i % 5],
        status: STATUSES[i % STATUSES.length],
        source: 'MANUAL',
        createdAt,
      },
    });
    leads.push(lead);
  }
  console.log(`✅ ${leads.length} leads`);

  // 2) Campaigns with engagement
  const campNames = ['Q3 Outreach', 'Founder Network', 'Reengagement Push'];
  for (let c = 0; c < campNames.length; c++) {
    const subset = leads.slice(c * 4, c * 4 + 5);
    const campaign = await prisma.campaign.create({
      data: {
        userId: user.id,
        name: campNames[c],
        description: 'Demo campaign',
        status: 'ACTIVE',
        leadCount: subset.length,
        launchedAt: new Date(now - (10 - c * 3) * DAY),
        startedAt: new Date(now - (10 - c * 3) * DAY),
      },
    });
    let sent = 0, opened = 0, replied = 0;
    for (let j = 0; j < subset.length; j++) {
      const sentAt = new Date(now - (8 - j) * DAY);
      const isOpened = j % 4 !== 0;
      const isReplied = j % 3 === 0;
      let status = 'SENT';
      if (isReplied) status = 'REPLIED'; else if (isOpened) status = 'OPENED';
      await prisma.campaignLead.create({
        data: {
          campaignId: campaign.id,
          leadId: subset[j].id,
          status,
          sentAt,
          openedAt: isOpened ? new Date(sentAt.getTime() + 3600000) : null,
          repliedAt: isReplied ? new Date(sentAt.getTime() + 7200000) : null,
        },
      });
      sent++; if (isOpened) opened++; if (isReplied) replied++;
    }
    await prisma.campaign.update({
      where: { id: campaign.id },
      data: { sentCount: sent, openCount: opened, replyCount: replied },
    });
    await prisma.campaignActivity.create({
      data: { campaignId: campaign.id, action: 'sent', description: `${sent} messages sent` },
    });
  }
  console.log(`✅ ${campNames.length} campaigns with engagement`);

  // 3) AI generations (messagesGenerated)
  for (let i = 0; i < 12; i++) {
    await prisma.aIGeneration.create({
      data: {
        userId: user.id,
        leadId: leads[i % leads.length].id,
        messageType: 'CONNECTION_MESSAGE',
        tone: 'PROFESSIONAL',
        length: 'MEDIUM',
        prompt: 'demo',
        response: 'Hi, I would love to connect regarding our solution.',
        tokensUsed: 120,
        provider: 'template',
        createdAt: new Date(now - (i % 14) * DAY),
      },
    });
  }
  console.log('✅ 12 AI generations');

  // 4) Daily analytics snapshots for the last 14 days (line chart trend)
  for (let d = 13; d >= 0; d--) {
    const date = new Date(now - d * DAY);
    date.setHours(0, 0, 0, 0);
    const total = 15 - d + 5;
    await prisma.analytics.create({
      data: {
        userId: user.id,
        date,
        totalLeads: total,
        newLeads: Math.max(1, Math.round(total * 0.3)),
        contactedLeads: Math.round(total * 0.25),
        qualifiedLeads: Math.round(total * 0.2),
        convertedLeads: Math.round(total * 0.15),
        conversionRate: 12 + (13 - d),
        campaignsRun: d < 10 ? 3 : 0,
        messagesGenerated: Math.round((13 - d) * 1.2),
        tokensUsed: Math.round((13 - d) * 140),
      },
    });
  }
  console.log('✅ 14 days of analytics snapshots');
  console.log('🎉 Done — refresh the Analytics page.');
}

async function withRetry(fn, tries = 4) {
  for (let i = 1; i <= tries; i++) {
    try { return await fn(); }
    catch (e) {
      const cold = /timed out|Can't reach|connection pool/i.test(e.message || '');
      if (cold && i < tries) { console.log(`DB cold/slow, retry ${i}/${tries}...`); await new Promise(r => setTimeout(r, 4000)); continue; }
      throw e;
    }
  }
}

withRetry(main)
  .catch((e) => { console.error('❌', e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
