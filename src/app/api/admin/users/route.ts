import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// Simple admin emails - add your admin email(s) here
const ADMIN_EMAILS = ['oliviajools@icloud.com', 'olivia@deepvelop.com', 'admin@teampayer.de']

async function isAdmin(email: string | null | undefined): Promise<boolean> {
  if (!email) return false
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

// GET - Fetch all users
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            companies: true,
            createdSessions: true,
            participants: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(users)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Benutzer' }, { status: 500 })
  }
}

// DELETE - Delete a user
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID erforderlich' }, { status: 400 })
    }

    // Prevent deleting yourself
    const currentUser = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (currentUser?.id === userId) {
      return NextResponse.json({ error: 'Du kannst dich nicht selbst löschen' }, { status: 400 })
    }

    await prisma.user.delete({
      where: { id: userId }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting user:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Benutzers' }, { status: 500 })
  }
}

// PUT - Update a user
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email || !(await isAdmin(session.user.email))) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { userId, name, email } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID erforderlich' }, { status: 400 })
    }

    // Check if email is already taken by another user
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          NOT: { id: userId }
        }
      })

      if (existingUser) {
        return NextResponse.json({ error: 'Diese E-Mail wird bereits verwendet' }, { status: 400 })
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(name !== undefined && { name: name.trim() || null }),
        ...(email !== undefined && { email: email.toLowerCase().trim() })
      },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        createdAt: true,
        updatedAt: true
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren des Benutzers' }, { status: 500 })
  }
}
