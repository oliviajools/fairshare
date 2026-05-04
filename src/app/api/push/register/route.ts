import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { token, platform } = body

    if (!token || !platform) {
      return NextResponse.json({ error: 'Token und Platform sind erforderlich' }, { status: 400 })
    }

    if (!['ios', 'android'].includes(platform)) {
      return NextResponse.json({ error: 'Platform muss "ios" oder "android" sein' }, { status: 400 })
    }

    // Check if DeviceToken table exists, if not return error gracefully
    try {
      await (prisma as any).deviceToken.upsert({
        where: {
          userId_token: {
            userId: user.id,
            token,
          },
        },
        update: {
          isActive: true,
          platform,
          updatedAt: new Date(),
        },
        create: {
          userId: user.id,
          token,
          platform,
          isActive: true,
        },
      })
    } catch (error: any) {
      // If table doesn't exist yet, return a helpful error
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        console.error('DeviceToken table does not exist yet. Please run migration.')
        return NextResponse.json(
          { error: 'DeviceToken Tabelle existiert noch nicht. Bitte Migration durchführen.' },
          { status: 503 }
        )
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error registering device token:', error)
    return NextResponse.json({ error: 'Fehler beim Registrieren des Device Tokens' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Token ist erforderlich' }, { status: 400 })
    }

    try {
      await (prisma as any).deviceToken.deleteMany({
        where: {
          userId: user.id,
          token,
        },
      })
    } catch (error: any) {
      if (error.code === 'P2021' || error.message?.includes('does not exist')) {
        return NextResponse.json({ success: true }) // Table doesn't exist, nothing to delete
      }
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error unregistering device token:', error)
    return NextResponse.json({ error: 'Fehler beim Entfernen des Device Tokens' }, { status: 500 })
  }
}
