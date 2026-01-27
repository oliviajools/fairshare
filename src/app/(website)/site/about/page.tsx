import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Target, Heart, Lightbulb } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Über TeamPayer – Unsere Mission',
  description: 'Erfahre mehr über TeamPayer: Warum wir existieren, was uns antreibt und wie wir Kostenverteilung revolutionieren wollen.',
  openGraph: {
    title: 'Über TeamPayer – Unsere Mission',
    description: 'Erfahre mehr über TeamPayer und unsere Mission für faire Kostenverteilung.',
  },
}

const values = [
  {
    icon: Target,
    title: 'Fairness',
    description: 'Jeder Mensch verdient eine faire Behandlung – auch bei Geld. Unser Algorithmus berücksichtigt alle Stimmen gleich.',
  },
  {
    icon: Heart,
    title: 'Transparenz',
    description: 'Keine versteckten Berechnungen. Jeder kann nachvollziehen, wie das Ergebnis zustande kommt.',
  },
  {
    icon: Lightbulb,
    title: 'Einfachheit',
    description: 'Komplexe Mathematik, simple Bedienung. Du musst kein Experte sein, um faire Ergebnisse zu erzielen.',
  },
]

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-violet-400 to-violet-600 text-white py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              Über TeamPayer
            </h1>
            <p className="text-xl text-violet-100 leading-relaxed">
              Wir glauben, dass Geld nie ein Grund für Streit sein sollte. 
              Deshalb haben wir TeamPayer entwickelt.
            </p>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-6">Die Geschichte</h2>
            <div className="prose prose-lg text-gray-600 space-y-4">
              <p>
                Alles begann mit einer WG-Abrechnung, die fast eine Freundschaft gekostet hätte. 
                Wer hat mehr eingekauft? Wer nutzt mehr Strom? Wer sollte wie viel zahlen?
              </p>
              <p>
                Die Diskussionen waren endlos, die Stimmung angespannt. Dabei ging es nicht um 
                große Summen – sondern um das Gefühl, fair behandelt zu werden.
              </p>
              <p>
                Wir fragten uns: <strong>Was wäre, wenn jeder anonym seine Einschätzung abgeben könnte?</strong> 
                Was wäre, wenn ein neutraler Algorithmus die fairste Lösung berechnet?
              </p>
              <p>
                So entstand TeamPayer – eine App, die Demokratie in die Kostenverteilung bringt.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-12">Unsere Werte</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {values.map((value) => (
              <div key={value.title} className="text-center">
                <div className="w-16 h-16 bg-violet-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <value.icon className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold mb-4">Neugierig geworden?</h2>
          <p className="text-gray-600 mb-8">
            Erfahre mehr über das Team hinter TeamPayer.
          </p>
          <Link
            href="/site/team"
            className="bg-violet-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-violet-600 transition-colors inline-flex items-center gap-2"
          >
            Das Team kennenlernen
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
