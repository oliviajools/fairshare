import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'
import { generateInviteToken } from '@/lib/jwt'

const APP_URL = process.env.NEXTAUTH_URL || 'https://teampayer.de'

// GET - Get all projects for a classroom
export async function GET(
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

    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: userId }
    })

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    const projects = await prisma.classroomProject.findMany({
      where: { classroomId: id },
      include: {
        session: {
          include: {
            participants: true,
            _count: { select: { participants: true, ballots: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error) {
    console.error('Error fetching projects:', error)
    return NextResponse.json({ error: 'Failed to fetch projects' }, { status: 500 })
  }
}

// POST - Create a new project with voting session
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
    const { name, description, dueDate } = body

    if (!name) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 })
    }

    // Verify teacher owns this classroom
    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: userId },
      include: { students: true }
    })

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    if (classroom.students.length === 0) {
      return NextResponse.json({ error: 'Keine Schüler in der Klasse' }, { status: 400 })
    }

    // Create voting session for students
    const organizerToken = generateInviteToken()
    const votingSession = await prisma.votingSession.create({
      data: {
        title: `${name} - Bewertung`,
        evaluationInfo: 'Bewertet fair den Beitrag jedes Teammitglieds: Wer hat welche Aufgaben übernommen? Wie war die Qualität? Wie war das Engagement?',
        isAnonymous: true,
        creatorId: userId,
        organizerToken,
        date: dueDate ? new Date(dueDate) : new Date()
      }
    })

    // Create participants for each student
    const inviteLinks = []
    for (const student of classroom.students) {
      const inviteToken = generateInviteToken()
      await prisma.participant.create({
        data: {
          sessionId: votingSession.id,
          userId: student.userId,
          displayName: student.studentName,
          invitedEmail: student.studentEmail,
          inviteToken
        }
      })
      inviteLinks.push({
        name: student.studentName,
        email: student.studentEmail,
        link: `${APP_URL}/vote/${inviteToken}`
      })
    }

    // Create the project
    const project = await prisma.classroomProject.create({
      data: {
        classroomId: id,
        name,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        sessionId: votingSession.id
      },
      include: {
        session: {
          include: {
            participants: true,
            _count: { select: { participants: true, ballots: true } }
          }
        }
      }
    })

    return NextResponse.json({ project, inviteLinks })
  } catch (error) {
    console.error('Error creating project:', error)
    return NextResponse.json({ error: 'Failed to create project' }, { status: 500 })
  }
}
