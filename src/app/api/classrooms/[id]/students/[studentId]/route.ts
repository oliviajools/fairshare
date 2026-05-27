import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// DELETE - Remove a student from a classroom
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string, studentId: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id, studentId } = await params
    const userId = (session.user as any).id

    // Verify user is the teacher of this classroom
    const classroom = await prisma.classroom.findUnique({
      where: { id },
      select: { teacherId: true }
    })

    if (!classroom || classroom.teacherId !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check if student exists in this classroom
    const student = await prisma.classroomStudent.findUnique({
      where: {
        id: studentId,
        classroomId: id
      }
    })

    if (!student) {
      return NextResponse.json({ error: 'Student not found in this classroom' }, { status: 404 })
    }

    // Remove student from all groups in this classroom
    await prisma.classroomGroupMember.deleteMany({
      where: {
        student: {
          classroomId: id
        }
      }
    })

    // Remove student from classroom
    await prisma.classroomStudent.delete({
      where: { id: studentId }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error removing student:', error)
    return NextResponse.json({ error: 'Failed to remove student', details: error?.message }, { status: 500 })
  }
}
