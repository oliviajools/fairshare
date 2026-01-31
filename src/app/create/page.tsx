'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { ArrowLeft, Plus, Trash2, Copy, Mail, Check, Eye, EyeOff, Building2, UsersRound, Sparkles, Users, Calendar, PartyPopper, Briefcase, Home, Trophy, ChevronRight, Info, GraduationCap } from 'lucide-react'

interface Company {
  id: string
  name: string
}

interface GroupMember {
  id: string
  name: string | null
  email: string
}

interface CompanyGroup {
  id: string
  name: string
  description: string | null
  memberCount: number
  members: GroupMember[]
}

interface Participant {
  name: string
  email: string
}

interface InviteLink {
  name: string
  email: string
  link: string
  token: string
}

interface SessionTemplate {
  id: string
  name: string
  icon: React.ReactNode
  color: string
  description: string
  defaultTitle: string
  defaultEvaluationInfo: string
  isAnonymous: boolean
}

const SESSION_TEMPLATES: SessionTemplate[] = [
  {
    id: 'team-event',
    name: 'Teamevent',
    icon: <PartyPopper className="h-6 w-6" />,
    color: 'from-pink-500 to-rose-500',
    description: 'Firmenfeiern, Teamausflüge, After-Work',
    defaultTitle: 'Teamevent',
    defaultEvaluationInfo: 'Bitte berücksichtigt bei der Bewertung: Wer hat organisiert? Wer war wie lange dabei?',
    isAnonymous: true,
  },
  {
    id: 'project',
    name: 'Projekt',
    icon: <Briefcase className="h-6 w-6" />,
    color: 'from-blue-500 to-cyan-500',
    description: 'Projektarbeit, Freelancer-Teams',
    defaultTitle: 'Projektabrechnung',
    defaultEvaluationInfo: 'Bewertungskriterien: Zeitaufwand, Verantwortung, Qualität der Arbeit',
    isAnonymous: true,
  },
  {
    id: 'wg',
    name: 'WG / Haushalt',
    icon: <Home className="h-6 w-6" />,
    color: 'from-green-500 to-emerald-500',
    description: 'WG-Kosten, Haushaltskasse',
    defaultTitle: 'WG-Abrechnung',
    defaultEvaluationInfo: 'Bitte fair bewerten: Wer nutzt was wie oft?',
    isAnonymous: false,
  },
  {
    id: 'sports',
    name: 'Verein / Sport',
    icon: <Trophy className="h-6 w-6" />,
    color: 'from-amber-500 to-orange-500',
    description: 'Vereinskasse, Mannschaftskosten',
    defaultTitle: 'Vereinsabrechnung',
    defaultEvaluationInfo: 'Teilnahme an Veranstaltungen und Engagement berücksichtigen',
    isAnonymous: true,
  },
  {
    id: 'school',
    name: 'Schulprojekt',
    icon: <GraduationCap className="h-6 w-6" />,
    color: 'from-indigo-500 to-blue-500',
    description: 'Gruppenarbeiten, Projektbewertung',
    defaultTitle: 'Projektarbeit Bewertung',
    defaultEvaluationInfo: 'Bewertet fair den Beitrag jedes Teammitglieds: Wer hat welche Aufgaben übernommen? Wie war die Qualität? Wie war das Engagement und die Zuverlässigkeit?',
    isAnonymous: true,
  },
  {
    id: 'custom',
    name: 'Eigene Session',
    icon: <Sparkles className="h-6 w-6" />,
    color: 'from-violet-500 to-purple-500',
    description: 'Komplett individuell anpassen',
    defaultTitle: '',
    defaultEvaluationInfo: '',
    isAnonymous: true,
  },
]

function CreateSessionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([])
  const [organizerLink, setOrganizerLink] = useState('')
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})
  const [companies, setCompanies] = useState<Company[]>([])
  const [selectedCompany, setSelectedCompany] = useState<string>('')
  const [groups, setGroups] = useState<CompanyGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string>('')
  const [loadingGroups, setLoadingGroups] = useState(false)
  const [currentStep, setCurrentStep] = useState(0) // 0 = template, 1 = details, 2 = participants
  const [selectedTemplate, setSelectedTemplate] = useState<SessionTemplate | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    evaluationInfo: '',
    isAnonymous: true,
  })

  useEffect(() => {
    fetchCompanies()
  }, [])

  useEffect(() => {
    const companyId = searchParams.get('company')
    if (companyId) {
      setSelectedCompany(companyId)
    }
  }, [searchParams])

  useEffect(() => {
    if (selectedCompany) {
      fetchGroups(selectedCompany)
    } else {
      setGroups([])
      setSelectedGroup('')
    }
  }, [selectedCompany])

  const fetchGroups = async (companyId: string) => {
    setLoadingGroups(true)
    try {
      const response = await fetch(`/api/companies/${companyId}/groups`)
      if (response.ok) {
        const data = await response.json()
        setGroups(data)
      }
    } catch (error) {
      console.error('Error fetching groups:', error)
    } finally {
      setLoadingGroups(false)
    }
  }

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroup(groupId)
    if (groupId) {
      const group = groups.find(g => g.id === groupId)
      if (group && group.members.length > 0) {
        // Add group members as participants
        const groupParticipants = group.members.map(member => ({
          name: member.name || member.email.split('@')[0],
          email: member.email
        }))
        setParticipants(groupParticipants)
      }
    }
  }

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies')
      if (response.ok) {
        const data = await response.json()
        setCompanies(data)
      }
    } catch (error) {
      console.error('Error fetching companies:', error)
    }
  }

  const [participants, setParticipants] = useState<Participant[]>([
    { name: '', email: '' }
  ])

  const selectTemplate = (template: SessionTemplate) => {
    setSelectedTemplate(template)
    setFormData({
      ...formData,
      title: template.defaultTitle,
      evaluationInfo: template.defaultEvaluationInfo,
      isAnonymous: template.isAnonymous,
    })
    setCurrentStep(1)
  }

  const addParticipant = () => {
    setParticipants([...participants, { name: '', email: '' }])
  }

  const removeParticipant = (index: number) => {
    if (participants.length > 1) {
      setParticipants(participants.filter((_, i) => i !== index))
    }
  }

  const updateParticipant = (index: number, field: keyof Participant, value: string) => {
    const updated = [...participants]
    updated[index][field] = value
    setParticipants(updated)
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates({ ...copiedStates, [id]: true })
      setTimeout(() => {
        setCopiedStates({ ...copiedStates, [id]: false })
      }, 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const validParticipants = participants.filter(p => p.name.trim() !== '')
      
      if (validParticipants.length === 0) {
        alert('Bitte füge mindestens einen Teilnehmer hinzu.')
        return
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          companyId: selectedCompany || null,
          participants: validParticipants,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInviteLinks(result.inviteLinks)
        setOrganizerLink(result.organizerLink)
        setShowResults(true)
        
        // Save organizer link to localStorage for quick access from homepage
        try {
          const stored = localStorage.getItem('createdSessions') || '{}'
          const createdSessions = JSON.parse(stored)
          createdSessions[result.session.id] = {
            organizerLink: result.organizerLink,
            title: result.session.title,
            createdAt: new Date().toISOString()
          }
          localStorage.setItem('createdSessions', JSON.stringify(createdSessions))
        } catch (e) {
          console.error('Error saving organizer link:', e)
        }
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating session:', error)
      alert('Fehler beim Erstellen der Session. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-4">
                Session erfolgreich erstellt!
              </h1>
              <p className="text-gray-600">
                Teile die folgenden Links mit den Teilnehmern:
              </p>
            </div>

            <div className="space-y-6">
              {/* Organizer Link */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Organisator-Link</CardTitle>
                  <CardDescription>
                    Mit diesem Link kannst du den Fortschritt verfolgen und die Session schließen.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Input
                      value={organizerLink}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(organizerLink, 'organizer')}
                    >
                      {copiedStates['organizer'] ? (
                        <Check className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Participant Links */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Einladungslinks</CardTitle>
                  <CardDescription>
                    Sende jedem Teilnehmer seinen persönlichen Link.
                    {(formData.date || formData.time) && (
                      <div className="mt-2 text-sm font-medium text-gray-700">
                        {formData.date && (
                          <>
                            📅 {new Date(formData.date).toLocaleDateString('de-DE')}
                            {formData.time && ` um ${formData.time}`}
                          </>
                        )}
                        {!formData.date && formData.time && `🕐 ${formData.time}`}
                      </div>
                    )}
                    <div className="mt-2 text-xs text-gray-600">
                      * Fehlende Stimmen werden ignoriert/fließen nicht in die Mittelwert-Bildung mit ein
                    </div>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {inviteLinks.map((invite, index) => (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{invite.name}</h4>
                          {invite.email && (
                            <span className="text-sm text-gray-600">{invite.email}</span>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            value={invite.link}
                            readOnly
                            className="font-mono text-sm"
                          />
                          <Button
                            variant="outline"
                            onClick={() => copyToClipboard(invite.link, `invite-${index}`)}
                          >
                            {copiedStates[`invite-${index}`] ? (
                              <Check className="h-4 w-4" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </Button>
                          {invite.email && (
                            <Button
                              variant="outline"
                              onClick={() => {
                                const subject = encodeURIComponent(`TeamPayer Einladung: ${formData.title}`)
                                const body = encodeURIComponent(`Hallo ${invite.name},\n\ndu wurdest zur TeamPayer Session "${formData.title}" eingeladen.\n\nKlicke auf den folgenden Link, um deine Bewertung abzugeben:\n${invite.link}\n\nViele Grüße`)
                                window.open(`mailto:${invite.email}?subject=${subject}&body=${body}`)
                              }}
                            >
                              <Mail className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="text-center">
                <Link href="/">
                  <Button variant="outline">
                    Zurück zur Übersicht
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Step 0: Template Selection
  const renderTemplateStep = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white mb-4">
          <Sparkles className="h-8 w-8" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Was möchtest du aufteilen?</h2>
        <p className="text-gray-600 mt-2">Wähle eine Vorlage oder starte von vorne</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {SESSION_TEMPLATES.map((template) => (
          <button
            key={template.id}
            onClick={() => selectTemplate(template)}
            className="group relative overflow-hidden rounded-2xl border-2 border-gray-100 bg-white p-6 text-left transition-all hover:border-transparent hover:shadow-xl hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-sky-500"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-0 group-hover:opacity-10 transition-opacity`} />
            <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br ${template.color} text-white mb-4`}>
              {template.icon}
            </div>
            <h3 className="font-semibold text-gray-900 text-base sm:text-lg">{template.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{template.description}</p>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-300 group-hover:text-gray-500 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  )

  // Step 1: Session Details
  const renderDetailsStep = () => (
    <div className="space-y-6 pb-4">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-medium">1</div>
          <div className="w-16 h-1 bg-sky-500 mx-1" />
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center text-sm font-medium">2</div>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            {selectedTemplate && (
              <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${selectedTemplate.color} text-white`}>
                {selectedTemplate.icon}
              </div>
            )}
            <div>
              <CardTitle>Session Details</CardTitle>
              <CardDescription>Grundlegende Informationen zur Session</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Titel der Session *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="z.B. Weihnachtsfeier 2026"
              className="h-12 text-base"
              required
            />
          </div>

          {companies.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="company" className="text-sm font-medium">Team/Unternehmen</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="company"
                  value={selectedCompany}
                  onChange={(e) => {
                    setSelectedCompany(e.target.value)
                    setSelectedGroup('')
                  }}
                  className="flex h-12 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="">Persönlich (kein Team)</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>{company.name}</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {selectedCompany && groups.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="group" className="text-sm font-medium">Gruppe</Label>
              <div className="relative">
                <UsersRound className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  id="group"
                  value={selectedGroup}
                  onChange={(e) => handleGroupSelect(e.target.value)}
                  disabled={loadingGroups}
                  className="flex h-12 w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2 text-base ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50"
                >
                  <option value="">Keine Gruppe</option>
                  {groups.map((group) => (
                    <option key={group.id} value={group.id}>{group.name} ({group.memberCount})</option>
                  ))}
                </select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date" className="text-sm font-medium">Datum</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="h-12 pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="time" className="text-sm font-medium">Uhrzeit</Label>
              <Input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="h-12"
              />
            </div>
          </div>

          {/* Anonymous toggle - modern style */}
          <div className="rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${formData.isAnonymous ? 'bg-sky-100 text-sky-600' : 'bg-amber-100 text-amber-600'}`}>
                  {formData.isAnonymous ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {formData.isAnonymous ? 'Anonyme Abstimmung' : 'Offene Abstimmung'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formData.isAnonymous ? 'Niemand sieht, wer wie abgestimmt hat' : 'Du siehst, wer wie abgestimmt hat'}
                  </p>
                </div>
              </div>
              <Switch
                checked={formData.isAnonymous}
                onCheckedChange={(checked) => setFormData({ ...formData, isAnonymous: checked })}
              />
            </div>
          </div>

          {/* Evaluation info */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Label htmlFor="evaluationInfo" className="text-sm font-medium">Hinweise für Teilnehmer</Label>
              <div className="group relative">
                <Info className="h-4 w-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  Wird allen während der Abstimmung angezeigt
                </div>
              </div>
            </div>
            <Textarea
              id="evaluationInfo"
              value={formData.evaluationInfo}
              onChange={(e) => setFormData({ ...formData, evaluationInfo: e.target.value })}
              placeholder="z.B. Wer hat organisiert? Besondere Beiträge..."
              rows={3}
              className="resize-none"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3 pb-8">
        <Button variant="outline" onClick={() => setCurrentStep(0)} className="w-full sm:flex-1 h-12">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button 
          type="button"
          onClick={() => setCurrentStep(2)} 
          disabled={!formData.title.trim()}
          className="w-full sm:flex-1 h-12 bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600"
        >
          Weiter zu Teilnehmern
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )

  // Step 2: Participants
  const renderParticipantsStep = () => (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Progress indicator */}
      <div className="flex items-center justify-center gap-2 mb-8">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-medium">
            <Check className="h-4 w-4" />
          </div>
          <div className="w-16 h-1 bg-sky-500 mx-1" />
        </div>
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-sky-500 text-white flex items-center justify-center text-sm font-medium">2</div>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Teilnehmer hinzufügen</CardTitle>
              <CardDescription>Wer soll an der Abstimmung teilnehmen?</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {participants.map((participant, index) => (
              <div key={index} className="flex gap-2 items-center p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-sky-400 to-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">
                  {index + 1}
                </div>
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <Input
                    value={participant.name}
                    onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                    placeholder="Name *"
                    className="h-10 bg-white"
                    required={index === 0}
                  />
                  <Input
                    type="email"
                    value={participant.email}
                    onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                    placeholder="E-Mail (optional)"
                    className="h-10 bg-white"
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeParticipant(index)}
                  disabled={participants.length === 1}
                  className="flex-shrink-0 hover:bg-red-100 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            
            <Button
              type="button"
              variant="outline"
              onClick={addParticipant}
              className="w-full h-12 border-dashed border-2 hover:border-sky-500 hover:text-sky-600 hover:bg-sky-50"
            >
              <Plus className="mr-2 h-5 w-5" />
              Weitere Person hinzufügen
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Summary Card */}
      <Card className="border-0 bg-gradient-to-br from-sky-50 to-blue-50">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Session:</span>
            <span className="font-medium">{formData.title}</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Teilnehmer:</span>
            <span className="font-medium">{participants.filter(p => p.name.trim()).length} Personen</span>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-gray-600">Modus:</span>
            <span className="font-medium">{formData.isAnonymous ? '🔒 Anonym' : '👁 Offen'}</span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1 h-12">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Zurück
        </Button>
        <Button 
          type="submit" 
          disabled={loading || participants.filter(p => p.name.trim()).length === 0}
          className="flex-1 h-12 bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Erstelle...
            </>
          ) : (
            <>
              Session erstellen
              <Check className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </div>
    </form>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-amber-50 pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => currentStep === 0 ? router.push('/') : setCurrentStep(currentStep - 1)}
                className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">
                Neue Session
              </h1>
            </div>
          </div>

          {/* Step Content */}
          {currentStep === 0 && renderTemplateStep()}
          {currentStep === 1 && renderDetailsStep()}
          {currentStep === 2 && renderParticipantsStep()}
        </div>
      </div>
    </div>
  )
}

export default function CreateSession() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Laden...</p>
        </div>
      </div>
    }>
      <CreateSessionContent />
    </Suspense>
  )
}
