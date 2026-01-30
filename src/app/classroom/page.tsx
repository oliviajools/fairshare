'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BottomNav } from '@/components/BottomNav'
import {
  ArrowLeft,
  Plus,
  Users,
  FolderOpen,
  Copy,
  Check,
  GraduationCap,
  BookOpen
} from 'lucide-react'

interface Classroom {
  id: string
  name: string
  description: string | null
  joinCode: string
  isActive: boolean
  createdAt: string
  _count: {
    students: number
    projects: number
  }
}

export default function ClassroomPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [copied, setCopied] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchClassrooms()
    }
  }, [status, router])

  const fetchClassrooms = async () => {
    try {
      const response = await fetch('/api/classrooms')
      if (response.ok) {
        const data = await response.json()
        setClassrooms(data)
      }
    } catch (error) {
      console.error('Error fetching classrooms:', error)
    } finally {
      setLoading(false)
    }
  }

  const createClassroom = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch('/api/classrooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        const newClassroom = await response.json()
        setClassrooms([newClassroom, ...classrooms])
        setShowCreate(false)
        setFormData({ name: '', description: '' })
      }
    } catch (error) {
      console.error('Error creating classroom:', error)
    } finally {
      setCreating(false)
    }
  }

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-24">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <button 
              onClick={() => router.push('/')}
              className="inline-flex items-center text-gray-500 hover:text-gray-900 transition-colors mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </button>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Meine Klassen</h1>
                  <p className="text-gray-500">Gruppenarbeiten verwalten</p>
                </div>
              </div>
              <Button
                onClick={() => setShowCreate(true)}
                className="bg-gradient-to-r from-indigo-500 to-blue-600 hover:opacity-90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Neue Klasse
              </Button>
            </div>
          </div>

          {/* Create Form */}
          {showCreate && (
            <Card className="mb-6 border-indigo-200">
              <CardHeader>
                <CardTitle>Neue Klasse erstellen</CardTitle>
                <CardDescription>
                  Erstelle eine Klasse, zu der sich Schüler mit einem Code anmelden können
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createClassroom} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Klassenname</Label>
                    <Input
                      id="name"
                      placeholder="z.B. Informatik 10b"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Beschreibung (optional)</Label>
                    <Input
                      id="description"
                      placeholder="z.B. Schuljahr 2025/26"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creating}>
                      {creating ? 'Erstellen...' : 'Klasse erstellen'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>
                      Abbrechen
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}

          {/* Classrooms List */}
          {classrooms.length === 0 && !showCreate ? (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-indigo-100 flex items-center justify-center mx-auto mb-6">
                <BookOpen className="h-10 w-10 text-indigo-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Noch keine Klassen
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto mb-6">
                Erstelle deine erste Klasse, um Gruppenarbeiten zu verwalten und Bewertungen zu sammeln.
              </p>
              <Button onClick={() => setShowCreate(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Erste Klasse erstellen
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {classrooms.map((classroom) => (
                <Card key={classroom.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-lg">{classroom.name}</h3>
                          <div className="flex items-center gap-1 px-2 py-1 bg-indigo-100 rounded-lg">
                            <span className="font-mono text-sm font-bold text-indigo-700">
                              {classroom.joinCode}
                            </span>
                            <button
                              onClick={() => copyCode(classroom.joinCode)}
                              className="p-1 hover:bg-indigo-200 rounded transition-colors"
                            >
                              {copied === classroom.joinCode ? (
                                <Check className="h-3.5 w-3.5 text-green-600" />
                              ) : (
                                <Copy className="h-3.5 w-3.5 text-indigo-600" />
                              )}
                            </button>
                          </div>
                        </div>
                        {classroom.description && (
                          <p className="text-gray-500 text-sm mb-2">{classroom.description}</p>
                        )}
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="h-4 w-4" />
                            {classroom._count.students} Schüler
                          </span>
                          <span className="flex items-center gap-1">
                            <FolderOpen className="h-4 w-4" />
                            {classroom._count.projects} Projekte
                          </span>
                        </div>
                      </div>
                      <Link href={`/classroom/${classroom.id}`}>
                        <Button variant="outline">
                          Öffnen
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
