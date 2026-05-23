import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { randomUUID } from 'crypto'

// POST - Create voting sessions for all groups in a classroom
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
    const userId = (session.user as any).id
    const body = await request.json()
    const { projectId, sessionTitle, sessionDate } = body

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all groups for this project
    const groups = await prisma.classroomGroup.findMany({
      where: { 
        classroomId: id,
        projectId 
      },
      include: {
        members: {
          include: {
            student: {
              include: {
                user: true
              }
            }
          }
        }
      }
    })

    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups found for this project' }, { status: 400 })
    }

    // Create a voting session for each group
    const createdSessions = []
    for (const group of groups) {
      // Create voting session
      const votingSession = await prisma.votingSession.create({
        data: {
          id: randomUUID(),
          title: sessionTitle || `${group.name} - Gruppenbewertung`,
          date: sessionDate ? new Date(sessionDate) : null,
          status: 'OPEN',
          isAnonymous: true,
          classroomProjectId: group.id
        }
      })

      // Create participants for each student in the group
      const participants = []
      for (const member of group.members) {
        // Find or create user for the student
        let userId = member.student.userId
        if (!userId && member.student.studentEmail) {
          // Try to find user by email
          const existingUser = await prisma.user.findUnique({
            where: { email: member.student.studentEmail }
          })
          if (existingUser) {
            userId = existingUser.id
          }
        }

        const participant = await prisma.participant.create({
          data: {
            sessionId: votingSession.id,
            userId,
            displayName: member.student.studentName,
            invitedEmail: member.student.studentEmail,
            inviteToken: randomUUID()
          }
        })
        participants.push(participant)
      }

      // Link session to group
      await prisma.classroomGroup.update({
        where: { id: group.id },
        data: { sessionId: votingSession.id }
      })

      createdSessions.push({
        group: group.name,
        sessionId: votingSession.id,
        participantCount: participants.length
      })
    }

    return NextResponse.json({ sessions: createdSessions })
  } catch (error: any) {
    console.error('Error creating group sessions:', error?.message, error)
    return NextResponse.json({ error: 'Failed to create sessions', details: error?.message }, { status: 500 })
  }
}
