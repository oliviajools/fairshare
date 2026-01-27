'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Share2, MessageCircle, Download, Loader2, Check } from 'lucide-react'

interface ShareResultsProps {
  targetRef: React.RefObject<HTMLDivElement | null>
  sessionTitle: string
  results: Array<{
    name: string
    averagePercent: number
  }>
}

const COLORS = [
  '#0ea5e9', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444',
  '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1'
]

export function ShareResults({ targetRef, sessionTitle, results }: ShareResultsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [copied, setCopied] = useState(false)

  // Fallback: Generate a simple canvas image programmatically
  const generateFallbackImage = (): Promise<Blob | null> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (!ctx) {
        resolve(null)
        return
      }

      const width = 600
      const padding = 40
      const lineHeight = 36
      const headerHeight = 80
      const height = headerHeight + padding * 2 + results.length * lineHeight + 60

      canvas.width = width
      canvas.height = height

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, '#f0f9ff')
      gradient.addColorStop(1, '#fefce8')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)

      // Title
      ctx.fillStyle = '#111827'
      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(sessionTitle, width / 2, padding + 30)

      // Subtitle
      ctx.fillStyle = '#6b7280'
      ctx.font = '14px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.fillText('Ergebnisse', width / 2, padding + 55)

      // Results
      ctx.textAlign = 'left'
      const startY = headerHeight + padding

      results.forEach((result, index) => {
        const y = startY + index * lineHeight
        const color = COLORS[index % COLORS.length]

        // Color dot
        ctx.beginPath()
        ctx.arc(padding + 10, y + 5, 8, 0, Math.PI * 2)
        ctx.fillStyle = color
        ctx.fill()

        // Name
        ctx.fillStyle = '#374151'
        ctx.font = '16px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.fillText(result.name, padding + 30, y + 10)

        // Percentage
        ctx.fillStyle = '#0ea5e9'
        ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, sans-serif'
        ctx.textAlign = 'right'
        ctx.fillText(`${result.averagePercent.toFixed(1)}%`, width - padding, y + 10)
        ctx.textAlign = 'left'

        // Progress bar background
        const barY = y + 18
        const barWidth = width - padding * 2 - 30
        ctx.fillStyle = '#e5e7eb'
        ctx.fillRect(padding + 30, barY, barWidth, 6)

        // Progress bar fill
        ctx.fillStyle = color
        ctx.fillRect(padding + 30, barY, (barWidth * result.averagePercent) / 100, 6)
      })

      // Footer
      ctx.fillStyle = '#9ca3af'
      ctx.font = '12px -apple-system, BlinkMacSystemFont, sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('📱 Erstellt mit TeamPayer', width / 2, height - 20)

      canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0)
    })
  }

  const generateImage = async (): Promise<Blob | null> => {
    setIsGenerating(true)
    
    // Try html2canvas first (better quality on desktop)
    if (targetRef.current) {
      try {
        const html2canvas = (await import('html2canvas')).default
        
        const canvas = await html2canvas(targetRef.current, {
          backgroundColor: '#f0f9ff',
          scale: 2,
          logging: false,
          useCORS: true,
          allowTaint: true
        })
        
        const blob = await new Promise<Blob | null>((resolve) => {
          canvas.toBlob((b) => resolve(b), 'image/png', 1.0)
        })
        
        if (blob) {
          setIsGenerating(false)
          return blob
        }
      } catch (err) {
        console.log('html2canvas failed, using fallback:', err)
      }
    }
    
    // Fallback to programmatic canvas
    console.log('Using fallback image generator')
    const blob = await generateFallbackImage()
    setIsGenerating(false)
    return blob
  }

  const generateTextSummary = () => {
    const lines = [
      `📊 *${sessionTitle}* - Ergebnisse`,
      '',
      ...results.slice(0, 10).map((r, i) => 
        `${i + 1}. ${r.name}: ${r.averagePercent.toFixed(1)}%`
      ),
      '',
      '📱 Erstellt mit TeamPayer'
    ]
    return lines.join('\n')
  }

  const shareViaWhatsApp = async () => {
    const text = generateTextSummary()
    const blob = await generateImage()
    
    // Try native share with image first (works on mobile)
    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'teampayer-results.png', { type: 'image/png' })] })) {
      try {
        const file = new File([blob], 'teampayer-results.png', { type: 'image/png' })
        await navigator.share({
          text: text,
          files: [file]
        })
        setShowOptions(false)
        return
      } catch (err) {
        // User cancelled or error, fall back to text-only
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err)
        }
      }
    }
    
    // Fallback: WhatsApp link with text only
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(whatsappUrl, '_blank')
    setShowOptions(false)
  }

  const downloadImage = async () => {
    const blob = await generateImage()
    if (!blob) {
      alert('Bild konnte nicht erstellt werden. Bitte versuche es erneut.')
      return
    }
    
    const filename = `teampayer-${sessionTitle.replace(/\s+/g, '-').toLowerCase()}.png`
    const file = new File([blob], filename, { type: 'image/png' })
    
    // On mobile, try Web Share API first (allows saving to photos)
    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: sessionTitle
        })
        setShowOptions(false)
        return
      } catch (err) {
        // User cancelled or not supported, fall through to download
        if ((err as Error).name === 'AbortError') {
          setShowOptions(false)
          return
        }
      }
    }
    
    // Fallback: Traditional download
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    link.style.display = 'none'
    document.body.appendChild(link)
    link.click()
    
    setTimeout(() => {
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    }, 100)
    
    setShowOptions(false)
  }

  const copyText = async () => {
    const text = generateTextSummary()
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="relative">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowOptions(!showOptions)}
        disabled={isGenerating}
      >
        {isGenerating ? (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Share2 className="mr-2 h-4 w-4" />
        )}
        Teilen
      </Button>

      {showOptions && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowOptions(false)}
          />
          <div className="absolute right-0 top-full mt-2 z-50 bg-white rounded-lg shadow-lg border p-2 min-w-[200px]">
            <button
              onClick={shareViaWhatsApp}
              disabled={isGenerating}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
            >
              <MessageCircle className="h-5 w-5 text-green-600" />
              <span>WhatsApp</span>
            </button>
            
            <button
              onClick={downloadImage}
              disabled={isGenerating}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
            >
              <Download className="h-5 w-5 text-sky-600" />
              <span>Als Bild speichern</span>
            </button>

            <button
              onClick={copyText}
              className="w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 rounded-md transition-colors"
            >
              {copied ? (
                <Check className="h-5 w-5 text-green-600" />
              ) : (
                <Share2 className="h-5 w-5 text-gray-600" />
              )}
              <span>{copied ? 'Kopiert!' : 'Text kopieren'}</span>
            </button>
          </div>
        </>
      )}
    </div>
  )
}
