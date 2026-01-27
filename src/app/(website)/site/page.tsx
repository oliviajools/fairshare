import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Users, Vote, Calculator, Sparkles } from 'lucide-react'

export const metadata: Metadata = {
  title: 'TeamPayer – Faire Kostenverteilung für Teams',
  description: 'Mit TeamPayer verteilst du Kosten fair und demokratisch. Jeder stimmt ab, der Algorithmus berechnet – kein Streit, nur Fairness.',
  keywords: ['Kostenverteilung', 'Team', 'Fair', 'Abstimmung', 'App', 'Gruppenkosten'],
  openGraph: {
    title: 'TeamPayer – Faire Kostenverteilung für Teams',
    description: 'Mit TeamPayer verteilst du Kosten fair und demokratisch.',
    type: 'website',
  },
}

const features = [
  {
    icon: Users,
    title: 'Team einladen',
    description: 'Erstelle eine Session und lade alle Beteiligten per Link ein.',
  },
  {
    icon: Vote,
    title: 'Demokratisch abstimmen',
    description: 'Jeder bewertet anonym, wer wie viel beitragen sollte.',
  },
  {
    icon: Calculator,
    title: 'Automatisch berechnen',
    description: 'Unser Algorithmus ermittelt die fairste Verteilung.',
  },
  {
    icon: Sparkles,
    title: 'Stressfrei teilen',
    description: 'Keine Diskussionen mehr – nur transparente Ergebnisse.',
  },
]

export default function HomePage() {
  return (
    <>
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-sky-400 via-sky-500 to-violet-500 text-white">
        <div className="container mx-auto px-6 py-20 md:py-32">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Schluss mit der Frage: <br />
              <span className="text-sky-100">„Wer zahlt wie viel?"</span>
            </h1>
            <p className="text-xl md:text-2xl text-sky-100 mb-8 leading-relaxed">
              TeamPayer macht Kostenverteilung fair, transparent und demokratisch. 
              Alle stimmen ab – der Algorithmus rechnet.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/login"
                className="bg-white text-sky-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-50 transition-colors inline-flex items-center justify-center gap-2"
              >
                Jetzt starten
                <ArrowRight className="h-5 w-5" />
              </Link>
              <Link
                href="/site/about"
                className="border-2 border-white/30 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-white/10 transition-colors"
              >
                Mehr erfahren
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            So einfach geht&apos;s
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            In vier Schritten zur fairen Kostenverteilung – ohne Streit und ohne Taschenrechner.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 bg-sky-100 rounded-xl flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-sky-600" />
                </div>
                <div className="text-sm text-sky-600 font-medium mb-2">
                  Schritt {index + 1}
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">
            Perfekt für jede Situation
          </h2>
          <p className="text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            Ob WG, Urlaub oder Firmenevent – TeamPayer funktioniert überall.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🏠</div>
              <h3 className="text-xl font-semibold mb-2">WG-Kosten</h3>
              <p className="text-gray-600">Miete, Internet, Putzmittel fair aufteilen.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">✈️</div>
              <h3 className="text-xl font-semibold mb-2">Gruppenreisen</h3>
              <p className="text-gray-600">Hotel, Mietwagen, Aktivitäten transparent teilen.</p>
            </div>
            <div className="text-center p-6">
              <div className="text-5xl mb-4">🎉</div>
              <h3 className="text-xl font-semibold mb-2">Events & Feiern</h3>
              <p className="text-gray-600">Geburtstage, Teamevents, Hochzeiten organisieren.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gray-900 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Bereit für faire Kostenverteilung?
          </h2>
          <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
            Starte jetzt kostenlos und erlebe, wie einfach Fairness sein kann.
          </p>
          <Link
            href="/register"
            className="bg-sky-500 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-sky-600 transition-colors inline-flex items-center gap-2"
          >
            Kostenlos registrieren
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </>
  )
}
