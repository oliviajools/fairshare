'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Plus, Trash2, Copy, Mail, Check } from 'lucide-react'

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

export default function CreateSession() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([])
  const [organizerLink, setOrganizerLink] = useState('')
  const [copiedStates, setCopiedStates] = useState<{[key: string]: boolean}>({})

  const [formData, setFormData] = useState({
    title: '',
    date: '',
    time: '',
    evaluationInfo: '',
  })

  const [participants, setParticipants] = useState<Participant[]>([
    { name: '', email: '' }
  ])

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
          participants: validParticipants,
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInviteLinks(result.inviteLinks)
        setOrganizerLink(result.organizerLink)
        setShowResults(true)
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-4">
              Neue Session erstellen
            </h1>
            <p className="text-gray-600 mt-2">
              Erstelle eine neue Bewertungssession für dein Team.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Session Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">Titel *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="z.B. Projekt Alpha - Retrospektive"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date">Datum (optional)</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      placeholder="Für zeitlich ungebundene Events leer lassen"
                    />
                  </div>
                  <div>
                    <Label htmlFor="time">Uhrzeit (optional)</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      placeholder="z.B. 14:30"
                    />
                  </div>
                </div>

              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Wichtige Infos für alle zur Bewertung</CardTitle>
                <CardDescription>
                  Diese Informationen werden allen Teilnehmern während der Bewertung angezeigt, um eine faire Beurteilung zu ermöglichen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div>
                  <Label htmlFor="evaluationInfo">Bewertungshinweise (optional)</Label>
                  <Textarea
                    id="evaluationInfo"
                    value={formData.evaluationInfo}
                    onChange={(e) => setFormData({ ...formData, evaluationInfo: e.target.value })}
                    placeholder="z.B. Session wurde mit Hans' Eltern-Kind-Konzept und -Präsentation gehalten, externe Beiträge die berücksichtigt werden sollten..."
                    rows={3}
                    className="mt-1"
                  />
                  <p className="text-sm text-gray-600 mt-1">
                    Diese Hinweise helfen allen Teilnehmern bei einer fairen und informierten Bewertung.
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Teilnehmer</CardTitle>
                <CardDescription>
                  Füge alle Personen hinzu, die an der Bewertung teilnehmen sollen.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {participants.map((participant, index) => (
                    <div key={index} className="flex gap-2 items-end">
                      <div className="flex-1">
                        <Label htmlFor={`name-${index}`}>Name *</Label>
                        <Input
                          id={`name-${index}`}
                          value={participant.name}
                          onChange={(e) => updateParticipant(index, 'name', e.target.value)}
                          placeholder="Name des Teilnehmers"
                          required={index === 0}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={`email-${index}`}>E-Mail (optional)</Label>
                        <Input
                          id={`email-${index}`}
                          type="email"
                          value={participant.email}
                          onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                          placeholder="email@beispiel.de"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => removeParticipant(index)}
                        disabled={participants.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addParticipant}
                    className="w-full"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Teilnehmer hinzufügen
                  </Button>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-4">
              <Link href="/" className="flex-1">
                <Button variant="outline" className="w-full">
                  Abbrechen
                </Button>
              </Link>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? 'Erstelle Session...' : 'Session erstellen'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
