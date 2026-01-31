'use client'

import { useState, useEffect, use } from 'react'
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
  Copy,
  Check,
  GraduationCap,
  FolderOpen,
  Send,
  BarChart3,
  Clock,
  CheckCircle2
} from 'lucide-react'

interface Student {
  id: string
  studentName: string
  studentEmail: string | null
  joinedAt: string
}

interface Project {
  id: string
  name: string
  description: string | null
  dueDate: string | null
  resultsSentAt: string | null
  session: {
    id: string
    status: 'OPEN' | 'CLOSED'
    _count: { participants: number; ballots: number }
  } | null
}

interface Classroom {
  id: string
  name: string
  description: string | null
  joinCode: string
  students: Student[]
  projects: Project[]
}

export default function ClassroomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { status } = useSession()
  const [classroom, setClassroom] = useState<Classroom | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    dueDate: ''
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchClassroom()
      fetchProjects()
    }
  }, [status, id])

  const fetchClassroom = async () => {
    try {
      const response = await fetch('/api/classrooms')
      if (response.ok) {
        const data = await response.json()
        const found = data.find((c: any) => c.id === id)
        if (found) setClassroom(found)
      }
    } catch (error) {
      console.error('Error fetching classroom:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const response = await fetch(`/api/classrooms/${id}/projects`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data)
      }
    } catch (error) {
      console.error('Error fetching projects:', error)
    }
  }

  const createProject = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    try {
      const response = await fetch(`/api/classrooms/${id}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(projectForm)
      })
      if (response.ok) {
        const { project } = await response.json()
        setProjects([project, ...projects])
        setShowCreateProject(false)
        setProjectForm({ name: '', description: '', dueDate: '' })
      }
    } catch (error) {
      console.error('Error creating project:', error)
    } finally {
      setCreating(false)
    }
  }

  const sendResults = async (projectId: string) => {
    setSending(projectId)
    try {
      const response = await fetch(`/api/classrooms/${id}/send-results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (response.ok) {
        fetchProjects()
      }
    } catch (error) {
      console.error('Error sending results:', error)
    } finally {
      setSending(null)
    }
  }

  const copyCode = () => {
    if (classroom) {
      navigator.clipboard.writeText(classroom.joinCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
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

  if (!classroom) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center pb-20">
        <div className="text-center">
          <p className="text-gray-600">Klasse nicht gefunden</p>
          <Link href="/classroom">
            <Button className="mt-4">Zurück zu Klassen</Button>
          </Link>
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
              onClick={() => router.push('/classroom')}
              className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors mb-4 shadow-md"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg">
                  <GraduationCap className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{classroom.name}</h1>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-gray-500">Beitrittscode:</span>
                    <span className="font-mono font-bold text-indigo-600">{classroom.joinCode}</span>
                    <button onClick={copyCode} className="p-1 hover:bg-gray-100 rounded">
                      {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Students Section */}
          <Card className="mb-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  <CardTitle className="text-lg">Schüler ({classroom.students?.length || 0})</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {classroom.students?.length === 0 ? (
                <p className="text-gray-500 text-sm">
                  Noch keine Schüler beigetreten. Teile den Code <strong>{classroom.joinCode}</strong> mit deinen Schülern.
                </p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {classroom.students?.map((student) => (
                    <span key={student.id} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                      {student.studentName}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Projects Section */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <FolderOpen className="h-5 w-5 text-indigo-600" />
              Projekte
            </h2>
            <Button onClick={() => setShowCreateProject(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Neues Projekt
            </Button>
          </div>

          {/* Create Project Form */}
          {showCreateProject && (
            <Card className="mb-6 border-indigo-200">
              <CardHeader>
                <CardTitle>Neues Projekt erstellen</CardTitle>
                <CardDescription>
                  Erstelle ein Projekt - die Schüler können dann ihre Beiträge gegenseitig bewerten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={createProject} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="projectName">Projektname</Label>
                    <Input
                      id="projectName"
                      placeholder="z.B. Webseiten-Projekt"
                      value={projectForm.name}
                      onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="projectDesc">Beschreibung (optional)</Label>
                    <Input
                      id="projectDesc"
                      placeholder="Kurze Beschreibung des Projekts"
                      value={projectForm.description}
                      onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Abgabedatum (optional)</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={projectForm.dueDate}
                      onChange={(e) => setProjectForm({ ...projectForm, dueDate: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" disabled={creating || classroom.students?.length === 0}>
                      {creating ? 'Erstellen...' : 'Projekt erstellen'}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowCreateProject(false)}>
                      Abbrechen
                    </Button>
                  </div>
                  {classroom.students?.length === 0 && (
                    <p className="text-amber-600 text-sm">
                      ⚠️ Es müssen erst Schüler der Klasse beitreten, bevor du ein Projekt erstellen kannst.
                    </p>
                  )}
                </form>
              </CardContent>
            </Card>
          )}

          {/* Projects List */}
          {projects.length === 0 && !showCreateProject ? (
            <Card className="text-center py-12">
              <CardContent>
                <FolderOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Noch keine Projekte erstellt</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {projects.map((project) => {
                const isClosed = project.session?.status === 'CLOSED'
                const progress = project.session 
                  ? Math.round((project.session._count.ballots / project.session._count.participants) * 100)
                  : 0

                return (
                  <Card key={project.id}>
                    <CardContent className="p-5">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold">{project.name}</h3>
                            {isClosed ? (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <CheckCircle2 className="h-3 w-3" />
                                Abgeschlossen
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Läuft
                              </span>
                            )}
                          </div>
                          {project.description && (
                            <p className="text-gray-500 text-sm mb-2">{project.description}</p>
                          )}
                          {project.session && (
                            <div className="mt-2">
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-gray-500">Bewertungen</span>
                                <span className="font-medium">
                                  {project.session._count.ballots}/{project.session._count.participants}
                                </span>
                              </div>
                              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-gradient-to-r from-indigo-500 to-blue-600 rounded-full"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {project.session && (
                            <Link href={`/results/${project.session.id}`}>
                              <Button variant="outline" size="sm">
                                <BarChart3 className="mr-2 h-4 w-4" />
                                Ergebnisse
                              </Button>
                            </Link>
                          )}
                          {isClosed && (
                            <Link href={`/classroom/${id}/project/${project.id}`}>
                              <Button size="sm" className="bg-indigo-600 hover:bg-indigo-700">
                                Noten vergeben
                              </Button>
                            </Link>
                          )}
                          {isClosed && !project.resultsSentAt && (
                            <Button 
                              size="sm"
                              variant="outline"
                              onClick={() => sendResults(project.id)}
                              disabled={sending === project.id}
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {sending === project.id ? 'Senden...' : 'E-Mail'}
                            </Button>
                          )}
                          {project.resultsSentAt && (
                            <span className="text-xs text-green-600 flex items-center gap-1">
                              <Check className="h-4 w-4" />
                              Gesendet
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  )
}
