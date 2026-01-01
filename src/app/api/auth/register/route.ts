import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { sendVerificationEmail } from '@/lib/email'
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimit = checkRateLimit(ip, 'register', rateLimitConfigs.register)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Zu viele Registrierungsversuche. Bitte warte ${rateLimit.resetIn} Sekunden.` },
        { status: 429 }
      )
    }

    const { name, email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email und Passwort erforderlich' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Passwort muss mindestens 6 Zeichen lang sein' },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Ein Account mit dieser Email existiert bereits' },
        { status: 400 }
      )
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12)

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase().trim(),
        password: hashedPassword,
      }
    })

    // Create verification token
    const verificationToken = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await prisma.verificationToken.create({
      data: {
        identifier: email.toLowerCase().trim(),
        token: verificationToken,
        expires
      }
    })

    // Send verification email
    sendVerificationEmail(email.toLowerCase().trim(), verificationToken).catch((err: Error) => {
      console.error('Failed to send verification email:', err)
    })

    return NextResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      message: 'Bitte bestätige deine E-Mail-Adresse'
    })
  } catch (error) {
    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Registrierung fehlgeschlagen' },
      { status: 500 }
    )
  }
}
