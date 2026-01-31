'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ArrowLeft, User, Mail, Calendar, Users, Trash2, AlertTriangle, Camera, Search, Pencil, Check, X } from 'lucide-react'
import { BottomNav } from '@/components/BottomNav'

interface AccountData {
  id: string
  name: string | null
  email: string
  image: string | null
  createdAt: string
  _count: {
    createdSessions: number
    participants: number
  }
}

export default function AccountPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [account, setAccount] = useState<AccountData | null>(null)
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [editingName, setEditingName] = useState(false)
  const [newName, setNewName] = useState('')
  const [uploadingImage, setUploadingImage] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchAccount()
    }
  }, [status, router])

  const fetchAccount = async () => {
    try {
      const response = await fetch('/api/account')
      if (response.ok) {
        const data = await response.json()
        setAccount(data)
      }
    } catch (error) {
      console.error('Error fetching account:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 2 * 1024 * 1024) {
      alert('Bild darf maximal 2MB groß sein')
      return
    }

    setUploadingImage(true)
    try {
      const reader = new FileReader()
      reader.onloadend = async () => {
        const base64 = reader.result as string
        const response = await fetch('/api/account', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 })
        })
        if (response.ok) {
          const updated = await response.json()
          setAccount(prev => prev ? { ...prev, image: updated.image } : null)
        }
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('Error uploading image:', error)
      setUploadingImage(false)
    }
  }

  const handleNameUpdate = async () => {
    if (!newName.trim()) return
    try {
      const response = await fetch('/api/account', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim() })
      })
      if (response.ok) {
        const updated = await response.json()
        setAccount(prev => prev ? { ...prev, name: updated.name } : null)
        setEditingName(false)
      }
    } catch (error) {
      console.error('Error updating name:', error)
    }
  }

  const handleDeleteAccount = async () => {
    setDeleting(true)
    try {
      const response = await fetch('/api/account', {
        method: 'DELETE'
      })

      if (response.ok) {
        await signOut({ callbackUrl: '/login' })
      } else {
        alert('Fehler beim Löschen des Accounts')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Fehler beim Löschen des Accounts')
    } finally {
      setDeleting(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (!session?.user || !account) {
    return null
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 pb-24">
      <div className="container mx-auto px-6 py-8 pt-20">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => router.push('/')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">Mein Account</h1>
          </div>

          {/* Search Link */}
          <Link href="/search">
            <Card className="mb-6 hover:shadow-md transition-shadow cursor-pointer border-sky-200 bg-sky-50/50">
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-3">
                  <Search className="h-6 w-6 text-sky-500" />
                  <div>
                    <p className="font-medium">User & Unternehmen suchen</p>
                    <p className="text-sm text-gray-500">Finde andere TeamPayer</p>
                  </div>
                </div>
                <ArrowLeft className="h-5 w-5 text-gray-400 rotate-180" />
              </CardContent>
            </Card>
          </Link>

          {/* Profile Card */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center gap-4">
                {/* Profile Image */}
                <div className="relative">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  {account.image ? (
                    <img
                      src={account.image}
                      alt="Profilbild"
                      className="h-20 w-20 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-sky-100 flex items-center justify-center">
                      <User className="h-10 w-10 text-sky-600" />
                    </div>
                  )}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-sky-500 text-white flex items-center justify-center hover:bg-sky-600 transition-colors"
                  >
                    {uploadingImage ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    ) : (
                      <Camera className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {/* Name & Email */}
                <div className="flex-1">
                  {editingName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Dein Name"
                        className="h-9"
                        autoFocus
                      />
                      <Button size="sm" onClick={handleNameUpdate} className="bg-sky-500 hover:bg-sky-600">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingName(false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <CardTitle className="text-xl">{account.name || 'Kein Name'}</CardTitle>
                      <button
                        onClick={() => {
                          setNewName(account.name || '')
                          setEditingName(true)
                        }}
                        className="text-gray-400 hover:text-sky-500"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                  <CardDescription className="flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4" />
                    {account.email}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Dabei seit</p>
                    <p className="font-medium">{formatDate(account.createdAt)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <Users className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Erstellte Sessions</p>
                    <p className="font-medium">{account._count.createdSessions}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <User className="h-5 w-5 text-gray-500" />
                  <div>
                    <p className="text-sm text-gray-500">Teilnahmen</p>
                    <p className="font-medium">{account._count.participants}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logout */}
          <Card className="mb-6">
            <CardContent className="py-4">
              <Button
                variant="outline"
                className="w-full"
                onClick={() => signOut({ callbackUrl: '/login' })}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-red-200 bg-red-50/50">
            <CardHeader>
              <CardTitle className="text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Gefahrenzone
              </CardTitle>
              <CardDescription className="text-red-600">
                Diese Aktionen können nicht rückgängig gemacht werden.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!showDeleteConfirm ? (
                <Button
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-100"
                  onClick={() => setShowDeleteConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Account löschen
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-sm text-red-700">
                    Bist du sicher? Dein Account und alle deine Daten werden unwiderruflich gelöscht.
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                    >
                      {deleting ? 'Löschen...' : 'Ja, Account löschen'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
