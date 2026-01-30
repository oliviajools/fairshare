import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

// POST - Send results to teacher
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { projectId } = body

    // Get project with session results
    const project = await prisma.classroomProject.findUnique({
      where: { id: projectId },
      include: {
        classroom: {
          include: { teacher: true }
        },
        session: {
          include: {
            participants: true,
            ballots: {
              include: { votes: true }
            }
          }
        }
      }
    })

    if (!project || project.classroomId !== id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.session) {
      return NextResponse.json({ error: 'No session found' }, { status: 404 })
    }

    // Calculate results
    const participantVotes: { [key: string]: { total: number; count: number; name: string } } = {}
    
    project.session.participants.forEach(p => {
      participantVotes[p.id] = { total: 0, count: 0, name: p.displayName }
    })

    project.session.ballots.forEach(ballot => {
      ballot.votes.forEach(vote => {
        if (participantVotes[vote.personId]) {
          participantVotes[vote.personId].total += vote.percent
          participantVotes[vote.personId].count += 1
        }
      })
    })

    const results = Object.entries(participantVotes).map(([id, data]) => ({
      name: data.name,
      averagePercent: data.count > 0 ? Math.round(data.total / data.count * 10) / 10 : 0
    })).sort((a, b) => b.averagePercent - a.averagePercent)

    // Send email to teacher
    if (resend && project.classroom.teacher.email) {
      const resultsHtml = results.map(r => 
        `<tr><td style="padding: 8px; border: 1px solid #ddd;">${r.name}</td><td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${r.averagePercent}%</td></tr>`
      ).join('')

      await resend.emails.send({
        from: 'TeamPayer <noreply@teampayer.de>',
        to: project.classroom.teacher.email,
        subject: `Ergebnisse: ${project.name}`,
        html: `
          <h2>Projektergebnisse: ${project.name}</h2>
          <p>Klasse: ${project.classroom.name}</p>
          <p>Die Schüler haben ihre gegenseitige Bewertung abgeschlossen.</p>
          <table style="border-collapse: collapse; width: 100%; max-width: 400px;">
            <thead>
              <tr style="background: #f5f5f5;">
                <th style="padding: 8px; border: 1px solid #ddd; text-align: left;">Schüler</th>
                <th style="padding: 8px; border: 1px solid #ddd; text-align: center;">Beitrag</th>
              </tr>
            </thead>
            <tbody>${resultsHtml}</tbody>
          </table>
          <p style="margin-top: 20px; color: #666;">
            <a href="${process.env.NEXTAUTH_URL}/classroom/${project.classroomId}">Vollständige Ergebnisse ansehen</a>
          </p>
        `
      })
    }

    // Mark results as sent
    await prisma.classroomProject.update({
      where: { id: projectId },
      data: { resultsSentAt: new Date() }
    })

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error('Error sending results:', error)
    return NextResponse.json({ error: 'Failed to send results' }, { status: 500 })
  }
}
