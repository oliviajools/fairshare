'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { BottomNav } from '@/components/BottomNav'
import { Search, User, Building2, Users, BarChart3, UserPlus, Check, ArrowLeft } from 'lucide-react'

interface SearchUser {
  id: string
  name: string | null
  email: string
  image: string | null
  sessionCount: number
}

interface SearchCompany {
  id: string
  name: string
  slug: string
  description: string | null
  memberCount: number
  sessionCount: number
  isMember: boolean
  role: string | null
}

export default function SearchPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [query, setQuery] = useState('')
  const [users, setUsers] = useState<SearchUser[]>([])
  const [companies, setCompanies] = useState<SearchCompany[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'companies'>('all')
  const [joining, setJoining] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      if (query.length >= 2) {
        performSearch()
      } else {
        setUsers([])
        setCompanies([])
      }
    }, 300)

    return () => clearTimeout(delaySearch)
  }, [query, activeTab])

  const performSearch = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${activeTab}`)
      if (response.ok) {
        const data = await response.json()
        setUsers(data.users || [])
        setCompanies(data.companies || [])
      }
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setLoading(false)
    }
  }

  const joinCompany = async (companyId: string) => {
    setJoining(companyId)
    try {
      const response = await fetch(`/api/companies/${companyId}/join`, {
        method: 'POST'
      })
      if (response.ok) {
        setCompanies(companies.map(c => 
          c.id === companyId ? { ...c, isMember: true, role: 'MEMBER' } : c
        ))
      }
    } catch (error) {
      console.error('Error joining company:', error)
    } finally {
      setJoining(null)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
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
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/account')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <Search className="h-8 w-8 text-sky-500" />
                <h1 className="text-3xl font-bold text-gray-900">Suche</h1>
              </div>
              <p className="text-gray-600">Finde andere User und Unternehmen</p>
            </div>
          </div>

          {/* Search Input */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, E-Mail oder Unternehmen suchen..."
              className="pl-10 h-12 text-lg"
            />
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6">
            <Button
              variant={activeTab === 'all' ? 'default' : 'outline'}
              onClick={() => setActiveTab('all')}
              className={activeTab === 'all' ? 'bg-sky-500 hover:bg-sky-600' : ''}
              size="sm"
            >
              Alle
            </Button>
            <Button
              variant={activeTab === 'users' ? 'default' : 'outline'}
              onClick={() => setActiveTab('users')}
              className={activeTab === 'users' ? 'bg-sky-500 hover:bg-sky-600' : ''}
              size="sm"
            >
              <User className="mr-1 h-4 w-4" />
              User
            </Button>
            <Button
              variant={activeTab === 'companies' ? 'default' : 'outline'}
              onClick={() => setActiveTab('companies')}
              className={activeTab === 'companies' ? 'bg-sky-500 hover:bg-sky-600' : ''}
              size="sm"
            >
              <Building2 className="mr-1 h-4 w-4" />
              Unternehmen
            </Button>
          </div>

          {/* Results */}
          {loading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
            </div>
          ) : query.length < 2 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-12">
                <Search className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">
                  Gib mindestens 2 Zeichen ein, um zu suchen
                </p>
              </CardContent>
            </Card>
          ) : users.length === 0 && companies.length === 0 ? (
            <Card className="border-2 border-dashed border-gray-200">
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Keine Ergebnisse für "{query}"</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Users */}
              {users.length > 0 && (activeTab === 'all' || activeTab === 'users') && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <User className="h-5 w-5 text-sky-500" />
                    User ({users.length})
                  </h2>
                  <div className="space-y-2">
                    {users.map((user) => (
                      <Card key={user.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            {user.image ? (
                              <img
                                src={user.image}
                                alt={user.name || 'User'}
                                className="w-12 h-12 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center">
                                <User className="h-6 w-6 text-sky-600" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium">{user.name || 'Unbenannt'}</p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          </div>
                          <Badge variant="secondary">
                            {user.sessionCount} Sessions
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Companies */}
              {companies.length > 0 && (activeTab === 'all' || activeTab === 'companies') && (
                <div>
                  <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-sky-500" />
                    Unternehmen ({companies.length})
                  </h2>
                  <div className="space-y-2">
                    {companies.map((company) => (
                      <Card key={company.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="flex items-center justify-between py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-amber-100 flex items-center justify-center">
                              <Building2 className="h-6 w-6 text-amber-600" />
                            </div>
                            <div>
                              <p className="font-medium">{company.name}</p>
                              {company.description && (
                                <p className="text-sm text-gray-500 line-clamp-1">{company.description}</p>
                              )}
                              <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {company.memberCount}
                                </span>
                                <span className="flex items-center gap-1">
                                  <BarChart3 className="h-3 w-3" />
                                  {company.sessionCount}
                                </span>
                              </div>
                            </div>
                          </div>
                          {company.isMember ? (
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <Check className="h-3 w-3" />
                              Mitglied
                            </Badge>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => joinCompany(company.id)}
                              disabled={joining === company.id}
                              className="bg-sky-500 hover:bg-sky-600"
                            >
                              {joining === company.id ? (
                                '...'
                              ) : (
                                <>
                                  <UserPlus className="h-4 w-4 mr-1" />
                                  Beitreten
                                </>
                              )}
                            </Button>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
