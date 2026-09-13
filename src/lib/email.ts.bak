import { Resend } from 'resend'

const APP_URL = process.env.NEXTAUTH_URL || 'https://teampayer.de'

export async function sendPasswordResetEmail(email: string, token: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set')
      return { success: false, error: 'API key missing' }
    }
    
    const resend = new Resend(apiKey)
    const resetLink = `${APP_URL}/reset-password?token=${token}`
    
    const result = await resend.emails.send({
      from: 'TeamPayer <noreply@teampayer.de>',
      to: email,
      subject: '🔐 Passwort zurücksetzen – TeamPayer',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-size: 64px;">🔐</span>
            <h1 style="color: #0ea5e9; margin: 20px 0 10px;">Passwort zurücksetzen</h1>
          </div>
          
          <div style="background: #f0f9ff; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <p style="color: #4b5563; line-height: 1.6; margin-top: 0;">
              Du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, 
              um ein neues Passwort zu erstellen.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Hinweis:</strong> Dieser Link ist nur <strong>1 Stunde</strong> gültig.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetLink}" 
               style="display: inline-block; background: #0ea5e9; color: white; padding: 16px 32px; 
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Neues Passwort erstellen 🔑
            </a>
          </div>
          
          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <p style="color: #92400e; margin: 0; font-size: 14px;">
              ⚠️ Falls du diese Anfrage nicht gestellt hast, ignoriere diese E-Mail einfach. 
              Dein Passwort bleibt unverändert.
            </p>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px;">
              Dein TeamPayer-Team 💸
            </p>
          </div>
        </div>
      `
    })
    
    return { success: true, result }
  } catch (error) {
    console.error('Error sending password reset email:', error)
    return { success: false, error }
  }
}

export async function sendVerificationEmail(email: string, token: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    
    if (!apiKey) {
      console.error('RESEND_API_KEY is not set')
      return { success: false, error: 'API key missing' }
    }
    
    const resend = new Resend(apiKey)
    const verifyLink = `${APP_URL}/verify-email?token=${token}`
    
    const result = await resend.emails.send({
      from: 'TeamPayer <noreply@teampayer.de>',
      to: email,
      subject: '✉️ Bestätige deine E-Mail – TeamPayer',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-size: 64px;">✉️</span>
            <h1 style="color: #0ea5e9; margin: 20px 0 10px;">E-Mail bestätigen</h1>
          </div>
          
          <div style="background: #f0f9ff; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <p style="color: #4b5563; line-height: 1.6; margin-top: 0;">
              Klicke auf den Button unten, um deine E-Mail-Adresse zu bestätigen und deinen Account zu aktivieren.
            </p>
            <p style="color: #6b7280; font-size: 14px;">
              <strong>Hinweis:</strong> Dieser Link ist <strong>24 Stunden</strong> gültig.
            </p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verifyLink}" 
               style="display: inline-block; background: #0ea5e9; color: white; padding: 16px 32px; 
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              E-Mail bestätigen ✓
            </a>
          </div>
          
          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px;">
              Dein TeamPayer-Team 💸
            </p>
          </div>
        </div>
      `
    })
    
    return { success: true, result }
  } catch (error) {
    console.error('Error sending verification email:', error)
    return { success: false, error }
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY
    console.log('Sending welcome email to:', email)
    console.log('RESEND_API_KEY exists:', !!apiKey)

    if (!apiKey) {
      console.error('RESEND_API_KEY is not set')
      return { success: false, error: 'API key missing' }
    }

    const resend = new Resend(apiKey)

    const result = await resend.emails.send({
      from: 'TeamPayer <noreply@teampayer.de>',
      to: email,
      subject: '🎉 Willkommen bei TeamPayer, du Held der fairen Verteilung!',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-size: 64px;">💰</span>
            <h1 style="color: #0ea5e9; margin: 20px 0 10px;">Willkommen bei TeamPayer!</h1>
            <p style="color: #6b7280; font-size: 18px;">Hallo ${name || 'du Finanzgenie'}! 👋</p>
          </div>

          <div style="background: linear-gradient(135deg, #f0f9ff 0%, #fef3c7 100%); border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <h2 style="color: #1f2937; margin-top: 0;">Du bist jetzt offiziell ein TeamPayer! 🏆</h2>
            <p style="color: #4b5563; line-height: 1.6;">
              Herzlichen Glückwunsch! Du hast gerade den ersten Schritt gemacht, um
              <strong>nie wieder peinliche Geld-Diskussionen</strong> mit Freunden, Familie
              oder Kollegen führen zu müssen.
            </p>
          </div>

          <div style="margin-bottom: 30px;">
            <h3 style="color: #1f2937;">Was du jetzt tun kannst:</h3>
            <ul style="color: #4b5563; line-height: 2;">
              <li>📝 <strong>Session erstellen</strong> – Lade dein Team ein</li>
              <li>🗳️ <strong>Abstimmen lassen</strong> – Jeder gibt anonym seine Einschätzung ab</li>
              <li>📊 <strong>Fair verteilen</strong> – Der Algorithmus macht den Rest</li>
            </ul>
          </div>

          <div style="background: #fef3c7; border-radius: 12px; padding: 20px; margin-bottom: 30px;">
            <p style="color: #92400e; margin: 0; font-style: italic;">
              💡 <strong>Fun Fact:</strong> Die durchschnittliche Diskussion über Geldaufteilung
              dauert 47 Minuten. Mit TeamPayer: 47 Sekunden. Okay, das haben wir uns ausgedacht.
              Aber es ist definitiv schneller!
            </p>
          </div>

          <div style="text-align: center; margin-top: 40px;">
            <a href="https://teampayer.de"
               style="display: inline-block; background: #0ea5e9; color: white; padding: 16px 32px;
                      border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
              Los geht's! 🚀
            </a>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px;">
              Viel Spaß beim fairen Verteilen! 💸<br>
              Dein TeamPayer-Team
            </p>
          </div>
        </div>
      `
    })
    console.log('Email sent successfully:', result)
    return { success: true, result }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

export async function sendContactEmail(name: string, email: string, subject: string, message: string) {
  try {
    const apiKey = process.env.RESEND_API_KEY

    if (!apiKey) {
      console.error('RESEND_API_KEY is not set')
      return { success: false, error: 'API key missing' }
    }

    const resend = new Resend(apiKey)

    const subjectMap: Record<string, string> = {
      question: 'Allgemeine Frage',
      feedback: 'Feedback',
      bug: 'Bug melden',
      business: 'Geschäftliche Anfrage',
      press: 'Presseanfrage',
      other: 'Sonstiges',
    }

    const result = await resend.emails.send({
      from: 'TeamPayer Kontakt <noreply@teampayer.de>',
      to: 'olivia@provoid.de',
      subject: `TeamPayer Kontakt: ${subjectMap[subject] || subject}`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px;">
          <div style="text-align: center; margin-bottom: 40px;">
            <span style="font-size: 64px;">📧</span>
            <h1 style="color: #0ea5e9; margin: 20px 0 10px;">Neue Kontaktanfrage</h1>
          </div>

          <div style="background: #f0f9ff; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <div style="margin-bottom: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">Name</p>
              <p style="color: #1f2937; font-weight: 600; margin: 0;">${name}</p>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">E-Mail</p>
              <p style="color: #1f2937; font-weight: 600; margin: 0;"><a href="mailto:${email}" style="color: #0ea5e9;">${email}</a></p>
            </div>

            <div style="margin-bottom: 20px;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 4px;">Betreff</p>
              <p style="color: #1f2937; font-weight: 600; margin: 0;">${subjectMap[subject] || subject}</p>
            </div>
          </div>

          <div style="background: #f9fafb; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px;">Nachricht</p>
            <p style="color: #1f2937; line-height: 1.6; margin: 0; white-space: pre-wrap;">${message}</p>
          </div>

          <div style="text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px;">
              Gesendet über TeamPayer Kontaktformular
            </p>
          </div>
        </div>
      `
    })

    return { success: true, result }
  } catch (error) {
    console.error('Error sending contact email:', error)
    return { success: false, error }
  }
}
