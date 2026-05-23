import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get all groups for a classroom
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

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const groups = await prisma.classroomGroup.findMany({
      where: { classroomId: id },
      include: {
        members: {
          include: {
            student: {
              select: {
                id: true,
                studentName: true,
                studentEmail: true
              }
            }
          }
        }
      },
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(groups)
  } catch (error: any) {
    console.error('Error fetching groups:', error?.message, error)
    return NextResponse.json({ error: 'Failed to fetch groups', details: error?.message }, { status: 500 })
  }
}

// POST - Create groups for a classroom
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
    const { groups: groupsData, projectId } = body

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        students: {
          select: {
            id: true,
            studentName: true,
            studentEmail: true
          }
        }
      }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete existing groups for this project if specified
    if (projectId) {
      await prisma.classroomGroupMember.deleteMany({
        where: {
          group: {
            projectId
          }
        }
      })
      await prisma.classroomGroup.deleteMany({
        where: { projectId }
      })
    }

    // Create groups and assign students
    const createdGroups = []
    for (const groupData of groupsData) {
      const group = await prisma.classroomGroup.create({
        data: {
          classroomId: id,
          name: groupData.name,
          projectId,
          members: {
            create: groupData.studentIds.map((studentId: string) => ({
              studentId
            }))
          }
        },
        include: {
          members: {
            include: {
              student: {
                select: {
                  id: true,
                  studentName: true,
                  studentEmail: true
                }
              }
            }
          }
        }
      })
      createdGroups.push(group)
    }

    return NextResponse.json({ groups: createdGroups })
  } catch (error: any) {
    console.error('Error creating groups:', error?.message, error)
    return NextResponse.json({ error: 'Failed to create groups', details: error?.message }, { status: 500 })
  }
}
