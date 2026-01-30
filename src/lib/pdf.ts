// PDF Generation utilities using jsPDF
import { jsPDF } from 'jspdf'

interface ResultData {
  name: string
  averagePercent: number
}

interface SessionData {
  title: string
  date?: string
  participantCount: number
  voteCount: number
}

export function generateResultsPDF(
  session: SessionData,
  results: ResultData[]
): Blob {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  
  // Header
  doc.setFontSize(24)
  doc.setTextColor(14, 165, 233) // Sky-500
  doc.text('TeamPayer', 20, 25)
  
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128) // Gray-500
  doc.text('Ergebnisbericht', 20, 32)
  
  // Session Title
  doc.setFontSize(18)
  doc.setTextColor(17, 24, 39) // Gray-900
  doc.text(session.title, 20, 50)
  
  // Session Info
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  const infoY = 60
  if (session.date) {
    doc.text(`Datum: ${new Date(session.date).toLocaleDateString('de-DE')}`, 20, infoY)
  }
  doc.text(`Teilnehmer: ${session.participantCount}`, 20, infoY + 6)
  doc.text(`Abgestimmt: ${session.voteCount}`, 20, infoY + 12)
  doc.text(`Erstellt am: ${new Date().toLocaleDateString('de-DE')}`, 20, infoY + 18)
  
  // Divider
  doc.setDrawColor(229, 231, 235) // Gray-200
  doc.line(20, infoY + 28, pageWidth - 20, infoY + 28)
  
  // Results Table Header
  const tableStartY = infoY + 40
  doc.setFillColor(249, 250, 251) // Gray-50
  doc.rect(20, tableStartY - 6, pageWidth - 40, 10, 'F')
  
  doc.setFontSize(10)
  doc.setTextColor(107, 114, 128)
  doc.text('Rang', 25, tableStartY)
  doc.text('Name', 45, tableStartY)
  doc.text('Anteil', pageWidth - 45, tableStartY, { align: 'right' })
  
  // Results Rows
  doc.setTextColor(17, 24, 39)
  let currentY = tableStartY + 12
  
  results.forEach((result, index) => {
    const rank = index + 1
    
    // Alternate row background
    if (index % 2 === 1) {
      doc.setFillColor(249, 250, 251)
      doc.rect(20, currentY - 5, pageWidth - 40, 8, 'F')
    }
    
    // Medal colors for top 3
    if (rank <= 3) {
      const colors: Record<number, [number, number, number]> = {
        1: [234, 179, 8],   // Gold
        2: [156, 163, 175], // Silver
        3: [180, 83, 9]     // Bronze
      }
      doc.setTextColor(...colors[rank])
    } else {
      doc.setTextColor(107, 114, 128)
    }
    
    doc.text(`${rank}.`, 25, currentY)
    
    doc.setTextColor(17, 24, 39)
    doc.text(result.name, 45, currentY)
    
    // Progress bar
    const barWidth = 40
    const barX = pageWidth - 90
    doc.setFillColor(229, 231, 235)
    doc.rect(barX, currentY - 3, barWidth, 4, 'F')
    
    const fillWidth = (result.averagePercent / 100) * barWidth
    doc.setFillColor(14, 165, 233) // Sky-500
    doc.rect(barX, currentY - 3, fillWidth, 4, 'F')
    
    // Percentage
    doc.setTextColor(17, 24, 39)
    doc.text(`${result.averagePercent.toFixed(1)}%`, pageWidth - 25, currentY, { align: 'right' })
    
    currentY += 10
    
    // Add new page if needed
    if (currentY > 270) {
      doc.addPage()
      currentY = 30
    }
  })
  
  // Footer
  const footerY = doc.internal.pageSize.getHeight() - 15
  doc.setFontSize(8)
  doc.setTextColor(156, 163, 175)
  doc.text('Generiert mit TeamPayer - teampayer.de', pageWidth / 2, footerY, { align: 'center' })
  
  return doc.output('blob')
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}
