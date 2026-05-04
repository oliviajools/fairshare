import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSessions() {
  try {
    // Get all sessions without companyId
    const sessionsWithoutCompany = await prisma.votingSession.findMany({
      where: { companyId: null },
      include: {
        creator: true,
      },
    })

    console.log(`Found ${sessionsWithoutCompany.length} sessions without companyId`)

    let updated = 0
    let skipped = 0

    for (const session of sessionsWithoutCompany) {
      // Find company membership for the creator
      if (!session.creator) {
        console.log(`Skipping session "${session.title}" - no creator`)
        skipped++
        continue
      }

      const membership = await prisma.companyMember.findFirst({
        where: {
          userId: session.creator.id,
        },
        include: {
          company: true,
        },
      })

      if (membership) {
        await prisma.votingSession.update({
          where: { id: session.id },
          data: { companyId: membership.company.id },
        })
        console.log(`✓ Updated "${session.title}" to company "${membership.company.name}"`)
        updated++
      } else {
        console.log(`Skipping session "${session.title}" - creator has no company membership`)
        skipped++
      }
    }

    console.log(`\nMigration complete:`)
    console.log(`  Updated: ${updated}`)
    console.log(`  Skipped: ${skipped}`)
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

migrateSessions()
