import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Join a company
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Check if company exists
    const company = await prisma.company.findUnique({
      where: { id }
    })

    if (!company) {
      return NextResponse.json({ error: 'Unternehmen nicht gefunden' }, { status: 404 })
    }

    // Check if already a member
    const existingMembership = await prisma.companyMember.findUnique({
      where: {
        companyId_userId: {
          companyId: id,
          userId: user.id
        }
      }
    })

    if (existingMembership) {
      return NextResponse.json({ error: 'Du bist bereits Mitglied' }, { status: 400 })
    }

    // Add user as member
    await prisma.companyMember.create({
      data: {
        companyId: id,
        userId: user.id,
        role: 'MEMBER'
      }
    })

    return NextResponse.json({ success: true, message: 'Erfolgreich beigetreten' })
  } catch (error) {
    console.error('Error joining company:', error)
    return NextResponse.json({ error: 'Fehler beim Beitreten' }, { status: 500 })
  }
}
