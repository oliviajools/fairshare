import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Assign unassigned students to groups for a project
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
    const { projectId } = body

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      include: {
        students: true
      }
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
        members: true
      }
    })

    if (groups.length === 0) {
      return NextResponse.json({ error: 'No groups found for this project' }, { status: 400 })
    }

    // Get all assigned student IDs
    const assignedStudentIds = new Set()
    groups.forEach(group => {
      group.members.forEach(member => {
        assignedStudentIds.add(member.studentId)
      })
    })

    // Find unassigned students
    const unassignedStudents = classroom.students.filter(student => !assignedStudentIds.has(student.id))

    if (unassignedStudents.length === 0) {
      return NextResponse.json({ message: 'No unassigned students found' })
    }

    // Assign unassigned students to groups with the fewest members
    for (const student of unassignedStudents) {
      // Find group with fewest members
      const sortedGroups = [...groups].sort((a, b) => a.members.length - b.members.length)
      const smallestGroup = sortedGroups[0]

      // Add student to group
      await prisma.classroomGroupMember.create({
        data: {
          groupId: smallestGroup.id,
          studentId: student.id
        }
      })

      // Update local group members count
      smallestGroup.members.push({ studentId: student.id })
    }

    return NextResponse.json({ 
      message: `Assigned ${unassignedStudents.length} students to groups`,
      assignedCount: unassignedStudents.length
    })
  } catch (error: any) {
    console.error('Error assigning students:', error)
    return NextResponse.json({ error: 'Failed to assign students', details: error?.message }, { status: 500 })
  }
}
