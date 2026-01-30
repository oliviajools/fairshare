import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Send Slack notification for a session
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { sessionId, message, type } = body

    if (!sessionId) {
      return NextResponse.json({ error: 'Session ID required' }, { status: 400 })
    }

    // Get the voting session with company info
    const votingSession = await prisma.votingSession.findUnique({
      where: { id: sessionId },
      include: {
        company: true,
        creator: { select: { name: true, email: true } },
        _count: { select: { participants: true, ballots: true } }
      }
    })

    if (!votingSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 })
    }

    // Check if company has Slack webhook configured
    if (!votingSession.company?.slackWebhook) {
      return NextResponse.json({ error: 'No Slack webhook configured for this company' }, { status: 400 })
    }

    // Build Slack message
    const slackMessage = buildSlackMessage(votingSession, type, message)

    // Send to Slack
    const slackResponse = await fetch(votingSession.company.slackWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(slackMessage)
    })

    if (!slackResponse.ok) {
      console.error('Slack API error:', await slackResponse.text())
      return NextResponse.json({ error: 'Failed to send Slack notification' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error sending Slack notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function buildSlackMessage(session: any, type: string, customMessage?: string) {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://teampayer.de'
  
  switch (type) {
    case 'session_created':
      return {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '🎉 Neue TeamPayer Session erstellt',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Session:*\n${session.title}`
              },
              {
                type: 'mrkdwn',
                text: `*Erstellt von:*\n${session.creator?.name || session.creator?.email || 'Unbekannt'}`
              }
            ]
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Teilnehmer:*\n${session._count.participants}`
              },
              {
                type: 'mrkdwn',
                text: `*Datum:*\n${session.date ? new Date(session.date).toLocaleDateString('de-DE') : 'Nicht festgelegt'}`
              }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Session öffnen',
                  emoji: true
                },
                url: `${baseUrl}/vote/${session.id}`,
                style: 'primary'
              }
            ]
          }
        ]
      }

    case 'session_closed':
      return {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '✅ TeamPayer Session abgeschlossen',
              emoji: true
            }
          },
          {
            type: 'section',
            fields: [
              {
                type: 'mrkdwn',
                text: `*Session:*\n${session.title}`
              },
              {
                type: 'mrkdwn',
                text: `*Abstimmungen:*\n${session._count.ballots}/${session._count.participants}`
              }
            ]
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Ergebnisse ansehen',
                  emoji: true
                },
                url: `${baseUrl}/results/${session.id}`,
                style: 'primary'
              }
            ]
          }
        ]
      }

    case 'reminder':
      return {
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: '⏰ TeamPayer Erinnerung',
              emoji: true
            }
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `Vergiss nicht, bei *${session.title}* abzustimmen!\n\n${session._count.ballots}/${session._count.participants} haben bereits abgestimmt.`
            }
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: {
                  type: 'plain_text',
                  text: 'Jetzt abstimmen',
                  emoji: true
                },
                url: `${baseUrl}/vote/${session.id}`,
                style: 'primary'
              }
            ]
          }
        ]
      }

    default:
      return {
        text: customMessage || `TeamPayer Update: ${session.title}`
      }
  }
}
