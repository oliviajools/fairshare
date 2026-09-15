'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Plus, Trash2, Copy, Check, Percent, Users, Sparkles, ChevronRight } from 'lucide-react'

interface Participant {
  name: string
  email: string
}

interface FixedShare {
  name: string
  percent: number
}

type FixedShareSetupMode = 'MANUAL' | 'PRE_VOTE'

interface InviteLink {
  name: string
  email: string
  link: string
  token: string
}

export default function CreateFixedSharesPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [participants, setParticipants] = useState<Participant[]>([{ name: '', email: '' }])
  const [fixedShares, setFixedShares] = useState<FixedShare[]>([])
  const [fixedShareSetupMode, setFixedShareSetupMode] = useState<FixedShareSetupMode>('PRE_VOTE')
  const [showFixedShareSection, setShowFixedShareSection] = useState(false)
  const [inviteLinks, setInviteLinks] = useState<InviteLink[]>([])
  const [organizerLink, setOrganizerLink] = useState('')
  const [createdSessionId, setCreatedSessionId] = useState('')
  const [copiedStates, setCopiedStates] = useState<{ [key: string]: boolean }>({})

  const addFixedShare = () => {
    setFixedShares([...fixedShares, { name: '', percent: 0 }])
  }

  const updateFixedShare = (index: number, field: 'name' | 'percent', value: string | number) => {
    const updated = [...fixedShares]
    if (field === 'percent') {
      updated[index].percent = Math.min(Math.max(0, Number(value)), 100)
    } else {
      updated[index].name = value as string
    }
    setFixedShares(updated)
  }

  const removeFixedShare = (index: number) => {
    setFixedShares(fixedShares.filter((_, i) => i !== index))
  }

  const totalFixedPercent = fixedShares.reduce((sum, fs) => sum + (fs.percent || 0), 0)

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
      const validParticipants = participants.filter((p) => p.name.trim() !== '')

      if (validParticipants.length === 0) {
        alert('Bitte füge mindestens einen Teilnehmer hinzu.')
        return
      }

      const validFixedShares = fixedShares.filter((fs) => fs.name.trim() !== '')
      if (validFixedShares.length === 0) {
        alert('Bitte lege mindestens einen festen Anteil fest.')
        return
      }

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: title.trim() || 'Feste Anteile',
          evaluationInfo: '',
          isAnonymous: true,
          participants: validParticipants,
          fixedShares: validFixedShares,
          fixedShareMode: 'TRANSPARENT_FULL',
          fixedShareVotingStatus: fixedShareSetupMode === 'PRE_VOTE' ? 'OPEN' : 'CLOSED',
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setInviteLinks(result.inviteLinks)
        setOrganizerLink(result.organizerLink)
        setCreatedSessionId(result.session?.id || '')

        try {
          const stored = localStorage.getItem('createdSessions') || '{}'
          const createdSessions = JSON.parse(stored)
          createdSessions[result.session.id] = {
            organizerLink: result.organizerLink,
            title: result.session.title,
            createdAt: new Date().toISOString(),
          }
          localStorage.setItem('createdSessions', JSON.stringify(createdSessions))
        } catch (e) {
          console.error('Error saving organizer link:', e)
        }
      } else {
        throw new Error('Failed to create session')
      }
    } catch (error) {
      console.error('Error creating fixed shares session:', error)
      alert('Fehler beim Erstellen. Bitte versuche es erneut.')
    } finally {
      setLoading(false)
    }
  }

  if (organizerLink) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50 pb-24">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => router.replace('/')}
                  aria-label="Zurück zur Übersicht"
                  className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
                <h1 className="text-3xl font-bold text-gray-900">Feste Anteile angelegt!</h1>
              </div>
              <p className="text-gray-600">Teile die Links mit den Teilnehmern, damit sie über die festen Anteile abstimmen können.</p>
            </div>

            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Zusammenfassung</CardTitle>
                <CardDescription>Deine festen Anteile für diese Session</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {fixedShares.map((share, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                    <span className="font-medium">{share.name}</span>
                    <span className="text-amber-700 font-bold">{share.percent.toFixed(1)}%</span>
                  </div>
                ))}
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                  <span className="font-medium">Gesamt feste Anteile</span>
                  <span className="font-bold">{totalFixedPercent.toFixed(1)}%</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-gray-100">
                  <span className="font-medium">Verbleibend für Teilnehmer</span>
                  <span className="font-bold">{(100 - totalFixedPercent).toFixed(1)}%</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Organisator-Link</CardTitle>
                <CardDescription>Verwalte die Session und schließe die Abstimmung.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input value={organizerLink} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={() => copyToClipboard(organizerLink, 'organizer')}>
                    {copiedStates['organizer'] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg mb-6">
              <CardHeader>
                <CardTitle className="text-lg">Einladungslinks</CardTitle>
                <CardDescription>Sende jedem Teilnehmer seinen persönlichen Link.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {inviteLinks.map((invite, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{invite.name}</p>
                      <p className="text-xs text-gray-500 truncate">{invite.email || 'Keine E-Mail'}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={() => copyToClipboard(invite.link, `invite-${index}`)}>
                      {copiedStates[`invite-${index}`] ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {createdSessionId && (
                <Link href={`/results/${createdSessionId}`}>
                  <Button variant="outline" className="w-full sm:w-auto">
                    Ergebnisse ansehen
                  </Button>
                </Link>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full sm:w-auto">
                  Zurück zur Übersicht
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-white to-orange-50 pb-24">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => router.replace('/create')}
                aria-label="Zurück zur Auswahl"
                className="w-10 h-10 rounded-full bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">Feste Anteile bestimmen</h1>
            </div>
            <p className="text-gray-600 mt-2">
              Erstelle eine Session, in der zuerst über feste Anteile abgestimmt wird.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Session-Name</CardTitle>
                    <CardDescription>Worum geht es bei der Abstimmung?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title" className="text-sm font-medium">
                    Titel *
                  </Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="z. B. Gewinnverteilung 2026"
                    className="h-12 text-base"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white">
                    <Percent className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Feste Anteile</CardTitle>
                    <CardDescription>Welche Anteile sollen festgelegt werden?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="rounded-xl bg-gradient-to-r from-amber-50 to-orange-50 p-4">
                  <button
                    type="button"
                    onClick={() => setShowFixedShareSection(!showFixedShareSection)}
                    className="w-full flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                        <Percent className="h-5 w-5" />
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900">Feste Anteile</p>
                        <p className="text-sm text-gray-500">
                          {fixedShares.length > 0
                            ? `${fixedShares.length} feste Anteile (${totalFixedPercent.toFixed(1)}%)`
                            : 'z. B. Unternehmen, Overhead, Steuern'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-5 w-5 text-gray-400 transition-transform ${showFixedShareSection ? 'rotate-90' : ''}`}
                    />
                  </button>

                  {showFixedShareSection && (
                    <div className="mt-4 space-y-4">
                      {fixedShares.length > 0 && (
                        <div className="space-y-2">
                          <Label className="text-sm font-medium">Wie soll der feste Anteil festgelegt werden?</Label>
                          <div className="grid grid-cols-1 gap-2">
                            <label
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                                fixedShareSetupMode === 'MANUAL'
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="fixedShareSetupMode"
                                checked={fixedShareSetupMode === 'MANUAL'}
                                onChange={() => setFixedShareSetupMode('MANUAL')}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium text-sm">Direkt festlegen</p>
                                <p className="text-xs text-gray-500">Du trägst den Prozentwert ein (keine Vorab-Abstimmung).</p>
                              </div>
                            </label>
                            <label
                              className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer ${
                                fixedShareSetupMode === 'PRE_VOTE'
                                  ? 'border-amber-500 bg-amber-50'
                                  : 'border-gray-200 hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name="fixedShareSetupMode"
                                checked={fixedShareSetupMode === 'PRE_VOTE'}
                                onChange={() => setFixedShareSetupMode('PRE_VOTE')}
                                className="mt-1"
                              />
                              <div>
                                <p className="font-medium text-sm">Vorab abstimmen lassen</p>
                                <p className="text-xs text-gray-500">Teilnehmer stimmen zuerst über den festen Anteil ab.</p>
                              </div>
                            </label>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        {fixedShares.map((share, index) => (
                          <div key={index} className="flex gap-2 items-center">
                            <Input
                              placeholder="Name (z. B. Unternehmen)"
                              value={share.name}
                              onChange={(e) => updateFixedShare(index, 'name', e.target.value)}
                              className="flex-1 bg-white"
                            />
                            <div className="relative w-24">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                value={share.percent || ''}
                                onChange={(e) => updateFixedShare(index, 'percent', e.target.value)}
                                className="bg-white pr-8"
                                placeholder="0"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFixedShare(index)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        onClick={addFixedShare}
                        disabled={totalFixedPercent >= 99}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Festen Anteil hinzufügen
                      </Button>

                      {totalFixedPercent > 0 && (
                        <p className="text-sm text-amber-600 font-medium">
                          Gesamt: {totalFixedPercent.toFixed(1)}% fest → {(100 - totalFixedPercent).toFixed(1)}% für Teilnehmer
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-green-500 text-white">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <CardTitle>Teilnehmer</CardTitle>
                    <CardDescription>Wer soll über die festen Anteile abstimmen?</CardDescription>
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

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.replace('/create')}
                className="flex-1 h-12"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück
              </Button>
              <Button
                type="submit"
                disabled={
                  loading ||
                  !title.trim() ||
                  participants.filter((p) => p.name.trim()).length === 0 ||
                  fixedShares.filter((fs) => fs.name.trim()).length === 0
                }
                className="flex-1 h-12 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                    Erstelle...
                  </>
                ) : (
                  <>
                    Feste Anteile anlegen
                    <Check className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
