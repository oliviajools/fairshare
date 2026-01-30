import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Get company settings (including SSO and Slack config)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Check if user is admin of this company
    const membership = await prisma.companyMember.findFirst({
      where: {
        companyId: id,
        user: { email: session.user.email },
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const company = await prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        domain: true,
        ssoEnabled: true,
        ssoProvider: true,
        slackWebhook: true,
        slackChannel: true
      }
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Mask sensitive data
    return NextResponse.json({
      ...company,
      slackWebhook: company.slackWebhook ? '••••••••' + company.slackWebhook.slice(-8) : null
    })
  } catch (error) {
    console.error('Error fetching company settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update company settings
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()

    // Check if user is admin of this company
    const membership = await prisma.companyMember.findFirst({
      where: {
        companyId: id,
        user: { email: session.user.email },
        role: { in: ['OWNER', 'ADMIN'] }
      }
    })

    if (!membership) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Only allow updating specific fields
    const allowedFields = ['domain', 'ssoEnabled', 'ssoProvider', 'ssoConfig', 'slackWebhook', 'slackChannel']
    const updateData: Record<string, any> = {}
    
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field]
      }
    }

    const updated = await prisma.company.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        name: true,
        domain: true,
        ssoEnabled: true,
        ssoProvider: true,
        slackChannel: true
      }
    })

    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating company settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
