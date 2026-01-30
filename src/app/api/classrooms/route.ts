import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

function generateJoinCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return code
}

// GET - Get all classrooms for the current user (as teacher)
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const classrooms = await prisma.classroom.findMany({
      where: { teacherId: userId },
      include: {
        students: true,
        projects: {
          include: {
            session: {
              include: {
                _count: {
                  select: { participants: true, ballots: true }
                }
              }
            }
          }
        },
        _count: {
          select: { students: true, projects: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(classrooms)
  } catch (error) {
    console.error('Error fetching classrooms:', error)
    return NextResponse.json({ error: 'Failed to fetch classrooms' }, { status: 500 })
  }
}

// POST - Create a new classroom
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id
    const body = await request.json()
    const { name, description } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    // Generate unique join code
    let joinCode = generateJoinCode()
    let attempts = 0
    while (attempts < 10) {
      const existing = await prisma.classroom.findUnique({ where: { joinCode } })
      if (!existing) break
      joinCode = generateJoinCode()
      attempts++
    }

    const classroom = await prisma.classroom.create({
      data: {
        name,
        description,
        joinCode,
        teacherId: userId
      },
      include: {
        _count: {
          select: { students: true, projects: true }
        }
      }
    })

    return NextResponse.json(classroom)
  } catch (error) {
    console.error('Error creating classroom:', error)
    return NextResponse.json({ error: 'Failed to create classroom' }, { status: 500 })
  }
}
