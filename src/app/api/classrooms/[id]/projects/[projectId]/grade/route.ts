import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Set teacher points for a project
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { points } = body

    if (points === undefined || points < 0 || points > 15) {
      return NextResponse.json({ error: 'Points must be between 0 and 15' }, { status: 400 })
    }

    // Verify teacher owns this classroom
    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: userId }
    })

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Get project with session results
    const project = await prisma.classroomProject.findUnique({
      where: { id: projectId },
      include: {
        session: {
          include: {
            participants: true,
            ballots: {
              where: { status: 'SUBMITTED' },
              include: { votes: true }
            }
          }
        }
      }
    })

    if (!project || project.classroomId !== id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.session || project.session.status !== 'CLOSED') {
      return NextResponse.json({ error: 'Session must be closed first' }, { status: 400 })
    }

    // Update project with teacher points
    const updatedProject = await prisma.classroomProject.update({
      where: { id: projectId },
      data: { teacherPoints: points }
    })

    // Calculate individual grades
    const participantCount = project.session.participants.length
    const totalPoints = points * participantCount

    // Calculate average percentages per participant
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

    // Calculate individual points based on percentage
    const grades = Object.entries(participantVotes).map(([id, data]) => {
      const avgPercent = data.count > 0 ? data.total / data.count : 0
      const individualPoints = Math.round((avgPercent / 100) * totalPoints * 10) / 10
      
      return {
        participantId: id,
        name: data.name,
        averagePercent: Math.round(avgPercent * 10) / 10,
        points: individualPoints,
        grade: pointsToGrade(individualPoints)
      }
    }).sort((a, b) => b.points - a.points)

    return NextResponse.json({
      project: updatedProject,
      teacherPoints: points,
      participantCount,
      totalPoints,
      grades
    })
  } catch (error: any) {
    console.error('Error grading project:', error?.message, error)
    return NextResponse.json({ error: 'Failed to grade project' }, { status: 500 })
  }
}

// GET - Get grades for a project
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; projectId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, projectId } = await params
    const userId = (session.user as any).id

    // Verify teacher owns this classroom
    const classroom = await prisma.classroom.findFirst({
      where: { id, teacherId: userId }
    })

    if (!classroom) {
      return NextResponse.json({ error: 'Classroom not found' }, { status: 404 })
    }

    // Get project with session results
    const project = await prisma.classroomProject.findUnique({
      where: { id: projectId },
      include: {
        session: {
          include: {
            participants: true,
            ballots: {
              where: { status: 'SUBMITTED' },
              include: { votes: true }
            }
          }
        }
      }
    })

    if (!project || project.classroomId !== id) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    if (!project.teacherPoints) {
      return NextResponse.json({ error: 'Project not graded yet', graded: false }, { status: 200 })
    }

    const participantCount = project.session?.participants.length || 0
    const totalPoints = project.teacherPoints * participantCount

    // Calculate average percentages per participant
    const participantVotes: { [key: string]: { total: number; count: number; name: string } } = {}
    
    project.session?.participants.forEach(p => {
      participantVotes[p.id] = { total: 0, count: 0, name: p.displayName }
    })

    project.session?.ballots.forEach(ballot => {
      ballot.votes.forEach(vote => {
        if (participantVotes[vote.personId]) {
          participantVotes[vote.personId].total += vote.percent
          participantVotes[vote.personId].count += 1
        }
      })
    })

    // Calculate individual points based on percentage
    const grades = Object.entries(participantVotes).map(([id, data]) => {
      const avgPercent = data.count > 0 ? data.total / data.count : 0
      const individualPoints = Math.round((avgPercent / 100) * totalPoints * 10) / 10
      
      return {
        participantId: id,
        name: data.name,
        averagePercent: Math.round(avgPercent * 10) / 10,
        points: individualPoints,
        grade: pointsToGrade(individualPoints)
      }
    }).sort((a, b) => b.points - a.points)

    return NextResponse.json({
      graded: true,
      teacherPoints: project.teacherPoints,
      participantCount,
      totalPoints,
      grades
    })
  } catch (error: any) {
    console.error('Error getting grades:', error?.message, error)
    return NextResponse.json({ error: 'Failed to get grades' }, { status: 500 })
  }
}

// Convert points to German grade
function pointsToGrade(points: number): string {
  const rounded = Math.round(points)
  if (rounded >= 15) return '1+'
  if (rounded >= 14) return '1'
  if (rounded >= 13) return '1-'
  if (rounded >= 12) return '2+'
  if (rounded >= 11) return '2'
  if (rounded >= 10) return '2-'
  if (rounded >= 9) return '3+'
  if (rounded >= 8) return '3'
  if (rounded >= 7) return '3-'
  if (rounded >= 6) return '4+'
  if (rounded >= 5) return '4'
  if (rounded >= 4) return '4-'
  if (rounded >= 3) return '5+'
  if (rounded >= 2) return '5'
  if (rounded >= 1) return '5-'
  return '6'
}
