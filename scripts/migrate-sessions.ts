import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function migrateSessions() {
  console.log('🔍 Analysiere Sessions...\n')

  // 1. Find all sessions without creatorId
  const orphanedSessions = await prisma.votingSession.findMany({
    where: { creatorId: null },
    include: {
      participants: true,
      ballots: true
    }
  })

  console.log(`📊 Gefunden: ${orphanedSessions.length} Sessions ohne Creator\n`)

  // 2. Get all users for matching
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true }
  })

  console.log(`👥 Registrierte User: ${users.length}\n`)

  // Create email -> userId map
  const emailToUser = new Map(users.map(u => [u.email.toLowerCase(), u]))

  let migratedCount = 0
  let skippedCount = 0

  for (const session of orphanedSessions) {
    console.log(`\n📋 Session: "${session.title}" (${session.id})`)
    console.log(`   Status: ${session.status}`)
    console.log(`   Erstellt: ${session.createdAt.toLocaleDateString('de-DE')}`)
    console.log(`   Teilnehmer: ${session.participants.length}`)

    // Try to find a matching user from participants
    let matchedUser = null

    for (const participant of session.participants) {
      // Check if participant has a userId
      if (participant.userId) {
        const user = users.find(u => u.id === participant.userId)
        if (user) {
          matchedUser = user
          console.log(`   ✅ Zuordnung via userId: ${user.email}`)
          break
        }
      }

      // Check if participant email matches a user
      if (participant.invitedEmail) {
        const user = emailToUser.get(participant.invitedEmail.toLowerCase())
        if (user) {
          matchedUser = user
          console.log(`   ✅ Zuordnung via Email: ${user.email}`)
          break
        }
      }
    }

    if (matchedUser) {
      // Update the session with creatorId
      await prisma.votingSession.update({
        where: { id: session.id },
        data: { creatorId: matchedUser.id }
      })
      migratedCount++
      console.log(`   ➡️  CreatorId gesetzt auf: ${matchedUser.email}`)
    } else {
      skippedCount++
      console.log(`   ⚠️  Kein passender User gefunden`)
      
      // Show participant emails for debugging
      const emails = session.participants
        .map(p => p.invitedEmail || p.displayName)
        .join(', ')
      console.log(`   Teilnehmer-Emails: ${emails}`)
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`✅ Migriert: ${migratedCount} Sessions`)
  console.log(`⏭️  Übersprungen: ${skippedCount} Sessions`)
  console.log('='.repeat(50))

  // Also show stats for sessions WITH creatorId
  const linkedSessions = await prisma.votingSession.findMany({
    where: { creatorId: { not: null } },
    include: { creator: { select: { email: true } } }
  })

  console.log(`\n📊 Sessions mit Creator: ${linkedSessions.length}`)
  
  // Group by creator
  const byCreator = new Map<string, number>()
  for (const s of linkedSessions) {
    const email = s.creator?.email || 'unbekannt'
    byCreator.set(email, (byCreator.get(email) || 0) + 1)
  }
  
  console.log('\nSessions pro User:')
  for (const [email, count] of byCreator) {
    console.log(`   ${email}: ${count} Sessions`)
  }
}

migrateSessions()
  .catch(console.error)
  .finally(() => prisma.$disconnect())
