'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { 
  Users, 
  Trash2, 
  Pencil, 
  Search, 
  Building2, 
  Calendar, 
  UserCheck,
  X,
  Check,
  ArrowLeft,
  Shield,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  RefreshCw
} from 'lucide-react'
import Link from 'next/link'

interface User {
  id: string
  name: string | null
  email: string
  emailVerified: string | null
  createdAt: string
  updatedAt: string
  _count: {
    companies: number
    createdSessions: number
    participants: number
  }
}

export default function AdminPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ name: '', email: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchUsers()
    }
  }, [status, router])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/admin/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else if (response.status === 401) {
        setError('Keine Admin-Berechtigung')
      } else {
        setError('Fehler beim Laden der Benutzer')
      }
    } catch (error) {
      console.error('Error fetching users:', error)
      setError('Verbindungsfehler')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string, userName: string | null) => {
    if (!confirm(`Möchtest du "${userName || 'Unbenannt'}" wirklich löschen? Alle zugehörigen Daten werden ebenfalls gelöscht!`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      })

      if (response.ok) {
        setUsers(users.filter(u => u.id !== userId))
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Löschen')
      }
    } catch (error) {
      console.error('Error deleting user:', error)
      alert('Fehler beim Löschen')
    }
  }

  const startEdit = (user: User) => {
    setEditingUser(user.id)
    setEditForm({ name: user.name || '', email: user.email })
  }

  const cancelEdit = () => {
    setEditingUser(null)
    setEditForm({ name: '', email: '' })
  }

  const saveEdit = async (userId: string) => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...editForm })
      })

      if (response.ok) {
        const updatedUser = await response.json()
        setUsers(users.map(u => u.id === userId ? { ...u, ...updatedUser } : u))
        setEditingUser(null)
      } else {
        const data = await response.json()
        alert(data.error || 'Fehler beim Speichern')
      }
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Fehler beim Speichern')
    } finally {
      setSaving(false)
    }
  }

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <Shield className="h-12 w-12 text-red-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Zugriff verweigert</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Link href="/">
              <Button variant="outline">Zurück zur Startseite</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Link href="/">
              <button className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md">
                <ArrowLeft className="h-5 w-5" />
              </button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-6 w-6 text-sky-500" />
                Admin Dashboard
              </h1>
              <p className="text-gray-600">Benutzerverwaltung</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-4 md:grid-cols-3 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-sky-100 flex items-center justify-center">
                    <Users className="h-6 w-6 text-sky-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{users.length}</p>
                    <p className="text-sm text-gray-600">Benutzer gesamt</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                    <UserCheck className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => u.emailVerified).length}
                    </p>
                    <p className="text-sm text-gray-600">Verifiziert</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
                    <Calendar className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {users.filter(u => {
                        const created = new Date(u.createdAt)
                        const now = new Date()
                        const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
                        return diffDays <= 7
                      }).length}
                    </p>
                    <p className="text-sm text-gray-600">Neue (7 Tage)</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card className="mb-6">
            <CardContent className="pt-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Suche nach Name oder E-Mail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Users Table */}
          <Card>
            <CardHeader>
              <CardTitle>Alle Benutzer ({filteredUsers.length})</CardTitle>
              <CardDescription>
                Klicke auf den Stift zum Bearbeiten oder den Papierkorb zum Löschen
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 font-medium text-gray-600">Name / E-Mail</th>
                      <th className="pb-3 font-medium text-gray-600 hidden md:table-cell">Status</th>
                      <th className="pb-3 font-medium text-gray-600 hidden lg:table-cell">Statistiken</th>
                      <th className="pb-3 font-medium text-gray-600 hidden md:table-cell">Erstellt</th>
                      <th className="pb-3 font-medium text-gray-600 text-right">Aktionen</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="py-4">
                          {editingUser === user.id ? (
                            <div className="space-y-2">
                              <Input
                                placeholder="Name"
                                value={editForm.name}
                                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                                className="h-8"
                              />
                              <Input
                                placeholder="E-Mail"
                                type="email"
                                value={editForm.email}
                                onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                                className="h-8"
                              />
                            </div>
                          ) : (
                            <div>
                              <p className="font-medium text-gray-900">
                                {user.name || <span className="text-gray-400 italic">Kein Name</span>}
                              </p>
                              <p className="text-sm text-gray-500">{user.email}</p>
                            </div>
                          )}
                        </td>
                        <td className="py-4 hidden md:table-cell">
                          {user.emailVerified ? (
                            <Badge className="bg-green-100 text-green-800">Verifiziert</Badge>
                          ) : (
                            <Badge variant="secondary">Nicht verifiziert</Badge>
                          )}
                        </td>
                        <td className="py-4 hidden lg:table-cell">
                          <div className="flex gap-2 text-xs">
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Building2 className="h-3 w-3" />
                              {user._count.companies}
                            </Badge>
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {user._count.createdSessions}
                            </Badge>
                          </div>
                        </td>
                        <td className="py-4 text-sm text-gray-500 hidden md:table-cell">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="py-4 text-right">
                          {editingUser === user.id ? (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveEdit(user.id)}
                                disabled={saving}
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={cancelEdit}
                                className="text-gray-500 hover:text-gray-600"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ) : (
                            <div className="flex gap-1 justify-end">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(user)}
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(user.id, user.name)}
                                className="text-red-500 hover:text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredUsers.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    {searchTerm ? 'Keine Benutzer gefunden' : 'Keine Benutzer vorhanden'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
