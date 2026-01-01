import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { sendPasswordResetEmail } from '@/lib/email'
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown'
    
    const rateLimit = checkRateLimit(ip, 'forgotPassword', rateLimitConfigs.forgotPassword)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Zu viele Anfragen. Bitte warte ${rateLimit.resetIn} Sekunden.` },
        { status: 429 }
      )
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'E-Mail erforderlich' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.toLowerCase().trim()

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail }
    })

    // Always return success to prevent email enumeration
    if (!user) {
      return NextResponse.json({
        message: 'Falls ein Account mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.'
      })
    }

    // Delete any existing reset tokens for this email
    await prisma.passwordResetToken.deleteMany({
      where: { email: normalizedEmail }
    })

    // Generate secure token
    const token = crypto.randomBytes(32).toString('hex')
    
    // Token expires in 1 hour
    const expires = new Date(Date.now() + 60 * 60 * 1000)

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        email: normalizedEmail,
        token,
        expires
      }
    })

    // Send reset email
    await sendPasswordResetEmail(normalizedEmail, token)

    return NextResponse.json({
      message: 'Falls ein Account mit dieser E-Mail existiert, wurde ein Reset-Link gesendet.'
    })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
