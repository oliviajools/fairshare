'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { BottomNav } from '@/components/BottomNav'
import { Building2, Users, BarChart3, Plus, Crown, Shield, User } from 'lucide-react'

interface Company {
  id: string
  name: string
  slug: string
  description: string | null
  role: 'OWNER' | 'ADMIN' | 'MEMBER'
  memberCount: number
  sessionCount: number
  joinedAt: string
}

export default function CompaniesPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [newCompanyName, setNewCompanyName] = useState('')
  const [newCompanyDesc, setNewCompanyDesc] = useState('')
  const [creating, setCreating] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchCompanies()
    }
  }, [status, router])

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async () => {
    if (!newCompanyName.trim()) return

    setCreating(true)
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newCompanyName,
          description: newCompanyDesc
        })
      })

      if (response.ok) {
        const company = await response.json()
        setCompanies([company, ...companies])
        setNewCompanyName('')
        setNewCompanyDesc('')
        setShowCreate(false)
      }
    } catch (error) {
      console.error('Error creating company:', error)
    } finally {
      setCreating(false)
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'OWNER': return <Crown className="h-4 w-4 text-amber-500" />
      case 'ADMIN': return <Shield className="h-4 w-4 text-sky-500" />
      default: return <User className="h-4 w-4 text-gray-500" />
    }
  }

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'OWNER': return 'Inhaber'
      case 'ADMIN': return 'Admin'
      default: return 'Mitglied'
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!session?.user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8 pt-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="h-8 w-8 text-sky-500" />
              <h1 className="text-3xl font-bold text-gray-900">Unternehmen</h1>
            </div>
            <p className="text-gray-600">Verwalte deine Teams und Unternehmen</p>
          </div>

          {/* Create Button */}
          {!showCreate && (
            <Button 
              onClick={() => setShowCreate(true)}
              className="mb-6 bg-sky-500 hover:bg-sky-600"
            >
              <Plus className="mr-2 h-4 w-4" />
              Neues Unternehmen erstellen
            </Button>
          )}

          {/* Create Form */}
          {showCreate && (
            <Card className="mb-6 border-sky-200">
              <CardHeader>
                <CardTitle>Neues Unternehmen erstellen</CardTitle>
                <CardDescription>Erstelle ein Team oder Unternehmen für gemeinsame Sessions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Input
                    placeholder="Name des Unternehmens"
                    value={newCompanyName}
                    onChange={(e) => setNewCompanyName(e.target.value)}
                  />
                </div>
                <div>
                  <Input
                    placeholder="Beschreibung (optional)"
                    value={newCompanyDesc}
                    onChange={(e) => setNewCompanyDesc(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={createCompany}
                    disabled={!newCompanyName.trim() || creating}
                    className="bg-sky-500 hover:bg-sky-600"
                  >
                    {creating ? 'Erstellen...' : 'Erstellen'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowCreate(false)}
                  >
                    Abbrechen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Companies List */}
          {companies.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-16">
                <span className="text-6xl mb-6 block">🏢</span>
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Noch keine Unternehmen
                </h3>
                <p className="text-gray-600 mb-4">
                  Erstelle ein Unternehmen, um Sessions mit deinem Team zu teilen.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {companies.map((company) => (
                <Link key={company.id} href={`/companies/${company.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{company.name}</CardTitle>
                        <Badge variant="secondary" className="flex items-center gap-1">
                          {getRoleIcon(company.role)}
                          {getRoleLabel(company.role)}
                        </Badge>
                      </div>
                      {company.description && (
                        <CardDescription>{company.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {company.memberCount} Mitglieder
                        </span>
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-4 w-4" />
                          {company.sessionCount} Sessions
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
