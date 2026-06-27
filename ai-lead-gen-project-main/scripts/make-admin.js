/**
 * Promote a user to ADMIN.
 *
 * Usage (from the project root):
 *   node --env-file=.env.local scripts/make-admin.js you@example.com
 *
 * Requires DATABASE_URL to be set (loaded from .env.local via --env-file).
 */
const { PrismaClient } = require('@prisma/client')

async function main() {
  const email = process.argv[2]
  if (!email) {
    console.error('Usage: node --env-file=.env.local scripts/make-admin.js <email>')
    process.exit(1)
  }

  const prisma = new PrismaClient()
  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'ADMIN' },
      select: { id: true, email: true, role: true },
    })
    console.log('✅ Promoted to admin:', user)
  } catch (e) {
    if (e.code === 'P2025') {
      console.error(`❌ No user found with email "${email}". Register on the site first, then run this again.`)
    } else {
      console.error('❌ Failed:', e.message)
    }
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()
