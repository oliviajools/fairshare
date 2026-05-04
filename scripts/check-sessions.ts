import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkSessions() {
  try {
    // Count all sessions
    const allSessions = await prisma.votingSession.count()
    console.log(`Total sessions in database: ${allSessions}`)

    // Count sessions with companyId
    const sessionsWithCompany = await prisma.votingSession.count({
      where: { companyId: { not: null } }
    })
    console.log(`Sessions with companyId: ${sessionsWithCompany}`)

    // Count sessions without companyId
    const sessionsWithoutCompany = await prisma.votingSession.count({
      where: { companyId: null }
    })
    console.log(`Sessions without companyId: ${sessionsWithoutCompany}`)

    // Get all companies
    const companies = await prisma.company.findMany({
      select: { id: true, name: true },
    })
    console.log(`Total companies: ${companies.length}`)

    // Show sample sessions
    const sampleSessions = await prisma.votingSession.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        title: true,
        date: true,
        companyId: true,
        createdAt: true,
      },
    })

    console.log('\nSample sessions:')
    sampleSessions.forEach((s) => {
      console.log(`  - ${s.title} (ID: ${s.id}, companyId: ${s.companyId || 'NULL'}, date: ${s.date})`)
    })
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkSessions()
