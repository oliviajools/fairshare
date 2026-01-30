import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// POST - Join a classroom with a code
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { joinCode, studentName, studentEmail } = body

    if (!joinCode) {
      return NextResponse.json({ error: 'Join code is required' }, { status: 400 })
    }

    if (!studentName) {
      return NextResponse.json({ error: 'Student name is required' }, { status: 400 })
    }

    const classroom = await prisma.classroom.findUnique({
      where: { joinCode: joinCode.toUpperCase() },
      include: { teacher: { select: { name: true, email: true } } }
    })

    if (!classroom) {
      return NextResponse.json({ error: 'Ungültiger Beitrittscode' }, { status: 404 })
    }

    if (!classroom.isActive) {
      return NextResponse.json({ error: 'Diese Klasse ist nicht mehr aktiv' }, { status: 403 })
    }

    // Check if student already joined
    const email = studentEmail || (session?.user as any)?.email
    if (email) {
      const existingStudent = await prisma.classroomStudent.findUnique({
        where: {
          classroomId_studentEmail: {
            classroomId: classroom.id,
            studentEmail: email
          }
        }
      })

      if (existingStudent) {
        return NextResponse.json({ 
          classroom,
          student: existingStudent,
          alreadyJoined: true 
        })
      }
    }

    // Add student to classroom
    const student = await prisma.classroomStudent.create({
      data: {
        classroomId: classroom.id,
        userId: session?.user ? (session.user as any).id : null,
        studentName,
        studentEmail: email || null
      }
    })

    return NextResponse.json({ classroom, student, alreadyJoined: false })
  } catch (error) {
    console.error('Error joining classroom:', error)
    return NextResponse.json({ error: 'Failed to join classroom' }, { status: 500 })
  }
}
