import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function createUser() {
  const email = process.argv[2]
  const password = process.argv[3]
  const name = process.argv[4] || email?.split('@')[0]

  if (!email || !password) {
    console.log('Usage: npx ts-node scripts/create-user.ts <email> <password> [name]')
    process.exit(1)
  }

  try {
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    })

    if (existingUser) {
      console.log('User already exists:', existingUser.email)
      process.exit(1)
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user with email verified
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        emailVerified: new Date(),
      }
    })

    console.log('User created successfully:')
    console.log('  Email:', user.email)
    console.log('  Name:', user.name)
    console.log('  ID:', user.id)
    console.log('  Email verified:', user.emailVerified)
  } catch (error) {
    console.error('Error creating user:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

createUser()
