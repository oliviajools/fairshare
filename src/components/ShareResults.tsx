'use client'

import { useState, useRef } from 'react'
import html2canvas from 'html2canvas'
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

export function ShareResults({ targetRef, sessionTitle, results }: ShareResultsProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [copied, setCopied] = useState(false)

  const generateImage = async (): Promise<Blob | null> => {
    if (!targetRef.current) return null
    
    setIsGenerating(true)
    try {
      const canvas = await html2canvas(targetRef.current, {
        backgroundColor: '#f0f9ff',
        scale: 2,
        logging: false,
        useCORS: true
      })
      
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob)
        }, 'image/png', 0.95)
      })
    } catch (error) {
      console.error('Error generating image:', error)
      return null
    } finally {
      setIsGenerating(false)
    }
  }

  const generateTextSummary = () => {
    const lines = [
      `📊 *${sessionTitle}* - Ergebnisse`,
      '',
      ...results.slice(0, 10).map((r, i) => 
        `${i + 1}. ${r.name}: ${r.averagePercent.toFixed(1)}%`
      ),
      '',
      '📱 Erstellt mit FairShare'
    ]
    return lines.join('\n')
  }

  const shareViaWhatsApp = async () => {
    const text = generateTextSummary()
    const blob = await generateImage()
    
    // Try native share with image first (works on mobile)
    if (blob && navigator.canShare && navigator.canShare({ files: [new File([blob], 'fairshare-results.png', { type: 'image/png' })] })) {
      try {
        const file = new File([blob], 'fairshare-results.png', { type: 'image/png' })
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
    if (!blob) return
    
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `fairshare-${sessionTitle.replace(/\s+/g, '-').toLowerCase()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
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
