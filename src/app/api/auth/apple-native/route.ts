import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { identityToken, user, email, fullName } = await request.json()

    if (!identityToken) {
      return NextResponse.json({ error: 'Identity token required' }, { status: 400 })
    }

    // Decode the Apple identity token (it's a JWT)
    const decoded = jwt.decode(identityToken) as {
      sub: string  // Apple user ID
      email?: string
      email_verified?: boolean
      aud: string
      iss: string
    }

    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid identity token' }, { status: 400 })
    }

    // Apple only sends email on first sign-in, so we need to handle both cases
    const userEmail = email || decoded.email
    const userName = fullName?.givenName && fullName?.familyName 
      ? `${fullName.givenName} ${fullName.familyName}`
      : fullName?.givenName || userEmail?.split('@')[0] || 'Apple User'

    if (!userEmail) {
      return NextResponse.json({ 
        error: 'Email required. Please sign out of Apple ID in Settings and try again.' 
      }, { status: 400 })
    }

    const normalizedEmail = userEmail.toLowerCase()

    // Find or create user
    let dbUser = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    if (!dbUser) {
      dbUser = await prisma.user.create({
        data: {
          email: normalizedEmail,
          name: userName,
          emailVerified: new Date(),
        }
      })
    }

    // Create a session token for NextAuth compatibility
    // We'll use a simple JWT that the client can use
    const sessionToken = jwt.sign(
      {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret'
    )

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        email: dbUser.email,
        name: dbUser.name,
      },
      sessionToken,
    })
  } catch (error) {
    console.error('Apple native auth error:', error)
    return NextResponse.json({ error: 'Authentication failed' }, { status: 500 })
  }
}
