import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Add students to a group
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, groupId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, groupId } = await params
    const userId = (session.user as any).id
    const body = await request.json()
    const { studentIds } = body

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Verify group belongs to this classroom
    const group = await prisma.classroomGroup.findUnique({
      where: { id: groupId },
      select: { classroomId: true }
    })

    if (!group || group.classroomId !== id) {
      return NextResponse.json({ error: 'Group not found in this classroom' }, { status: 404 })
    }

    // Add students to group
    const createdMembers = []
    for (const studentId of studentIds) {
      // Check if student is already in this group
      const existingMember = await prisma.classroomGroupMember.findUnique({
        where: {
          groupId_studentId: {
            groupId,
            studentId
          }
        }
      })

      if (!existingMember) {
        // Remove student from other groups in the same project
        const otherMembers = await prisma.classroomGroupMember.findMany({
          where: {
            studentId,
            group: {
              projectId: group.projectId
            },
            groupId: { not: groupId }
          }
        })

        for (const otherMember of otherMembers) {
          await prisma.classroomGroupMember.delete({
            where: { id: otherMember.id }
          })
        }

        // Add student to this group
        const member = await prisma.classroomGroupMember.create({
          data: {
            groupId,
            studentId
          }
        })
        createdMembers.push(member)
      }
    }

    return NextResponse.json({ 
      message: `Added ${createdMembers.length} students to group`,
      members: createdMembers
    })
  } catch (error: any) {
    console.error('Error adding students to group:', error)
    return NextResponse.json({ error: 'Failed to add students to group', details: error?.message }, { status: 500 })
  }
}
