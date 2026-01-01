import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch user's companies
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        companies: {
          include: {
            company: {
              include: {
                _count: {
                  select: {
                    members: true,
                    sessions: true
                  }
                }
              }
            }
          }
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    const companies = user.companies.map(cm => ({
      id: cm.company.id,
      name: cm.company.name,
      slug: cm.company.slug,
      description: cm.company.description,
      logo: (cm.company as any).logo,
      domain: (cm.company as any).domain,
      role: cm.role,
      memberCount: cm.company._count.members,
      sessionCount: cm.company._count.sessions,
      joinedAt: cm.joinedAt
    }))

    return NextResponse.json(companies)
  } catch (error) {
    console.error('Error fetching companies:', error)
    return NextResponse.json({ error: 'Fehler beim Laden der Unternehmen' }, { status: 500 })
  }
}

// POST - Create a new company
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Nicht autorisiert' }, { status: 401 })
    }

    const { name, description } = await request.json()

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: 'Name muss mindestens 2 Zeichen haben' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email }
    })

    if (!user) {
      return NextResponse.json({ error: 'Benutzer nicht gefunden' }, { status: 404 })
    }

    // Generate slug from name
    const baseSlug = name.toLowerCase()
      .replace(/[äöüß]/g, (c: string) => ({ 'ä': 'ae', 'ö': 'oe', 'ü': 'ue', 'ß': 'ss' }[c] || c))
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')

    // Check if slug exists and make unique
    let slug = baseSlug
    let counter = 1
    while (await prisma.company.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${counter}`
      counter++
    }

    // Create company and add user as owner
    const company = await prisma.company.create({
      data: {
        name: name.trim(),
        slug,
        description: description?.trim() || null,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER'
          }
        }
      },
      include: {
        _count: {
          select: {
            members: true,
            sessions: true
          }
        }
      }
    })

    return NextResponse.json({
      id: company.id,
      name: company.name,
      slug: company.slug,
      description: company.description,
      role: 'OWNER',
      memberCount: company._count.members,
      sessionCount: company._count.sessions
    })
  } catch (error) {
    console.error('Error creating company:', error)
    return NextResponse.json({ error: 'Fehler beim Erstellen des Unternehmens' }, { status: 500 })
  }
}
