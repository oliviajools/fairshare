import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch account details
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true,
        _count: {
          select: {
            createdSessions: true,
            participants: true
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching account:', error)
    return NextResponse.json({ error: 'Fehler beim Laden des Accounts' }, { status: 500 })
  }
}

// PUT - Update account (name, image)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { name, image } = await request.json()

    const user = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        ...(name !== undefined && { name }),
        ...(image !== undefined && { image })
      },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        createdAt: true
      }
    })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating account:', error)
    return NextResponse.json({ error: 'Fehler beim Aktualisieren' }, { status: 500 })
  }
}

// DELETE - Delete account
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'User nicht gefunden' }, { status: 404 })
    }

    // Delete user (cascades to related data)
    await prisma.user.delete({
      where: { id: user.id }
    })

    return NextResponse.json({ success: true, message: 'Account gelöscht' })
  } catch (error) {
    console.error('Error deleting account:', error)
    return NextResponse.json({ error: 'Fehler beim Löschen des Accounts' }, { status: 500 })
  }
}
