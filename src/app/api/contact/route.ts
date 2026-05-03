import { NextRequest, NextResponse } from 'next/server'
import { sendContactEmail } from '@/lib/email'
import { checkRateLimit, rateLimitConfigs } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] ||
               request.headers.get('x-real-ip') ||
               'unknown'

    const rateLimit = checkRateLimit(ip, 'contact', rateLimitConfigs.register)
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: `Zu viele Anfragen. Bitte warte ${rateLimit.resetIn} Sekunden.` },
        { status: 429 }
      )
    }

    const { name, email, subject, message } = await request.json()

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Alle Felder sind erforderlich' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Ungültige E-Mail-Adresse' },
        { status: 400 }
      )
    }

    // Send email
    const result = await sendContactEmail(name, email, subject, message)

    if (!result.success) {
      console.error('Failed to send contact email:', result.error)
      return NextResponse.json(
        { error: 'Fehler beim Senden der Nachricht. Bitte versuche es später erneut.' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Nachricht gesendet'
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { error: 'Ein Fehler ist aufgetreten' },
      { status: 500 }
    )
  }
}
