/**
 * Seed the local SQLite database with a demo admin user + sample data.
 * Run via: npm run seed:local
 *
 * Demo login:  demo@demo.com  /  Demo@1234
 */
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const passwordHash = bcrypt.hashSync('Demo@1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@demo.com' },
    update: { passwordHash, role: 'ADMIN' },
    create: {
      firstName: 'Demo',
      lastName: 'Admin',
      email: 'demo@demo.com',
      passwordHash,
      role: 'ADMIN',
    },
  });
  console.log('✅ Demo user ready: demo@demo.com / Demo@1234 (ADMIN)');

  const existingLeads = await prisma.lead.count({ where: { userId: user.id } });
  if (existingLeads === 0) {
    const sample = [
      { firstName: 'Aarav', lastName: 'Sharma', email: 'aarav@acme.io', company: 'Acme Corp', jobTitle: 'CTO', status: 'NEW' },
      { firstName: 'Diya', lastName: 'Patel', email: 'diya@globex.com', company: 'Globex', jobTitle: 'Head of Growth', status: 'CONTACTED' },
      { firstName: 'Rohan', lastName: 'Mehta', email: 'rohan@initech.com', company: 'Initech', jobTitle: 'Founder', status: 'QUALIFIED' },
      { firstName: 'Sara', lastName: 'Khan', email: 'sara@umbrella.co', company: 'Umbrella', jobTitle: 'Marketing Lead', status: 'NEW' },
      { firstName: 'Vikram', lastName: 'Rao', email: 'vikram@hooli.com', company: 'Hooli', jobTitle: 'VP Sales', status: 'CONVERTED' },
    ];
    for (const l of sample) {
      await prisma.lead.create({ data: { ...l, userId: user.id, source: 'MANUAL' } });
    }
    console.log(`✅ Created ${sample.length} sample leads`);

    const campaign = await prisma.campaign.create({
      data: { userId: user.id, name: 'Q3 Outreach', description: 'Demo campaign', status: 'DRAFT' },
    });
    const leads = await prisma.lead.findMany({ where: { userId: user.id }, take: 3 });
    for (const lead of leads) {
      await prisma.campaignLead.create({ data: { campaignId: campaign.id, leadId: lead.id, status: 'PENDING' } });
    }
    await prisma.campaign.update({ where: { id: campaign.id }, data: { leadCount: leads.length } });
    console.log('✅ Created demo campaign "Q3 Outreach" with 3 leads');
  } else {
    console.log(`ℹ️  ${existingLeads} leads already exist — skipping sample data`);
  }
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
