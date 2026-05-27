import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get all grades for a classroom
export async function GET(
  request: Request,
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
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Get all grades for this classroom
    const grades = await prisma.classroomGrade.findMany({
      where: {
        group: {
          classroomId: id
        }
      },
      include: {
        student: true,
        group: {
          include: {
            project: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(grades)
  } catch (error: any) {
    console.error('Error fetching grades:', error)
    return NextResponse.json({ error: 'Failed to fetch grades', details: error?.message }, { status: 500 })
  }
}

// POST - Create or update grades for a group
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
    const body = await request.json()
    const { grades } = body // Array of { studentId, score, comment }

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Create or update grades
    const createdGrades = []
    for (const grade of grades) {
      const existingGrade = await prisma.classroomGrade.findUnique({
        where: {
          groupId_studentId: {
            groupId: grade.groupId,
            studentId: grade.studentId
          }
        }
      })

      if (existingGrade) {
        const updated = await prisma.classroomGrade.update({
          where: { id: existingGrade.id },
          data: {
            score: grade.score,
            comment: grade.comment
          }
        })
        createdGrades.push(updated)
      } else {
        const created = await prisma.classroomGrade.create({
          data: {
            groupId: grade.groupId,
            studentId: grade.studentId,
            score: grade.score,
            comment: grade.comment
          }
        })
        createdGrades.push(created)
      }
    }

    return NextResponse.json(createdGrades)
  } catch (error: any) {
    console.error('Error saving grades:', error)
    return NextResponse.json({ error: 'Failed to save grades', details: error?.message }, { status: 500 })
  }
}
