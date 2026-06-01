import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function deleteUser() {
  const email = (process.argv[2] || 'olivia@provoid.de').toLowerCase()

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      console.log('No user found with email:', email)
      return
    }

    // Delete verification tokens (no FK relation, identified by email)
    const deletedTokens = await prisma.verificationToken.deleteMany({
      where: { identifier: email }
    })
    console.log(`Deleted ${deletedTokens.count} verification token(s)`)

    // Delete user (cascades to accounts, sessions, etc.)
    await prisma.user.delete({ where: { email } })
    console.log('User deleted:', email)
  } catch (error) {
    console.error('Error deleting user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

deleteUser()
