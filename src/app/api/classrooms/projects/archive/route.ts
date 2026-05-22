import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get all completed classroom projects for the current user's classrooms
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    // Get all classrooms where the user is the teacher
    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: userId },
      select: { id: true }
    })

    const classroomIds = classrooms.map(c => c.id)

    // Get completed projects from these classrooms
    // A project is considered "completed" when results have been sent
    const projects = await prisma.classroomProject.findMany({
      where: {
        classroomId: { in: classroomIds },
        resultsSentAt: { not: null }
      },
      include: {
        classroom: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: { resultsSentAt: 'desc' }
    })

    return NextResponse.json(projects)
  } catch (error: any) {
    console.error('Error fetching classroom projects archive:', error?.message, error)
    return NextResponse.json({ error: 'Failed to fetch projects', details: error?.message }, { status: 500 })
  }
}
