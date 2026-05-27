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

interface Group {
  id: string
  name: string
  projectId: string | null
  sessionId: string | null
  members: {
    student: Student
  }[]
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

interface Grade {
  id: string
  groupId: string
  studentId: string
  score: number
  comment: string | null
  sentAt: string | null
  student: {
    studentName: string
    studentEmail: string | null
  }
  group: {
    name: string
    project: {
      name: string | null
    } | null
  }
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
  const [groups, setGroups] = useState<Group[]>([])
  const [grades, setGrades] = useState<Grade[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreateProject, setShowCreateProject] = useState(false)
  const [showGroupManagement, setShowGroupManagement] = useState(false)
  const [showGrades, setShowGrades] = useState(false)
  const [creating, setCreating] = useState(false)
  const [sending, setSending] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [projectForm, setProjectForm] = useState({
    name: '',
    description: '',
    dueDate: ''
  })
  const [groupForm, setGroupForm] = useState({
    numberOfGroups: 2
  })
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (status === 'authenticated') {
      fetchClassroom()
      fetchProjects()
      fetchGroups()
      fetchGrades()
    }
  }, [status, id])

  const fetchGrades = async () => {
    try {
      const response = await fetch(`/api/classrooms/${id}/grades`)
      if (response.ok) {
        const data = await response.json()
        setGrades(data)
      }
    } catch (error) {
      console.error('Error fetching grades:', error)
    }
  }

  const saveGrades = async (gradesData: { groupId: string, studentId: string, score: number, comment: string }[]) => {
    try {
      const response = await fetch(`/api/classrooms/${id}/grades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grades: gradesData })
      })
      if (response.ok) {
        await fetchGrades()
        alert('Noten gespeichert!')
      } else {
        alert('Fehler beim Speichern der Noten')
      }
    } catch (error) {
      console.error('Error saving grades:', error)
      alert('Fehler beim Speichern der Noten')
    }
  }

  const saveSingleGrade = async (grade: Grade) => {
    await saveGrades([{ groupId: grade.groupId, studentId: grade.studentId, score: grade.score, comment: grade.comment || '' }])
  }

  const sendGrades = async () => {
    try {
      setSending('all')
      const response = await fetch(`/api/classrooms/${id}/grades/send`, {
        method: 'POST'
      })
      if (response.ok) {
        await fetchGrades()
        alert('Noten per E-Mail versendet!')
      } else {
        alert('Fehler beim Versenden der Noten')
      }
    } catch (error) {
      console.error('Error sending grades:', error)
      alert('Fehler beim Versenden der Noten')
    } finally {
      setSending(null)
    }
  }

  const assignUnassignedStudents = async (projectId: string) => {
    try {
      const response = await fetch(`/api/classrooms/${id}/groups/assign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId })
      })
      if (response.ok) {
        await fetchGroups()
        alert('Neue Schüler wurden Gruppen zugeordnet!')
      } else {
        alert('Fehler beim Zuweisen der Schüler')
      }
    } catch (error) {
      console.error('Error assigning students:', error)
      alert('Fehler beim Zuweisen der Schüler')
    }
  }

  const fetchGroups = async () => {
    try {
      const response = await fetch(`/api/classrooms/${id}/groups`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    }
  }

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

  const createGroups = async (projectId: string) => {
    if (!classroom || classroom.students.length === 0) {
      alert('Es müssen Schüler in der Klasse sein, um Gruppen zu erstellen.')
      return
    }

    setCreating(true)
    try {
      // Distribute students evenly across groups
      const numGroups = groupForm.numberOfGroups
      const students = [...classroom.students]
      const shuffled = students.sort(() => Math.random() - 0.5)
      
      const groupsData = []
      for (let i = 0; i < numGroups; i++) {
        const groupStudents = shuffled.filter((_, idx) => idx % numGroups === i)
        groupsData.push({
          name: `Gruppe ${String.fromCharCode(65 + i)}`, // Gruppe A, B, C, ...
          studentIds: groupStudents.map(s => s.id)
        })
      }

      const response = await fetch(`/api/classrooms/${id}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          groups: groupsData,
          projectId 
        })
      })

      if (response.ok) {
        await fetchGroups()
        setSelectedProjectId(projectId)
      }
    } catch (error) {
      console.error('Error creating groups:', error)
      alert('Fehler beim Erstellen der Gruppen')
    } finally {
      setCreating(false)
    }
  }

  const createSessionsForGroups = async () => {
    if (!selectedProjectId) {
      alert('Bitte wähle zuerst ein Projekt aus')
      return
    }

    setCreating(true)
    try {
      const response = await fetch(`/api/classrooms/${id}/groups/sessions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: selectedProjectId,
          sessionTitle: 'Gruppenbewertung',
          sessionDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        const data = await response.json()
        alert(`Erfolgreich ${data.sessions.length} Abstimmungen erstellt!`)
        await fetchGroups()
        await fetchProjects()
        setShowGroupManagement(false)
      }
    } catch (error) {
      console.error('Error creating sessions:', error)
      alert('Fehler beim Erstellen der Abstimmungen')
    } finally {
      setCreating(false)
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 pb-24 page-transition">
      <div className="container mx-auto px-4 py-6 pt-12">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => router.push('/classroom')}
                  className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <GraduationCap className="h-8 w-8 text-sky-500 flex-shrink-0" />
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
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowGroupManagement(true)} variant="outline">
                  <Users className="mr-2 h-4 w-4" />
                  Gruppen verwalten
                </Button>
                <Button onClick={() => setShowGrades(!showGrades)} variant="outline">
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Noten
                </Button>
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

          {/* Grades Section */}
          {showGrades && (
            <Card className="mb-6">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-indigo-600" />
                    <CardTitle className="text-lg">Noten</CardTitle>
                  </div>
                  <Button onClick={() => sendGrades()} size="sm" disabled={sending === 'all'}>
                    {sending === 'all' ? 'Sende...' : 'Noten per E-Mail versenden'}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {grades.length === 0 ? (
                  <p className="text-gray-500 text-sm">
                    Noch keine Noten vergeben. Erstelle zuerst Gruppen und Sessions, um Noten einzugeben.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {grades.map((grade) => (
                      <div key={grade.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{grade.student.studentName}</h4>
                            <p className="text-sm text-gray-500">{grade.group.name} - {grade.group.project?.name || 'Kein Projekt'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Input
                              type="number"
                              step="0.1"
                              min="1"
                              max="6"
                              defaultValue={grade.score}
                              className="w-20"
                              onChange={(e) => {
                                const newScore = parseFloat(e.target.value)
                                setGrades(grades.map(g => 
                                  g.id === grade.id ? { ...g, score: newScore } : g
                                ))
                              }}
                            />
                            <Button size="sm" onClick={() => saveSingleGrade(grade)}>
                              Speichern
                            </Button>
                          </div>
                        </div>
                        {grade.comment && (
                          <p className="text-sm text-gray-600 mt-2">Kommentar: {grade.comment}</p>
                        )}
                        {grade.sentAt && (
                          <p className="text-xs text-green-600 mt-2">✓ Versendet am {new Date(grade.sentAt).toLocaleDateString('de-DE')}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

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
                        <div className="flex flex-wrap gap-2">
                          {project.session && (
                            <Link href={`/results/${project.session.id}`}>
                              <Button variant="outline" size="sm">
                                <BarChart3 className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Ergebnisse</span>
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
                              <Send className="h-4 w-4 sm:mr-2" />
                              <span className="hidden sm:inline">{sending === project.id ? 'Senden...' : 'E-Mail'}</span>
                            </Button>
                          )}
                          {project.resultsSentAt && (
                            <span className="text-xs text-green-600 flex items-center gap-1 px-2">
                              <Check className="h-4 w-4" />
                              <span className="hidden sm:inline">Gesendet</span>
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

      {/* Group Management Modal */}
      {showGroupManagement && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center p-4 z-50" onClick={() => setShowGroupManagement(false)}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">Gruppen verwalten</h2>
                <Button variant="ghost" size="icon" onClick={() => setShowGroupManagement(false)}>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </div>

              {/* Project Selection */}
              <div className="mb-6">
                <Label htmlFor="projectSelect">Projekt auswählen</Label>
                <select
                  id="projectSelect"
                  value={selectedProjectId || ''}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="w-full mt-1 p-2 border border-gray-300 rounded-md"
                >
                  <option value="">-- Projekt auswählen --</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Create Groups Section */}
              {selectedProjectId && groups.filter(g => g.projectId === selectedProjectId).length === 0 && (
                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="text-lg">Neue Gruppen erstellen</CardTitle>
                    <CardDescription>
                      Teile die Schüler automatisch in Gruppen ein
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="numGroups">Anzahl der Gruppen</Label>
                        <Input
                          id="numGroups"
                          type="number"
                          min="2"
                          max={classroom?.students.length || 2}
                          value={groupForm.numberOfGroups}
                          onChange={(e) => setGroupForm({ ...groupForm, numberOfGroups: parseInt(e.target.value) })}
                          className="mt-1"
                        />
                      </div>
                      <Button
                        onClick={() => selectedProjectId && createGroups(selectedProjectId)}
                        disabled={creating}
                      >
                        {creating ? 'Erstellen...' : 'Gruppen erstellen'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Existing Groups */}
              {selectedProjectId && groups.filter(g => g.projectId === selectedProjectId).length > 0 && (
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Vorhandene Gruppen</h3>
                    <Button 
                      onClick={() => selectedProjectId && assignUnassignedStudents(selectedProjectId)}
                      size="sm"
                      variant="outline"
                    >
                      <Users className="mr-2 h-4 w-4" />
                      Neue Schüler zuweisen
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {groups.filter(g => g.projectId === selectedProjectId).map((group) => (
                      <Card key={group.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-semibold">{group.name}</h4>
                            {group.sessionId && (
                              <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs">
                                Abstimmung aktiv
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {group.members.map((member) => (
                              <span key={member.student.id} className="px-2 py-1 bg-gray-100 rounded text-sm">
                                {member.student.studentName}
                              </span>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Create Sessions Button */}
              {selectedProjectId && groups.filter(g => g.projectId === selectedProjectId).length > 0 && (
                <div className="border-t pt-4">
                  <Button
                    onClick={createSessionsForGroups}
                    disabled={creating || groups.filter(g => g.projectId === selectedProjectId).some(g => g.sessionId)}
                    className="w-full"
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {creating ? 'Erstellen...' : 'Abstimmungen für alle Gruppen erstellen'}
                  </Button>
                  {groups.filter(g => g.projectId === selectedProjectId).some(g => g.sessionId) && (
                    <p className="text-sm text-gray-500 mt-2">
                      ⚠️ Einige Gruppen haben bereits eine aktive Abstimmung
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  )
}
