import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

// POST - Send grades to students via email
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true, name: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all unsent grades for this classroom
    const gradesToSend = await prisma.classroomGrade.findMany({
      where: {
        group: {
          classroomId: id
        },
        sentAt: null
      },
      include: {
        student: true,
        group: {
          include: {
            project: true
          }
        }
      }
    })

    if (gradesToSend.length === 0) {
      return NextResponse.json({ message: 'No unsent grades found' })
    }

    // Send emails
    const sentGrades = []
    for (const grade of gradesToSend) {
      if (!grade.student.studentEmail) {
        continue
      }

      try {
        await resend.emails.send({
          from: 'noreply@teampayer.de',
          to: grade.student.studentEmail,
          subject: `Deine Note für ${grade.group.project?.name || 'das Projekt'}`,
          html: `
            <h1>Deine Note</h1>
            <p>Hallo ${grade.student.studentName},</p>
            <p>Du hast für das Projekt <strong>${grade.group.project?.name || 'das Projekt'}</strong> in der Gruppe <strong>${grade.group.name}</strong> folgende Note erhalten:</p>
            <h2>${grade.score}</h2>
            ${grade.comment ? `<p>Kommentar: ${grade.comment}</p>` : ''}
            <p>Viele Grüße,<br>${classroom.name}</p>
          `
        })

        // Mark as sent
        const updated = await prisma.classroomGrade.update({
          where: { id: grade.id },
          data: { sentAt: new Date() }
        })
        sentGrades.push(updated)
      } catch (emailError) {
        console.error('Failed to send email to', grade.student.studentEmail, emailError)
      }
    }

    return NextResponse.json({ 
      message: `Sent ${sentGrades.length} grades`,
      sentGrades 
    })
  } catch (error: any) {
    console.error('Error sending grades:', error)
    return NextResponse.json({ error: 'Failed to send grades', details: error?.message }, { status: 500 })
  }
}
