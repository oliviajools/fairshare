'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Calculator, FileSpreadsheet, FileText, Download } from 'lucide-react'
import { PieChart } from '@/components/PieChart'

interface ResultData {
  participantId: string
  name: string
  averagePercent: number
}

interface PayoutData {
  name: string
  percent: number
  amount: number
}

export default function PayoutPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const { data: authSession, status: authStatus } = useSession()
  
  const [sessionTitle, setSessionTitle] = useState('')
  const [results, setResults] = useState<ResultData[]>([])
  const [totalAmount, setTotalAmount] = useState<string>('')
  const [payouts, setPayouts] = useState<PayoutData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (authStatus === 'unauthenticated') {
      router.push('/login')
    } else if (authStatus === 'authenticated') {
      fetchResults()
    }
  }, [authStatus, id])

  const fetchResults = async () => {
    try {
      const response = await fetch(`/api/sessions/${id}/results`)
      if (!response.ok) {
        throw new Error('Failed to fetch results')
      }
      const data = await response.json()
      
      // Check if user is the creator
      if (data.session.creatorId !== (authSession?.user as any)?.id) {
        setError('Nur der Ersteller kann die Auszahlung berechnen')
        return
      }
      
      if (data.session.status !== 'CLOSED') {
        setError('Die Session muss geschlossen sein')
        return
      }
      
      setSessionTitle(data.session.title)
      setResults(data.results)
    } catch (err) {
      setError('Fehler beim Laden der Ergebnisse')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const calculatePayouts = () => {
    const amount = parseFloat(totalAmount)
    if (isNaN(amount) || amount <= 0) return

    const totalPercent = results.reduce((sum, r) => sum + r.averagePercent, 0)
    
    const calculated = results.map(r => ({
      name: r.name,
      percent: totalPercent > 0 ? (r.averagePercent / totalPercent) * 100 : 0,
      amount: totalPercent > 0 ? (r.averagePercent / totalPercent) * amount : 0
    })).sort((a, b) => b.amount - a.amount)

    setPayouts(calculated)
  }

  const exportToPDF = () => {
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Auszahlung - ${sessionTitle}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; }
          h1 { color: #0ea5e9; margin-bottom: 10px; }
          h2 { color: #666; font-weight: normal; margin-bottom: 30px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .amount { text-align: right; font-weight: bold; }
          .percent { text-align: right; color: #666; }
          .total { font-weight: bold; background-color: #f0f9ff; }
          .footer { margin-top: 40px; color: #999; font-size: 12px; }
          @media print { body { padding: 20px; } }
        </style>
      </head>
      <body>
        <h1>Auszahlungsübersicht</h1>
        <h2>${sessionTitle}</h2>
        <p><strong>Gesamtsumme:</strong> ${parseFloat(totalAmount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th class="percent">Anteil</th>
              <th class="amount">Betrag</th>
            </tr>
          </thead>
          <tbody>
            ${payouts.map(p => `
              <tr>
                <td>${p.name}</td>
                <td class="percent">${p.percent.toFixed(1)}%</td>
                <td class="amount">${p.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
              </tr>
            `).join('')}
            <tr class="total">
              <td>Gesamt</td>
              <td class="percent">100%</td>
              <td class="amount">${parseFloat(totalAmount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</td>
            </tr>
          </tbody>
        </table>
        <div class="footer">
          Erstellt am ${new Date().toLocaleDateString('de-DE')} um ${new Date().toLocaleTimeString('de-DE')} mit TeamPayer
        </div>
        <script>window.onload = function() { window.print(); }</script>
      </body>
      </html>
    `

    // Create blob and download as HTML file that auto-prints
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    
    // Try to open in new window first
    const printWindow = window.open(url, '_blank')
    if (printWindow) {
      // Window opened successfully
      setTimeout(() => URL.revokeObjectURL(url), 10000)
    } else {
      // Popup blocked - offer download instead
      const link = document.createElement('a')
      link.href = url
      link.download = `Auszahlung_${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}.html`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      setTimeout(() => URL.revokeObjectURL(url), 1000)
      alert('Die Datei wurde heruntergeladen. Öffne sie und drucke als PDF.')
    }
  }

  const exportToExcel = () => {
    try {
      // Create CSV content with German formatting
      const headers = ['Name', 'Anteil (%)', 'Betrag (EUR)']
      const rows = payouts.map(p => [
        `"${p.name}"`,
        p.percent.toFixed(2).replace('.', ','),
        p.amount.toFixed(2).replace('.', ',')
      ])
      rows.push(['"Gesamt"', '100,00', parseFloat(totalAmount).toFixed(2).replace('.', ',')])

      const csvContent = [
        headers.join(';'),
        ...rows.map(row => row.join(';'))
      ].join('\r\n')

      // Add BOM for Excel to recognize UTF-8
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `Auszahlung_${sessionTitle.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      
      // Cleanup after a delay
      setTimeout(() => {
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
      }, 100)
    } catch (error) {
      console.error('Export error:', error)
      alert('Export fehlgeschlagen. Bitte versuche es erneut.')
    }
  }

  if (authStatus === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-sky-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Laden...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href={`/results/${id}`}>
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Zurück zu den Ergebnissen
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-amber-50">
      <div className="container mx-auto px-4 py-8 pt-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Button 
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück
            </Button>
            
            <h1 className="text-3xl font-bold text-gray-900">Auszahlung berechnen</h1>
            <p className="text-gray-600 mt-1">{sessionTitle}</p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Input Card */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Summe eingeben
                </CardTitle>
                <CardDescription>
                  Gib den Gesamtbetrag ein, der aufgeteilt werden soll
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="amount">Gesamtbetrag (EUR)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={totalAmount}
                      onChange={(e) => setTotalAmount(e.target.value)}
                      placeholder="z.B. 1000"
                      className="text-lg"
                    />
                  </div>
                  <Button 
                    onClick={calculatePayouts}
                    disabled={!totalAmount || parseFloat(totalAmount) <= 0}
                    className="w-full bg-sky-500 hover:bg-sky-600"
                  >
                    Berechnen
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Pie Chart */}
            {payouts.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-center">Verteilung</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-center">
                    <PieChart
                      data={payouts.map(p => ({
                        name: p.name,
                        value: p.percent
                      }))}
                      size={200}
                      showLabels={true}
                      showLegend={true}
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Results Table */}
          {payouts.length > 0 && (
            <Card className="mt-6">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Auszahlungsübersicht</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                      <FileText className="mr-2 h-4 w-4" />
                      PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToExcel}>
                      <FileSpreadsheet className="mr-2 h-4 w-4" />
                      Excel
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-4 font-medium text-gray-600">Name</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Anteil</th>
                        <th className="text-right py-3 px-4 font-medium text-gray-600">Betrag</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payouts.map((payout, index) => (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="py-3 px-4 font-medium">{payout.name}</td>
                          <td className="py-3 px-4 text-right text-gray-600">{payout.percent.toFixed(1)}%</td>
                          <td className="py-3 px-4 text-right font-bold text-sky-600">
                            {payout.amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                          </td>
                        </tr>
                      ))}
                      <tr className="bg-sky-50 font-bold">
                        <td className="py-3 px-4">Gesamt</td>
                        <td className="py-3 px-4 text-right">100%</td>
                        <td className="py-3 px-4 text-right text-sky-600">
                          {parseFloat(totalAmount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
